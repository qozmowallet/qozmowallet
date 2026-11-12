import assert from 'node:assert/strict';
import { after, afterEach, before, beforeEach, test } from 'node:test';
import React, { act } from 'react';
import { JSDOM } from 'jsdom';
import PrivacyPanel from '../components/dashboard/privacy-panel';
import { getWalletNetwork } from '../lib/wallet/networks';
import { PrivacyDemo } from '../components/dashboard/privacy-demo';
import { PRIVACY_RESEARCH } from '../lib/wallet/privacy/research-deployment';
import { withdrawalContext } from '../lib/wallet/privacy/note';
import type { DemoEvidence } from '../lib/wallet/privacy/demo-evidence';
import { getAddress, zeroAddress } from 'viem';

let dom: JSDOM, root: import('react-dom/client').Root;
const originals = new Map<string, PropertyDescriptor | undefined>();
function install(name: string, value: unknown) { originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name)); Object.defineProperty(globalThis, name, { configurable: true, writable: true, value }); }
before(() => {
  dom = new JSDOM('<div id="root"></div>', { url: 'https://privacy-lab.test', pretendToBeVisual: true });
  for (const [name, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, Event: dom.window.Event, IS_REACT_ACT_ENVIRONMENT: true, fetch: () => { throw new Error('Privacy lab must not make network requests.'); } })) install(name, value);
});
beforeEach(async () => { const { createRoot } = await import('react-dom/client'); root = createRoot(document.getElementById('root')!); });
afterEach(async () => { await act(async () => root.unmount()); });
after(() => { dom.window.close(); for (const [name, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else Reflect.deleteProperty(globalThis, name); } });
const content = () => document.body.textContent ?? '';
async function render(chainId: number, onTestnet = () => {}) { await act(async () => root.render(React.createElement(PrivacyPanel, { key: chainId, network: getWalletNetwork(chainId), onTestnet }))); }
async function fill(input: HTMLInputElement, value: string) { await act(async () => { Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!.call(input, value); input.dispatchEvent(new dom.window.Event('input', { bubbles: true })); }); }
async function fillNote() {
  const inputs = document.querySelectorAll<HTMLInputElement>('form input');
  for (const [i, value] of ['0x1111111111111111111111111111111111111111', '0.01', 'public UI note password', 'public UI note password'].entries()) await fill(inputs[i], value);
}
async function submit() { await act(async () => { document.querySelector('form')!.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); }); }
async function waitFor(predicate: () => boolean) { for (let i = 0; i < 200; i++) { if (predicate()) return; await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); }); } assert.fail('Privacy UI did not settle.'); }

test('privacy lab disables mainnet and distinguishes note preparation from a funded balance', async () => {
  let requested = false;
  await render(4663, () => { requested = true; });
  assert.equal(document.querySelector<HTMLButtonElement>('form button')!.disabled, true);
  assert.match(content(), /does not create a private balance/);
  await act(async () => { [...document.querySelectorAll('button')].find(b => b.textContent === 'Use Robinhood Testnet')!.click(); });
  assert.ok(requested);
});

test('creating a note exposes only its commitment, clears passwords and resets on network change', async () => {
  await render(46630); await fillNote(); await submit();
  await waitFor(() => content().includes('Download encrypted note'));
  assert.match(document.querySelector('.qd-privacy-note-commitment')!.textContent!, /^[0-9]+$/);
  assert.equal(document.querySelector<HTMLInputElement>('input[type=password]')!.value, '');
  assert.equal(dom.window.localStorage.length, 0);
  assert.match(content(), /No funds have moved/);
  await render(11155111);
  assert.ok(!content().includes('Download encrypted note'));
});

test('a wallet lock invalidates an in-flight backup and cannot repopulate the note panel', async () => {
  await render(46630); await fillNote(); await submit();
  await act(async () => { window.dispatchEvent(new dom.window.Event('qozmo:lock-all')); });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 400)); });
  assert.ok(!content().includes('Download encrypted note'));
  assert.equal(document.querySelector<HTMLInputElement>('input[type=password]')!.value, '');
  assert.equal(document.querySelector<HTMLButtonElement>('form button')!.disabled, false);
  assert.equal(dom.window.localStorage.length, 0);
});

function demoFixture(): DemoEvidence {
  const sender = getAddress('0x1111111111111111111111111111111111111111');
  return { version: 1, status: 'complete', chainId: 46630, pool: PRIVACY_RESEARCH.pool, verifier: PRIVACY_RESEARCH.verifier, denomination: PRIVACY_RESEARCH.denomination, domain: PRIVACY_RESEARCH.domain, sender, recipient: sender, commitment: '1', nullifierHash: '2', root: '3', leafIndex: 0, gasFeeWei: '123', completedAt: '2026-11-11T15:00:00.000Z', deposit: { hash: `0x${'ab'.repeat(32)}`, blockHash: `0x${'cd'.repeat(32)}`, blockNumber: '1' }, withdrawal: { hash: `0x${'bc'.repeat(32)}`, blockHash: `0x${'de'.repeat(32)}`, blockNumber: '2' }, proof: { a: ['1', '2'], b: [['1', '2'], ['3', '4']], c: ['1', '2'] }, publicSignals: ['3', '2', PRIVACY_RESEARCH.domain, withdrawalContext({ chainId: 46630, pool: PRIVACY_RESEARCH.pool, denomination: PRIVACY_RESEARCH.denomination }, sender, zeroAddress, 0n).toString()] };
}
test('dashboard demo explores recorded stages without RPC requests or a signing action', async () => {
  let calls = 0;
  await act(async () => root.render(React.createElement(PrivacyDemo, { evidence: demoFixture(), verifyRecord: async () => { calls++; throw new Error('Fixture RPC unavailable.'); } })));
  assert.match(content(), /Recorded testnet run/); assert.ok(!content().includes('RPC verified'));
  const stages = document.querySelectorAll<HTMLButtonElement>('.qd-privacy-demo-stages button');
  await act(async () => stages[1].click()); assert.match(content(), /Membership, without the secret/);
  await act(async () => stages[2].click()); assert.match(content(), /One note. One withdrawal/);
  assert.match(document.querySelector<HTMLAnchorElement>('.qd-privacy-demo-detail > div > a')!.href, /\/tx\/0xbcbcbc/);
  assert.equal(calls, 0); assert.match(content(), /makes no anonymity claim/);
});
test('a failed fresh check clears a previously verified demo badge', async () => {
  let fail = false;
  const verifyRecord = async () => { if (fail) throw new Error('Fixture RPC unavailable.'); return { checkedAt: new Date().toISOString(), depositConfirmed: true, withdrawalConfirmed: true, proofValid: true, nullifierSpent: true, gasFeeWei: '123', blockNumber: '5' }; };
  await act(async () => root.render(React.createElement(PrivacyDemo, { evidence: demoFixture(), verifyRecord })));
  const button = [...document.querySelectorAll<HTMLButtonElement>('button')].find(b => b.textContent === 'Check testnet receipts')!;
  await act(async () => button.click()); assert.match(content(), /RPC verified/);
  fail = true; await act(async () => button.click());
  assert.ok(!content().includes('RPC verified')); assert.match(content(), /Verification is unavailable/);
});
