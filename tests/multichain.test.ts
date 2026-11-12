import assert from 'node:assert/strict';
import {test} from 'node:test';
import {base58,base64,hex} from '@scure/base';
import {ed25519} from '@noble/curves/ed25519.js';
import {secp256k1} from '@noble/curves/secp256k1.js';
import {Transaction,TEST_NETWORK,p2wpkh,p2pkh} from '@scure/btc-signer';
import {getTransactionDecoder,getSignatureFromTransaction} from '@solana/kit';
import {deriveNativeAddresses} from '../lib/wallet/multichain/keys';
import {nativeNetwork,nativeExplorer,parseNativeAmount} from '../lib/wallet/multichain/networks';
import {prepareSolana,submitSolana,solanaConfirmation} from '../lib/wallet/multichain/solana';
import {prepareBitcoin,submitBitcoin,bitcoinBalance,signetFeeRate} from '../lib/wallet/multichain/bitcoin';
import {appendNativeOutbox,readNativeOutbox,nativeOutboxKey,nativePending,updateNativeStatus} from '../lib/wallet/multichain/outbox';
import {NativeBroadcastUncertain,type SignedNativeTransfer} from '../lib/wallet/multichain/types';
import type {NativeTransport} from '../lib/wallet/multichain/transport';
// Public BIP-39 development vector only. These tests never contact any network.
const secret={mnemonic:'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'};
const accounts=deriveNativeAddresses(secret);
const other=deriveNativeAddresses({mnemonic:'test test test test test test test test test test test junk'});
function storage():Storage{const data=new Map<string,string>();return {get length(){return data.size;},key:(index:number)=>[...data.keys()][index]??null,clear:()=>data.clear(),getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>{data.set(key,value);},removeItem:(key:string)=>{data.delete(key);}};}
function solanaMock(){
  const config={genesis:nativeNetwork('solana-devnet').genesis as string,fee:5000,balance:1_000_000_000,simulationError:null as unknown,owner:'11111111111111111111111111111111',height:101,status:null as unknown,loseResponse:false};
  const broadcasts:string[]=[],calls:string[]=[];
  const wrap=(value:unknown)=>({context:{slot:100},value});
  const io:NativeTransport={text:async()=>{throw new Error('Unexpected request');},json:async(_url,init)=>{
    const {method,params}=JSON.parse(String(init?.body));calls.push(method);let result:unknown;
    switch(method){
      case 'getGenesisHash':result=config.genesis;break;
      case 'getBalance':result=wrap(config.balance);break;
      case 'getAccountInfo':result=wrap({owner:config.owner,executable:false,data:['','base64']});break;
      case 'getLatestBlockhash':result=wrap({blockhash:'11111111111111111111111111111111',lastValidBlockHeight:150});break;
      case 'getFeeForMessage':result=wrap(config.fee);break;
      case 'simulateTransaction':assert.equal(params[1].sigVerify,false);result=wrap({err:config.simulationError,unitsConsumed:150});break;
      case 'getBlockHeight':result=config.height;break;
      case 'getSignatureStatuses':result=wrap([config.status]);break;
      case 'sendTransaction':{
        broadcasts.push(params[0]);assert.equal(params[1].skipPreflight,false);assert.equal(params[1].maxRetries,0);
        if(config.loseResponse)throw new Error('Simulated timeout');
        result=getSignatureFromTransaction(getTransactionDecoder().decode(base64.decode(params[0])));break;
      }
      default:throw new Error('Unexpected Solana method '+method);
    }
    return {jsonrpc:'2.0',id:1,result};
  }};return {io,config,broadcasts,calls};
}
function bitcoinMock(){
  const parent=new Transaction({allowUnknownInputs:true,allowUnknownOutputs:true});
  parent.addOutputAddress(accounts.bitcoin,1_000_000n,TEST_NETWORK);
  parent.addInput({txid:'00'.repeat(32),index:0xffffffff,sequence:0xffffffff,finalScriptSig:new Uint8Array([1,0])});
  const config={genesis:nativeNetwork('bitcoin-signet').genesis as string,spent:false,utxoValue:1_000_000,confirmed:true,parentHex:parent.hex,loseResponse:false};
  const broadcasts:string[]=[];
  const io:NativeTransport={text:async(url,init)=>{
    if(url.endsWith('/block-height/0'))return config.genesis;
    if(url.endsWith('/blocks/tip/height'))return '300';
    if(url.endsWith('/hex'))return config.parentHex;
    if(init?.method==='POST'){const raw=String(init.body);broadcasts.push(raw);if(config.loseResponse)throw new Error('Simulated timeout');return Transaction.fromRaw(hex.decode(raw)).id;}
    throw new Error('Unexpected Bitcoin text URL '+url);
  },json:async url=>{
    if(url.endsWith('/utxo'))return [{txid:parent.id,vout:0,value:config.utxoValue,status:{confirmed:config.confirmed}}];
    if(url.endsWith('/outspend/0'))return {spent:config.spent};
    if(url.endsWith('/status'))return {confirmed:config.confirmed,block_height:200};
    if(url.endsWith('/v1/fees/recommended'))return {halfHourFee:2};
    throw new Error('Unexpected Bitcoin URL '+url);
  }};return {io,config,broadcasts,parent};
}

