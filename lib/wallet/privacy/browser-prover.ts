import type { Groth16Result, PrivacyProver } from './transactions';
import assets from './prover-assets.json';

export async function checkBrowserProver(signal?: AbortSignal) {
  if (typeof Worker === 'undefined') throw new Error('This browser does not support the local Privacy Ring prover.');
  const response = await fetch('/privacy-prover/worker.js', { method: 'HEAD', cache: 'no-store', credentials: 'omit', signal });
  if (!response.ok || !/javascript/.test(response.headers.get('content-type') ?? '')) throw new Error('The local prover is not installed on this website. Deposits are disabled until the deployed proving archive is packaged.');
  // Fail before a deposit if any required withdrawal artifact is absent or replaced.
  await Promise.all(Object.entries(assets).map(async ([file, expected]) => {
    const artifact = await fetch(`/privacy-prover/${file}`, { cache: 'force-cache', credentials: 'omit', signal });
    if (!artifact.ok) throw new Error('A required withdrawal artifact is missing. No deposit can be prepared.');
    const data = await artifact.arrayBuffer();
    if (data.byteLength > 8 * 1024 * 1024) throw new Error('Unsupported prover artifact size.');
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data)), value => value.toString(16).padStart(2, '0')).join('');
    if (hash !== expected) throw new Error('Withdrawal artifact integrity check failed. No deposit can be prepared.');
  }));
}
export function browserPrivacyProver(signal: AbortSignal): PrivacyProver {
  return witness => new Promise<Groth16Result>((resolve, reject) => {
    signal.throwIfAborted();
    const worker = new Worker('/privacy-prover/worker.js');
    const finish = () => { worker.terminate(); clearTimeout(timer); signal.removeEventListener('abort', cancel); };
    const cancel = () => { finish(); reject(new DOMException('Proof cancelled', 'AbortError')); };
    const timer = setTimeout(() => { finish(); reject(new Error('Local proof timed out. Preserve your note and retry on a faster device.')); }, 180_000);
    signal.addEventListener('abort', cancel, { once: true });
    worker.onerror = () => { finish(); reject(new Error('The local prover could not start. No withdrawal was signed.')); };
    worker.onmessage = event => {
      finish();
      try {
        const v = event.data;
        if (v.error) throw new Error(v.error);
        if (!Array.isArray(v.a) || !Array.isArray(v.b) || !Array.isArray(v.c) || !Array.isArray(v.publicSignals)) throw new Error('Invalid local prover response.');
        resolve({ a: v.a.map(BigInt), b: v.b.map((row: string[]) => row.map(BigInt)), c: v.c.map(BigInt), publicSignals: v.publicSignals.map(BigInt) });
      } catch (reason) { reject(reason); }
    };
    worker.postMessage(witness);
  });
}
