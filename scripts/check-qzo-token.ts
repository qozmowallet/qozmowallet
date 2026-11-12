import {createPublicClient,http,erc20Abi,keccak256} from 'viem';
import {mkdir,writeFile} from 'node:fs/promises';
import {QZO_TOKEN} from '../lib/qzo-token';
async function main(){
  const client=createPublicClient({transport:http('https://rpc.mainnet.chain.robinhood.com',{timeout:15_000,retryCount:0}),cacheTime:0});
  if(await client.getChainId()!==QZO_TOKEN.chainId)throw new Error('The RPC did not report Robinhood Chain mainnet.');
  const blockNumber=await client.getBlockNumber({cacheTime:0});
  const [code,name,symbol,decimals,totalSupply,block]=await Promise.all([
    client.getCode({address:QZO_TOKEN.address,blockNumber}),
    client.readContract({address:QZO_TOKEN.address,abi:erc20Abi,functionName:'name',blockNumber}),
    client.readContract({address:QZO_TOKEN.address,abi:erc20Abi,functionName:'symbol',blockNumber}),
    client.readContract({address:QZO_TOKEN.address,abi:erc20Abi,functionName:'decimals',blockNumber}),
    client.readContract({address:QZO_TOKEN.address,abi:erc20Abi,functionName:'totalSupply',blockNumber}),
    client.getBlock({blockNumber}),
  ]);
  if(!code||code==='0x'||name!==QZO_TOKEN.name||symbol!==QZO_TOKEN.symbol)throw new Error('Configured token metadata did not match.');
  const report={checkedAt:new Date().toISOString(),chainId:QZO_TOKEN.chainId,address:QZO_TOKEN.address,blockNumber:blockNumber.toString(),blockHash:block.hash,name,symbol,decimals,totalSupply:totalSupply.toString(),runtimeHash:keccak256(code),scope:'Public metadata for the configured token only. Does not certify issuer identity, supply controls, an audit, wallet utility, fee capture, or investment value.'};
  await mkdir('public/evidence',{recursive:true});await writeFile('public/evidence/qzo-token-metadata.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
void main().catch(()=>{console.error('Token metadata could not be checked. No transaction was created.');process.exitCode=1;});
