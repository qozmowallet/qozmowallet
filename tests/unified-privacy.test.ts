import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { decodeFunctionData, encodeFunctionData, type PublicClient } from 'viem';
import type { UserOperation } from 'viem/account-abstraction';
import { QuantumSafeWallet } from '../lib/wallet/quantum-sdk/wallet';
import { createJournalLock } from '../lib/wallet/quantum-sdk/journal';
import { newQuantumDraft, sealQuantumDraft, installQuantumRecord, QuantumJournal } from '../lib/wallet/quantum/storage';
import { prepareQuantumPrivacy, confirmQuantumPrivacy, assertQuantumPrivacyReview, prepareQuantumTransfer, QUANTUM_DEPLOYMENT, type QuantumSession, type QuantumRelay } from '../lib/wallet/quantum/client';
import { quantumSafeAccountAbi } from '../lib/wallet/quantum-sdk/account';
import runtime from './fixtures/quantum-runtime.json';
import privacyRuntime from './fixtures/privacy-runtime.json';
import { PRIVACY_RESEARCH as pins } from '../lib/wallet/privacy/research-deployment';
import { createPrivacyNote } from '../lib/wallet/privacy/note';
import { preparePrivacyDeposit, privacyPoolAbi } from '../lib/wallet/privacy/transactions';
import { privacyCallDetails } from '../lib/wallet/privacy/account-calls';
import { deriveAccountNotesKey, saveAccountNote, readAccountNotes, exportAccountNotes, importAccountNotes } from '../lib/wallet/privacy/account-notes';
class TestStorage {
  records = new Map<string,string>(); failJournal = false;
  get length() { return this.records.size; }
  key(index: number) { return [...this.records.keys()][index] ?? null; }
  getItem(key: string) { return this.records.get(key) ?? null; }
  setItem(key: string, value: string) { if (this.failJournal && key.startsWith('qozmo.quantum.journal:')) throw new Error('Storage unavailable'); this.records.set(key,value); }
  removeItem(key: string) { this.records.delete(key); }
}
let storage: TestStorage;
const password = 'qozmo-fixture-password-only';
beforeEach(() => {
  storage = new TestStorage(); Object.defineProperty(globalThis,'localStorage',{configurable:true,value:storage});
  const locks = new Map<string,ReturnType<typeof createJournalLock>>();
  Object.defineProperty(globalThis.navigator,'locks',{configurable:true,value:{ request: (name: string, options: unknown, callback?: () => Promise<unknown>) => {
    if (!locks.has(name)) locks.set(name,createJournalLock());
    return locks.get(name)!(typeof options === 'function' ? options as () => Promise<unknown> : callback!);
  } }});
});
async function fixture() {
  const draft = newQuantumDraft(); const record = await sealQuantumDraft(draft,password,'Quantum fixture');
  await installQuantumRecord(record);
  const client = { chain: {id:46630}, getChainId: async () => 46630, getCode: async () => undefined } as unknown as PublicClient;
  const wallet = await QuantumSafeWallet.load({ seed:draft.seed, publicClient:client, journal:new QuantumJournal(record),
    factory:QUANTUM_DEPLOYMENT.factory, accountImplementation:QUANTUM_DEPLOYMENT.accountImplementation,
    entryPoint:QUANTUM_DEPLOYMENT.entryPoint, restoreBlocked:record.restored });
  const session: QuantumSession = {record,wallet,client};
  const op: UserOperation<'0.7'> = {sender:record.address,nonce:0n,callData:'0x01',callGasLimit:100_000n,
    verificationGasLimit:400_000n,preVerificationGas:60_000n,maxFeePerGas:2n,maxPriorityFeePerGas:1n,signature:'0x'};
  return {draft,record,session,op};
}

