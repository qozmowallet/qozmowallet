import assert from 'node:assert/strict';
import { after, afterEach, before, beforeEach, test } from 'node:test';
import React, { act, useState } from 'react';
import { JSDOM } from 'jsdom';
import type { QozmoAccountContext } from '../components/wallet/account-context';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { newQuantumDraft, sealQuantumDraft, installQuantumRecord, QUANTUM_STORAGE_KEY } from '../lib/wallet/quantum/storage';
import { deriveAccountNotesKey, saveAccountNote } from '../lib/wallet/privacy/account-notes';
import { createPrivacyNote } from '../lib/wallet/privacy/note';
import { PRIVACY_RESEARCH as pins } from '../lib/wallet/privacy/research-deployment';
import { encodeAbiParameters, encodeFunctionData, type Hex } from 'viem';
import { encodeCalls } from '../lib/wallet/quantum-sdk/account';
import { QUANTUM_DEPLOYMENT } from '../lib/wallet/quantum/client';
import { privacyPoolAbi } from '../lib/wallet/privacy/transactions';
import { createAccountBackup, rememberBackupDownload } from '../lib/wallet/account-backup';
import runtime from './fixtures/quantum-runtime.json';
import type { QuantumSession } from '../lib/wallet/quantum/client';

let dom: JSDOM, root: import('react-dom/client').Root, account: QozmoAccountContext;
const original = new Map<string, PropertyDescriptor | undefined>();
function install(name: string, value: unknown) { original.set(name, Object.getOwnPropertyDescriptor(globalThis, name)); Object.defineProperty(globalThis, name, { configurable: true, value }); }
let App: React.ComponentType, readAccount: () => QozmoAccountContext, setActivity: (value: QozmoAccountContext['status']) => void, cache: string;
const harness = `
import React, { useState } from 'react';
import { QozmoAccountProvider } from './components/wallet/account-provider';
import { useQozmoAccount, AccountContext } from './components/wallet/account-context';
import QuantumWallet from './components/dashboard/quantum-wallet';
import { AccountPrivacy } from './components/wallet/account-privacy';
import BackupCenter from './components/wallet/backup-center';
import { AccountActivity } from './components/wallet/account-activity';
let account, setActivity;
function Workspace() {
  account = useQozmoAccount();
  const [tab, setTab] = useState('wallet');
  const [activityStatus, updateActivity] = useState(null); setActivity = updateActivity;
  return React.createElement(React.Fragment, null,
    React.createElement('nav', null, ...['wallet', 'privacy', 'backup', 'activity'].map(value => React.createElement('button', { key: value, onClick: () => setTab(value) }, value))),
    React.createElement('output', { 'data-account': true }, account.record?.address ?? 'No account'),
    tab === 'wallet' ? React.createElement(QuantumWallet) : tab === 'backup' ? React.createElement(BackupCenter) : tab === 'activity' ? React.createElement(AccountContext.Provider, {value:{...account,status:activityStatus ?? account.status}}, React.createElement(AccountActivity)) : React.createElement(AccountPrivacy, { supported: true, onTestnet: () => {} }));
}

export const readAccount = () => account;
export const configureActivity = value => setActivity(value);
export default function App() { return <QozmoAccountProvider><Workspace/></QozmoAccountProvider>; }
`;
const content = () => document.body.textContent ?? '';
async function click(label: string) { const button = [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === label); assert.ok(button, label); await act(async () => button.click()); }
before(async () => {
  dom = new JSDOM('<div id="root"></div>', { url: 'https://unified-qozmo.test', pretendToBeVisual: true });
  for (const [name, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, localStorage: dom.window.localStorage, HTMLElement: dom.window.HTMLElement, Event: dom.window.Event, StorageEvent: dom.window.StorageEvent, requestAnimationFrame: (fn: () => void) => setTimeout(fn, 0), IS_REACT_ACT_ENVIRONMENT: true, fetch: () => { throw new Error('No network allowed in the shared-session component test.'); } })) install(name, value);
  dom.window.HTMLElement.prototype.scrollTo = () => {};
  dom.window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  dom.window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  Object.defineProperty(dom.window.navigator, 'locks', { value: { request: async (_name: string, options: unknown, callback?: () => unknown) => typeof options === 'function' ? options() : callback?.() } });
  cache = await mkdtemp(path.resolve('node_modules/.cache/qozmo-unified-ui-'));
  await build({ stdin: { contents: harness, resolveDir: process.cwd(), loader: 'tsx' }, outfile: path.join(cache, 'component.mjs'), bundle: true, platform: 'node', format: 'esm', packages: 'external', loader: { '.css': 'empty' }, jsx: 'automatic', logLevel: 'silent' });
  const component = await import(pathToFileURL(path.join(cache, 'component.mjs')).href); App = component.default; readAccount = component.readAccount; setActivity = component.configureActivity;

});
beforeEach(async () => { localStorage.clear(); const { createRoot } = await import('react-dom/client'); root = createRoot(document.getElementById('root')!); });
afterEach(async () => { await act(async () => root.unmount()); });
after(async () => { if (cache) await rm(cache, { recursive: true, force: true }); dom.window.close(); for (const [name, descriptor] of original) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else Reflect.deleteProperty(globalThis, name); } });

