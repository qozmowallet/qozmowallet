# Qozmo multichain extension

Version 0.7.0 adds native Solana Devnet and Bitcoin Signet accounts to the same extension as Qozmo Quantum. The network picker changes the active account view; it does not bridge assets or move funds.

| Account | Network | Authorization | Recovery |
| --- | --- | --- | --- |
| Qozmo Quantum | Robinhood Testnet, chain 46630 | WOTS smart account / ERC-4337 | Separate Quantum phrase, encrypted archive and original signing history; restored accounts remain read-only |
| Native SOL | Solana Devnet | Standard Ed25519 | Standard Qozmo EVM vault, path `m/44'/501'/0'/0'` |
| Native BTC | Bitcoin Signet | Standard ECDSA / native SegWit P2WPKH | Standard Qozmo EVM vault, path `m/84'/1'/0'/0/0` |

WOTS is exclusive to Robinhood Quantum. Native SOL and BTC are not labeled quantum resistant. The standard vault derives separate EVM/Solana/Bitcoin keys and addresses from its standard BIP-39 phrase; the Quantum seed is never automatically reused. A Bitcoin address cannot receive SOL, and a Quantum address cannot receive native BTC. A ticker does not establish an asset's chain or token issuer.

## Open and receive

1. Update the existing unpacked extension folder and select Reload in Chrome. Do not uninstall the previous wallet. Chrome 137+ is required for native Ed25519 WebCrypto support. Version 0.7.0 adds host access to `api.devnet.solana.com` and `mempool.space` for native network requests.
2. Open the network picker and choose Quantum / Robinhood Testnet, Solana / Devnet or Bitcoin / Signet. Changing networks locks the current context. The initial view remains Quantum unless a native network is explicitly requested in a local page URL.
3. For SOL or BTC, unlock the existing standard EVM vault with its standard password. If there is no standard vault, create or import one. Do not use the Quantum phrase in standard wallet setup. An encrypted standard backup can restore the documented paths without changing the old vault format.
4. Select Receive. Confirm the complete address and network label. The QR contains the address; it does not perform a bridge or choose the sender's network. Use test funds only.

## SOL transfer

Enter a standard, on-curve Solana recipient and a positive amount with at most nine decimal places. This release supports ordinary System Program SOL accounts, not arbitrary program/PDA transfers. Qozmo checks the Devnet genesis hash, balance, sender/recipient account owners, recent blockhash, fee quote and unsigned simulation. A transfer that fails simulation never reaches the signature step.

The review shows network, sender, recipient, amount and network fee. It expires after two minutes and is bound to the exact compiled message. After the owner confirms the standard password, Qozmo repeats the balance, expiry, simulation and fee checks, signs locally with Ed25519, saves the signed bytes, and submits with RPC preflight enabled. A response containing the signature means submitted; confirmation is checked separately in Activity. No priority fee or fee sponsor is configured for this testnet release.

## BTC transfer

Enter a lowercase Signet native SegWit (`tb1q`) or Taproot (`tb1p`) destination and a positive amount with at most eight decimals. The minimum transfer is 546 sats. Select a fee rate of 1–100 sat/vB or request the Signet estimate. The sender is a native SegWit P2WPKH account.

Qozmo pins the Signet genesis hash, lists UTXOs, selects confirmed inputs, decodes the actual parent transactions locally, and verifies each selected output's transaction ID, amount, script ownership, confirmation and unspent status. Coinbase inputs must have 100-block maturity. A bounded P2WPKH size estimate sets the fee budget; the exact total fee and change are shown before approval. The final signed transaction must fit that budget. A change output below 546 sats is omitted and its value is included in the reviewed fee.

The fee cap is 100,000 sats, with at most 20 selected inputs and 100 listed UTXOs. Change returns to the same first Signet address. Only the reviewed PSBT can be signed after password confirmation and rechecking inputs. A returned transaction ID means submitted; confirmed status is checked separately. Native balance and status responses are reported by the configured service, not independently verified with a local full node/SPV client.

## Backups, history and interruption

- Export the encrypted **standard backup** from a native account's Security screen. Its existing AES-256-GCM/PBKDF2 format is shared with the EVM vault. Keep the standard phrase/password separately from the Quantum phrase/password/archive.
- The first Solana account and first Bitcoin receive/change address are supported. Other derivation paths, BIP-39 passphrases, additional Bitcoin addresses and account discovery are not implemented. Importing a phrase does not scan another wallet's whole address history.
- Public native outbox records are scoped to network and sender, separate from the vault and the WOTS journal. They contain signed transaction bytes, IDs, recipient, amount and fee; they never contain a recovery phrase, private key or password. The outbox retains up to 50 transactions and does not silently prune unresolved history.
- A browser lock coordinates preparation/submission across extension contexts. Signed bytes must be saved successfully before broadcast. If the service response is lost, the entry stays signed/uncertain. No new transfer is allowed for that native account until its existing operation is resolved. This release checks status and exports history; it never automatically rebroadcasts or discards an uncertain transaction.
- Activity shows outgoing transactions created by this installation, not a full incoming or externally-created transaction index. Unknown status is not success. Solana processed status is not treated as confirmed.
- Each context locks when hidden (side panel), closed, switched to another network, or idle for five minutes. No unlocked seed is passed to the background worker. The extension and website have different storage origins.

## Scope and validation

Native mainnet signing, SPL/Token-2022 transfers, Bitcoin tokens, swaps, staking, bridging and dapp provider injection are not included. Quantum ETH/ERC-20 behavior and its WOTS deployment/history guards remain independent. Adding a new network requires a new validated adapter, account derivation, review and receipt implementation; adding a token symbol alone cannot enable native transactions.

`tests/multichain.test.ts` uses published BIP-39 development vectors and mocked RPC/indexer services only. It verifies native address vectors, signed SOL/BTC bytes, reviewed outputs/fees, simulation/network failures, UTXO ownership/maturity/spend checks, review expiry, cancellation, durable storage and ambiguous broadcasts. These tests are not evidence of a funded on-chain transaction from an installed extension. No funded native operation was submitted while implementing this feature.

`tests/multichain-ui.test.ts` runs the real account picker and native controller in an isolated in-memory DOM, with a published development phrase and fully mocked services. It checks unlock/balance reads, SOL/BTC receive addresses and exact reviews, network switching that locks the session, and a late balance response after hiding the panel. It does not access the user's browser, wallet profile or live services. These are component tests, not visual browser QA; browser access was unavailable during this release's visual check.

## Implementation and primary references

- `lib/wallet/multichain/`: pinned native networks, account derivation, bounded transport, SOL/BTC transaction adapters and outbox.
- `components/extension-wallet.tsx`: common network picker and account boundary.
- `components/native-extension-wallet.tsx`: standard-vault unlock, balances, receive, send/review, history and backup UI.
- [Solana transactions](https://solana.com/docs/core/transactions), [simulation RPC](https://solana.com/docs/rpc/http/simulatetransaction), [SLIP-0010](https://github.com/satoshilabs/slips/blob/master/slip-0010.md).
- [Bitcoin Signet specification](https://github.com/bitcoin/bips/blob/master/bip-0325.mediawiki), [Bitcoin PSBT guide](https://github.com/bitcoin/bitcoin/blob/master/doc/psbt.md), [scure transaction signer](https://github.com/paulmillr/scure-btc-signer).
