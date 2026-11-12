import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createPublicClient, http, zeroAddress } from 'viem';
import { groth16 } from 'snarkjs';
import { getCurveFromName } from 'ffjavascript';
import { createPrivacyNote, noteCommitment, withdrawalWitness } from '../lib/wallet/privacy/note.ts';
import { assertTestnet, testnetChain, verifyDeployment } from './privacy-deploy.mjs';
import { buildDirectory, deploymentEnvironment, deploymentFile, ensure, loadPrivacyArtifacts, projectRoot, readJSONIfPresent, RPC_URL, saveJSON, scriptMain } from './privacy-runtime.mjs';

/** Read-only proof test of the deployed verifier. Does not make a pool deposit or prove pool membership. */
export async function verifyProofOnChain(client, journal, build) {
  await assertTestnet(client);
  const note = createPrivacyNote({ chainId: 46630, pool: journal.contracts.QozmoPrivacyPool.address, denomination: journal.denomination });
  const witness = withdrawalWitness(note, [noteCommitment(note)], journal.deployer, zeroAddress, 0n);
  try {
    const { proof, publicSignals } = await groth16.fullProve(witness, path.join(build.directory, 'withdraw_js/withdraw.wasm'), path.join(build.directory, 'withdraw.zkey'), undefined, undefined, { singleThread: true });
    ensure(await groth16.verify(JSON.parse(await readFile(path.join(build.directory, 'verification-key.json'), 'utf8')), publicSignals, proof), 'Test proof failed local verification.');
    const [a, b, c] = JSON.parse(`[${await groth16.exportSolidityCallData(proof, publicSignals)}]`);
    const request = { address: journal.contracts.Groth16Verifier.address, abi: build.contracts.Groth16Verifier.abi, functionName: 'verifyProof', args: [a, b, c, publicSignals] };
    ensure(await client.readContract(request) === true, 'Verifier rejected the real Groth16 test proof.');
    const changed = publicSignals.map(BigInt); changed[3] += 1n;
    ensure(await client.readContract({ ...request, args: [a, b, c, changed] }) === false, 'Verifier accepted a changed withdrawal context.');
    const gas = await client.estimateContractGas({ ...request, account: journal.deployer });
    return { checkedAt: new Date().toISOString(), manifestHash: build.manifestHash, method: 'eth_call', validProof: true, changedContextRejected: true, verifierGasEstimate: gas.toString(), scope: 'verifier-only; synthetic root; no pool deposit or withdrawal', proof, publicSignals };
  } finally { await (await getCurveFromName('bn128')).terminate(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await scriptMain(async () => {
    const journal = await readJSONIfPresent(deploymentFile);
    ensure(journal?.status === 'verified', 'Deployment journal is missing or incomplete.');
    const expectedArchive = `privacy/artifacts/${journal.manifestHash}`;
    ensure(!journal.artifactArchive || journal.artifactArchive === expectedArchive, 'Deployment artifact archive path mismatch.');
    const build = await loadPrivacyArtifacts(journal.artifactArchive ? path.join(projectRoot, expectedArchive) : buildDirectory);
    ensure(journal.manifestHash === build.manifestHash, 'Deployment and archived build differ.');
    const env = await deploymentEnvironment();
    const rpc = env.QOZMO_PRIVACY_RPC_URL || RPC_URL;
    const client = createPublicClient({ chain: testnetChain(rpc), transport: http(rpc, { retryCount: 1, timeout: 20_000 }) });
    await verifyDeployment(client, journal, build);
    journal.verifierTest = await verifyProofOnChain(client, journal, build);
    await saveJSON(deploymentFile, journal);
    console.log(`Verifier proof passed on chain 46630. Estimated verifier call gas: ${journal.verifierTest.verifierGasEstimate}. No funds deposited.`);
  });
}
