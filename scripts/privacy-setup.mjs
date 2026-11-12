import { execFileSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import solc from 'solc';
import { poseidonContract } from 'circomlibjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const build = path.join(root, 'privacy/build');
const circuitHash = createHash('sha256').update(await readFile(path.join(root, 'privacy/circuits/withdraw.circom'))).digest('hex');
if (process.argv.includes('--contracts-only')) {
  if ((await readFile(`${build}/circuit.sha256`, 'utf8')) !== circuitHash) throw new Error('Circuit changed; run the full privacy:setup.');
} else {
await rm(build, { recursive: true, force: true });
await mkdir(build, { recursive: true });
function run(bin, args) { execFileSync(process.execPath, [path.join(root, 'node_modules', bin), ...args], { cwd: root, stdio: 'inherit' }); }
console.log('LOCAL RESEARCH SETUP ONLY. Single-machine entropy is not a production ceremony.');
run('circom2/cli.js', ['privacy/circuits/withdraw.circom', '--r1cs', '--wasm', '--sym', '--O2', '-l', 'node_modules', '-o', build]);
run('snarkjs/cli.js', ['powersoftau', 'new', 'bn128', '12', `${build}/pot0.ptau`]);
run('snarkjs/cli.js', ['powersoftau', 'contribute', `${build}/pot0.ptau`, `${build}/pot1.ptau`, '--name=local-research', `-e=${randomBytes(64).toString('hex')}`]);
run('snarkjs/cli.js', ['powersoftau', 'prepare', 'phase2', `${build}/pot1.ptau`, `${build}/pot-final.ptau`]);
run('snarkjs/cli.js', ['groth16', 'setup', `${build}/withdraw.r1cs`, `${build}/pot-final.ptau`, `${build}/initial.zkey`]);
run('snarkjs/cli.js', ['zkey', 'contribute', `${build}/initial.zkey`, `${build}/withdraw.zkey`, '--name=local-research', `-e=${randomBytes(64).toString('hex')}`]);
run('snarkjs/cli.js', ['zkey', 'export', 'verificationkey', `${build}/withdraw.zkey`, `${build}/verification-key.json`]);
run('snarkjs/cli.js', ['zkey', 'export', 'solidityverifier', `${build}/withdraw.zkey`, `${build}/WithdrawVerifier.sol`]);
await writeFile(`${build}/circuit.sha256`, circuitHash);
}
const sources = {
  'QozmoPrivacyPool.sol': { content: await readFile(path.join(root, 'privacy/contracts/QozmoPrivacyPool.sol'), 'utf8') },
  'WithdrawVerifier.sol': { content: await readFile(`${build}/WithdrawVerifier.sol`, 'utf8') },
  'TestRecipients.sol': { content: await readFile(path.join(root, 'privacy/test/TestRecipients.sol'), 'utf8') },
};
const output = JSON.parse(solc.compile(JSON.stringify({ language: 'Solidity', sources, settings: { optimizer: { enabled: true, runs: 200 }, viaIR: true, evmVersion: 'paris', outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } } })));
for (const error of output.errors ?? []) if (error.severity === 'error') throw new Error(error.formattedMessage);
const contracts = {};
for (const file of Object.values(output.contracts)) for (const [name, artifact] of Object.entries(file)) {
  if (artifact.evm.bytecode.object) contracts[name] = { abi: artifact.abi, bytecode: `0x${artifact.evm.bytecode.object}` };
}
for (const n of [2, 4]) contracts[`Poseidon${n}`] = { abi: poseidonContract.generateABI(n), bytecode: poseidonContract.createCode(n) };
await writeFile(`${build}/contracts.json`, JSON.stringify(contracts));
const artifactHashes = {};
for (const file of ['contracts.json', 'verification-key.json', 'WithdrawVerifier.sol', 'withdraw.zkey', 'withdraw_js/withdraw.wasm', 'withdraw.r1cs']) artifactHashes[file] = createHash('sha256').update(await readFile(path.join(build, file))).digest('hex');
const hashes = {};
for (const file of ['privacy/circuits/withdraw.circom', 'privacy/contracts/QozmoPrivacyPool.sol', 'privacy/test/TestRecipients.sol', 'lib/wallet/privacy/note.ts', 'lib/wallet/privacy/transactions.ts', 'package-lock.json', 'scripts/privacy-setup.mjs', 'scripts/privacy-runtime.mjs', 'scripts/privacy-deploy.mjs', 'scripts/privacy-verify.mjs', 'scripts/privacy-e2e.mjs']) hashes[file] = createHash('sha256').update(await readFile(path.join(root, file))).digest('hex');
await writeFile(`${build}/manifest.json`, JSON.stringify({ localResearchOnly: true, solc: solc.version(), hashes, artifactHashes }, null, 2));
console.log('Circuit, local proving key, Solidity verifier and contract artifacts ready in privacy/build.');
