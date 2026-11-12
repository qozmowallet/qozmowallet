import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { getAddress } from 'viem';
import { parseQuantumRecord, restoreQuantumBackup } from '../lib/wallet/quantum/storage';
import { approveRecoveryResearch, createOfflineAuthority, createRecoveryCandidate, inspectRecoveryCandidate, parseRecoveryEnvelope, parseRecoveryIntent, publicRecoveryAuthority, RECOVERY_RELEASE_GATES, verifyRecoveryApproval } from '../lib/wallet/quantum/recovery';

const account=getAddress('0x1111111111111111111111111111111111111111');
const password='offline independent recovery password';
let kit: Awaited<ReturnType<typeof createOfflineAuthority>>;
let identity: ReturnType<typeof publicRecoveryAuthority>;
let candidate: Awaited<ReturnType<typeof createRecoveryCandidate>>;
let approval: Awaited<ReturnType<typeof approveRecoveryResearch>>;
before(async()=>{
  kit=await createOfflineAuthority(account,password);
  identity=publicRecoveryAuthority(kit);
  candidate=await createRecoveryCandidate(identity,password);
  approval=await approveRecoveryResearch(kit,password,candidate.request);
});

test('recovery tools use real stateless signatures with an independently trusted fingerprint',()=>{
  assert.equal(approval.signature.length,2+49856*2);
  assert.equal(verifyRecoveryApproval(approval,candidate.request,identity.fingerprint),true);
  assert.equal(verifyRecoveryApproval(approval,candidate.request,`0x${'00'.repeat(32)}`),false);
  assert.equal(RECOVERY_RELEASE_GATES.activation,false);
});
test('fresh candidates differ and cannot substitute for the retained request',async()=>{
  const second=await createRecoveryCandidate(identity,password);
  assert.notEqual(second.request.namespace,candidate.request.namespace);
  assert.notEqual(second.request.newSigningKeyHash,candidate.request.newSigningKeyHash);
  assert.equal(verifyRecoveryApproval(approval,second.request,identity.fingerprint),false);
  assert.equal(await inspectRecoveryCandidate(candidate.envelope,password,candidate.request),true);
  assert.equal(await inspectRecoveryCandidate(candidate.envelope,password,second.request),false);
});
test('approval binds account, chain, epoch, nonce, root, expiry and exact schema',()=>{
  for(const change of [{account:'0x2222222222222222222222222222222222222222'},{chainId:1},{expectedEpoch:'1'},{nonce:`0x${'11'.repeat(32)}`},{newSigningKeyHash:`0x${'22'.repeat(32)}`},{extra:'ignored'}]){
    assert.equal(verifyRecoveryApproval({...approval,request:{...candidate.request,...change}},candidate.request,identity.fingerprint),false);
  }
  assert.equal(verifyRecoveryApproval({...approval,signature:`0x${approval.signature.slice(2,4)==='00'?'01':'00'}${approval.signature.slice(4)}`},candidate.request,identity.fingerprint),false);
  assert.equal(verifyRecoveryApproval(approval,candidate.request,identity.fingerprint,Date.parse(candidate.request.expiresAt)+1),false);
  assert.throws(()=>parseRecoveryIntent({...candidate.request,purpose:'activate-wallet'}));
});
test('kit encryption authenticates account and kind; wrong password/tampering never sign',async()=>{
  await assert.rejects(approveRecoveryResearch(kit,'wrong password with enough length',candidate.request),/authentication/);
  await assert.rejects(approveRecoveryResearch({...kit,account:getAddress('0x2222222222222222222222222222222222222222')},password,candidate.request),/does not match/);
  await assert.rejects(approveRecoveryResearch({...kit,ciphertext:kit.ciphertext.replace(/^./,kit.ciphertext[0]==='A'?'B':'A')},password,candidate.request),/authentication/);
  assert.throws(()=>parseRecoveryEnvelope({...kit,kdf:'PBKDF2-SHA256-1'}));
  assert.throws(()=>parseRecoveryEnvelope({...kit,extra:true}));
  assert.equal(JSON.stringify(identity).includes(kit.ciphertext),false);
  assert.equal(Object.hasOwn(identity,'ciphertext'),false);
});


test('research artifacts cannot be imported as a legacy wallet or recovery archive',async()=>{
  assert.throws(()=>parseQuantumRecord(candidate.envelope));
  await assert.rejects(restoreQuantumBackup(JSON.stringify(candidate.envelope),password,'Not a wallet'));
  await assert.rejects(restoreQuantumBackup(JSON.stringify(kit),password,'Not a wallet'));
});
