import { createPublicClient, getAddress, http, isAddress, isHash, parseEther, zeroAddress, type Address, type Hash } from 'viem';
import { getWalletNetwork } from './networks';
import { QOZMO_WEBSITE } from '../app-runtime';

export const PAYMENTS_KEY = 'qozmo.payment-requests.v1';
export type PaymentRequest = Readonly<{ version: 1; id: string; chainId: number; recipient: Address; amount: string; label: string; createdAt: string; expiresAt: string }>;
export type PaymentConfirmation = { hash: Hash; blockNumber: string; blockHash: Hash; checkedAt: string };
export type StoredPayment = { request: PaymentRequest; confirmation?: PaymentConfirmation };

export function parsePaymentRequest(value: unknown): PaymentRequest {
  const r = value as PaymentRequest;
  if (!r || typeof r !== 'object' || Array.isArray(r) || Object.keys(r).sort().join(',') !== 'amount,chainId,createdAt,expiresAt,id,label,recipient,version' || r.version !== 1 || typeof r.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(r.id) || !isAddress(r.recipient, { strict: true }) || r.recipient.toLowerCase() === zeroAddress || typeof r.amount !== 'string' || !/^(0|[1-9]\d{0,59})(\.\d{1,18})?$/.test(r.amount) || typeof r.label !== 'string' || r.label.length > 100 || /[\u0000-\u001f\u007f]/.test(r.label)) throw new Error('Invalid payment request.');
  getWalletNetwork(r.chainId);
  const amount = parseEther(r.amount);
  if (amount <= 0n || amount >= 2n ** 256n || typeof r.createdAt !== 'string' || typeof r.expiresAt !== 'string' || !Number.isFinite(Date.parse(r.createdAt)) || !Number.isFinite(Date.parse(r.expiresAt)) || new Date(r.createdAt).toISOString() !== r.createdAt || new Date(r.expiresAt).toISOString() !== r.expiresAt || Date.parse(r.expiresAt) <= Date.parse(r.createdAt) || Date.parse(r.expiresAt) - Date.parse(r.createdAt) > 30 * 86400000) throw new Error('Invalid amount or payment validity window.');
  return Object.freeze({ ...r, recipient: getAddress(r.recipient) });
}

export function paymentURI(request: PaymentRequest): string {
  const r = parsePaymentRequest(request);
  return `ethereum:${r.recipient}@${r.chainId}?value=${parseEther(r.amount)}`;
}
export function paymentLink(request: PaymentRequest, origin: string): string {
  // Extension URLs are private to an installation and cannot be shared with a payer.
  const url = new URL('/dashboard/', origin.startsWith('chrome-extension:') ? QOZMO_WEBSITE : origin);
  url.searchParams.set('payment', JSON.stringify(parsePaymentRequest(request)));
  url.hash = 'payments'; return url.href;
}

export function readPayments(storage: Pick<Storage, 'getItem'> = localStorage): StoredPayment[] {
  const text = storage.getItem(PAYMENTS_KEY);
  if (!text) return [];
  if (text.length > 200000) throw new Error('Payment storage is too large. Preserve browser data.');
  const rows = JSON.parse(text); if (!Array.isArray(rows) || rows.length > 100) throw new Error('Invalid payment storage.');
  const claimed = new Set<string>(); const ids = new Set<string>();
  return rows.map(row => {
    const request = parsePaymentRequest(row.request); if(ids.has(request.id)) throw new Error('Duplicate invoice identifiers in storage.'); ids.add(request.id); const c = row.confirmation as PaymentConfirmation | undefined;
    if (c && (!isHash(c.hash) || !isHash(c.blockHash) || !/^\d{1,78}$/.test(c.blockNumber) || !Number.isFinite(Date.parse(c.checkedAt)))) throw new Error('Invalid saved payment observation.');
    if (c) { const key = `${request.chainId}:${c.hash.toLowerCase()}`; if (claimed.has(key)) throw new Error('One transaction is assigned to multiple invoices.'); claimed.add(key); }
    return { request, confirmation: c };
  });
}

export async function storePayment(request: PaymentRequest, confirmation?: PaymentConfirmation): Promise<StoredPayment[]> {
  const checked = parsePaymentRequest(request);
  if (!navigator.locks) throw new Error('This browser cannot coordinate invoice storage.');
  return navigator.locks.request('qozmo-payment-requests', () => {
    const rows = readPayments(); const existing = rows.find(row => row.request.id === checked.id);
    if (existing && JSON.stringify(existing.request) !== JSON.stringify(checked)) throw new Error('An invoice with this ID already has different details.');
    if (confirmation && rows.some(row => row.request.id !== checked.id && row.request.chainId === checked.chainId && row.confirmation?.hash.toLowerCase() === confirmation.hash.toLowerCase())) throw new Error('This transaction was already assigned to another invoice.');
    if (!existing && rows.length >= 100) throw new Error('This browser already contains 100 invoices. Export existing invoices before continuing.');
    const next = existing ? rows.map(row => row === existing ? { request: checked, confirmation } : row) : [{ request: checked, confirmation }, ...rows];
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(next)); return next;
  });
}

export async function verifyPayment(request: PaymentRequest, hash: string, client = createPublicClient({ chain: getWalletNetwork(request.chainId).chain, transport: http(getWalletNetwork(request.chainId).rpcUrl, { retryCount: 0, timeout: 12000 }), cacheTime: 0 })): Promise<PaymentConfirmation> {
  const r = parsePaymentRequest(request);
  if (!isHash(hash)) throw new Error('Enter a valid transaction hash.');
  if (await client.getChainId() !== r.chainId) throw new Error('The RPC returned the wrong network.');
  const [tx, receipt, head] = await Promise.all([client.getTransaction({ hash }), client.getTransactionReceipt({ hash }), client.getBlockNumber({ cacheTime: 0 })]);
  if (receipt.status !== 'success' || receipt.transactionHash.toLowerCase() !== hash.toLowerCase() || !tx.to || getAddress(tx.to) !== r.recipient || tx.value !== parseEther(r.amount) || tx.input !== '0x' || tx.blockHash !== receipt.blockHash || tx.blockNumber !== receipt.blockNumber) throw new Error('This is not a successful direct native payment for the exact requested amount and recipient.');
  const block = await client.getBlock({ blockNumber: receipt.blockNumber });
  const timestamp = Number(block.timestamp) * 1000;
  if (block.hash !== receipt.blockHash || head < receipt.blockNumber + 2n || timestamp < Date.parse(r.createdAt) || timestamp > Date.parse(r.expiresAt)) throw new Error('Payment needs three confirmations in its validity window and a canonical block.');
  return { hash: hash.toLowerCase() as Hash, blockNumber: receipt.blockNumber.toString(), blockHash: receipt.blockHash, checkedAt: new Date().toISOString() };
}