test('standard native derivation has stable public account vectors and stays separate from Quantum',()=>{
  assert.equal(accounts.solana,'HAgk14JpMQLgt6rVgv7cBQFJWFto5Dqxi472uT3DKpqk');
  assert.equal(accounts.bitcoin,'tb1q6rz28mcfaxtmd6v789l9rrlrusdprr9pqcpvkl');
  assert.equal(accounts.bitcoinPublicKey,'02e7ab2537b5d49e970309aae06e9e49f36ce1c9febbd44ec8e0d1cca0b4f9c319');
  assert.throws(()=>deriveNativeAddresses({mnemonic:'invalid phrase'}));
  assert.throws(()=>nativeNetwork('solana-mainnet' as never));
  assert.throws(()=>nativeNetwork('__proto__' as never));
  assert.ok(nativeExplorer('bitcoin-signet','address',accounts.bitcoin).includes('/signet/address/'));
  assert.ok(nativeExplorer('solana-devnet','address',accounts.solana).endsWith('?cluster=devnet'));
  assert.throws(()=>nativeExplorer('bitcoin-signet','tx','<script>'));
});
test('native decimal amounts never round or accept scientific notation',()=>{
  assert.equal(parseNativeAmount('0.000000001',9),1n);assert.equal(parseNativeAmount('0.00000001',8),1n);
  for(const value of ['0','-1','1e-8','01','1.000000001','NaN'])assert.throws(()=>parseNativeAmount(value,8));
});
test('Solana signs the reviewed bytes only after simulation and durable outbox storage',async()=>{
  const mock=solanaMock(),saved:SignedNativeTransfer[]=[];
  const review=await prepareSolana(mock.io,accounts.solana,other.solana,'0.01');
  assert.equal(review.value,10_000_000n);assert.equal(review.fee,5000n);assert.ok(Object.isFrozen(review));assert.equal(mock.broadcasts.length,0);
  const sent=await submitSolana(mock.io,review,secret,async row=>{assert.equal(mock.broadcasts.length,0);saved.push(row);});
  assert.equal(saved.length,1);assert.equal(sent.status,'submitted');
  const decoded=getTransactionDecoder().decode(base64.decode(mock.broadcasts[0]));
  const signature=decoded.signatures[accounts.solana as keyof typeof decoded.signatures];
  assert.ok(signature);assert.ok(ed25519.verify(Uint8Array.from(signature),Uint8Array.from(decoded.messageBytes),base58.decode(accounts.solana)));
  const message=Uint8Array.from(decoded.messageBytes);
  assert.ok(Buffer.from(message).includes(Buffer.from(base58.decode(other.solana))));
  await assert.rejects(submitSolana(mock.io,review,secret,async()=>{}),/already used/);
  await assert.rejects(submitSolana(mock.io,{...review},secret,async()=>{}),/Invalid/);
});
test('Solana rejects wrong networks, failed simulations, stale fees, programs and expired blockhashes before signing',async()=>{
  const wrong=solanaMock();wrong.config.genesis='mainnet';await assert.rejects(prepareSolana(wrong.io,accounts.solana,other.solana,'0.01'),/different network/);
  const failed=solanaMock();failed.config.simulationError={InstructionError:[0,'InsufficientFunds']};await assert.rejects(prepareSolana(failed.io,accounts.solana,other.solana,'0.01'),/simulation failed/);
  const program=solanaMock();program.config.owner=other.solana;await assert.rejects(prepareSolana(program.io,accounts.solana,other.solana,'0.01'),/System Program/);
  for(const mutation of ['fee','height'] as const){const mock=solanaMock();const review=await prepareSolana(mock.io,accounts.solana,other.solana,'0.01');mock.config[mutation]=mutation==='fee'?6000:151;await assert.rejects(submitSolana(mock.io,review,secret,async()=>assert.fail('must not save')));assert.equal(mock.broadcasts.length,0);}
});
test('Solana storage failure never broadcasts and uncertain submission retains the same transaction ID',async()=>{
  const failed=solanaMock();const review=await prepareSolana(failed.io,accounts.solana,other.solana,'0.01');await assert.rejects(submitSolana(failed.io,review,secret,async()=>{throw new Error('Storage full');}),/Storage full/);assert.equal(failed.broadcasts.length,0);
  const lost=solanaMock();lost.config.loseResponse=true;const second=await prepareSolana(lost.io,accounts.solana,other.solana,'0.01');let saved:SignedNativeTransfer|undefined;
  await assert.rejects(submitSolana(lost.io,second,secret,async row=>{saved=row;}),(error:unknown)=>error instanceof NativeBroadcastUncertain&&error.transactionId===saved?.id);
  assert.equal(lost.broadcasts.length,1);assert.equal(saved?.status,'signed');
  lost.config.status={confirmationStatus:'processed',err:{InstructionError:[0,1]}};assert.equal(await solanaConfirmation(lost.io,saved!.id),'pending');
  lost.config.status={confirmationStatus:'confirmed',err:null};assert.equal(await solanaConfirmation(lost.io,saved!.id),'confirmed');
  lost.config.status={confirmationStatus:'finalized',err:{InstructionError:[0,1]}};assert.equal(await solanaConfirmation(lost.io,saved!.id),'failed');
});
test('Bitcoin builds and signs native SegWit with exact reviewed recipient, change and fee',async()=>{
  const mock=bitcoinMock();assert.deepEqual(await bitcoinBalance(mock.io,accounts.bitcoin),{balance:1_000_000n,confirmedBalance:1_000_000n});assert.equal(await signetFeeRate(mock.io),2);
  const review=await prepareBitcoin(mock.io,accounts.bitcoin,accounts.bitcoinPublicKey,other.bitcoin,'0.001',2);
  assert.equal(review.value,100_000n);assert.equal(review.fee,284n);assert.equal(mock.broadcasts.length,0);
  let saved=false;const sent=await submitBitcoin(mock.io,review,secret,async()=>{assert.equal(mock.broadcasts.length,0);saved=true;});assert.equal(saved,true);assert.equal(sent.status,'submitted');
  const tx=Transaction.fromRaw(hex.decode(mock.broadcasts[0]));assert.equal(tx.id,sent.id);assert.equal(tx.getOutputAddress(0,TEST_NETWORK),other.bitcoin);assert.equal(tx.getOutput(0).amount,100_000n);assert.equal(tx.getOutputAddress(1,TEST_NETWORK),accounts.bitcoin);assert.equal(tx.getOutput(1).amount,899_716n);
  assert.equal(1_000_000n-tx.getOutput(0).amount!-tx.getOutput(1).amount!,review.fee);
  assert.ok(tx.getInput(0).finalScriptWitness?.length===2);
  const witness=tx.getInput(0).finalScriptWitness!;
  const pub=hex.decode(accounts.bitcoinPublicKey);
  const digest=tx.preimageWitnessV0(0,p2pkh(pub,TEST_NETWORK).script,1,1_000_000n);
  assert.equal(witness[0].at(-1),1);
  assert.ok(secp256k1.verify(witness[0].subarray(0,-1),digest,pub,{format:'der',prehash:false}));
  await assert.rejects(submitBitcoin(mock.io,review,secret,async()=>{}),/already used/);
});
test('Bitcoin rejects fabricated UTXO amounts, wrong parent bytes, unconfirmed/spent inputs and wrong networks',async()=>{
  const make=async(mock:ReturnType<typeof bitcoinMock>)=>prepareBitcoin(mock.io,accounts.bitcoin,accounts.bitcoinPublicKey,other.bitcoin,'0.001',2);
  const wrong=bitcoinMock();wrong.config.genesis='00'.repeat(32);await assert.rejects(make(wrong),/different network/);
  const amount=bitcoinMock();amount.config.utxoValue=2_000_000;await assert.rejects(make(amount),/value or ownership/);
  const parent=bitcoinMock();parent.config.parentHex='00';await assert.rejects(make(parent));
  const pending=bitcoinMock();pending.config.confirmed=false;await assert.rejects(make(pending),/confirmed Signet/);
  const spent=bitcoinMock();const review=await make(spent);spent.config.spent=true;await assert.rejects(submitBitcoin(spent.io,review,secret,async()=>assert.fail('must not save')),/spent/);assert.equal(spent.broadcasts.length,0);
  const fresh=bitcoinMock();await assert.rejects(prepareBitcoin(fresh.io,accounts.bitcoin,accounts.bitcoinPublicKey,'bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu','0.001',2));
});
test('Bitcoin rejects foreign signing keys, storage errors and ambiguous submission without automatic retry',async()=>{
  const mock=bitcoinMock();const make=()=>prepareBitcoin(mock.io,accounts.bitcoin,accounts.bitcoinPublicKey,other.bitcoin,'0.001',2);
  const first=await make();await assert.rejects(submitBitcoin(mock.io,first,{mnemonic:'test test test test test test test test test test test junk'},async()=>assert.fail('must not save')),/does not own/);assert.equal(mock.broadcasts.length,0);
  const second=await make();await assert.rejects(submitBitcoin(mock.io,second,secret,async()=>{throw new Error('Storage full');}),/Storage full/);assert.equal(mock.broadcasts.length,0);
  const third=await make();mock.config.loseResponse=true;let saved:SignedNativeTransfer|undefined;await assert.rejects(submitBitcoin(mock.io,third,secret,async row=>{saved=row;}),NativeBroadcastUncertain);assert.equal(saved?.status,'signed');assert.equal(mock.broadcasts.length,1);
});
test('native outbox isolates chains, preserves tampered data and prevents a second unresolved send',async()=>{
  const io=solanaMock(),memory=storage();const review=await prepareSolana(io.io,accounts.solana,other.solana,'0.01');
  const sent=await submitSolana(io.io,review,secret,async row=>appendNativeOutbox(memory,row));assert.equal(nativePending(readNativeOutbox(memory,'solana-devnet',accounts.solana))?.id,sent.id);
  assert.throws(()=>appendNativeOutbox(memory,sent),/status check/);
  updateNativeStatus(memory,sent,'submitted');updateNativeStatus(memory,sent,'confirmed');assert.equal(nativePending(readNativeOutbox(memory,'solana-devnet',accounts.solana)),undefined);
  assert.throws(()=>updateNativeStatus(memory,{...sent,to:accounts.solana},'confirmed'),/history changed/);
  assert.deepEqual(readNativeOutbox(memory,'bitcoin-signet',accounts.bitcoin),[]);
  const key=nativeOutboxKey('solana-devnet',accounts.solana);memory.setItem(key,'{broken');assert.throws(()=>readNativeOutbox(memory,'solana-devnet',accounts.solana));assert.equal(memory.getItem(key),'{broken');
});
test('expired native review and cancelled work cannot reach a signing/broadcast path',async()=>{
  const mock=solanaMock(),review=await prepareSolana(mock.io,accounts.solana,other.solana,'0.01');const original=Date.now;
  try{Date.now=()=>review.expiresAt+1;await assert.rejects(submitSolana(mock.io,review,secret,async()=>assert.fail('must not save')),/expired/);}finally{Date.now=original;}
  const signal=AbortSignal.abort();await assert.rejects(submitSolana(mock.io,review,secret,async()=>assert.fail('must not save'),signal));assert.equal(mock.broadcasts.length,0);
});

test('immature Bitcoin coinbase outputs are rejected before a review or signature exists',async()=>{
 const mock=bitcoinMock();const original=mock.io.text;mock.io.text=async(url,init)=>url.endsWith('/blocks/tip/height')?'250':original(url,init);
 await assert.rejects(prepareBitcoin(mock.io,accounts.bitcoin,accounts.bitcoinPublicKey,other.bitcoin,'0.001',2),/100-block maturity/);assert.equal(mock.broadcasts.length,0);
});