async function transferFixture() {
  const base = await fixture();
  const state = { nonce: 0n, price: 2n, submits: [] as UserOperation<'0.7'>[] };
  const client = {
    chain:{id:46630}, getChainId:async()=>46630, getBlockNumber:async()=>pins.deployBlock+100n,
    getBlock:async()=>({baseFeePerGas:1n}), getBalance:async()=>10n**18n, call:async()=>({data:'0x'}),
    getCode:async({address}:{address:string}) => {
      const name = (['entryPoint','factory','accountImplementation'] as const).find(key=>QUANTUM_DEPLOYMENT[key].toLowerCase()===address.toLowerCase());
      if (address.toLowerCase() === pins.pool.toLowerCase()) return privacyRuntime.pool;
      if (address.toLowerCase() === pins.verifier.toLowerCase()) return privacyRuntime.verifier;
      return name ? runtime[name] : address.toLowerCase() === '0x0000000000000000000000000000000000001234' ? '0x1234' : undefined;
    },
    readContract:async({functionName}:{functionName:string}) => {
      if (functionName === 'domain') return BigInt(pins.domain);
      if (functionName === 'denomination') return BigInt(pins.denomination);
      if (functionName === 'verifier') return pins.verifier;
      if (functionName === 'accountImplementation') return QUANTUM_DEPLOYMENT.accountImplementation;
      if (functionName === 'entryPoint') return QUANTUM_DEPLOYMENT.entryPoint;
      if (functionName === 'getNonce') return state.nonce;
      if (functionName === 'symbol') return 'TEST';
      if (functionName === 'decimals') return 6;
      if (functionName === 'balanceOf') return 10000000n;
      throw new Error(`Unexpected test read: ${functionName}`);
    },
  } as unknown as PublicClient;
  const wallet = await QuantumSafeWallet.load({seed:base.draft.seed,publicClient:client,journal:new QuantumJournal(base.record),
    factory:QUANTUM_DEPLOYMENT.factory,accountImplementation:QUANTUM_DEPLOYMENT.accountImplementation});
  const relay:QuantumRelay={label:'Local fixture',submitter:{kind:'fixture',fees:async()=>({maxFeePerGas:state.price,maxPriorityFeePerGas:1n}),
    estimate:async()=>({callGasLimit:100000n,verificationGasLimit:300000n,preVerificationGas:60000n}),
    submit:async(op)=>{state.submits.push(structuredClone(op));return {userOpHash:`0x${'0'.repeat(64)}`,wait:async()=>{throw new Error('Simulated relay timeout');}};}}};
  return {...base,session:{record:base.record,client,wallet},state,relay};
}


