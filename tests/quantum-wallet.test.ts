import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { decodeFunctionData, erc20Abi, type PublicClient } from 'viem';
import type { UserOperation } from 'viem/account-abstraction';
import { QuantumSafeWallet } from '../lib/wallet/quantum-sdk/wallet';
import { createJournalLock } from '../lib/wallet/quantum-sdk/journal';
import {
  newQuantumDraft, sealQuantumDraft, decryptQuantumRecord, installQuantumRecord,
  readQuantumRecord, restoreQuantumPhrase, restoreQuantumBackup, exportQuantumBackup,
  QuantumJournal, QUANTUM_STORAGE_KEY, inspectQuantumBackup,
} from '../lib/wallet/quantum/storage';
import { assertQuantumChain, assertQuantumSigner, assertQuantumReview, prepareQuantumTransfer, confirmQuantumTransfer, retryQuantumPending, quantumAmount, validateBundlerUrl, QUANTUM_DEPLOYMENT, verifyQuantumDeployment, type QuantumSession, type QuantumRelay } from '../lib/wallet/quantum/client';
import runtime from './fixtures/quantum-runtime.json';
import { quantumSafeAccountAbi } from '../lib/wallet/quantum-sdk/account';

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

test('Qozmo quantum vault binds its identity and restored policy to authenticated ciphertext', async () => {
  const {draft,record} = await fixture();
  assert.equal(await decryptQuantumRecord(record,password),draft.seed);
  assert.ok(!JSON.stringify(record).includes(draft.seed));
  assert.ok(!JSON.stringify(record).includes(draft.mnemonic));
  for (const altered of [{...record,name:'Other name'},{...record,restored:true},{...record,salt:'1'}]) {
    await assert.rejects(decryptQuantumRecord(altered,password),/Unable to unlock/);
  }
  await assert.rejects(decryptQuantumRecord(record,'wrong password'),/Unable to unlock/);
});

test('install cannot replace an existing encrypted quantum account or its history', async () => {
  const {record} = await fixture();
  const other = await sealQuantumDraft(newQuantumDraft(),password,'Other quantum');
  await assert.rejects(installQuantumRecord(other),/already exists/);
  assert.deepEqual(readQuantumRecord(),record);
  storage.setItem(QUANTUM_STORAGE_KEY,'{broken-json');
  assert.throws(readQuantumRecord,/could not be read safely/);
  assert.equal(storage.getItem(QUANTUM_STORAGE_KEY),'{broken-json');
});

test('one-time signatures are durable before release and conflicting signatures are rejected', async () => {
  const {record,session,op} = await fixture();
  const signed = await session.wallet.sign(op);
  const persisted = await new QuantumJournal(record).list();
  assert.equal(persisted.length,1); assert.equal(persisted[0].userOperation.signature,signed.signature);
  assert.equal(persisted[0].status,'signed');
  await assert.rejects(session.wallet.sign({...op,callData:'0x02'}),/already signed|different/);
  assert.equal((await new QuantumJournal(record).list())[0].userOperation.signature,signed.signature);
});

test('two same-origin signers cannot disclose a key for different operations concurrently', async () => {
  const {record,draft,session,op} = await fixture();
  const second = await QuantumSafeWallet.load({seed:draft.seed,publicClient:session.client,journal:new QuantumJournal(record),
    factory:QUANTUM_DEPLOYMENT.factory,accountImplementation:QUANTUM_DEPLOYMENT.accountImplementation});
  const outcomes = await Promise.allSettled([session.wallet.sign(op),second.sign({...op,callData:'0x02'})]);
  assert.equal(outcomes.filter(value => value.status === 'fulfilled').length,1);
  assert.equal((await new QuantumJournal(record).list()).length,1);
});