test('website wallet and Privacy Ring use the same record and keep one unlock session across feature navigation', async () => {
  const draft = newQuantumDraft(), record = await sealQuantumDraft(draft, 'Public fixture password!', 'One shared account');
  await installQuantumRecord(record);
  localStorage.setItem('qozmo.wallet.vault.v1', 'preserved legacy EOA sentinel');
  const before = localStorage.getItem(QUANTUM_STORAGE_KEY);
  const notesKey = await deriveAccountNotesKey(draft.seed, record.address);
  await saveAccountNote(record.address, notesKey, createPrivacyNote({ chainId: 46630, pool: pins.pool, denomination: pins.denomination }));
  await act(async () => root.render(React.createElement(App)));
  assert.equal(document.querySelector('[data-account]')?.textContent, record.address);
  assert.match(content(), /One shared account/); assert.ok(!content().includes('Create quantum wallet'));
  const session = { record, notesKey, wallet: {}, client: { getChainId: async () => 46630, getCode: async () => undefined } } as unknown as QuantumSession;
  await act(async () => readAccount().setSession(session));
  await click('privacy');
  assert.match(content(), /Unlocked across your workspace/); assert.equal(document.querySelectorAll('select[aria-label="Your account privacy note"] option').length, 2);
  assert.equal(readAccount().session, session); assert.ok(!document.querySelector('input[type=password]'));
  await click('wallet'); assert.equal(readAccount().session, session); assert.match(content(), /PUBLIC WALLET BALANCE/);
  await click('privacy'); await act(async () => readAccount().lock());
  assert.equal(readAccount().session, null); assert.match(content(), /Your wallet is locked/); assert.ok(!document.querySelector('select[aria-label="Your account privacy note"]'));
  assert.equal(localStorage.getItem(QUANTUM_STORAGE_KEY), before); assert.equal(localStorage.getItem('qozmo.wallet.vault.v1'), 'preserved legacy EOA sentinel');
});
test('Privacy Ring opens the shared setup and Receive uses the canonical smart account', async () => {
  await act(async () => root.render(React.createElement(App)));
  await click('privacy'); await click('Create wallet');
  assert.equal(document.querySelectorAll('dialog').length, 1); assert.match(content(), /One smart account for your wallet, Quantum and Privacy Ring/);
  await act(async () => readAccount().lock()); assert.equal(document.querySelectorAll('dialog').length, 0);
  assert.equal(localStorage.getItem(QUANTUM_STORAGE_KEY), null);
});

