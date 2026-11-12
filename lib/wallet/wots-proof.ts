import { concat, decodeFunctionData, encodeAbiParameters, getAddress, isAddress, keccak256, parseAbi, parseEventLogs, size, type Address, type Hex, type PublicClient, TransactionReceiptNotFoundError } from 'viem';
import { entryPoint07Abi, type PackedUserOperation } from 'viem/account-abstraction';
import manifest from './quantum-deployment.json';
import { decodeUserOpSignature, quantumSafeAccountAbi, signatureDigest, USEROP_SIGNATURE_BYTES } from './quantum-sdk/account';
import { recoverPublicKeyHash } from './quantum-sdk/wots';

export const WOTS_PROOF_CHAIN = 46630;
// Public archive endpoint listed by dRPC for Robinhood Testnet; wallet signing RPC is unchanged.
export const WOTS_PROOF_RPC = 'https://robinhood-testnet.drpc.org';
export type WotsProofCheck = { name:string; passed:boolean };
export type WotsProof = {
  version:1; chainId:46630; checkedAt:string; transactionHash:Hex;
  status:'verified'|'execution-reverted'|'unverified'|'not-found'; message:string;
  checks:WotsProofCheck[]; account?:Address; userOpHash?:Hex; blockNumber?:string; blockHash?:Hex;
  timestamp?:string; keyIndex?:string; nextKeyIndex?:string; usedPublicKeyHash?:Hex; nextPublicKeyHash?:Hex;
  signatureHash?:Hex; signatureBytes?:number; nonce?:string; actualGasUsed?:string; actualGasCostWei?:string;
  calls?:{to:Address;valueWei:string;dataBytes:number}[];
  scope:'Public chain evidence only. Does not establish wallet UI origin, an audit, mainnet readiness, or Ethereum settlement finality.';
};
export type WotsProofRequest={transactionHash:Hex;account?:Address;userOpHash?:Hex};
const isHash=(value:unknown):value is Hex=>typeof value==='string'&&/^0x[0-9a-f]{64}$/i.test(value);
const same=(a:string|undefined|null,b:string|undefined|null)=>!!a&&!!b&&a.toLowerCase()===b.toLowerCase();
const linkAbi=parseAbi(['function accountImplementation() view returns(address)','function entryPoint() view returns(address)']);

/** ERC-4337 v0.7 hash of the exact packed calldata; the signature is excluded by the protocol. */
export function packedWotsOperationHash(op:PackedUserOperation):Hex {
  const inner=keccak256(encodeAbiParameters([
    {type:'address'},{type:'uint256'},{type:'bytes32'},{type:'bytes32'},
    {type:'bytes32'},{type:'uint256'},{type:'bytes32'},{type:'bytes32'},
  ],[op.sender,op.nonce,keccak256(op.initCode),keccak256(op.callData),op.accountGasLimits,op.preVerificationGas,op.gasFees,keccak256(op.paymasterAndData)]));
  return keccak256(encodeAbiParameters([{type:'bytes32'},{type:'address'},{type:'uint256'}],[inner,manifest.entryPoint as Address,BigInt(WOTS_PROOF_CHAIN)]));
}