test('failed persistence or missing journal prevents a signature from leaving the signer', async () => {
  const {record,session,op} = await fixture();
  storage.failJournal = true;
  await assert.rejects(session.wallet.sign(op),/Storage unavailable/);
  storage.failJournal = false;
  assert.equal((await new QuantumJournal(record).list()).length,0);
  const name = [...storage.records.keys()].find(key => key.startsWith('qozmo.quantum.journal:'))!;
  storage.removeItem(name);
  await assert.rejects(session.wallet.sign(op),/history is missing/);
  assert.equal(storage.getItem(name),null);
});

test('phrase and encrypted-archive restores stay read-only and preserve known signed history', async () => {
  const {draft,record,session,op} = await fixture();
  await session.wallet.sign(op);
  const backup = await exportQuantumBackup(record,password);
  assert.equal(backup.format,'qozmo-quantum-backup');
  assert.ok(!JSON.stringify(backup).includes(draft.seed));
  const restored = await restoreQuantumBackup(JSON.stringify(backup),password,'Imported quantum');
  assert.equal(restored.record.restored,true); assert.equal(restored.record.address,record.address);
  assert.equal(restored.history.length,1);
  const phraseRecord = await restoreQuantumPhrase(draft.mnemonic,password,'Phrase import');
  assert.equal(phraseRecord.restored,true); assert.equal(phraseRecord.address,record.address);
  // The policy is authenticated; editing this boolean cannot activate the copied wallet.
  await assert.rejects(decryptQuantumRecord({...phraseRecord,restored:false},password),/Unable to unlock/);
  assert.throws(() => assertQuantumSigner({...session,record:phraseRecord}),/read-only/);
  const importedWallet = await QuantumSafeWallet.load({seed:draft.seed,publicClient:session.client,restoreBlocked:true,
    factory:QUANTUM_DEPLOYMENT.factory,accountImplementation:QUANTUM_DEPLOYMENT.accountImplementation});
  await assert.rejects(importedWallet.sign(op),/read-only/);
});

test('mainnet selection and mismatched deployment cannot activate Qozmo Quantum signing', async () => {
  for (const chain of [1,4663,11155111,8453]) assert.throws(() => assertQuantumChain(chain),/46630/);
  assert.doesNotThrow(() => assertQuantumChain(46630));
  const calls: string[]=[];
  const wrong = {chain:{id:46630},getChainId:async()=>{calls.push('chain');return 1;}} as unknown as PublicClient;
  await assert.rejects(verifyQuantumDeployment(wrong),/could not be verified/);
  assert.deepEqual(calls,['chain']);
});

test('quantum transfer amount parsing preserves units and rejects ambiguous precision', () => {
  assert.equal(quantumAmount('0.000000000000000001',18),1n);
  assert.equal(quantumAmount('1.234567',6),1234567n);
  for (const amount of ['0','-1','1e3','01','.1','1.','0.0000001']) assert.throws(()=>quantumAmount(amount,6));
  for (const url of ['http://example.com','https://user:pass@example.com','https://example.com/#key']) assert.throws(()=>validateBundlerUrl(url));
});