async function until(predicate: () => boolean) { for (let i = 0; i < 250; i++) { if (predicate()) return; await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); }); } assert.fail('Shared workspace did not reach expected state: ' + content().slice(-1000)); }
async function unlockedFixture() {
  const draft = newQuantumDraft(), record = await sealQuantumDraft(draft, 'Public fixture password!', 'Workspace fixture');
  await installQuantumRecord(record);
  const notesKey = await deriveAccountNotesKey(draft.seed, record.address);
  await saveAccountNote(record.address, notesKey, createPrivacyNote({ chainId: 46630, pool: pins.pool, denomination: pins.denomination }));
  await act(async () => root.render(React.createElement(App)));
  const session = { record, notesKey, wallet: {}, client: { getChainId: async () => 46630, getCode: async () => undefined } } as unknown as QuantumSession;
  await act(async () => readAccount().setSession(session));
  return { record, notesKey, session };
}
test('Backup Center shows stale note coverage and lock clears its passwords without touching the account', async () => {
  const { record, notesKey } = await unlockedFixture();
  const backup = await createAccountBackup(record, 'Public fixture password!'); rememberBackupDownload(record, backup.stamp);
  await click('backup'); await until(() => content().includes('Matches local data'));
  assert.match(content(), /Check completeness/); assert.match(content(), /Known operations/);
  await act(async () => { await saveAccountNote(record.address, notesKey, createPrivacyNote({ chainId: 46630, pool: pins.pool, denomination: pins.denomination })); });
  await until(() => content().includes('New backup needed'));
  const input = document.querySelector<HTMLInputElement>('input[type=password]')!;
  await act(async () => { Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!.call(input, 'private temporary field'); input.dispatchEvent(new dom.window.Event('input', { bubbles: true })); });
  await act(async () => readAccount().lock());
  assert.ok([...document.querySelectorAll<HTMLInputElement>('input[type=password]')].every(field => field.value === ''));
  assert.equal(JSON.parse(localStorage.getItem(QUANTUM_STORAGE_KEY)!).id, record.id);
});
test('Activity renders exact signed privacy/public intent and exposes receipt failures separately from consumed keys', async () => {
  const { record } = await unlockedFixture();
  const native = encodeCalls([{to:pins.verifier,value:1n,data:'0x'}]);
  const deposit = encodeCalls([{to:pins.pool,value:BigInt(pins.denomination),data:encodeFunctionData({abi:privacyPoolAbi,functionName:'deposit',args:[123n]})}]);
  const entries = [native,deposit].map((callData,index)=>({keyIndex:index,userOpHash:`0x${String(index+1).repeat(64)}` as Hex,nextPublicKeyHash:`0x${'ab'.repeat(32)}` as Hex,status:'confirmed' as const,createdAt:Date.now(),transactionHash:`0x${String(index+3).repeat(64)}` as Hex,userOperation:{callData,signature:'0x1234'}}));
  await act(async () => { setActivity({balance:1n,state:{deployed:true,keyIndex:2,recoveryIndex:0} as never,entries,recoveryExposed:false}); });
  await click('activity');
  assert.match(content(), /ETH transfer/); assert.match(content(), /Privacy deposit/); assert.match(content(), /0.000000000000000001 ETH/); assert.match(content(), /0.001 ETH/);
  assert.match(content(), /Check execution/); assert.ok(!content().includes('Execution confirmed'));
  const filter=document.querySelector<HTMLSelectElement>('[aria-label="Activity operation type"]')!;
  await act(async()=>{filter.value='privacy';filter.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});
  assert.ok(!content().includes('ETH transfer'));assert.match(content(),/Privacy deposit/);
  assert.equal(readAccount().record?.address,record.address);
});
test('a missing gateway offers retry; an explicit retry checks the network and creates one shared connection', async () => {
  const { session } = await unlockedFixture();
  let ready=false; const methods:string[]=[];
  const originalFetch=globalThis.fetch;
  Object.defineProperty(globalThis,'fetch',{configurable:true,value:async(input:unknown,init?:RequestInit)=>{
    const url=String(input);
    if(url.endsWith('/health'))return new Response(JSON.stringify({chainId:46630,bundler:ready?'ready':'not-configured'}));
    const request=JSON.parse(String(init?.body));methods.push(request.method);let result:unknown;
    if(request.method==='eth_chainId')result='0xb626';
    else if(request.method==='eth_supportedEntryPoints')result=[QUANTUM_DEPLOYMENT.entryPoint];
    else if(request.method==='eth_blockNumber')result='0x9000000';
    else if(request.method==='eth_getCode') {const address=request.params[0];const name=(['entryPoint','factory','accountImplementation'] as const).find(key=>QUANTUM_DEPLOYMENT[key].toLowerCase()===address.toLowerCase());result=name?runtime[name]:'0x';}
    else if(request.method==='eth_call')result=encodeAbiParameters([{type:'address'}],[request.params[0].to.toLowerCase()===QUANTUM_DEPLOYMENT.factory.toLowerCase()?QUANTUM_DEPLOYMENT.accountImplementation:QUANTUM_DEPLOYMENT.entryPoint]);
    else assert.fail('Unexpected RPC; this test never submits a transaction.');
    return new Response(JSON.stringify({jsonrpc:'2.0',id:request.id,result}));
  }});
  try {
    await click('Check & connect Qozmo'); await until(()=>content().includes('Gateway setup needed'));assert.equal(readAccount().relay,null);
    ready=true;await click('Retry connection check');await until(()=>content().includes('Transaction relay ready'));
    assert.equal(readAccount().connection.status,'connected');assert.ok(readAccount().relay);assert.equal(readAccount().session,session);
    await click('privacy');assert.match(content(),/Qozmo managed bundler/);assert.match(content(),/Transaction relay ready/);
    assert.ok(!methods.some(method=>method.includes('send')));
    await act(async()=>readAccount().disconnect());assert.equal(readAccount().relay,null);assert.equal(readAccount().session,session);
  } finally { Object.defineProperty(globalThis,'fetch',{configurable:true,value:originalFetch}); }
});

