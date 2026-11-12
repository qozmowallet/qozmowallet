import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'extension');
const outputParent = path.join(root, 'dist/chrome');
const output = path.join(outputParent, 'qozmo-wallet-extension');
const downloads = path.join(root, 'public/downloads');
const manifest = JSON.parse(await readFile(path.join(source, 'manifest.json'), 'utf8'));

// Recreate build output only. No browser profile or runtime wallet data is read.
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await mkdir(downloads, { recursive: true });
const result = await build({
  absWorkingDir: root,
  entryPoints: { wallet: 'extension/main.tsx', background: 'extension/background.js' },
  outdir: output,
  bundle: true,
  splitting: true,
  format: 'esm',
  platform: 'browser',
  target: 'chrome120',
  minify: true,
  sourcemap: false,
  legalComments: 'linked',
  metafile: true,
  assetNames: 'fonts/[name]-[hash]',
  chunkNames: 'chunks/[name]-[hash]',
  loader: { '.module.css': 'local-css', '.woff2': 'file', '.woff': 'file' },
  // Only these explicit public values enter the standalone bundle. Never read .env files.
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.NEXT_PUBLIC_QOZMO_GATEWAY_URL': '""',
  },
  logLevel: 'warning',
});
await writeFile(path.join(outputParent, 'bundle-metafile.json'), JSON.stringify(result.metafile));

const dependencies = [...new Set(Object.keys(result.metafile.inputs).filter(name => name.startsWith('node_modules/')).map(name => {
  const parts = name.slice('node_modules/'.length).split('/');
  return parts[0].startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}))].sort();
const notices = [];
for (const dependency of dependencies) {
  const directory = path.join(root, 'node_modules', dependency);
  const info = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8'));
  const licenses = (await readdir(directory)).filter(name => /^(?:licen[cs]e|copying|notice)(?:\.|$)/i.test(name));
  notices.push(`${info.name} ${info.version} — ${typeof info.license === 'string' ? info.license : JSON.stringify(info.license)}\n`);
  for (const license of licenses) notices.push(await readFile(path.join(directory, license), 'utf8'));
}
await writeFile(path.join(output, 'THIRD-PARTY-NOTICES.txt'), notices.join('\n\n---\n\n'));

for (const name of ['manifest.json', 'wallet.html', 'popup.html', 'sidepanel.html']) {
  await cp(path.join(source, name), path.join(output, name));
}
await cp(path.join(source, 'wallet.html'), path.join(output, 'recovery.html'));
await writeFile(path.join(output, 'quantum.html'), (await readFile(path.join(source, 'wallet.html'), 'utf8')).replace('Qozmo Wallet — Chrome', 'Qozmo Quantum Wallet'));
await cp(path.join(root, 'public/brand'), path.join(output, 'brand'), { recursive: true });
await cp(path.join(root, 'public/assets'), path.join(output, 'assets'), { recursive: true });
await cp(path.join(root, 'docs/chrome-extension.md'), path.join(output, 'INSTALL.md'));
await cp(path.join(root, 'docs/extension-alpine-theme.md'), path.join(output, 'extension-alpine-theme.md'));
await cp(path.join(root, 'docs/multichain-wallet.md'), path.join(output, 'multichain-wallet.md'));
await cp(path.join(root, 'components/magicui/LICENSE'), path.join(output, 'QOZMO-UI-LICENSE.txt'));

const archive = path.join(downloads, 'qozmo-wallet-chrome.zip');
// zip updates an existing archive, so remove the previous build to avoid stale files.
await rm(archive, { force: true });
execFileSync('zip', ['-q', '-r', archive, path.basename(output)], { cwd: outputParent });
const bytes = await readFile(archive);
const sha256 = createHash('sha256').update(bytes).digest('hex');
await writeFile(`${archive}.sha256`, `${sha256}  ${path.basename(archive)}\n`);
await writeFile(path.join(downloads, 'qozmo-wallet-chrome.json'), JSON.stringify({ version: manifest.version, filename: path.basename(archive), bytes: bytes.length, sha256 }, null, 2) + '\n');
console.log(`Chrome extension v${manifest.version}: ${output}`);
console.log(`Download: ${archive} (${(bytes.length / 1024 / 1024).toFixed(2)} MB)`);
console.log(`SHA-256: ${sha256}`);
