import type { Address } from "viem";
import { ENTRYPOINT_V07 } from "./account.ts";

export type Deployment = {
  chainId: number;
  entryPoint: Address;
  factory: Address;
  accountImplementation: Address;
  simpleAccountFactory?: Address;
  deployBlock?: number;
};

/**
 * Where script/Deploy.s.sol puts the contracts on any chain with the canonical EntryPoint v0.7:
 * deterministic CREATE2 (salt "winternitz.v1"), so the addresses are known before deployment.
 * Pinned by contracts/test/DeterministicAddresses.t.sol: if the bytecode changes, that test
 * fails and these must be updated.
 */
export const DETERMINISTIC = {
  entryPoint: ENTRYPOINT_V07,
  factory: "0xBe3a0B5f698a4F83C7679aAe7E7743D5E3d2F468",
  accountImplementation: "0xcCBA0b7B10f809e8f3B3C1e9835acDeEdC020c39",
  simpleAccountFactory: "0x804B16c10153467c4bF15AA900BF69c13A4ceB8c",
} as const satisfies Omit<Deployment, "chainId">;

/**
 * Deployments per chain. Wallets can be created and funded before the factory is deployed
 * (addresses are computed locally); sending needs it on-chain. Local chains are read from
 * contracts/deployments/31337.json instead.
 */
export const deployments: Partial<Record<number, Deployment>> = {
  // Confirmed deployment: contracts/deployments/46630.json; benchmark factory was not deployed.
  46630: {
    chainId: 46630,
    entryPoint: DETERMINISTIC.entryPoint,
    factory: DETERMINISTIC.factory,
    accountImplementation: DETERMINISTIC.accountImplementation,
    deployBlock: 137245774,
  }, // Robinhood Chain testnet
  // Confirmed deployment: contracts/deployments/4663.json. Benchmark factory was not deployed.
  4663: {
    chainId: 4663,
    entryPoint: DETERMINISTIC.entryPoint,
    factory: DETERMINISTIC.factory,
    accountImplementation: DETERMINISTIC.accountImplementation,
    deployBlock: 90623148,
  }, // Robinhood Chain mainnet
  11155111: { chainId: 11155111, ...DETERMINISTIC }, // Sepolia
  84532: { chainId: 84532, ...DETERMINISTIC }, // Base Sepolia
  421614: { chainId: 421614, ...DETERMINISTIC }, // Arbitrum Sepolia
};
