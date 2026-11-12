import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import type { PublicClient } from 'viem';
import { createAccountBackup, currentBackupSnapshot, inspectAccountBackup, openAccountBackup, readBackupStamp, rememberBackupDownload, restoreAccountBackup } from '../lib/wallet/account-backup';
import { newQuantumDraft, sealQuantumDraft, installQuantumRecord, QuantumJournal, QUANTUM_STORAGE_KEY } from '../lib/wallet/quantum/storage';
import { deriveAccountNotesKey, saveAccountNote, exportAccountNotes, importAccountNotes, readAccountNotes } from '../lib/wallet/privacy/account-notes';
import { createPrivacyNote } from '../lib/wallet/privacy/note';
import { PRIVACY_RESEARCH as pins } from '../lib/wallet/privacy/research-deployment';
import { QuantumSafeWallet } from '../lib/wallet/quantum-sdk/wallet';
import { createJournalLock } from '../lib/wallet/quantum-sdk/journal';
import { QUANTUM_DEPLOYMENT } from '../lib/wallet/quantum/client';

const password = 'Public complete backup fixture!';
class Storage {
  data = new Map<string,string>();
  get length() { return this.data.size; }
  key(i:number) { return [...this.data.keys()][i] ?? null; }
  getItem(k:string) { return this.data.get(k) ?? null; }
  setItem(k:string,v:string) { this.data.set(k,v); }
  removeItem(k:string) { this.data.delete(k); }
}
let storage: Storage;
beforeEach(() => {
  storage = new Storage(); Object.defineProperty(globalThis,'localStorage',{configurable:true,value:storage});
  const locks = new Map<string, ReturnType<typeof createJournalLock>>();
  Object.defineProperty(globalThis.navigator,'locks',{configurable:true,value:{request:(name:string,options:unknown,callback?:()=>Promise<unknown>)=>{if(!locks.has(name))locks.set(name,createJournalLock());return locks.get(name)!(typeof options==='function'?options as ()=>Promise<unknown>:callback!);}}});
});
async function fixture() {
  const draft = newQuantumDraft(), record = await sealQuantumDraft(draft,password,'Complete fixture'); await installQuantumRecord(record);
  const notesKey = await deriveAccountNotesKey(draft.seed,record.address);
  const note = createPrivacyNote({chainId:46630,pool:pins.pool,denomination:pins.denomination});
  await saveAccountNote(record.address,notesKey,note);
  const client = {chain:{id:46630},getChainId:async()=>46630,getCode:async()=>undefined} as unknown as PublicClient;
  const wallet = await QuantumSafeWallet.load({seed:draft.seed,publicClient:client,journal:new QuantumJournal(record),factory:QUANTUM_DEPLOYMENT.factory,accountImplementation:QUANTUM_DEPLOYMENT.accountImplementation,entryPoint:QUANTUM_DEPLOYMENT.entryPoint});
  await wallet.sign({sender:record.address,nonce:0n,callData:'0x01',callGasLimit:100000n,verificationGasLimit:400000n,preVerificationGas:60000n,maxFeePerGas:2n,maxPriorityFeePerGas:1n,signature:'0x'});
  return {draft,record,notesKey,note,wallet};
}
test('complete backup authenticates account, exposed-key history and notes without modifying storage',async()=>{
  const {record,draft,note}=await fixture();
  const before=JSON.stringify([...storage.data]);
  const {file,stamp}=await createAccountBackup(record,password);
  assert.equal(JSON.stringify([...storage.data]),before);
  const text=JSON.stringify(file);
  for(const secret of [draft.seed,draft.mnemonic,note.secret,note.nullifier,password])assert.ok(!text.includes(secret));
  const report=await inspectAccountBackup(text,password,record);
  assert.equal(report.operationCount,1);assert.equal(report.noteCount,1);assert.equal(report.comparison,'matches-known-local-history-only');assert.equal(report.canActivate,false);
  assert.equal(JSON.stringify([...storage.data]),before);
  assert.equal(readBackupStamp(record.address),null);
  rememberBackupDownload(record,stamp);assert.equal(readBackupStamp(record.address)?.fingerprint,(await currentBackupSnapshot(record)).fingerprint);
});
test('wrong password, altered identity/ciphertext and unsupported KDF parameters cannot authenticate',async()=>{
  const {record}=await fixture(); const {file}=await createAccountBackup(record,password);
  await assert.rejects(openAccountBackup(JSON.stringify(file),'Incorrect password fixture!'),/authenticate/);
  await assert.rejects(openAccountBackup(JSON.stringify({...file,owner:pins.pool}),password),/authenticate/);
  await assert.rejects(openAccountBackup(JSON.stringify({...file,data:(file.data[0]==='A'?'B':'A')+file.data.slice(1)}),password),/authenticate/);
  await assert.rejects(openAccountBackup(JSON.stringify({...file,iterations:1}),password),/unsupported/);
  await assert.rejects(openAccountBackup(JSON.stringify({...file,extra:true}),password),/unsupported/);
});
test('new notes and signing history make a previous download stale, while every original archive remains intact',async()=>{
  const {record,notesKey}=await fixture(); const {file,stamp}=await createAccountBackup(record,password);rememberBackupDownload(record,stamp);
  await saveAccountNote(record.address,notesKey,createPrivacyNote({chainId:46630,pool:pins.pool,denomination:pins.denomination}));
  assert.notEqual((await currentBackupSnapshot(record)).fingerprint,stamp.fingerprint);
  const report=await inspectAccountBackup(JSON.stringify(file),password,record);assert.equal(report.noteCount,1);
  const history=await new QuantumJournal(record).list();await new QuantumJournal(record).put({...history[0],status:'confirmed',transactionHash:`0x${'ab'.repeat(32)}`});
  assert.notEqual((await currentBackupSnapshot(record)).fingerprint,stamp.fingerprint);
  assert.equal((await readAccountNotes(record.address,notesKey)).length,2);
});
test('complete restore preparation never installs a signer; installing remains read-only and preserves note ciphertext',async()=>{
  const {record,notesKey}=await fixture(); const {file}=await createAccountBackup(record,password);const sourceNotes=exportAccountNotes(record.address);
  const imported=await restoreAccountBackup(JSON.stringify(file),password,'Read-only complete import');
  assert.equal(imported.record.restored,true);assert.equal(imported.record.address,record.address);assert.equal(imported.history.length,1);
  assert.equal(JSON.parse(storage.getItem(QUANTUM_STORAGE_KEY)!).id,record.id);
  const state=JSON.stringify([...storage.data]);await assert.rejects(installQuantumRecord(imported.record,imported.history),/already exists/);assert.equal(JSON.stringify([...storage.data]),state);
  storage.data.clear();await importAccountNotes(imported.record.address,notesKey,JSON.stringify(imported.privacyNotes));await installQuantumRecord(imported.record,imported.history);
  assert.deepEqual(exportAccountNotes(imported.record.address),sourceNotes);assert.equal(JSON.parse(storage.getItem(QUANTUM_STORAGE_KEY)!).restored,true);
  assert.equal((await new QuantumJournal(imported.record).list()).length,1);
});
test('cancelled exports and a corrupt local note store cannot produce a backup or overwrite data',async()=>{
  const {record}=await fixture();const abort=new AbortController();abort.abort();await assert.rejects(createAccountBackup(record,password,abort.signal));
  const name=[...storage.data.keys()].find(k=>k.startsWith('qozmo.privacy.notes:'))!;storage.setItem(name,'{broken');
  await assert.rejects(createAccountBackup(record,password));assert.equal(storage.getItem(name),'{broken');assert.equal(readBackupStamp(record.address),null);
});
