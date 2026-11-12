import { isAddress, keccak256, parseAbi, type Hex, type PublicClient } from "viem";
import type { Deployment } from "./deployments.ts";

export type DeploymentManifest = Deployment & {
  /** Reviewed hashes of deployed runtime bytecode, not creation bytecode. */
  runtimeHashes: { entryPoint: Hex; factory: Hex; accountImplementation: Hex };
};
export type ReadinessCheck = { name: string; ok: boolean; detail: string };
export type ReadinessReport = { ready: boolean; checkedAt: string; blockNumber?: string; checks: ReadinessCheck[] };
export type DeploymentPolicy = { manifest: DeploymentManifest; bundlerUrl?: string };

export function parseDeploymentManifest(value: unknown): DeploymentManifest {
  const m = value as DeploymentManifest;
  if (!m || !Number.isSafeInteger(m.chainId) || m.chainId <= 0 ||
      ![m.factory, m.accountImplementation, m.entryPoint].every(a => typeof a === "string" && isAddress(a)) ||
      !m.runtimeHashes || ![m.runtimeHashes.entryPoint, m.runtimeHashes.factory, m.runtimeHashes.accountImplementation]
        .every(h => typeof h === "string" && /^0x[0-9a-fA-F]{64}$/.test(h)) ||
      !Number.isSafeInteger(m.deployBlock) || m.deployBlock! <= 0) {
    throw new Error("Deployment manifest requires chainId, contract addresses, a positive deployBlock and three reviewed runtimeHashes.");
  }
  return m;
}

/** Read-only infrastructure checks; does not certify signatures, bundler acceptance or security. */
export async function checkDeploymentReadiness(client: PublicClient, policy: DeploymentPolicy): Promise<ReadinessReport> {
  const checks: ReadinessCheck[] = [];
  const report: ReadinessReport = { ready: false, checkedAt: new Date().toISOString(), checks };
  let manifest: DeploymentManifest;
  try { manifest = parseDeploymentManifest(policy.manifest); }
  catch { checks.push({ name: "manifest", ok: false, detail: "Missing or invalid reviewed deployment manifest." }); return report; }
  async function check(name: string, work: () => Promise<string>) {
    try { checks.push({ name, ok: true, detail: await work() }); }
    catch { checks.push({ name, ok: false, detail: "Check failed: unavailable, missing, or does not match the manifest." }); }
  }
  await check("chain", async () => {
    if (await client.getChainId() !== manifest.chainId || (client.chain && client.chain.id !== manifest.chainId)) throw Error();
    return `Chain ${manifest.chainId}`;
  });
  if (!checks[0].ok) return report;
  let blockNumber: bigint;
  try {
    blockNumber = await client.getBlockNumber({ cacheTime: 0 });
    report.blockNumber = String(blockNumber);
    if (BigInt(manifest.deployBlock!) > blockNumber) throw Error();
    checks.push({ name: "deployment-block", ok: true, detail: `Recorded deployment block ${manifest.deployBlock}` });
  } catch { checks.push({ name: "deployment-block", ok: false, detail: "Cannot validate deployment block." }); return report; }
  for (const name of ["entryPoint", "factory", "accountImplementation"] as const) {
    await check(`${name}-bytecode`, async () => {
      const code = await client.getCode({ address: manifest[name], blockNumber });
      if (!code || code === "0x" || keccak256(code).toLowerCase() !== manifest.runtimeHashes[name].toLowerCase()) throw Error();
      return "Runtime bytecode matches reviewed hash";
    });
  }
  const abi = parseAbi(["function accountImplementation() view returns(address)", "function entryPoint() view returns(address)"]);
  await check("factory-link", async () => {
    const address = await client.readContract({ address: manifest.factory, abi, functionName: "accountImplementation", blockNumber });
    if (address.toLowerCase() !== manifest.accountImplementation.toLowerCase()) throw Error();
    return "Factory points to the expected implementation";
  });
  await check("entrypoint-link", async () => {
    const address = await client.readContract({ address: manifest.accountImplementation, abi, functionName: "entryPoint", blockNumber });
    if (address.toLowerCase() !== manifest.entryPoint.toLowerCase()) throw Error();
    return "Implementation points to the expected EntryPoint";
  });
  await check("bundler", async () => {
    if (!policy.bundlerUrl) throw Error();
    const url = new URL(policy.bundlerUrl);
    if (url.protocol !== "https:" && !(manifest.chainId === 31337 && url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) throw Error();
    async function rpc(method: string): Promise<unknown> {
      const response = await fetch(url, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params: [] }), signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw Error();
      const body = await response.json();
      if (body.error || body.result === undefined) throw Error();
      return body.result;
    }
    const chain = await rpc("eth_chainId");
    if (typeof chain !== "string" || !/^0x[0-9a-fA-F]+$/.test(chain) || BigInt(chain) !== BigInt(manifest.chainId)) throw Error();
    const supported = await rpc("eth_supportedEntryPoints");
    if (!Array.isArray(supported) || !supported.some(a => typeof a === "string" && a.toLowerCase() === manifest.entryPoint.toLowerCase())) throw Error();
    return "Bundler reports the correct chain and EntryPoint; operation simulation still required";
  });
  report.ready = checks.every(c => c.ok);
  return report;
}

export async function assertDeploymentReady(client: PublicClient, policy: DeploymentPolicy): Promise<void> {
  const report = await checkDeploymentReadiness(client, policy);
  if (!report.ready) throw new Error(`Deployment is not ready: ${report.checks.filter(c => !c.ok).map(c => c.name).join(", ")}`);
}
