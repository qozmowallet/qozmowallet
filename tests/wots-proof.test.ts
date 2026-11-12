import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import {decodeFunctionData,encodeFunctionData,encodeEventTopics,type Hex,type PublicClient} from 'viem';
import {entryPoint07Abi,getUserOperationHash,toPackedUserOperation,type UserOperation} from 'viem/account-abstraction';
import {packedWotsOperationHash,verifyWotsTransaction} from '../lib/wallet/wots-proof';
import {checkPublicRepository,QOZMO_REPOSITORY} from '../lib/project-status';
import manifest from '../lib/wallet/quantum-deployment.json';
import runtime from './fixtures/quantum-runtime.json';
import reference from '../public/evidence/wots-core-reference.json';

type Snapshot={transaction:Record<string,any>;receipt:Record<string,any>;block:Record<string,any>;proxyCode:Hex};
async function fixture(){return JSON.parse(await readFile(new URL('./fixtures/wots-public-reference.json',import.meta.url),'utf8'),(_,value)=>value&&typeof value==='object'&&Object.keys(value).length===1&&typeof value.bigint==='string'?BigInt(value.bigint):value) as Snapshot;}
function client(snapshot:Snapshot,options:{chain?:number;wrongCode?:boolean;wrongProxy?:boolean;reorg?:boolean;archiveUnavailable?:boolean}={}){
  let blockReads=0;const calls:string[]=[];
  const methods={
    chain:undefined,
    getChainId:async()=>{calls.push('chain');return options.chain??46630;},
    getTransactionReceipt:async()=>{calls.push('receipt');return snapshot.receipt;},
    getTransaction:async()=>snapshot.transaction,
    getBlock:async()=>{blockReads++;return options.reorg&&blockReads>1?{...snapshot.block,hash:`0x${'00'.repeat(32)}`}:snapshot.block;},
    getCode:async({address,blockNumber}:{address:string;blockNumber:bigint})=>{
      assert.equal(blockNumber,BigInt(reference.blockNumber));if(options.archiveUnavailable)throw new Error('Private provider details must not escape');
      const key=(Object.keys(runtime) as (keyof typeof runtime)[]).find(key=>manifest[key].toLowerCase()===address.toLowerCase());
      return key?(options.wrongCode?'0x00':runtime[key]):options.wrongProxy?'0x00':snapshot.proxyCode;
    },
    readContract:async({functionName}:{functionName:string})=>functionName==='accountImplementation'?manifest.accountImplementation:manifest.entryPoint,
  };
  const restricted=new Proxy(methods,{get(target,key){assert.ok(Object.hasOwn(target,key),`Unexpected RPC/signing API ${String(key)}`);return target[key as keyof typeof target];}}) as unknown as PublicClient;
  return {rpc:restricted,calls};
}
test('packed v0.7 hash matches viem across gas, factory, paymaster and nonce fields',()=>{
  const op:UserOperation<'0.7'>={sender:reference.account as Hex,nonce:3n,callData:'0x1234',callGasLimit:120000n,verificationGasLimit:200000n,preVerificationGas:50000n,maxPriorityFeePerGas:1n,maxFeePerGas:3n,signature:'0x',factory:manifest.factory as Hex,factoryData:'0x1234',paymaster:'0x1111111111111111111111111111111111111111',paymasterData:'0xabcd',paymasterVerificationGasLimit:200n,paymasterPostOpGasLimit:300n};
  assert.equal(packedWotsOperationHash(toPackedUserOperation(op)),getUserOperationHash({userOperation:op,chainId:46630,entryPointAddress:manifest.entryPoint as Hex,entryPointVersion:'0.7'}));
});
test('real public reference fixture independently verifies WOTS signature, canonical execution and pinned historical bytecode',async()=>{
  const proof=await verifyWotsTransaction(client(await fixture()).rpc,{transactionHash:reference.transactionHash as Hex,account:reference.account as Hex});
  assert.equal(proof.status,'verified');assert.equal(proof.userOpHash,reference.userOpHash);assert.equal(proof.keyIndex,'0');assert.equal(proof.nextKeyIndex,'1');assert.equal(proof.usedPublicKeyHash,reference.usedPublicKeyHash);assert.equal(proof.signatureBytes,2176);
  assert.ok(proof.checks.every(check=>check.passed));assert.equal(proof.calls?.[0].valueWei,'1');assert.ok(!('signature' in proof));assert.ok(!('seed' in proof));
});
test('wrong chain stops before receipt reads, while wrong historical bytecode/proxy never verifies',async()=>{
  const data=await fixture();const wrong=client(data,{chain:4663});
  assert.equal((await verifyWotsTransaction(wrong.rpc,{transactionHash:reference.transactionHash as Hex})).status,'unverified');assert.deepEqual(wrong.calls,['chain']);
  for(const options of [{wrongCode:true},{wrongProxy:true},{reorg:true},{archiveUnavailable:true}]){
    const proof=await verifyWotsTransaction(client(data,options).rpc,{transactionHash:reference.transactionHash as Hex});
    assert.equal(proof.status,'unverified');assert.ok(!proof.message.includes('Private provider'));
  }
});
test('altered public WOTS bytes and spoofed rotation logs cannot become verified evidence',async()=>{
  for(const tamper of ['signature','rotation-address','operation-hash','outer-revert','missing-rotation']){
    const data=await fixture();
    if(tamper==='signature'){
      const decoded=decodeFunctionData({abi:entryPoint07Abi,data:data.transaction.input});assert.equal(decoded.functionName,'handleOps');
      if(decoded.functionName!=='handleOps')throw new Error('Fixture must call handleOps');
      const [ops,beneficiary]=decoded.args;const op=ops[0];const last=op.signature.slice(-2)==='00'?'01':'00';
      data.transaction.input=encodeFunctionData({abi:entryPoint07Abi,functionName:'handleOps',args:[[{...op,signature:(op.signature.slice(0,-2)+last) as Hex}],beneficiary]});
    }else if(tamper==='rotation-address'){for(const log of data.receipt.logs)if(log.address.toLowerCase()===reference.account.toLowerCase())log.address='0x1111111111111111111111111111111111111111';}
    else if(tamper==='operation-hash'){for(const log of data.receipt.logs)if(log.address.toLowerCase()===manifest.entryPoint.toLowerCase()&&log.topics.length===4)log.topics[1]=`0x${'00'.repeat(32)}`;}
    else if(tamper==='outer-revert')data.receipt.status='reverted';
    else data.receipt.logs=data.receipt.logs.filter((log:any)=>log.address.toLowerCase()!==reference.account.toLowerCase());
    assert.notEqual((await verifyWotsTransaction(client(data).rpc,{transactionHash:reference.transactionHash as Hex})).status,'verified',tamper);
  }
});
test('execution failure is distinct from valid WOTS authorization and never returns verified success',async()=>{
  const data=await fixture();const topics=encodeEventTopics({abi:entryPoint07Abi,eventName:'UserOperationEvent'});
  const event=data.receipt.logs.find((log:any)=>log.topics[0]===topics[0]);assert.ok(event);
  // Event data: nonce, success, actualGasCost, actualGasUsed. Keep the valid signature and key-rotation evidence.
  event.data=`${event.data.slice(0,66)}${'0'.repeat(64)}${event.data.slice(130)}`;
  const proof=await verifyWotsTransaction(client(data).rpc,{transactionHash:reference.transactionHash as Hex});
  assert.equal(proof.status,'execution-reverted');assert.ok(proof.checks.some(check=>check.name.includes('cryptography')&&check.passed));assert.equal(proof.checks.at(-1)?.passed,false);
});
test('proof verification validates input and honours cancellation without touching a wallet or journal',async()=>{
  const mock=client(await fixture());await assert.rejects(verifyWotsTransaction(mock.rpc,{transactionHash:'0x1234'}),/valid transaction hash/);assert.deepEqual(mock.calls,[]);
  const controller=new AbortController();controller.abort();await assert.rejects(verifyWotsTransaction(mock.rpc,{transactionHash:reference.transactionHash as Hex},controller.signal));assert.deepEqual(mock.calls,[]);
});
test('public repository checking does not confuse private/unavailable, rate limits, or another repository with public Qozmo source',async()=>{
  const fetcher=(body:unknown,status=200)=>(async()=>new Response(JSON.stringify(body),{status})) as typeof fetch;
  assert.equal((await checkPublicRepository(fetcher({},404))).status,'unavailable');assert.equal((await checkPublicRepository(fetcher({},403))).status,'unknown');
  assert.equal((await checkPublicRepository(fetcher({private:false,visibility:'public',full_name:'someone/other',html_url:'https://github.com/someone/other'}))).status,'unavailable');
  assert.equal((await checkPublicRepository(fetcher({private:false,visibility:'public',full_name:'imrybrndo/qozmo-wallet',html_url:QOZMO_REPOSITORY}))).status,'public');
});
