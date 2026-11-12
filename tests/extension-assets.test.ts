import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Address, PublicClient } from 'viem';
import {
  addExtensionToken, defaultExtensionAssets, discoverExtensionTokens, extensionAssetKey, inspectExtensionToken,
  parseDiscoveredTokens, parseExtensionAssets, readExtensionAssets, readExtensionTokenBalances, updateExtensionAssets,
  type ExtensionToken,
} from '../lib/wallet/extension-assets';
const account='0x1111111111111111111111111111111111111111' as Address;
const contract='0x2222222222222222222222222222222222222222' as Address;
const other='0x3333333333333333333333333333333333333333' as Address;
const token:ExtensionToken={address:contract,name:'Fixture Coin',symbol:'FIX',decimals:6,visible:true};
class StorageFixture {
  values=new Map<string,string>();fail=false;
  getItem(key:string){return this.values.get(key)??null;}
  setItem(key:string,value:string){if(this.fail)throw new Error('Quota');this.values.set(key,value);}
}
function client(options:{chain?:number;balance?:unknown;decimals?:number;symbol?:string;name?:string;code?:string;fail?:Address}={}){
  const calls:{functionName?:string;address?:Address;blockNumber?:bigint;args?:unknown[]}[]=[];
  const api={
    getChainId:async()=>options.chain??46630,
    getBlockNumber:async()=>{calls.push({functionName:'block'});return 88n;},
    getCode:async(request:{address:Address;blockNumber:bigint})=>{calls.push(request);return options.code??'0x6000';},
    readContract:async(request:{address:Address;functionName:string;blockNumber:bigint;args?:unknown[]})=>{
      calls.push(request);if(request.address===options.fail)throw new Error('RPC failure');
      return request.functionName==='balanceOf'?(options.balance??1234567n):request.functionName==='decimals'?(options.decimals??6):request.functionName==='symbol'?(options.symbol??'FIX'):(options.name??'Fixture Coin');
    },
  } as unknown as PublicClient;
  return {api,calls};
}
test('asset visibility is scoped to account and chain, persists public metadata, and never writes vault/journal keys',()=>{
  const store=new StorageFixture();store.setItem('qozmo.quantum.account.v1','preserve-vault');store.setItem('qozmo.quantum.journal:fixture','preserve-journal');
  const saved=updateExtensionAssets(account,current=>addExtensionToken(current,token),store);
  assert.equal(saved.tokens.length,1);
  updateExtensionAssets(account,current=>({...current,nativeVisible:false,tokens:current.tokens.map(item=>({...item,visible:false}))}),store);
  // An independent update reads the latest preferences rather than overwriting another context's edit.
  updateExtensionAssets(account,current=>({...current,hideZero:true}),store);
  const reopened=readExtensionAssets(account,store);
  assert.equal(reopened.nativeVisible,false);assert.equal(reopened.tokens[0].visible,false);assert.equal(reopened.hideZero,true);
  assert.deepEqual(readExtensionAssets(other,store),defaultExtensionAssets(other));
  assert.equal(store.getItem('qozmo.quantum.account.v1'),'preserve-vault');assert.equal(store.getItem('qozmo.quantum.journal:fixture'),'preserve-journal');
  assert.deepEqual([...store.values.keys()].filter(key=>key.includes('.assets.')),[extensionAssetKey(account)]);
  assert.throws(()=>parseExtensionAssets({...reopened,chainId:1},account));
  assert.throws(()=>parseExtensionAssets(reopened,other));
});
test('malformed or duplicate asset data is preserved, and a failed save cannot alter the displayed preference source',()=>{
  const store=new StorageFixture();store.setItem(extensionAssetKey(account),'{broken');
  assert.throws(()=>updateExtensionAssets(account,current=>({...current,hideZero:true}),store),/preserved/);
  assert.equal(store.getItem(extensionAssetKey(account)),'{broken');
  const defaults=defaultExtensionAssets(account);
  for(const bad of [{...defaults,tokens:[token,token]},{...defaults,tokens:[{...token,decimals:255}]},{...defaults,tokens:[{...token,symbol:'ETH\u202e'}]},{...defaults,tokens:[{...token,icon_url:'https://untrusted.example/icon.png'}]}])assert.throws(()=>parseExtensionAssets(bad,account));
  store.setItem(extensionAssetKey(account),JSON.stringify(defaults));store.fail=true;
  assert.throws(()=>updateExtensionAssets(account,current=>addExtensionToken(current,token),store),/could not be saved/);
  assert.deepEqual(readExtensionAssets(account,store),defaults);
});
test('reimport reveals a hidden token once and updates explicitly reviewed metadata without storing balances',()=>{
  const current=addExtensionToken(defaultExtensionAssets(account),{...token,visible:false});current.tokens[0].visible=false;
  const next=addExtensionToken(current,{...token,name:'Reviewed replacement metadata',decimals:18});
  assert.equal(next.tokens.length,1);assert.equal(next.tokens[0].visible,true);assert.equal(next.tokens[0].decimals,18);
  assert.deepEqual(Object.keys(next.tokens[0]).sort(),['address','decimals','name','symbol','visible']);
});
test('ERC-20 inspection reads code, metadata and balance at one chain-checked block and never trusts a symbol as identity',async()=>{
  const {api,calls}=client();const result=await inspectExtensionToken(api,account,contract);
  assert.equal(result.address,contract);assert.equal(result.balance,1234567n);assert.equal(result.decimals,6);assert.equal(result.blockNumber,88n);
  assert.ok(calls.filter(call=>call.functionName!=='block').every(call=>call.blockNumber===88n));
  assert.deepEqual(calls.find(call=>call.functionName==='balanceOf')?.args,[account]);
  for(const options of [{code:'0x'},{symbol:'ETH\u202e'},{decimals:37},{balance:-1n},{balance:'1000'}])await assert.rejects(inspectExtensionToken(client(options).api,account,contract));
  const wrong=client({chain:1});await assert.rejects(inspectExtensionToken(wrong.api,account,contract),/not on Robinhood Testnet/);assert.deepEqual(wrong.calls,[]);
  await assert.rejects(inspectExtensionToken(api,account,'0x0000000000000000000000000000000000000000'),/valid token/);
});
test('tracked balances distinguish a genuine zero, an unavailable contract, and changed token decimals',async()=>{
  const {api}=client({balance:0n,fail:other});
  const result=await readExtensionTokenBalances(api,account,[token,{...token,address:other}]);
  assert.deepEqual(result.tokens,[{address:contract,status:'ready',balance:0n},{address:other,status:'error'}]);
  const changed=await readExtensionTokenBalances(client({decimals:18}).api,account,[token]);assert.deepEqual(changed.tokens,[{address:contract,status:'error'}]);
  const wrong=client({chain:4663});await assert.rejects(readExtensionTokenBalances(wrong.api,account,[token]),/not on Robinhood Testnet/);assert.deepEqual(wrong.calls,[]);
  const controller=new AbortController();controller.abort();await assert.rejects(readExtensionTokenBalances(api,account,[token],controller.signal));
});
test('explorer discovery ignores NFTs, spam, malformed metadata and image URLs, deduplicates contracts, and uses the pinned host',async()=>{
  const suggestion={token:{type:'ERC-20',address_hash:contract,name:'Fixture Coin',symbol:'FIX',icon_url:'https://untrusted.example/track.png'}};
  const data={items:[suggestion,suggestion,{token:{...suggestion.token,type:'ERC-721'}},{token:{...suggestion.token,address_hash:other,reputation:'spam'}},{token:{...suggestion.token,symbol:'bad\u202e'}}]};
  const expected=[{address:contract,name:'Fixture Coin',symbol:'FIX'}];assert.deepEqual(parseDiscoveredTokens(data),expected);
  let url='';let credentials:unknown;
  const fetcher=(async(input:unknown,init?:RequestInit)=>{url=String(input);credentials=init?.credentials;return new Response(JSON.stringify(data));}) as typeof fetch;
  assert.deepEqual(await discoverExtensionTokens(account,undefined,fetcher),expected);
  assert.ok(url.startsWith(`https://explorer.testnet.chain.robinhood.com/api/v2/addresses/${account}/tokens?type=ERC-20`));assert.equal(credentials,'omit');
  await assert.rejects(discoverExtensionTokens(account,undefined,(async()=>new Response('unavailable',{status:503})) as typeof fetch),/unavailable/);
  await assert.rejects(discoverExtensionTokens(account,undefined,(async()=>new Response('<html>bad gateway</html>')) as typeof fetch),/unavailable/);
});
