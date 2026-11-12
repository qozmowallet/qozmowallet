import assert from 'node:assert/strict';
import test from 'node:test';
import { getAddress, type Hash } from 'viem';
import { historyCSV, parseHistoryRows } from '../lib/wallet/history';
import { parsePaymentRequest, paymentLink, paymentURI, readPayments, verifyPayment, type PaymentRequest } from '../lib/wallet/payments';

const account = getAddress('0x1111111111111111111111111111111111111111');
const sender = getAddress('0x2222222222222222222222222222222222222222');
const hash = `0x${'ab'.repeat(32)}` as Hash; const blockHash = `0x${'cd'.repeat(32)}` as Hash;
const now = Date.now();
const invoice: PaymentRequest = { version:1,id:'12345678-1234-1234-1234-123456789012',chainId:46630,recipient:account,amount:'0.000000000000000001',label:'Test invoice',createdAt:new Date(now-60000).toISOString(),expiresAt:new Date(now+3600000).toISOString() };
const native = { hash,from:sender,to:account,value:'1',timeStamp:String(Math.floor(now/1000)),blockNumber:'100',isError:'0' };

test('history preserves one wei, receiving direction and chain; foreign accounts fail',()=>{
  const [row]=parseHistoryRows([native],46630,account,'native',1);
  assert.equal(row.value,'0.000000000000000001');assert.equal(row.direction,'in');assert.equal(row.chainId,46630);
  assert.throws(()=>parseHistoryRows([{...native,to:sender}],46630,account,'native',1),/another account/);
  assert.throws(()=>parseHistoryRows([{...native,value:'1e18'}],46630,account,'native',1),/malformed/);
});
test('token history validates contract/decimals and CSV escapes formulas in token symbols',()=>{
  const [row]=parseHistoryRows([{...native,contractAddress:sender,tokenDecimal:'6',tokenSymbol:'=HYPERLINK("bad")',logIndex:'2'}],46630,account,'token',1);
  assert.equal(row.value,'0.000001');assert.equal(row.contract,sender);
  assert.match(historyCSV([row]),/"'=HYPERLINK\(""bad""\)"/);
  assert.throws(()=>parseHistoryRows([{...native,contractAddress:sender,tokenDecimal:'99'}],46630,account,'token',1),/metadata/);
});
test('payment QR encodes the exact integer wei amount and explicit chain',()=>{
  assert.equal(paymentURI(invoice),`ethereum:${account}@46630?value=1`);
  const link=new URL(paymentLink(invoice,'https://qozmo.example'));
  assert.deepEqual(parsePaymentRequest(JSON.parse(link.searchParams.get('payment')!)),invoice);
  assert.equal(link.hash,'#payments');
  for(const amount of ['0','-1','1e3','0.0000000000000000001'])assert.throws(()=>parsePaymentRequest({...invoice,amount}));
  assert.throws(()=>parsePaymentRequest({...invoice,chainId:12345}));
  assert.throws(()=>parsePaymentRequest({...invoice,extra:'ignored'}));
});
function rpc(overrides: Record<string,unknown>={}) {
  return { getChainId:async()=>46630,getTransaction:async()=>({to:account,value:1n,input:'0x',blockHash,blockNumber:100n}),getTransactionReceipt:async()=>({status:'success',transactionHash:hash,blockHash,blockNumber:100n}),getBlockNumber:async()=>102n,getBlock:async()=>({hash:blockHash,timestamp:BigInt(Math.floor(now/1000))}),...overrides } as unknown as NonNullable<Parameters<typeof verifyPayment>[2]>;
}
test('invoice confirmation rejects wrong chain, reverted, internal/underpaid and noncanonical payments',async()=>{
  assert.equal((await verifyPayment(invoice,hash,rpc())).blockNumber,'100');
  await assert.rejects(verifyPayment(invoice,hash,rpc({getChainId:async()=>1})),/wrong network/);
  await assert.rejects(verifyPayment(invoice,hash,rpc({getTransactionReceipt:async()=>({status:'reverted'})})),/successful direct/);
  await assert.rejects(verifyPayment(invoice,hash,rpc({getTransaction:async()=>({to:sender,value:1n,input:'0x',blockHash,blockNumber:100n})})),/successful direct/);
  await assert.rejects(verifyPayment(invoice,hash,rpc({getTransaction:async()=>({to:account,value:0n,input:'0x',blockHash,blockNumber:100n})})),/successful direct/);
  await assert.rejects(verifyPayment(invoice,hash,rpc({getBlockNumber:async()=>101n})),/three confirmations/);
  await assert.rejects(verifyPayment(invoice,hash,rpc({getBlock:async()=>({hash,timestamp:BigInt(Math.floor(now/1000))})})),/canonical/);
  await assert.rejects(verifyPayment(invoice,hash,rpc({getBlock:async()=>({hash:blockHash,timestamp:1n})})),/validity window/);
});
test('stored invoices cannot assign a transaction twice on the same chain',()=>{
  const confirmation={hash,blockHash,blockNumber:'100',checkedAt:new Date(now).toISOString()};
  assert.throws(()=>readPayments({getItem:()=>JSON.stringify([{request:invoice,confirmation},{request:{...invoice,id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'},confirmation}])}),/multiple invoices/);
});
