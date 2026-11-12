import { Address, OutScript, p2wpkh, TEST_NETWORK, Transaction } from '@scure/btc-signer';
import { hex } from '@scure/base';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import type { VaultSecret } from '../vault';
import { bitcoinPrivateKey } from './keys';
import { nativeNetwork, parseNativeAmount } from './networks';
import { assertNativeChain, object, uint, type NativeTransport } from './transport';
import { assertReviewAge, NativeBroadcastUncertain, signedRecord, type NativeReview, type SignedNativeTransfer, type NativeConfirmation } from './types';
const API=nativeNetwork('bitcoin-signet').rpc;
const MAX_MONEY=2_100_000_000_000_000;
type Utxo=Readonly<{txid:string;vout:number;value:bigint;confirmed:boolean}>;
function hash(value:unknown):string {if(typeof value!=='string'||!/^[0-9a-f]{64}$/.test(value))throw new Error('Invalid Bitcoin transaction ID.');return value;}
function destination(value:string) {
  const normalized=value.trim();
  if(normalized!==normalized.toLowerCase()||normalized.length>90)throw new Error('Use a lowercase Signet SegWit address.');
  const decoded=Address(TEST_NETWORK).decode(normalized);
  if(decoded.type!=='wpkh'&&decoded.type!=='tr')throw new Error('This release supports Signet native SegWit and Taproot recipients only.');
  return {address:normalized,script:OutScript.encode(decoded),size:decoded.type==='tr'?43:31};
}
async function utxos(io:NativeTransport,from:string):Promise<Utxo[]> {
  destination(from); const raw=await io.json(`${API}/address/${from}/utxo`);
  if(!Array.isArray(raw)||raw.length>100)throw new Error('This account exceeds the 100-UTXO limit or returned invalid data.');
  const seen=new Set<string>();
  return raw.map(item=>{
    const row=object(item),status=object(row.status);const txid=hash(row.txid),vout=uint(row.vout,100_000);const key=txid+':'+vout;
    if(seen.has(key)||typeof status.confirmed!=='boolean')throw new Error('Duplicate or invalid Bitcoin UTXO.');seen.add(key);
    const value=BigInt(uint(row.value,MAX_MONEY));if(value===0n)throw new Error('Invalid zero UTXO.');
    return Object.freeze({txid,vout,value,confirmed:status.confirmed});
  });
}
export async function bitcoinBalance(io:NativeTransport,from:string):Promise<{balance:bigint;confirmedBalance:bigint}> {
  await assertNativeChain('bitcoin-signet',io);const rows=await utxos(io,from);
  const balance=rows.reduce((sum,row)=>sum+row.value,0n),spendable=rows.filter(row=>row.confirmed).reduce((sum,row)=>sum+row.value,0n);
  if(balance>BigInt(MAX_MONEY))throw new Error('Invalid Bitcoin balance.');
  return {balance,confirmedBalance:spendable};
}
export async function signetFeeRate(io:NativeTransport):Promise<number> {
  await assertNativeChain('bitcoin-signet',io);
  const value=object(await io.json(API+'/v1/fees/recommended')).halfHourFee;
  if(typeof value!=='number'||!Number.isFinite(value)||value<1||value>100)throw new Error('Signet fee estimate unavailable or outside the 1–100 sat/vB limit.');
  return Math.ceil(value);
}
async function verifyInputs(io:NativeTransport,rows:readonly Utxo[],script:Uint8Array) {
  // Never sign only the indexer's claimed amounts. Decode the actual parent transaction locally.
  for(let offset=0;offset<rows.length;offset+=4)await Promise.all(rows.slice(offset,offset+4).map(async row=>{
    const raw=(await io.text(`${API}/tx/${row.txid}/hex`)).trim();
    if(!/^(?:[0-9a-f]{2})+$/.test(raw)||raw.length>800_000)throw new Error('Invalid Bitcoin parent transaction.');
    const parent=Transaction.fromRaw(hex.decode(raw),{allowUnknownInputs:true,allowUnknownOutputs:true});
    if(parent.id!==row.txid||row.vout>=parent.outputsLength)throw new Error('Bitcoin parent transaction ID or output mismatch.');
    const output=parent.getOutput(row.vout);
    if(output.amount!==row.value||!output.script||hex.encode(output.script)!==hex.encode(script))throw new Error('Bitcoin UTXO value or ownership mismatch.');
    const [status,spent]=await Promise.all([io.json(`${API}/tx/${row.txid}/status`),io.json(`${API}/tx/${row.txid}/outspend/${row.vout}`)]);
    const parentStatus=object(status);
    if(parentStatus.confirmed!==true||object(spent).spent!==false)throw new Error('A Bitcoin input is unconfirmed or already spent.');
    const first=parent.inputsLength===1?parent.getInput(0):undefined;
    if(first?.index===0xffffffff&&first.txid&&hex.encode(first.txid)==='00'.repeat(32)){
      const height=uint(parentStatus.block_height);
      const tip=(await io.text(API+'/blocks/tip/height')).trim();
      if(!/^\d{1,10}$/.test(tip)||uint(Number(tip))-height+1<100)throw new Error('This coinbase output has not reached 100-block maturity.');
    }
  }));
}
type BtcState={psbt:Uint8Array;rows:readonly Utxo[];script:Uint8Array;rate:number;pubkey:string;phase:'prepared'|'signing'|'signed'};
const reviews=new WeakMap<NativeReview,BtcState>();
export async function prepareBitcoin(io:NativeTransport,from:string,publicKey:string,to:string,amount:string,rate:number):Promise<NativeReview> {
  await assertNativeChain('bitcoin-signet',io);
  if(!Number.isInteger(rate)||rate<1||rate>100)throw new Error('Use a fee rate from 1 to 100 sat/vB.');
  if(!/^(02|03)[0-9a-f]{64}$/.test(publicKey))throw new Error('Invalid Bitcoin public key.');
  const payment=p2wpkh(hex.decode(publicKey),TEST_NETWORK);
  if(payment.address!==from)throw new Error('Bitcoin sender does not match this public key.');
  const toAddress=destination(to),value=parseNativeAmount(amount,8);
  if(value<546n)throw new Error('Send at least 546 satoshis to avoid dust outputs.');
  const candidates=(await utxos(io,from)).filter(row=>row.confirmed).sort((a,b)=>a.value>b.value?-1:a.value<b.value?1:0);
  const selected:Utxo[]=[];let total=0n;
  for(const candidate of candidates){
    if(selected.length===20)break;
    selected.push(candidate);total+=candidate.value;
    if(total>=value+BigInt((11+69*selected.length+toAddress.size+31)*rate))break;
  }
  const budget=BigInt((11+69*selected.length+toAddress.size+31)*rate);
  if(!selected.length||total<value+budget)throw new Error('Not enough confirmed Signet BTC for the amount and fee within the 20-input limit.');
  let change=total-value-budget;
  if(change<546n)change=0n;
  const fee=total-value-change;
  if(fee>100_000n)throw new Error('Fee exceeds this release’s 100,000-satoshi safety limit.');
  await verifyInputs(io,selected,payment.script);
  const tx=new Transaction();
  for(const row of selected)tx.addInput({txid:row.txid,index:row.vout,sequence:0xfffffffe,witnessUtxo:{script:payment.script,amount:row.value}});
  tx.addOutputAddress(toAddress.address,value,TEST_NETWORK);
  if(change)tx.addOutputAddress(from,change,TEST_NETWORK);
  if(tx.fee!==fee)throw new Error('Bitcoin fee calculation mismatch.');
  const now=Date.now();
  const review=Object.freeze({network:'bitcoin-signet' as const,from,to:toAddress.address,value,fee,balance:total,preparedAt:now,expiresAt:now+120_000,detail:`${selected.length} confirmed input(s) · ${rate} sat/vB budget · change ${change} sats to this account`});
  reviews.set(review,{psbt:tx.toPSBT(),rows:Object.freeze(selected),script:payment.script,rate,pubkey:publicKey,phase:'prepared'});return review;
}
export async function submitBitcoin(io:NativeTransport,review:NativeReview,secret:VaultSecret,save:(tx:SignedNativeTransfer)=>Promise<void>,signal?:AbortSignal):Promise<SignedNativeTransfer> {
  const state=reviews.get(review);
  if(!state||state.phase!=='prepared'||review.network!=='bitcoin-signet')throw new Error('Invalid or already used Bitcoin review.');
  assertReviewAge(review);signal?.throwIfAborted();state.phase='signing';
  try{
    await assertNativeChain('bitcoin-signet',io);await verifyInputs(io,state.rows,state.script);
    assertReviewAge(review);signal?.throwIfAborted();
    const privateKey=bitcoinPrivateKey(secret);
    const tx=Transaction.fromPSBT(state.psbt);
    try{
      if(hex.encode(secp256k1.getPublicKey(privateKey,true))!==state.pubkey)throw new Error('This standard vault does not own the reviewed Bitcoin account.');
      if(tx.sign(privateKey)!==state.rows.length)throw new Error('Not every Bitcoin input could be signed.');
    }finally{privateKey.fill(0);}
    tx.finalize();state.phase='signed';
    if(tx.fee!==review.fee||tx.fee<BigInt(tx.vsize*state.rate))throw new Error('Final Bitcoin fee differs from the reviewed fee budget.');
    const entry=signedRecord(review,tx.id,tx.hex);
    await save(entry);
    try{
      signal?.throwIfAborted();
      const returned=(await io.text(API+'/tx',{method:'POST',headers:{'Content-Type':'text/plain'},body:entry.wire})).trim();
      if(returned!==entry.id)throw new Error('Transaction ID mismatch.');
      return {...entry,status:'submitted'};
    }catch{throw new NativeBroadcastUncertain(entry.id);}
  }finally{if(state.phase==='signing')state.phase='prepared';}
}
export async function bitcoinConfirmation(io:NativeTransport,id:string):Promise<NativeConfirmation> {
  hash(id);await assertNativeChain('bitcoin-signet',io);
  const result=object(await io.json(`${API}/tx/${id}/status`));
  if(typeof result.confirmed!=='boolean')throw new Error('Invalid Bitcoin confirmation response.');
  return result.confirmed?'confirmed':'pending';
}
