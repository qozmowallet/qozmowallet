import {createPublicClient,http,type Address,type Hex} from 'viem';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {verifyWotsTransaction,WOTS_PROOF_RPC} from '../lib/wallet/wots-proof';
const args=process.argv.slice(2);
const value=(flag:string)=>{const i=args.indexOf(flag);return i<0?undefined:args[i+1];};
async function main(){
  const transactionHash=value('--tx');
  if(!transactionHash)throw new Error('Usage: npm run verify:wots -- --tx 0x… [--account 0x…] [--user-op 0x…] [--out public/evidence/name.json]');
  const rpcUrl=process.env.QOZMO_PROOF_RPC_URL;
  if(rpcUrl&&new URL(rpcUrl).protocol!=='https:')throw new Error('Use an HTTPS proof RPC.');
  const client=createPublicClient({transport:http(process.env.QOZMO_PROOF_RPC_URL||WOTS_PROOF_RPC,{timeout:20_000,retryCount:0}),cacheTime:0});
  const proof=await verifyWotsTransaction(client,{transactionHash:transactionHash as Hex,account:value('--account') as Address|undefined,userOpHash:value('--user-op') as Hex|undefined});
  console.log(JSON.stringify(proof,null,2));
  const output=value('--out');
  if(output){
    if(proof.status!=='verified')throw new Error('Unverified execution was not saved as public proof.');
    const location=path.resolve(output);const directory=path.resolve('public/evidence');
    if(!location.startsWith(directory+path.sep)||!location.endsWith('.json'))throw new Error('Public proof output must be a JSON file inside public/evidence/.');
    await mkdir(path.dirname(location),{recursive:true});await writeFile(location,JSON.stringify(proof,null,2)+'\n');
  }
  if(proof.status!=='verified')process.exitCode=1;
}
void main().catch(error=>{console.error(error instanceof Error?error.message:'Verification failed.');process.exitCode=1;});
