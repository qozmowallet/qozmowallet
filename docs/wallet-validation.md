# Qozmo dashboard — validation record

Date: 8 November 2026

This record describes verification completed for the EVM dashboard release and the limits of that verification.

## Multi-asset update — 8 November 2026

The current update passes **40 tests**, `npm run typecheck`, and `npm run build` (static landing and dashboard export). Six additional tests cover market quote validation/categories and chain-bound ERC-20 reads, exact decimals, pinned blocks, wrong-chain rejection and unavailable contract responses. Existing cryptographic, transfer and activity suites remain passing.

Live read-only RPC verification used the public Hardhat fixture address `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`. Ethereum PAXG/USDC reads succeeded at block 26,370,788; Robinhood Chain AAPL/NVDA/MSFT/TSLA/SPY/QQQ/USDG/WETH reads succeeded at block 109,298,603. Each result was a valid zero balance, with no fabricated holding. Robinhood `eth_chainId` returned 4663 and USDG `decimals()` returned 6. No transaction was signed or broadcast.

Native Chrome inspection verified the eight-row Robinhood catalog, ETF filter, Ethereum network switch, Ethereum gold filter, contract explorer links, eleven live Kraken watchlist quotes, and the landing phone's expanded scrollable asset section. Browser verification did not create or unlock a wallet, submit a transfer, or perform a fresh mobile-viewport audit. Unit tests and live fixture RPC reads cover the new balance library; a complete browser create/unlock/send flow remains outside this update's verification.

## Previous dashboard release checks

`npm test` completed with **34 passing tests**.

| Suite | Passing tests |
| --- | ---: |
| Encrypted vault and recovery | 11 |
| Chain and transfer validation | 9 |
| Local quantum identity and proofs | 9 |
| Activity reconciliation and persistence | 5 |
| **Total** | **34** |

The latest `npm run build` completed successfully, including TypeScript validation and the static `/dashboard` route. Actual cryptographic operations were exercised by the unit tests.

## Network and browser checks

| Area | Verified result |
| --- | --- |
| Sepolia | Read-only RPC balance retrieval and native-transfer fee preparation succeeded. |
| Base Sepolia | Read-only RPC balance retrieval and native-transfer fee preparation succeeded. |
| Robinhood Chain Testnet | Read-only RPC balance retrieval and native-transfer fee preparation succeeded. |
| Desktop dashboard | Live Kraken quotes, Kraken OHLC data, DeFi TVL, network switching, asset search, and filters were checked. |
| Mobile dashboard | Layouts at 360 px and 390 px were checked without horizontal overflow. Mobile menu focus restoration was checked. |

RPC checks used the public Hardhat development fixture. **No transaction was signed or broadcast during these checks.** The fixture is test material, not a wallet intended to hold funds.

## Browser verification limit

The managed browser preview used HTTP, where `crypto.subtle` was unavailable. Wallet creation correctly remained blocked by the secure-context requirement.

A complete **HTTPS browser create → unlock → send workflow was not tested end to end**. The unit tests verify the underlying cryptographic operations, while the browser checks above verify the available dashboard interactions. Testnet native-transfer submission is implemented, but no live signed transfer was submitted as part of this validation.

## Capability and security boundaries

- **Mainnets:** read-only in this release.
- **Testnets:** native-token transfer preparation and submission are implemented; the live verification above covered balances and fee preparation.
- **Quantum Lab:** SLH-DSA proofs are generated and verified locally. EVM funds remain authorized by standard ECDSA accounts. A local quantum proof does not add onchain protection.
- **Winternitz inspector:** reads contract information only. Onchain post-quantum activation still requires the official SDK, reviewed deployment integration, and bundler integration.
- **Audit status:** this release makes no independent security-audit claim.

Production readiness should be assessed against these boundaries and the outstanding HTTPS browser workflow verification.

## Light-theme brand update

The user-supplied stag emblem was adapted with transparent background, charcoal silhouette, and mauve–rose ribbon. The shared logo, legacy preview logo, favicon/touch icons, and social image were updated. The production build passed after these changes. Landing and dashboard branding loaded correctly on desktop and a 360px mobile frame (345px content width with scrollbar), with no horizontal overflow. Landing “Open wallet” navigation was verified. Screenshots are `qozmo-preview.jpg` and `qozmo-dashboard-preview.jpg`.

## Rounded glass navigation update

The landing navbar and dashboard topbar now use rounded floating surfaces, with glass styling activated after 24 px of page scroll. Production build and its TypeScript checks passed, and the local landing route returned HTTP 200. Browser visual QA could not be completed in this update because the native Chrome automation connection repeatedly timed out; no new screenshot or mobile interaction verification is claimed.

## Qozmo Quantum smart-account integration — 8 November 2026

The final suite passes **85 tests**, with zero failures. Production static build and its TypeScript checks passed. The tests include the integrated source's WOTS known answers, signature tampering, recovery payload/domain validation, deployment guards and canonical execution receipts, plus Qozmo's authenticated quantum vault, concurrent signer exclusion, failed/missing persistence, immutable account installation, read-only imports, review expiry/identity, exact ETH/ERC-20 calls, changed nonce/fee rejection, false-returning ERC-20 rejection before deployment, and byte-identical retry after simulated submission uncertainty.

A read-only check against the public Robinhood Testnet RPC matched chain 46630, deployment block, three runtime hashes and both factory/EntryPoint links at block **150,471,148**. No newly funded live transaction was signed or broadcast. The local dashboard returned HTTP 200; the quantum onboarding component also rendered with Qozmo branding and separate creation/import controls. Native browser interaction QA was not completed because the browser was actively being changed by the user; no end-to-end browser create/unlock/fund/send or fresh mobile visual verification is claimed.

The current integration supersedes historical entries above describing onchain smart-account integration as pending. Qozmo Quantum now provides its own testnet workspace, while mainnet quantum signing and restored-account spending remain blocked. See [the current integration guide](qozmo-quantum.md).
