import assert from 'node:assert/strict';
import { test } from 'node:test';
import { appHref, QOZMO_WEBSITE, requestExtensionOrigin } from '../lib/app-runtime';
import { paymentLink, type PaymentRequest } from '../lib/wallet/payments';

test('extension routes stay local, while guides and payment links remain shareable', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
  try {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { protocol: 'chrome-extension:' } } });
    assert.equal(appHref('/dashboard/#recovery'), '/wallet.html#recovery');
    assert.equal(appHref('/recovery/'), '/recovery.html');
    assert.equal(appHref('/'), '/wallet.html');
    assert.equal(appHref('/docs/quantum/overview/'), `${QOZMO_WEBSITE}/docs/quantum/overview/`);
    assert.equal(appHref('/proof/'), `${QOZMO_WEBSITE}/proof/`);
    assert.throws(() => appHref('/unknown/'));
    const request: PaymentRequest = { version: 1, id: '4b8a98fa-4545-4b3a-858b-c65c5a02e701', chainId: 46630, recipient: '0x1111111111111111111111111111111111111111', amount: '0.1', label: 'Test invoice', createdAt: '2026-11-11T00:00:00.000Z', expiresAt: '2026-11-12T00:00:00.000Z' };
    const url = new URL(paymentLink(request, 'chrome-extension://exampleid'));
    assert.equal(url.origin, QOZMO_WEBSITE);
    assert.equal(url.pathname, '/dashboard/');
    assert.equal(url.hash, '#payments');
    assert.equal(JSON.parse(url.searchParams.get('payment')!).id, request.id);
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { protocol: 'https:' } } });
    assert.equal(appHref('/dashboard/#recovery'), '/dashboard/#recovery');
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'window', descriptor); else Reflect.deleteProperty(globalThis, 'window');
  }
});

test('custom bundler permission is requested for only its origin and denial fails closed', async () => {
  const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const chromeDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'chrome');
  const calls: unknown[] = [];
  try {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { protocol: 'chrome-extension:' } } });
    Object.defineProperty(globalThis, 'chrome', { configurable: true, value: { permissions: { request: async (value: unknown) => { calls.push(value); return false; } } } });
    await assert.rejects(requestExtensionOrigin('https://bundler.example/rpc?key=private-session-key'), /not granted/);
    assert.deepEqual(calls, [{ origins: ['https://bundler.example/*'] }]);
    await assert.rejects(requestExtensionOrigin('http://bundler.example/rpc'), /HTTPS/);
    assert.equal(calls.length, 1);
    Object.defineProperty(globalThis, 'chrome', { configurable: true, value: { permissions: { request: async () => true } } });
    await requestExtensionOrigin('https://bundler.example/rpc');
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { protocol: 'https:' } } });
    Reflect.deleteProperty(globalThis, 'chrome');
    await requestExtensionOrigin('https://bundler.example/rpc');
  } finally {
    if (windowDescriptor) Object.defineProperty(globalThis, 'window', windowDescriptor); else Reflect.deleteProperty(globalThis, 'window');
    if (chromeDescriptor) Object.defineProperty(globalThis, 'chrome', chromeDescriptor); else Reflect.deleteProperty(globalThis, 'chrome');
  }
});
