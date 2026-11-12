import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { privateKeyToAccount } from 'viem/accounts';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export const buildDirectory = path.join(projectRoot, 'privacy/build');
export const deploymentFile = path.join(projectRoot, 'privacy/deployments/46630.json');
export const RPC_URL = 'https://rpc.testnet.chain.robinhood.com';
export const artifactFiles = ['contracts.json', 'verification-key.json', 'WithdrawVerifier.sol', 'withdraw.zkey', 'withdraw_js/withdraw.wasm', 'withdraw.r1cs'];
export const digest = value => createHash('sha256').update(value).digest('hex');
export function ensure(condition, message) { if (!condition) throw new Error(message); }

/** Read only the named deployment settings; never load secrets into the Next.js/browser runtime. */
export async function deploymentEnvironment() {
  const settings = {};
  for (const file of ['.env', '.env.local']) {
    let contents;
    try { contents = await readFile(path.join(projectRoot, file), 'utf8'); }
    catch (error) { if (error.code === 'ENOENT') continue; throw new Error('Could not read deployment environment file.'); }
    const parsed = parseEnv(contents);
    for (const name of ['WALLET_TESTNET', 'QOZMO_PRIVACY_RPC_URL']) if (Object.hasOwn(parsed, name)) settings[name] = parsed[name];
  }
  for (const name of ['WALLET_TESTNET', 'QOZMO_PRIVACY_RPC_URL']) if (Object.hasOwn(process.env, name)) settings[name] = process.env[name];
  return settings;
}

export function deployerAccount(value) {
  ensure(typeof value === 'string' && value.trim(), 'WALLET_TESTNET is missing. Save a dedicated testnet private key in .env; never send it to chat.');
  const key = value.trim().startsWith('0x') ? value.trim() : `0x${value.trim()}`;
  ensure(/^0x[0-9a-fA-F]{64}$/.test(key), 'WALLET_TESTNET must contain a 32-byte EVM private key, with or without 0x.');
  try { return privateKeyToAccount(key); }
  catch { throw new Error('WALLET_TESTNET is not a valid EVM private key.'); }
}

export async function loadPrivacyArtifacts(directory = buildDirectory, requireTests = true) {
  const manifestText = await readFile(path.join(directory, 'manifest.json'), 'utf8');
  const manifest = JSON.parse(manifestText);
  ensure(manifest.localResearchOnly === true && manifest.artifactHashes, 'Run privacy:setup -- --contracts-only to pin the build artifacts.');
  for (const [file, hash] of Object.entries(manifest.hashes)) ensure(digest(await readFile(path.join(projectRoot, file))) === hash, `Source changed: ${file}. Rebuild and rerun privacy:test.`);
  for (const file of artifactFiles) ensure(manifest.artifactHashes[file] && digest(await readFile(path.join(directory, file))) === manifest.artifactHashes[file], `Artifact mismatch: ${file}. Rebuild and rerun privacy:test.`);
  const manifestHash = digest(manifestText);
  if (requireTests) {
    const report = JSON.parse(await readFile(path.join(directory, 'test-report.json'), 'utf8'));
    ensure(report.completed === true && report.scope === 'isolated-anvil-local-only' && report.manifestHash === manifestHash && report.checks.length >= 9, 'Run privacy:test successfully against this exact build before deployment.');
  }
  return { directory, manifest, manifestHash, contracts: JSON.parse(await readFile(path.join(directory, 'contracts.json'), 'utf8')) };
}

export async function archivePrivacyArtifacts(build) {
  const archive = path.join(projectRoot, 'privacy/artifacts', build.manifestHash);
  for (const file of [...artifactFiles, 'manifest.json', 'test-report.json']) {
    const target = path.join(archive, file);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(path.join(build.directory, file), target);
  }
  return path.relative(projectRoot, archive);
}

export async function saveJSON(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
  await rename(temporary, file);
}

export async function readJSONIfPresent(file) {
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

/** Never print RPC errors, request bodies, process.env or signer objects: providers may echo inputs. */
export async function scriptMain(action) {
  try { await action(); }
  catch (error) {
    const allowed = /^(WALLET_TESTNET|Run privacy:|Source changed:|Artifact mismatch:|Wrong chain|Deployment |Pending deployment|Nonce |Gas |Insufficient |Pool |Poseidon |Verifier |Test proof|Could not read deployment|Another deployment|RPC configuration)/;
    console.error(allowed.test(error.message ?? '') ? error.message : 'Deployment check failed. Check RPC availability and the saved public deployment journal; raw errors were suppressed to protect credentials.');
    process.exitCode = 1;
  }
}
