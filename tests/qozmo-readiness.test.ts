import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { keccak256, type PublicClient } from "viem";
import { checkDeploymentReadiness, parseDeploymentManifest, type DeploymentManifest } from "../lib/wallet/quantum-sdk/readiness.ts";
import { DETERMINISTIC } from "../lib/wallet/quantum-sdk/deployments.ts";

const runtime = { entryPoint: "0x01", factory: "0x02", accountImplementation: "0x03" } as const;
const manifest: DeploymentManifest = { ...DETERMINISTIC, chainId: 4663, deployBlock: 12,
  runtimeHashes: { entryPoint: keccak256(runtime.entryPoint), factory: keccak256(runtime.factory), accountImplementation: keccak256(runtime.accountImplementation) } };
function client(overrides = {}) {
  return { chain: { id: 4663 }, getChainId: async () => 4663, getBlockNumber: async () => 20n,
    getCode: async ({ address }: { address: string }) => runtime[(Object.keys(runtime) as (keyof typeof runtime)[]).find(k => manifest[k] === address)!],
    readContract: async ({ functionName }: { functionName: string }) => functionName === "entryPoint" ? manifest.entryPoint : manifest.accountImplementation,
    ...overrides } as unknown as PublicClient;
}
function bundler(t: TestContext, chain = "0x1237", points: string[] = [manifest.entryPoint]) {
  t.mock.method(globalThis, "fetch", async (_url: unknown, init: RequestInit) => {
    const method = JSON.parse(init.body as string).method;
    return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: method === "eth_chainId" ? chain : points }));
  });
}
const policy = { manifest, bundlerUrl: "https://bundler.test/private-token" };

test("read-only checks require matching code, links, chain and bundler", async t => {
  bundler(t);
  const report = await checkDeploymentReadiness(client(), policy);
  assert.equal(report.ready, true);
  assert.equal(report.blockNumber, "20");
  assert.equal(report.checks.length, 8);
  assert.ok(!JSON.stringify(report).includes("private-token"));
});

test("a wrong RPC chain stops before any contract checks", async () => {
  const report = await checkDeploymentReadiness(client({ getChainId: async () => 1, getCode: () => { throw Error("must not query"); } }), policy);
  assert.equal(report.ready, false); assert.equal(report.checks.length, 1);
});

test("missing/mismatched bytecode or implementation linkage blocks readiness", async t => {
  bundler(t);
  for (const overrides of [ { getCode: async () => undefined }, { getCode: async () => "0xff" }, { readContract: async () => manifest.factory } ]) {
    const report = await checkDeploymentReadiness(client(overrides), policy);
    assert.equal(report.ready, false);
  }
});

test("wrong bundler chain, unsupported EntryPoint and provider failures block readiness without leaking URLs", async t => {
  for (const [chain, points] of [["0x1", [manifest.entryPoint]], ["0x1237", []]] as const) {
    t.mock.restoreAll(); bundler(t, chain, [...points]);
    assert.equal((await checkDeploymentReadiness(client(), policy)).ready, false);
  }
  t.mock.restoreAll();
  t.mock.method(globalThis, "fetch", async () => { throw Error("https://bundler.test/private-token"); });
  const report = await checkDeploymentReadiness(client(), policy);
  assert.equal(report.ready, false);
  assert.ok(!JSON.stringify(report).includes("private-token"));
});

test("missing trust pins, deployment block, bundler and future deployment blocks fail closed", async () => {
  assert.throws(() => parseDeploymentManifest({ ...manifest, runtimeHashes: undefined }));
  assert.throws(() => parseDeploymentManifest({ ...manifest, deployBlock: 0 }));
  assert.equal((await checkDeploymentReadiness(client(), { manifest })).ready, false);
  assert.equal((await checkDeploymentReadiness(client(), { ...policy, manifest: { ...manifest, deployBlock: 50 } })).ready, false);
});