async function transferFixture() {
  const base = await fixture();
  const state = { nonce: 0n, price: 2n, submits: [] as UserOperation<'0.7'>[] };
  const client = {
    chain:{id:46630}, getChainId:async()=>46630, getBlockNumber:async()=>150471148n,
    getBlock:async()=>({baseFeePerGas:1n}), getBalance:async()=>10n**18n, call:async()=>({data:'0x'}),
    getCode:async({address}:{address:string}) => {
      const name = (['entryPoint','factory','accountImplementation'] as const).find(key=>QUANTUM_DEPLOYMENT[key].toLowerCase()===address.toLowerCase());
      return name ? runtime[name] : address.toLowerCase() === '0x0000000000000000000000000000000000001234' ? '0x1234' : undefined;
    },
    readContract:async({functionName}:{functionName:string}) => {
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

const recipient='0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

test('quantum reviews bind exact ETH/token calls and expire without signing', async()=>{
  const {session,relay} = await transferFixture();
  const eth=await prepareQuantumTransfer(session,relay,{recipient,amount:'0.000000000000000001'});
  assert.equal(eth.value,1n); assert.equal(eth.operation.sender,session.record.address);
  assert.doesNotThrow(()=>assertQuantumReview(session,eth,eth.createdAt));
  assert.throws(()=>assertQuantumReview(session,eth,eth.createdAt+120001),/expired/);
  assert.throws(()=>assertQuantumReview(session,{...eth}),/missing/);
  const token=await prepareQuantumTransfer(session,relay,{recipient,amount:'1.234567',tokenAddress:'0x0000000000000000000000000000000000001234'});
  const execute=decodeFunctionData({abi:quantumSafeAccountAbi,data:token.operation.callData});
  assert.equal(execute.functionName,'execute');
  const args=execute.args as readonly [string,bigint,`0x${string}`];
  assert.equal(args[0].toLowerCase(),token.token?.address.toLowerCase());
  assert.equal(args[1],0n);
  const transfer=decodeFunctionData({abi:erc20Abi,data:args[2]});
  assert.equal(transfer.functionName,'transfer'); assert.deepEqual(transfer.args,[recipient,1234567n]);
  assert.equal((await session.wallet.journal.list()).length,0);
});

test('confirmation rejects a changed nonce or fee before exposing any one-time key',async()=>{
  const {session,relay,state}=await transferFixture();
  const review=await prepareQuantumTransfer(session,relay,{recipient,amount:'0.0001'});
  state.nonce=1n;
  await assert.rejects(confirmQuantumTransfer(session,review,password),/nonce changed/);
  state.nonce=0n; state.price=3n;
  await assert.rejects(confirmQuantumTransfer(session,review,password),/Fees/);
  assert.equal(state.submits.length,0); assert.equal((await session.wallet.journal.list()).length,0);
});

test('ambiguous submission retains signed bytes and retry never signs a second digest',async()=>{
  const {session,relay,state}=await transferFixture();
  const review=await prepareQuantumTransfer(session,relay,{recipient,amount:'0.0001'});
  await assert.rejects(confirmQuantumTransfer(session,review,password),/Simulated relay timeout/);
  const history=await session.wallet.journal.list();
  assert.equal(history.length,1); assert.equal(history[0].status,'signed');
  await assert.rejects(prepareQuantumTransfer(session,relay,{recipient,amount:'0.0002'}),/pending/);
  await assert.rejects(retryQuantumPending(session,relay,password),/Simulated relay timeout/);
  assert.equal(state.submits.length,2); assert.deepEqual(state.submits[0],state.submits[1]);
  assert.deepEqual(await session.wallet.journal.list(),history);
});

test('a token returning false is rejected even before the quantum account is deployed',async()=>{
  const {session,relay,state}=await transferFixture();
  Object.assign(session.client,{call:async()=>({data:`0x${'0'.repeat(64)}`})});
  await assert.rejects(prepareQuantumTransfer(session,relay,{recipient,amount:'1',tokenAddress:'0x0000000000000000000000000000000000001234'}),/returned false/);
  assert.equal(state.submits.length,0); assert.equal((await session.wallet.journal.list()).length,0);
});


test('backup inspection authenticates without installing or changing the signing policy', async () => {
  const {record}=await fixture();
  const backup=await exportQuantumBackup(record,password);
  const before=JSON.stringify([...storage.records]);
  const report=await inspectQuantumBackup(JSON.stringify(backup),password,record);
  assert.equal(report.comparison,'matches-known-local-history-only');
  assert.equal(report.canActivate,false);
  assert.equal(report.signingPolicy,'read-only');
  assert.equal(JSON.stringify([...storage.records]),before);
  assert.equal(JSON.stringify(report).includes('seed'),false);
  await assert.rejects(inspectQuantumBackup(JSON.stringify(backup),'bad password',record));
  assert.equal(JSON.stringify([...storage.records]),before);
});
