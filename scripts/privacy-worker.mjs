import { groth16 } from 'snarkjs';
import assets from '../lib/wallet/privacy/prover-assets.json';

// This worker fetches only public circuit artifacts; the witness never leaves it.
async function artifact(file, digest) {
  const response = await fetch(new URL(file, self.location.href), { credentials: 'omit', cache: 'no-cache' });
  if (!response.ok) throw Error();
  const data = new Uint8Array(await response.arrayBuffer());
  if (data.length > 8 * 1024 * 1024) throw Error();
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data)), v => v.toString(16).padStart(2, '0')).join('');
  if (hash !== digest) throw Error();
  return data;
}
self.onmessage = async event => {
  try {
    const [wasm, zkey, vkBytes] = await Promise.all(Object.entries(assets).map(([file, hash]) => artifact(file, hash)));
    const { proof, publicSignals } = await groth16.fullProve(event.data, wasm, zkey, undefined, { memorySize: 256 }, { singleThread: true });
    if (!await groth16.verify(JSON.parse(new TextDecoder().decode(vkBytes)), publicSignals, proof)) throw Error();
    self.postMessage({ a: proof.pi_a.slice(0, 2), b: proof.pi_b.slice(0, 2).map(row => [row[1], row[0]]), c: proof.pi_c.slice(0, 2), publicSignals });
  } catch { self.postMessage({ error: 'Local proof generation failed. Check the deployed prover assets and preserve your encrypted note.' }); }
};
