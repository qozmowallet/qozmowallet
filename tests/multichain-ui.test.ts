import assert from 'node:assert/strict';
import {after,afterEach,before,beforeEach,test} from 'node:test';
import {mkdir,mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import React,{act} from 'react';
import {JSDOM} from 'jsdom';
import {Transaction,TEST_NETWORK} from '@scure/btc-signer';
import {createVault,storeVault,type VaultRecord} from '../lib/wallet/vault';
import {deriveNativeAddresses} from '../lib/wallet/multichain/keys';

// Pure component tests in a private in-memory DOM, not automation of the user's browser.
const phrase='abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const accounts=deriveNativeAddresses({mnemonic:phrase});
const other=deriveNativeAddresses({mnemonic:'test test test test test test test test test test test junk'});
const password='Public component test fixture!';
let dom:JSDOM,vault:VaultRecord,root:import('react-dom/client').Root,Component:React.ComponentType<{surface:'panel'}>,cache:string;
const originals=new Map<string,PropertyDescriptor|undefined>();
let holdBalance=false,releaseBalance:(()=>void)|undefined,visibility='visible';
const methods:string[]=[];
function install(name:string,value:unknown){if(!originals.has(name))originals.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{configurable:true,writable:true,value});}
const tick=()=>new Promise(resolve=>setTimeout(resolve,15));
async function until(predicate:()=>boolean){for(let i=0;i<200;i++){if(predicate())return;await act(tick);}assert.fail('Component did not reach the expected state: '+document.body.textContent?.slice(-1400));}
function text(){return document.getElementById('root')!.textContent??'';}
function button(label:string){const found=[...document.querySelectorAll('button')].find(row=>row.textContent?.trim()===label);assert.ok(found,'Missing button '+label);return found;}
async function click(label:string){await act(async()=>button(label).click());}
async function fill(input:HTMLInputElement,value:string){await act(async()=>{Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value')!.set!.call(input,value);input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));});}
async function submit(form:HTMLFormElement){await act(async()=>{form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));});}
async function unlock(){const input=document.getElementById('qx-native-password') as HTMLInputElement;assert.ok(input);await fill(input,password);await submit(input.closest('form')!);}
async function selectNetwork(value:string){const select=document.querySelector('select[aria-label="Wallet network"]') as HTMLSelectElement;assert.ok(select);assert.equal(select.disabled,false);await act(async()=>{select.value=value;select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});}

before(async()=>{
  vault=await createVault({name:'Public multichain test',password,mnemonic:phrase,backupConfirmed:true});
  dom=new JSDOM('<div id="root"></div>',{url:'https://qozmo-component.test/quantum.html?network=solana-devnet',pretendToBeVisual:true});
  for(const [name,value] of Object.entries({window:dom.window,document:dom.window.document,navigator:dom.window.navigator,localStorage:dom.window.localStorage,HTMLElement:dom.window.HTMLElement,HTMLDialogElement:dom.window.HTMLDialogElement,Event:dom.window.Event,MouseEvent:dom.window.MouseEvent,StorageEvent:dom.window.StorageEvent,IS_REACT_ACT_ENVIRONMENT:true}))install(name,value);
  Object.defineProperty(dom.window.document,'visibilityState',{configurable:true,get:()=>visibility});
  dom.window.HTMLElement.prototype.scrollTo=()=>{};
  dom.window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  Object.defineProperty(dom.window.navigator,'locks',{configurable:true,value:{request:async(_name:string,options:unknown,callback?:()=>unknown)=>typeof options==='function'?options():callback?.()}});
  const parent=new Transaction({allowUnknownInputs:true,allowUnknownOutputs:true});parent.addOutputAddress(accounts.bitcoin,1_000_000n,TEST_NETWORK);parent.addInput({txid:'00'.repeat(32),index:0xffffffff,sequence:0xffffffff,finalScriptSig:new Uint8Array([1,0])});
  install('fetch',async(input:unknown,init?:RequestInit)=>{
    const url=String(input),wrap=(value:unknown)=>({context:{slot:1000},value});let result:unknown;
    if(url==='https://api.devnet.solana.com'){
      const request=JSON.parse(String(init?.body));methods.push(request.method);
      if(request.method==='getBalance'&&holdBalance)await new Promise<void>(resolve=>{releaseBalance=resolve;});
      switch(request.method){
        case 'getGenesisHash':result='EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';break;
        case 'getBalance':result=wrap(1_250_000_000);break;
        case 'getAccountInfo':result=wrap({owner:'11111111111111111111111111111111',executable:false,data:['','base64']});break;
        case 'getLatestBlockhash':result=wrap({blockhash:'11111111111111111111111111111111',lastValidBlockHeight:1150});break;
        case 'getFeeForMessage':result=wrap(5000);break;
        case 'simulateTransaction':result=wrap({err:null,unitsConsumed:150});break;
        default:throw new Error('Unexpected RPC; component tests never broadcast.');
      }
      return new Response(JSON.stringify({jsonrpc:'2.0',id:1,result}));
    }
    if(url.startsWith('https://mempool.space/signet/api/')){
      if(init?.method==='POST')assert.fail('Component tests must never broadcast');
      if(url.endsWith('/block-height/0'))return new Response('00000008819873e925422c1ff0f99f7cc9bbb232af63a077a480a3633bee1ef6');
      if(url.endsWith('/blocks/tip/height'))return new Response('300');
      if(url.endsWith('/hex'))return new Response(parent.hex);
      if(url.endsWith('/utxo'))result=[{txid:parent.id,vout:0,value:1_000_000,status:{confirmed:true}}];
      else if(url.endsWith('/status'))result={confirmed:true,block_height:200};
      else if(url.endsWith('/outspend/0'))result={spent:false};
      else if(url.endsWith('/v1/fees/recommended'))result={halfHourFee:2};
      else throw new Error('Unexpected fixture URL');
      return new Response(JSON.stringify(result));
    }
    throw new Error('No external network access is permitted in component tests.');
  });
  await mkdir('node_modules/.cache',{recursive:true});cache=await mkdtemp(path.resolve('node_modules/.cache/qozmo-native-ui-'));
  await build({entryPoints:['components/extension-wallet.tsx'],outfile:path.join(cache,'component.mjs'),bundle:true,platform:'node',format:'esm',packages:'external',loader:{'.css':'empty'},jsx:'automatic',logLevel:'silent'});
  Component=(await import(pathToFileURL(path.join(cache,'component.mjs')).href)).default;
});
beforeEach(async()=>{
  holdBalance=false;releaseBalance=undefined;visibility='visible';methods.length=0;
  localStorage.clear();storeVault(vault);dom.window.history.replaceState(null,'','?network=solana-devnet');
  const {createRoot}=await import('react-dom/client');root=createRoot(document.getElementById('root')!);
  await act(async()=>root.render(React.createElement(Component,{surface:'panel'})));
  await until(()=>text().includes('Unlock standard wallet'));
});
afterEach(async()=>{releaseBalance?.();await act(async()=>root?.unmount());});
after(async()=>{dom?.window.close();for(const [key,descriptor]of originals){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}if(cache)await rm(cache,{recursive:true,force:true});});

test('native unlock reads a balance, SOL review preserves the exact network, and switching accounts locks',async()=>{
  await unlock();await until(()=>text().includes('1.25'));
  assert.ok(text().includes('Ed25519'));assert.ok(text().includes('WOTS applies to Robinhood Quantum only'));
  await click('Receive');assert.equal(document.querySelector('.qx-full-address')?.textContent,accounts.solana);
  await click('Back to assets');await click('Send');
  const fields=document.querySelectorAll<HTMLInputElement>('.qx-send-form input');await fill(fields[0],other.solana);await fill(fields[1],'0.01');await submit(fields[0].closest('form')!);
  await until(()=>!!document.querySelector('dialog[open]'));
  const dialog=document.querySelector('dialog')!;assert.ok(dialog.textContent?.includes('Solana Devnet'));assert.ok(dialog.textContent?.includes(other.solana));assert.ok(dialog.textContent?.includes('0.000005 SOL'));assert.ok(methods.includes('simulateTransaction'));assert.ok(!methods.includes('sendTransaction'));
  await act(async()=>dialog.dispatchEvent(new dom.window.Event('cancel',{cancelable:true})));
  await selectNetwork('bitcoin-signet');await until(()=>text().includes('Unlock standard wallet'));
  assert.ok(!text().includes('1.25'));assert.ok(text().includes('ECDSA'));assert.equal(document.querySelector('.qx-balance'),null);
  await selectNetwork('quantum-robinhood');await until(()=>text().includes('Create a wallet'));assert.ok(text().includes('WOTS · Testnet'));assert.ok(!text().includes('Public multichain test'));
});
test('Bitcoin receive and review show Signet address, exact fee and recipient without broadcasting',async()=>{
  await selectNetwork('bitcoin-signet');await until(()=>text().includes('Unlock standard wallet'));await unlock();await until(()=>text().includes('0.01'));
  await click('Receive');assert.equal(document.querySelector('.qx-full-address')?.textContent,accounts.bitcoin);
  await click('Back to assets');await click('Send');
  const fields=document.querySelectorAll<HTMLInputElement>('.qx-send-form input');await fill(fields[0],other.bitcoin);await fill(fields[1],'0.001');await click('Get Signet fee estimate');await until(()=>fields[2].value==='2');await submit(fields[0].closest('form')!);
  await until(()=>!!document.querySelector('dialog[open]'));const dialog=document.querySelector('dialog')!;
  assert.ok(dialog.textContent?.includes('Bitcoin Signet'));assert.ok(dialog.textContent?.includes(other.bitcoin));assert.ok(dialog.textContent?.includes('0.00000284 BTC'));assert.ok(dialog.textContent?.includes('Quantum WOTS is not used'));
});
test('a hidden panel discards an in-flight balance response and does not resurrect an unlocked account',async()=>{
  holdBalance=true;await unlock();await until(()=>typeof releaseBalance==='function');
  await act(async()=>{visibility='hidden';document.dispatchEvent(new dom.window.Event('visibilitychange'));});
  await until(()=>text().includes('Unlock standard wallet'));
  await act(async()=>{releaseBalance?.();await tick();});
  assert.equal(document.querySelector('.qx-balance'),null);assert.ok(!text().includes('1.25'));assert.equal(document.querySelector('dialog'),null);
});