test('a fresh receipt failure clears a previous success and fee observation from the shared controller', async () => {
  const { record, session } = await unlockedFixture();
  const { encodeEventTopics } = await import('viem');
  const { entryPoint07Abi } = await import('viem/account-abstraction');
  const hash = `0x${'ab'.repeat(32)}` as Hex, tx = `0x${'cd'.repeat(32)}` as Hex, blockHash = `0x${'ef'.repeat(32)}` as Hex;
  const entry = { keyIndex: 0, userOpHash: hash, nextPublicKeyHash: hash, createdAt: Date.now(), status: 'confirmed' as const, transactionHash: tx, userOperation: { callData: encodeCalls([{to:pins.verifier,value:1n,data:'0x'}]), signature: '0x1234' } };
  let unavailable = false;
  const client = {
    chain: {id:46630}, getChainId: async()=>46630, getBlockNumber:async()=>150000002n,
    getCode: async({address}:{address:string})=>{const name=(['entryPoint','factory','accountImplementation'] as const).find(key=>QUANTUM_DEPLOYMENT[key].toLowerCase()===address.toLowerCase());return name?runtime[name]:undefined;},
    readContract:async({functionName}:{functionName:string})=>functionName==='accountImplementation'?QUANTUM_DEPLOYMENT.accountImplementation:QUANTUM_DEPLOYMENT.entryPoint,
    getBlock:async()=>({number:150000000n,hash:blockHash}),
    getTransactionReceipt:async()=>{
      if(unavailable)throw Error('Fixture receipt unavailable');
      return {transactionHash:tx,blockNumber:150000000n,blockHash,status:'success',logs:[{address:QUANTUM_DEPLOYMENT.entryPoint,transactionHash:tx,blockNumber:150000000n,blockHash,removed:false,topics:encodeEventTopics({abi:entryPoint07Abi,eventName:'UserOperationEvent',args:{userOpHash:hash,sender:record.address,paymaster:'0x0000000000000000000000000000000000000000'}}),data:encodeAbiParameters([{type:'uint256'},{type:'bool'},{type:'uint256'},{type:'uint256'}],[0n,true,123n,456n])}]};
    },
  };
  const next = {...session,client,wallet:{sync:async()=>({keyIndex:1,recoveryExposed:false}),getBalance:async()=>1n,getKeyState:async()=>({deployed:true,keyIndex:1,recoveryIndex:0}),journal:{list:async()=>[entry]}}} as unknown as QuantumSession;
  await act(async()=>readAccount().setSession(next));
  await until(()=>readAccount().receipts[hash]?.status==='succeeded');
  assert.equal(readAccount().receipts[hash].actualGasCost,'123');assert.equal(readAccount().receipts[hash].confirmations,3);
  unavailable=true;await act(async()=>{await readAccount().refresh(next);});
  assert.equal(readAccount().receipts[hash],undefined);assert.match(readAccount().receiptErrors[hash],/unavailable/);
  await click('activity');assert.match(content(),/Check execution/);assert.ok(!content().includes('Execution confirmed'));
});

test('locking during a gateway check prevents a late response from reconnecting the wallet', async () => {
  await unlockedFixture();
  const originalFetch=globalThis.fetch;let release!:()=>void, connecting!:Promise<void>;
  const held=new Promise<void>(resolve=>{release=resolve;});
  Object.defineProperty(globalThis,'fetch',{configurable:true,value:async(input:unknown)=>{assert.ok(String(input).endsWith('/health'));await held;return new Response(JSON.stringify({chainId:46630,bundler:'ready'}));}});
  try {
    await act(async()=>{connecting=readAccount().connect('managed');});
    assert.equal(readAccount().connection.status,'checking');
    await act(async()=>readAccount().lock());
    await act(async()=>{release();await connecting;});
    assert.equal(readAccount().session,null);assert.equal(readAccount().relay,null);assert.equal(readAccount().connection.status,'idle');assert.equal(readAccount().busy,false);
  } finally { release(); Object.defineProperty(globalThis,'fetch',{configurable:true,value:originalFetch}); }
});