const context = { chainId: 46630, pool: pins.pool, denomination: pins.denomination };
test('account notes are encrypted for one account and cannot be transplanted or recovered from a different seed', async () => {
  const {draft,record} = await fixture();
  const key = await deriveAccountNotesKey(draft.seed,record.address), note=createPrivacyNote(context);
  assert.equal(key.extractable,false);
  await saveAccountNote(record.address,key,note);
  assert.deepEqual((await readAccountNotes(record.address,key))[0].note,note);
  const encoded=JSON.stringify(exportAccountNotes(record.address));
  assert.ok(!encoded.includes(note.secret)); assert.ok(!encoded.includes(note.nullifier));
  const sameKey=await deriveAccountNotesKey(draft.seed,record.address);
  assert.deepEqual((await readAccountNotes(record.address,sameKey))[0].note,note);
  const otherKey=await deriveAccountNotesKey(newQuantumDraft().seed,record.address);
  await assert.rejects(readAccountNotes(record.address,otherKey),/authenticated/);
  await assert.rejects(importAccountNotes('0x1111111111111111111111111111111111111111',sameKey,encoded),/another wallet/);
  const archive=JSON.parse(encoded); archive.notes[0].commitment='1';
  await assert.rejects(importAccountNotes(record.address,key,JSON.stringify(archive)),/authenticated/);
  assert.equal(JSON.stringify(exportAccountNotes(record.address)),encoded);
});
test('concurrent note saves merge, failed persistence and cancellation cannot yield a deposit-ready note',async()=>{
  const {draft,record}=await fixture(), key=await deriveAccountNotesKey(draft.seed,record.address);
  await Promise.all([saveAccountNote(record.address,key,createPrivacyNote(context)),saveAccountNote(record.address,key,createPrivacyNote(context))]);
  assert.equal((await readAccountNotes(record.address,key)).length,2);
  const abort=new AbortController();abort.abort();
  await assert.rejects(saveAccountNote(record.address,key,createPrivacyNote(context),abort.signal));
  const set=storage.setItem.bind(storage);storage.setItem=(name,value)=>{if(name.startsWith('qozmo.privacy.notes:'))throw Error('Disk full');set(name,value);};
  await assert.rejects(saveAccountNote(record.address,key,createPrivacyNote(context)),/Disk full/);
  assert.equal((await readAccountNotes(record.address,key)).length,2);
});
test('privacy review wraps the pinned deposit as a call from the same Qozmo account and expires',async()=>{
  const {session,relay}=await transferFixture();
  const tx=preparePrivacyDeposit(createPrivacyNote(context));
  const review=await prepareQuantumPrivacy(session,relay,tx);
  const decoded=decodeFunctionData({abi:quantumSafeAccountAbi,data:review.operation.callData});
  assert.equal(decoded.functionName,'execute');assert.deepEqual(decoded.args,[pins.pool,BigInt(pins.denomination),tx.data]);
  assert.equal(review.operation.sender,session.record.address);
  assert.equal((await session.wallet.journal.list()).length,0);
  assert.throws(()=>assertQuantumPrivacyReview(session,{...review}),/expired|another wallet/);
  assert.throws(()=>assertQuantumPrivacyReview(session,review,review.createdAt+120001),/expired/);
  const unsigned=new AbortController();unsigned.abort();
  await assert.rejects(confirmQuantumPrivacy(session,review,password,unsigned.signal));
  assert.equal((await session.wallet.journal.list()).length,0);
});
test('privacy signing rejects changed fees, nonce, deployment, password and restored accounts without disclosing a key',async()=>{
  const {session,relay,state}=await transferFixture();
  const review=await prepareQuantumPrivacy(session,relay,preparePrivacyDeposit(createPrivacyNote(context)));
  await assert.rejects(confirmQuantumPrivacy(session,review,'wrong password'),/Unable to unlock/);
  state.nonce=1n; await assert.rejects(confirmQuantumPrivacy(session,review,password),/nonce changed/);
  state.nonce=0n;state.price=3n;await assert.rejects(confirmQuantumPrivacy(session,review,password),/Fees/);
  state.price=2n;const getCode=session.client.getCode;Object.assign(session.client,{getCode:async()=> '0x1234'});
  await assert.rejects(confirmQuantumPrivacy(session,review,password),/deployment/);
  Object.assign(session.client,{getCode});
  await assert.rejects(prepareQuantumPrivacy({...session,record:{...session.record,restored:true}},relay,review.transaction),/read-only/);
  assert.equal((await session.wallet.journal.list()).length,0);assert.equal(state.submits.length,0);
});
test('ambiguous privacy submission shares the WOTS pending journal and blocks public transfers',async()=>{
  const {session,relay,state}=await transferFixture();
  const review=await prepareQuantumPrivacy(session,relay,preparePrivacyDeposit(createPrivacyNote(context)));
  await assert.rejects(confirmQuantumPrivacy(session,review,password),/Simulated relay timeout/);
  const entries=await session.wallet.journal.list();assert.equal(entries.length,1);assert.equal(entries[0].status,'signed');
  assert.equal(entries[0].userOperation.sender,session.record.address);assert.equal(state.submits.length,1);
  await assert.rejects(prepareQuantumTransfer(session,relay,{recipient:pins.verifier,amount:'0.0001'}),/pending/);
  await assert.rejects(prepareQuantumPrivacy(session,relay,review.transaction),/pending/);
  await assert.rejects(confirmQuantumPrivacy(session,review,password),/expired|another wallet/);
  assert.equal((await session.wallet.journal.list()).length,1);
});
test('privacy call allowlist rejects another pool, arbitrary calldata, external withdrawal recipients and incorrect amounts',()=>{
  const owner='0x1111111111111111111111111111111111111111';
  const tx=preparePrivacyDeposit(createPrivacyNote(context));
  assert.throws(()=>privacyCallDetails({...tx,to:pins.verifier},owner),/pinned/);
  assert.throws(()=>privacyCallDetails({...tx,value:1n},owner),/Invalid/);
  assert.throws(()=>privacyCallDetails({...tx,data:tx.data+'00' as `0x${string}`},owner),/Noncanonical/);
  const data=encodeFunctionData({abi:privacyPoolAbi,functionName:'withdraw',args:[[1n,2n],[[1n,2n],[1n,2n]],[1n,2n],1n,2n,pins.verifier,'0x0000000000000000000000000000000000000000',0n]});
  assert.throws(()=>privacyCallDetails({...tx,value:0n,data},owner),/own Qozmo account/);
});
test('an aging research scan range blocks new funding before a one-time signature is created', async () => {
  const { session, relay } = await transferFixture();
  Object.assign(session.client, { getBlockNumber: async () => pins.deployBlock + 999001n });
  await assert.rejects(prepareQuantumPrivacy(session, relay, preparePrivacyDeposit(createPrivacyNote(context))), /deposits are paused/);
  assert.equal((await session.wallet.journal.list()).length, 0);
});
