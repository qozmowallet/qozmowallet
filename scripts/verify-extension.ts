import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { WALLET_NETWORKS } from '../lib/wallet/networks';
import { NATIVE_NETWORKS } from '../lib/wallet/multichain/networks';

async function main() {
const root = process.cwd();
const output = path.join(root, 'dist/chrome/qozmo-wallet-extension');
const archive = path.join(root, 'public/downloads/qozmo-wallet-chrome.zip');
const manifest = JSON.parse(await readFile(path.join(output, 'manifest.json'), 'utf8'));
const source = JSON.parse(await readFile(path.join(root, 'extension/manifest.json'), 'utf8'));
assert.deepEqual(manifest, source, 'Manifest is stale; rebuild the extension.');
assert.equal(manifest.manifest_version, 3);
assert.ok(Number(manifest.minimum_chrome_version) >= 137, 'Native Solana signing requires Chrome Ed25519 support.');
assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
for (const key of ['content_scripts', 'web_accessible_resources', 'externally_connectable', 'sandbox']) assert.equal(manifest[key], undefined, `Unexpected ${key}.`);
assert.deepEqual(manifest.permissions, ['sidePanel'], 'Only the browser side panel API is required.');
assert.deepEqual(manifest.background, { service_worker: 'background.js', type: 'module' });
assert.deepEqual(manifest.side_panel, { default_path: 'sidepanel.html' });
assert.equal(manifest.action.default_popup, undefined, 'The toolbar must open the side panel.');
assert.deepEqual(manifest.optional_host_permissions, ['https://*/*']);
const csp: string = manifest.content_security_policy.extension_pages;
assert.match(csp, /(?:^|; )script-src 'self';/);
assert.ok(!/unsafe-eval|wasm-unsafe-eval|https?:/.test(csp.split('script-src ')[1].split(';')[0]));
assert.match(csp, /object-src 'none'/);
for (const network of WALLET_NETWORKS) {
  assert.ok(manifest.host_permissions.includes(`${new URL(network.rpcUrl).origin}/*`), `Missing RPC host for ${network.label}.`);
}
for (const network of Object.values(NATIVE_NETWORKS)) assert.ok(manifest.host_permissions.includes(`${new URL(network.rpc).origin}/*`), `Missing native network service: ${network.id}`);
assert.ok(manifest.host_permissions.every((host: string) => /^https:\/\/[^*/]+\/\*$/.test(host)), 'Required host permissions must be explicit HTTPS origins.');

async function files(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? files(path.join(dir, entry.name)) : [path.join(dir, entry.name)]))).flat();
}
async function localResource(base: string, reference: string) {
  const resolved = path.resolve(base, reference.replace(/^\//, path.relative(base, output) + '/'));
  assert.ok(resolved.startsWith(output + path.sep), `Resource escaped package: ${reference}`);
  assert.ok((await stat(resolved)).isFile(), `Missing package resource: ${reference}`);
}
const packaged = await files(output);
assert.ok(packaged.length > 20, 'Incomplete package.');
const metadata = JSON.parse(await readFile(path.join(root, 'dist/chrome/bundle-metafile.json'), 'utf8'));
assert.ok(!Object.keys(metadata.inputs).some(name => name.startsWith('node_modules/next/')), 'Standalone bundle must not rely on the Next.js runtime.');
const worker = Object.entries(metadata.outputs).find(([name]) => name.endsWith('/background.js'))?.[1] as { inputs?: Record<string, unknown>; imports?: unknown[] } | undefined;
assert.deepEqual(Object.keys(worker?.inputs ?? {}), ['extension/background.js'], 'The panel worker must not bundle wallet code.');
assert.deepEqual(worker?.imports, [], 'The panel worker must not import wallet modules.');
for (const [name, info] of Object.entries(metadata.outputs) as [string, { imports: { path: string; external?: boolean; kind: string }[] }][]) {
  assert.ok(path.resolve(root, name).startsWith(output + path.sep));
  for (const imported of info.imports) {
    if (imported.kind === 'url-token' && imported.path.startsWith('data:image/')) continue;
    assert.ok(!imported.external, `Executable/runtime dependency was not bundled: ${imported.path}`);
    assert.ok(path.resolve(root, imported.path).startsWith(output + path.sep));
    assert.ok((await stat(path.resolve(root, imported.path))).isFile());
  }
}
for (const filename of packaged) {
  assert.ok(!/(?:^|\/)\.env|\.map$|\.ts$|\.tsx$|\.zip$|node_modules|\.DS_Store/.test(path.relative(output, filename)), `Unexpected packaged source/private file: ${filename}`);
  const contents = filename.endsWith('.html') || filename.endsWith('.css') || filename.endsWith('.js') ? await readFile(filename, 'utf8') : '';
  if (filename.endsWith('.html')) {
    assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(contents), 'Inline scripts are forbidden.');
    assert.ok(!/\son[a-z]+\s*=/i.test(contents), 'Inline handlers are forbidden.');
    for (const match of contents.matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (/^https:\/\//.test(match[1])) continue;
      assert.ok(!/^[a-z]+:/i.test(match[1]), 'Unsupported HTML resource protocol.');
      await localResource(path.dirname(filename), match[1]);
    }
  }
  // Bundled CSS dependencies were checked from esbuild's parsed metadata above.
  if (filename.endsWith('popup.css')) {
    for (const match of contents.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
      if (!match[1].startsWith('data:')) await localResource(path.dirname(filename), match[1]);
    }
  }
  if (filename.endsWith('.js')) {
    assert.ok(!/\beval\s*\(|\bnew Function\s*\(/.test(contents), 'Dynamic code execution conflicts with extension CSP.');
  }
}
for (const name of [manifest.side_panel.default_path, manifest.background.service_worker, ...Object.values(manifest.icons) as string[], 'popup.html', 'wallet.html', 'quantum.html', 'recovery.html', 'wallet.js', 'wallet.css', 'assets/qozmo-alpine-stag.webp', 'assets/solana.svg', 'assets/bitcoin.svg', 'extension-alpine-theme.md', 'multichain-wallet.md']) await localResource(output, name);
for (const entry of [manifest.side_panel.default_path, 'popup.html']) {
  const page = await readFile(path.join(output, entry), 'utf8');
  assert.ok(page.includes('src="wallet.js"') && page.includes('id="root"'), 'The Quantum surface must mount the bundled wallet UI.');
}
execFileSync('unzip', ['-tq', archive], { stdio: 'pipe' });
const zipEntries = execFileSync('unzip', ['-Z1', archive], { encoding: 'utf8' }).trim().split('\n');
assert.ok(zipEntries.includes('qozmo-wallet-extension/manifest.json'));
assert.ok(zipEntries.every(entry => entry.startsWith('qozmo-wallet-extension/') && !entry.includes('..')), 'Invalid ZIP path.');
const bytes = await readFile(archive);
const sha256 = createHash('sha256').update(bytes).digest('hex');
const release = JSON.parse(await readFile(path.join(root, 'public/downloads/qozmo-wallet-chrome.json'), 'utf8'));
assert.equal(release.sha256, sha256);
assert.equal(release.bytes, bytes.length);
assert.equal(release.version, manifest.version);
assert.ok((await readFile(`${archive}.sha256`, 'utf8')).startsWith(sha256 + '  '));
console.log(`Verified Qozmo Chrome v${manifest.version}: ${packaged.length} files, local scripts/assets, network permissions, ZIP integrity and SHA-256.`);

}
void main().catch(error => { console.error(error); process.exitCode = 1; });
