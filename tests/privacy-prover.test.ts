import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { browserPrivacyProver, checkBrowserProver } from '../lib/wallet/privacy/browser-prover';
import type { withdrawalWitness } from '../lib/wallet/privacy/note';

let fetchDescriptor: PropertyDescriptor | undefined, workerDescriptor: PropertyDescriptor | undefined;
const instances: FixtureWorker[] = [];
class FixtureWorker {
  terminated = false; message: unknown; onmessage?: (event: { data: unknown }) => void; onerror?: () => void;
  constructor(readonly url: string) { instances.push(this); }
  postMessage(message: unknown) { this.message = message; }
  terminate() { this.terminated = true; }
}
beforeEach(() => {
  fetchDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'fetch'); workerDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'Worker'); instances.length = 0;
  Object.defineProperty(globalThis, 'Worker', { configurable: true, value: FixtureWorker });
});
afterEach(() => {
  for (const [name, descriptor] of [['fetch', fetchDescriptor], ['Worker', workerDescriptor]] as const) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor); else Reflect.deleteProperty(globalThis, name);
  }
});
test('missing or replaced withdrawal artifacts fail before a deposit can be prepared', async () => {
  const urls: string[] = [];
  Object.defineProperty(globalThis, 'fetch', { configurable: true, value: async (url: string) => { urls.push(url); return url.endsWith('worker.js') ? new Response('', { headers: { 'content-type': 'application/javascript' } }) : new Response('wrong artifact'); } });
  await assert.rejects(checkBrowserProver(), /integrity check/);
  assert.ok(urls.every(url => url.startsWith('/privacy-prover/')));
  Object.defineProperty(globalThis, 'fetch', { configurable: true, value: async () => new Response('missing', { status: 404 }) });
  await assert.rejects(checkBrowserProver(), /not installed/);
});
test('locking cancels and terminates the local worker without any witness fetch', async () => {
  Object.defineProperty(globalThis, 'fetch', { configurable: true, value: () => assert.fail('Parent must never upload the private witness.') });
  const abort = new AbortController(), witness = { secret: 'fixture private witness' } as unknown as ReturnType<typeof withdrawalWitness>;
  const pending = browserPrivacyProver(abort.signal)(witness);
  assert.equal(instances.length, 1); assert.equal(instances[0].url, '/privacy-prover/worker.js'); assert.equal(instances[0].message, witness);
  abort.abort(); await assert.rejects(pending, /cancelled/); assert.equal(instances[0].terminated, true);
});
test('the worker terminates on successful output or startup failure', async () => {
  const witness = {} as ReturnType<typeof withdrawalWitness>;
  const first = browserPrivacyProver(new AbortController().signal)(witness);
  instances[0].onmessage?.({ data: { a: ['1', '2'], b: [['1', '2'], ['3', '4']], c: ['1', '2'], publicSignals: ['1', '2', '3', '4'] } });
  assert.deepEqual((await first).publicSignals, [1n, 2n, 3n, 4n]); assert.equal(instances[0].terminated, true);
  const failed = browserPrivacyProver(new AbortController().signal)(witness);
  instances[1].onerror?.(); await assert.rejects(failed, /could not start/); assert.equal(instances[1].terminated, true);
});
