import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { inspectManagedGateway } from '../lib/wallet/connection';
const original=Object.getOwnPropertyDescriptor(globalThis,'fetch');
function response(value:unknown,status=200){Object.defineProperty(globalThis,'fetch',{configurable:true,value:async(url:string,options:RequestInit)=>{assert.match(url,/\/health$/);assert.equal(options.credentials,'omit');assert.equal(options.cache,'no-store');return new Response(JSON.stringify(value),{status});}});}
afterEach(()=>{if(original)Object.defineProperty(globalThis,'fetch',original);});
test('connection checks distinguish ready, unconfigured, wrong network and unavailable without submitting operations',async()=>{
  response({chainId:46630,bundler:'ready'});assert.equal((await inspectManagedGateway()).status,'connected');
  response({chainId:46630,bundler:'not-configured'});assert.equal((await inspectManagedGateway()).status,'not-configured');
  response({chainId:1,bundler:'ready'});assert.equal((await inspectManagedGateway()).status,'wrong-network');
  response({chainId:46630,bundler:'wrong-network-or-entrypoint'},503);assert.equal((await inspectManagedGateway()).status,'wrong-network');
  response({error:'private provider response'},502);const unavailable=await inspectManagedGateway();assert.equal(unavailable.status,'unavailable');assert.ok(!JSON.stringify(unavailable).includes('private provider'));
});
test('a failed gateway check can recover on an explicit retry and never exposes provider errors',async()=>{
  Object.defineProperty(globalThis,'fetch',{configurable:true,value:async()=>{throw Error('https://provider.example/secret-key');}});
  const failed=await inspectManagedGateway();assert.equal(failed.status,'unavailable');assert.ok(!JSON.stringify(failed).includes('secret-key'));
  response({chainId:46630,bundler:'ready'});assert.equal((await inspectManagedGateway()).status,'connected');
  const abort=new AbortController();abort.abort();await assert.rejects(inspectManagedGateway(abort.signal));
});
