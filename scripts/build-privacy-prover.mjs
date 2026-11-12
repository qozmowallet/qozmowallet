import { mkdir, copyFile, access, rm } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';
import { loadPrivacyArtifacts, projectRoot } from './privacy-runtime.mjs';
const hash = '23c992a98db9c84c17c5910115e088828cbef6f61505636817c12e9814fa7af1';
const archive = path.join(projectRoot, 'privacy/artifacts', hash);
const destination = path.join(projectRoot, 'public/privacy-prover');
try { await access(archive); } catch {
  await rm(destination, { recursive: true, force: true });
  console.log('Privacy proving archive unavailable; the website will keep deposits disabled. Restore the exact deployed archive to enable proving.');
  process.exit(0);
}
const pinned = await loadPrivacyArtifacts(archive);
if (pinned.manifestHash !== hash) throw Error('Privacy manifest mismatch.');
await mkdir(destination, { recursive: true });
for (const [source, target] of [['withdraw_js/withdraw.wasm', 'withdraw.wasm'], ['withdraw.zkey', 'withdraw.zkey'], ['verification-key.json', 'verification-key.json']]) await copyFile(path.join(archive, source), path.join(destination, target));
await build({ entryPoints: ['scripts/privacy-worker.mjs'], outfile: path.join(destination, 'worker.js'), platform: 'browser', conditions: ['browser'], format: 'iife', bundle: true, minify: true, legalComments: 'linked' });
console.log('Packaged the pinned testnet prover. No wallet keys or note secrets included.');
