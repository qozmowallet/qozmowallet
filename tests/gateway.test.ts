import assert from 'node:assert/strict';
import test from 'node:test';
import { PassThrough } from 'node:stream';
import { createGateway, ENTRYPOINT, historyTarget, validateBundlerRequest } from '../scripts/gateway.mjs';

const address='0x1111111111111111111111111111111111111111';
test('gateway only accepts fixed ERC-4337 methods and the pinned EntryPoint',()=>{
  const body={jsonrpc:'2.0',id:1,method:'eth_sendUserOperation',params:[{sender:address},ENTRYPOINT]};
  assert.equal(validateBundlerRequest(body).method,'eth_sendUserOperation');
  for(const invalid of [[body],{...body,method:'eth_sendRawTransaction'},{...body,params:[{sender:address},address]},{...body,id:NaN},{...body,params:[]}])assert.throws(()=>validateBundlerRequest(invalid));
  assert.throws(()=>historyTarget(new URLSearchParams({chainId:'1',address,action:'txlist',page:'-1'})));
  assert.throws(()=>historyTarget(new URLSearchParams({chainId:'999',address,action:'txlist'})));
  assert.equal(historyTarget(new URLSearchParams({chainId:'46630',address,action:'tokentx',page:'2'})).origin,'https://explorer.testnet.chain.robinhood.com');
});
function request(server:ReturnType<typeof createGateway>,path:string,body?:unknown,origin='http://localhost:3001') {
  return new Promise<{code:number;body:Record<string,unknown>;headers:Record<string,string>}>((resolve,reject)=>{
    const req=new PassThrough() as PassThrough & {url:string;method:string;headers:Record<string,string>;socket:{remoteAddress:string}};
    req.url=path;req.method=body?'POST':'GET';req.headers={origin,'content-type':'application/json'};req.socket={remoteAddress:'127.0.0.1'};
    const headers:Record<string,string>={};let code=200;
    const res={setHeader:(key:string,value:string)=>{headers[key]=value;},writeHead:(value:number)=>{code=value;},end:(text:string)=>resolve({code,body:JSON.parse(text),headers})};
    server.emit('request',req,res);req.on('error',reject);req.end(body?JSON.stringify(body):undefined);
  });
}
test('gateway missing config, origin checks and provider errors do not expose credentials',async()=>{
  const server=createGateway({bundlerUrl:undefined});
  assert.equal((await request(server,'/health')).body.bundler,'not-configured');
  assert.equal((await request(server,'/health',undefined,'https://evil.example')).code,403);
  assert.equal((await request(server,'/bundler',{jsonrpc:'2.0',id:1,method:'eth_chainId',params:[]})).code,503);
  const withProvider=createGateway({bundlerUrl:'https://provider.example/secret-key',fetcher:async()=>{throw new Error('https://provider.example/secret-key');}});
  const failed=await request(withProvider,'/health');assert.equal(failed.code,502);assert.equal(JSON.stringify(failed).includes('secret-key'),false);
});
test('a wrong-chain provider cannot receive a signed operation',async()=>{
  const methods:string[]=[];
  const server=createGateway({bundlerUrl:'https://provider.example/key',fetcher:async(_url:unknown,init?:RequestInit)=>{const body=JSON.parse(init?.body as string);methods.push(body.method);return new Response(JSON.stringify({jsonrpc:'2.0',id:body.id,result:body.method==='eth_chainId'?'0x1':[ENTRYPOINT]}));}});
  const result=await request(server,'/bundler',{jsonrpc:'2.0',id:3,method:'eth_sendUserOperation',params:[{sender:address},ENTRYPOINT]});
  assert.equal(result.code,502);assert.equal(methods.includes('eth_sendUserOperation'),false);
});