/** Public data only: no wallet, seed, journal, relay, signing, or broadcast APIs. */
export async function verifyWotsTransaction(client:PublicClient,request:WotsProofRequest,signal?:AbortSignal):Promise<WotsProof>{
  if(!isHash(request.transactionHash)||(request.userOpHash!==undefined&&!isHash(request.userOpHash))||(request.account!==undefined&&!isAddress(request.account,{strict:true})))throw new Error('Enter a valid transaction hash and optional account/UserOperation hash.');
  const proof:WotsProof={version:1,chainId:WOTS_PROOF_CHAIN,checkedAt:new Date().toISOString(),transactionHash:request.transactionHash,status:'unverified',message:'Verification is incomplete.',checks:[],scope:'Public chain evidence only. Does not establish wallet UI origin, an audit, mainnet readiness, or Ethereum settlement finality.'};
  const check=(name:string,passed:boolean)=>{proof.checks.push({name,passed});return passed;};
  const stop=(message:string)=>{proof.message=message;return proof;};
  try{
    signal?.throwIfAborted();
    if(!check('Robinhood Testnet · chain 46630',await client.getChainId()===WOTS_PROOF_CHAIN&&(!client.chain||client.chain.id===WOTS_PROOF_CHAIN)))return stop('The RPC is not on the supported testnet.');
    signal?.throwIfAborted();
    let receipt;
    try{receipt=await client.getTransactionReceipt({hash:request.transactionHash});}
    catch(error){if(error instanceof TransactionReceiptNotFoundError){proof.status='not-found';return stop('No mined receipt was found on Robinhood Testnet.');}throw error;}
    signal?.throwIfAborted();
    if(!check('Successful outer transaction',receipt.status==='success'&&same(receipt.transactionHash,request.transactionHash)&&isHash(receipt.blockHash)&&typeof receipt.blockNumber==='bigint'&&receipt.blockNumber>=BigInt(manifest.deployBlock)))return stop('The outer transaction failed or has an invalid receipt. This is not successful WOTS execution.');
    proof.blockNumber=receipt.blockNumber.toString();proof.blockHash=receipt.blockHash;
    const [block,transaction]=await Promise.all([client.getBlock({blockNumber:receipt.blockNumber}),client.getTransaction({hash:request.transactionHash})]);
    signal?.throwIfAborted();
    if(!check('Canonical receipt and transaction',block.number===receipt.blockNumber&&same(block.hash,receipt.blockHash)&&same(transaction.hash,request.transactionHash)&&same(transaction.blockHash,receipt.blockHash)&&transaction.blockNumber===receipt.blockNumber))return stop('The transaction is not bound to the checked canonical block.');
    proof.timestamp=new Date(Number(block.timestamp)*1000).toISOString();
    if(!check('Direct call to pinned EntryPoint v0.7',same(transaction.to,manifest.entryPoint)&&typeof transaction.input==='string'&&transaction.input.length<=262_146))return stop('This verifier supports direct EntryPoint handleOps transactions only.');
    const decoded=decodeFunctionData({abi:entryPoint07Abi,data:transaction.input});
    if(decoded.functionName!=='handleOps'||!decoded.args||decoded.args[0].length>32)return stop('Unsupported EntryPoint call or oversized operation batch.');
    const events=parseEventLogs({abi:entryPoint07Abi,eventName:'UserOperationEvent',strict:true,logs:receipt.logs.filter(log=>same(log.address,manifest.entryPoint)&&!log.removed&&same(log.transactionHash,receipt.transactionHash)&&same(log.blockHash,receipt.blockHash)&&log.blockNumber===receipt.blockNumber)});
    const candidates=decoded.args[0].flatMap(packed=>{
      if(request.account&&!same(packed.sender,request.account))return [];
      const userOpHash=packedWotsOperationHash(packed);
      if(request.userOpHash&&!same(userOpHash,request.userOpHash))return [];
      const matches=events.filter(event=>same(event.args.sender,packed.sender)&&same(event.args.userOpHash,userOpHash)&&event.args.nonce===packed.nonce);
      return matches.length===1?[{packed,userOpHash,event:matches[0]}]:[];
    });
    if(!check('One matching UserOperation and hash',candidates.length===1))return stop(candidates.length?'Multiple operations match. Supply an account or UserOperation hash.':'No matching UserOperation event was bound to the transaction calldata.');
    const {packed,userOpHash,event}=candidates[0];
    proof.account=getAddress(packed.sender);proof.userOpHash=userOpHash;proof.nonce=packed.nonce.toString();
    if(!check('Normal WOTS signature encoding',size(packed.signature)===USEROP_SIGNATURE_BYTES))return stop('This is not a supported normal WOTS operation. Recovery and other signature schemes are outside this verifier.');
    const blockNumber=receipt.blockNumber;
    const runtimes=await Promise.all(['entryPoint','factory','accountImplementation'].map(async name=>{
      const key=name as keyof typeof manifest.runtimeHashes;
      const code=await client.getCode({address:manifest[key] as Address,blockNumber});
      return !!code&&code!=='0x'&&same(keccak256(code),manifest.runtimeHashes[key]);
    }));
    signal?.throwIfAborted();
    if(!check('Pinned protocol bytecode at execution block',runtimes.every(Boolean)))return stop('Historical protocol bytecode does not match the pinned deployment.');
    const [proxy,factoryLink,entryLink]=await Promise.all([
      client.getCode({address:proof.account,blockNumber}),
      client.readContract({address:manifest.factory as Address,abi:linkAbi,functionName:'accountImplementation',blockNumber}),
      client.readContract({address:manifest.accountImplementation as Address,abi:linkAbi,functionName:'entryPoint',blockNumber}),
    ]);
    signal?.throwIfAborted();
    const expectedProxy=concat(['0x363d3d373d3d3d363d73',manifest.accountImplementation as Address,'0x5af43d82803e903d91602b57fd5bf3']);
    if(!check('Account proxy and implementation links',same(proxy,expectedProxy)&&same(factoryLink,manifest.accountImplementation)&&same(entryLink,manifest.entryPoint)))return stop('The sender is not the supported WOTS account implementation.');
    const {nextPublicKeyHash,wotsSignature}=decodeUserOpSignature(packed.signature);
    const usedPublicKeyHash=recoverPublicKeyHash(signatureDigest(userOpHash,nextPublicKeyHash),wotsSignature);
    const rotations=parseEventLogs({abi:quantumSafeAccountAbi,eventName:'KeyRotated',strict:true,logs:receipt.logs.filter(log=>same(log.address,proof.account)&&!log.removed&&same(log.transactionHash,receipt.transactionHash)&&same(log.blockHash,receipt.blockHash)&&log.blockNumber===blockNumber)})
      .filter(log=>same(log.args.usedPublicKeyHash,usedPublicKeyHash)&&same(log.args.nextPublicKeyHash,nextPublicKeyHash));
    if(!check('WOTS cryptography and matching key rotation',rotations.length===1))return stop('The public WOTS signature does not bind to one matching key-rotation event.');
    proof.keyIndex=rotations[0].args.keyIndex.toString();proof.nextKeyIndex=(rotations[0].args.keyIndex+1n).toString();proof.usedPublicKeyHash=usedPublicKeyHash;proof.nextPublicKeyHash=nextPublicKeyHash;
    proof.signatureHash=keccak256(packed.signature);proof.signatureBytes=size(packed.signature);
    proof.actualGasUsed=event.args.actualGasUsed.toString();proof.actualGasCostWei=event.args.actualGasCost.toString();
    try{
      const call=decodeFunctionData({abi:quantumSafeAccountAbi,data:packed.callData});
      if(call.functionName==='execute')proof.calls=[{to:getAddress(call.args[0]),valueWei:call.args[1].toString(),dataBytes:size(call.args[2])}];
      else if(call.functionName==='executeBatch')proof.calls=call.args[0].map((to,index)=>({to:getAddress(to),valueWei:call.args[1][index].toString(),dataBytes:size(call.args[2][index])}));
    }catch{/* Call summaries are optional; signature and execution checks do not depend on a UI decoder. */}
    const finalBlock=await client.getBlock({blockNumber});signal?.throwIfAborted();
    if(!check('Block still canonical after verification',same(finalBlock.hash,receipt.blockHash)))return stop('The block changed during verification. Check again.');
    check('UserOperation execution succeeded',event.args.success);
    proof.status=event.args.success?'verified':'execution-reverted';
    proof.message=event.args.success?'WOTS authorization, key rotation, and successful execution verified from public chain data.':'WOTS authorization and key rotation verified, but operation execution reverted. This is not a successful transfer.';
    return proof;
  }catch{signal?.throwIfAborted();return stop('Public verification is unavailable or the transaction is unsupported. Retry with an archive-capable Robinhood Testnet RPC. No signature or transaction was created.');}
}
