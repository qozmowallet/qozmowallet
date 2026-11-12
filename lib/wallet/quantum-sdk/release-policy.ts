/**
 * User-facing beta policy. SDK primitives remain available for isolated research
 * and local tests; applications must enforce this boundary before any side effect.
 * There is deliberately no environment-variable override for a published build.
 */
export const BETA_RELEASE_NETWORK = "robinhood-testnet" as const;
export const BETA_RELEASE_CHAIN_ID = 46630 as const;
export const BETA_RELEASE_NAME = "Robinhood Testnet beta" as const;

export const BETA_RELEASE = Object.freeze({
  network: BETA_RELEASE_NETWORK,
  chainId: BETA_RELEASE_CHAIN_ID,
  name: BETA_RELEASE_NAME,
  testFundsOnly: true,
  recoveryActivation: false,
  features: Object.freeze({
    create: true,
    receive: true,
    send: true,
    erc20: true,
    history: true,
    pendingTransactions: true,
    encryptedBackup: true,
    readOnlyImport: true,
    swap: false,
    bridge: false,
    nativeAccounts: false,
    privacy: false,
    sponsorship: false,
    xmss: false,
    managedVaults: false,
  }),
});

export function isBetaNetwork(value: unknown): value is typeof BETA_RELEASE_NETWORK {
  return value === BETA_RELEASE_NETWORK;
}

export function assertBetaNetwork(value: unknown): asserts value is typeof BETA_RELEASE_NETWORK {
  if (!isBetaNetwork(value)) {
    throw new Error("This beta supports Robinhood Testnet (46630) only. Existing wallets and signing history must remain on their original network.");
  }
}

export function assertBetaChainId(value: unknown): asserts value is typeof BETA_RELEASE_CHAIN_ID {
  if (value !== BETA_RELEASE_CHAIN_ID) {
    throw new Error("This beta accepts transactions on Robinhood Testnet (46630) only.");
  }
}
