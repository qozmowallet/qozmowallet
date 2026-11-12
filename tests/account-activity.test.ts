import assert from 'node:assert/strict';
import { test } from 'node:test';
import { encodeFunctionData, erc20Abi, type Hex } from 'viem';
import { describeAccountOperation, accountExecutionState, type AccountReceipt } from '../lib/wallet/account-activity';
import { encodeCalls, ENTRYPOINT_V07 } from '../lib/wallet/quantum-sdk/account';
import type { JournalEntry } from '../lib/wallet/quantum-sdk/journal';
import { privacyPoolAbi } from '../lib/wallet/privacy/transactions';
import { PRIVACY_RESEARCH as pins } from '../lib/wallet/privacy/research-deployment';
const owner='0x1111111111111111111111111111111111111111', recipient='0x2222222222222222222222222222222222222222';
function entry(callData:Hex):JournalEntry {return {keyIndex:0,userOpHash:`0x${'ab'.repeat(32)}`,nextPublicKeyHash:`0x${'cd'.repeat(32)}`,userOperation:{callData,signature:'0x1234'},status:'signed',createdAt:1};}
test('signed activity distinguishes public ETH, raw token units, privacy deposit and withdrawal',()=>{
  const native=describeAccountOperation(entry(encodeCalls([{to:recipient,value:1n,data:'0x'}])),owner);assert.equal(native.kind,'transfer');assert.equal(native.amount,1n);assert.equal(native.recipient,recipient);
  const token=describeAccountOperation(entry(encodeCalls([{to:recipient,value:0n,data:encodeFunctionData({abi:erc20Abi,functionName:'transfer',args:[owner,1234567n]})}])),owner);assert.equal(token.kind,'token-transfer');assert.equal(token.amount,1234567n);assert.equal(token.token,recipient);
  const deposit=describeAccountOperation(entry(encodeCalls([{to:pins.pool,value:BigInt(pins.denomination),data:encodeFunctionData({abi:privacyPoolAbi,functionName:'deposit',args:[123n]})}])),owner);assert.equal(deposit.kind,'privacy-deposit');assert.equal(deposit.reference,'123');assert.equal(deposit.amount,BigInt(pins.denomination));
  const withdrawal=describeAccountOperation(entry(encodeCalls([{to:pins.pool,value:0n,data:encodeFunctionData({abi:privacyPoolAbi,functionName:'withdraw',args:[[1n,2n],[[1n,2n],[1n,2n]],[1n,2n],1n,2n,owner,'0x0000000000000000000000000000000000000000',0n]})}])),owner);assert.equal(withdrawal.kind,'privacy-withdrawal');assert.equal(withdrawal.recipient,owner);assert.equal(withdrawal.reference,'2');
});
test('unknown, malformed, batched and recovery calls never become fabricated ETH transfers',()=>{
  assert.equal(describeAccountOperation(entry('0x1234'),owner).kind,'contract-call');
  assert.equal(describeAccountOperation(entry(encodeCalls([{to:recipient,value:1n,data:'0x'}])+'00' as Hex),owner).kind,'contract-call');
  assert.equal(describeAccountOperation(entry(encodeCalls([{to:recipient,value:1n},{to:owner,value:2n}])),owner).kind,'batch');
  assert.equal(describeAccountOperation({...entry('0x'),kind:'recovery'},owner).kind,'recovery');
});
test('a consumed key alone is not execution confirmation; receipts bind account, chain, hash and EntryPoint',()=>{
  const signed=entry('0x'), confirmed={...signed,status:'confirmed' as const,transactionHash:`0x${'ef'.repeat(32)}` as Hex};
  assert.equal(accountExecutionState(signed,undefined,owner),'pending');assert.equal(accountExecutionState(confirmed,undefined,owner),'unverified');
  const receipt:AccountReceipt={chainId:46630,account:owner,entryPoint:ENTRYPOINT_V07,checkedAt:new Date().toISOString(),transactionHash:confirmed.transactionHash,userOpHash:confirmed.userOpHash,status:'succeeded',actualGasCost:'1',confirmations:3};
  assert.equal(accountExecutionState(confirmed,receipt,owner),'confirmed');assert.equal(accountExecutionState(confirmed,{...receipt,status:'execution-reverted'},owner),'reverted');
  for(const changed of [{...receipt,chainId:1},{...receipt,account:recipient},{...receipt,entryPoint:recipient},{...receipt,userOpHash:`0x${'11'.repeat(32)}` as Hex},{...receipt,transactionHash:`0x${'22'.repeat(32)}` as Hex}])assert.equal(accountExecutionState(confirmed,changed as AccountReceipt,owner),'unverified');
});
