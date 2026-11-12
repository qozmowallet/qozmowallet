# Qozmo DeFi workspace and wallet

## Routes and product scope

The existing landing page is at `/`; the real application is at `/dashboard/`. Landing-page wallet calls to action now open the app. Dashboard sections are Overview, My assets, Explore DeFi, Activity, Quantum Wallet, and Settings. Hash links preserve the selected section.

This release provides an everyday EVM account and a separate **Qozmo Quantum** smart account. The quantum core from the user-supplied local source is now integrated with its Robinhood Testnet deployment manifest, durable journals, encrypted archives, relay support and testnet ETH/ERC-20 sends. The conventional EVM account remains ECDSA. The optional local SLH-DSA proof laboratory does not authorize either account. See [the integrated quantum wallet](qozmo-quantum.md).

## Account creation and recovery

New accounts use 24-word English BIP-39 recovery phrases generated using the browser's cryptographic random source. Users reveal and record the phrase, then confirm three randomly selected word positions before a vault is saved. Standard BIP-39 phrases can also be imported; derivation uses `m/44'/60'/0'/0/0`. This is a standard EVM EOA, separate from the Qozmo Quantum smart account. No BIP-39 passphrase extension is supported by this interface.

Encrypted JSON backup import validates the complete format and decrypts it with the existing password before accepting it. The local vault is immutable: importing another account cannot silently overwrite an existing vault.

The vault uses WebCrypto PBKDF2-SHA-256 with 600,000 iterations and a random 16-byte salt, then AES-256-GCM with a fresh 12-byte IV. Version, identity, address, name, creation time, encryption parameters, and backup confirmation are authenticated as associated data. Unlocking verifies that the recovered phrase derives the authenticated public address. The password must have at least 12 characters. Only ciphertext and public account metadata are persisted.

Secrets exist in JavaScript memory while unlocked. Reloading, manual locking, page exit, cross-tab vault changes, and five minutes of inactivity clear the app's unlocked session. JavaScript does not guarantee erasure of every immutable string or runtime copy. This is a browser wallet; it is not a hardware wallet or an independently audited key-storage implementation.

## Supported networks

| Network | Chain ID | Balance reads | Native transfers |
| --- | --- | --- | --- |
| Robinhood Chain | 4663 | Yes | Disabled in this release |
| Ethereum | 1 | Yes | Disabled in this release |
| Base | 8453 | Yes | Disabled in this release |
| Arbitrum One | 42161 | Yes | Disabled in this release |
| Optimism | 10 | Yes | Disabled in this release |
| Polygon | 137 | Yes | Disabled in this release |
| Sepolia | 11155111 | Yes | Testnet only |
| Base Sepolia | 84532 | Yes | Testnet only |
| Robinhood Chain Testnet | 46630 | Yes | Testnet only |

Robinhood Chain mainnet is the default. Existing saved network preferences are preserved. A standard EVM account has the same address across these chains; balances are separate. Configured networks are not evidence of a quantum smart-account deployment.

The app uses public RPCs from the pinned Viem chain definitions and the official Robinhood endpoint. It verifies the RPC chain ID before balance, transaction, receipt, and inspector reads. RPC errors remain unavailable states and are not replaced with zero balances. Balance snapshots are pinned to a block. Test tokens are never assigned a real USD portfolio value. Mainnet ETH estimates use the live ETH/USD market quote; other native currencies have no invented fiat conversion.

## Multi-asset holdings

`lib/wallet/assets.ts` contains a curated issuer-contract registry, verified on 8 November 2026. Ethereum supports PAX Gold (18 decimals) and USDC (6). Robinhood Chain mainnet supports Apple, NVIDIA, Microsoft, Tesla, SPY and QQQ stock/ETF tokens (18), USDG (6) and WETH (18). Each asset is bound to a chain ID and contract address. These addresses are never reused on testnets; other networks have an explicit empty token catalog.

`fetchTokenBalances` verifies `eth_chainId`, selects one block and reads `balanceOf` individually for the selected network's contracts. Contract failures stay unavailable; successful zero balances stay zero. No assumed multicall deployment is required. The UI discards responses after an account/network switch and guards against showing another account's or chain's snapshot.

The Beyond crypto panel appears on Overview and My assets, including before wallet setup as a browsable asset catalog. Search and category filters cover Crypto, Stocks, ETFs, Gold and Stablecoins. Each row links to its contract on the selected network's explorer. An unlocked vault is not needed for public balance reads.

Balances display exact raw token units using issuer decimals. Robinhood stock tokens can have corporate-action multipliers; raw units are not underlying-share counts. No USD value is assigned from Kraken xStocks quotes because these are different issuer contracts. Token sends and approvals remain disabled.

Sources: [Robinhood registry](https://api.robinhood.com/rhj/assets), [Robinhood canonical contracts](https://docs.robinhood.com/chain/contracts/), [Robinhood stock-token units](https://docs.robinhood.com/chain/building-with-stock-tokens/), [Circle USDC contracts](https://developers.circle.com/stablecoins/usdc-contract-addresses), [Paxos PAXG examination](https://paxos.com/wp-content/uploads/2024/12/PAXG-Executed-Report.pdf).

## Transaction flow

Native testnet transfers follow recipient/amount entry → RPC validation and fee review → password confirmation → local signing → broadcast → receipt monitoring. The final review shows the exact amount with all decimal precision. Recipients, checksums, zero addresses, decimal format, precision, balance, nonce, gas, and network identity are validated. OP Stack estimates include an additional L1/operator fee budget.

A review expires after two minutes. Increased fees, changed nonces, or insufficient balances require a new review. The final signed transaction uses the reviewed chain, account, recipient, value, nonce, gas, and gas price with empty calldata. Mainnet broadcasting is rejected at the transaction-library boundary before RPC/signing, independent of the UI. No token approvals, arbitrary contract calls, ERC-20 transfers, bridges, or swaps are executed.

The browser coordinates submission with Web Locks. A response lost after broadcast is treated as uncertain: the locally computed hash is retained as pending, no automatic resubmission occurs, and the UI directs the user to the explorer. Activity reflects only transfers submitted from this browser. Incoming transactions and other-device history remain available through explorer links. Local activity is a convenience log, not a complete chain indexer.

## Quantum Lab

Quantum Lab uses `@noble/post-quantum`'s SLH-DSA-SHA2-256f implementation. It is a stateless, hash-based signature scheme incorporating Winternitz chains. It is separate from Winternitz Wallet's custom WOTS/Keccak-256 account-authorization protocol.

The full BIP-39 seed feeds HKDF-SHA-256 under the domain `qozmo/quantum-proof/slh-dsa-sha2-256f/v1`, producing the required 96-byte key-generation seed. The same domain is also the signature context. Expanding seed bytes does not increase the recovery phrase's original entropy.

A proof signs a fixed, canonical Qozmo message containing the contextual EVM address, chain ID, UTC creation time, and a fresh 32-byte nonce. Proof exports contain only public data: algorithm, public key, SHA-256 fingerprint, message, signature, and timestamp. Imported proofs are bounded and strictly parsed, then cryptographically verified. Parsing alone is not treated as successful verification.

“Local proof verified” means possession of the separate SLH-DSA private key. It does not authorize a transaction, independently prove EVM account ownership, establish an audited wallet, or protect assets held by the ECDSA account. The maintained library is used directly; this repository does not implement a new signature primitive.

## Qozmo Quantum smart account

The Quantum Wallet view supersedes the old read-only inspector. It offers fresh quantum account creation with a separate phrase, read-only phrase/archive import, receive address/QR, onchain key state, native/token transfer review and password confirmation, connected bundler or browser gas payer, exact-byte pending retry, execution-verified activity and encrypted known-history export. The beta is restricted at the adapter boundary to Robinhood Testnet (46630). Mainnet metadata is not signing authorization.

See [Qozmo Quantum integration and validation](qozmo-quantum.md) for authenticated vault metadata, locks, journal durability, immutable account installation, relay checks, fee/nonce review guards, source provenance and remaining limits. User-facing naming is Qozmo; original cryptographic wire domains and contract addresses remain unchanged for compatibility.

## Market and DeFi data

- Existing Kraken WebSocket quotes provide live crypto/RWA watchlist prices. They are never represented as the user's holdings.
- The market chart requests real Kraken OHLC data for the selected watchlist asset (including tokenized-asset queries for stock/ETF tokens) across 1 day, 1 week, or 1 month. A provider may not expose history or quotes for every asset/region; unavailable data stays visibly unavailable. The latest bucket may still be forming. Failures show an unavailable state rather than synthetic history.
- DeFi discovery shows public protocol TVL from DefiLlama and links to external protocol applications. It does not quote guaranteed returns or perform deposits/approvals.
- Browser network access is required for public data. RPC/provider availability, rate limits, regional restrictions, and CORS can affect retrieval.

## Checks

Run `npm run typecheck`, `npm test`, and `npm run build`. Tests cover derivation, encrypted backup round trips, wrong passwords and tampering, KDF bounds, persistence protections, transfer validation/review guards, mainnet blocking, and actual SLH-DSA signing/verification. No blockchain write or funded transaction is required for these tests.

## Primary references

- [Viem mnemonic accounts](https://viem.sh/docs/accounts/local/mnemonicToAccount)
- [Viem OP Stack fee calculation](https://viem.sh/op-stack/actions/estimateTotalFee)
- [Robinhood network configuration](https://docs.robinhood.com/chain/connecting/)
- [Winternitz documentation](https://www.winternitz.app/docs)
- [Winternitz developers](https://www.winternitz.app/docs/developers)
- [Winternitz security and recovery scope](https://www.winternitz.app/docs/security)
- [Noble post-quantum implementation](https://github.com/paulmillr/noble-post-quantum)
- [Kraken OHLC](https://docs.kraken.com/api-reference/market-data/get-ohlc-data)
- [DefiLlama API](https://github.com/DefiLlama/api-docs/blob/main/llms-free.txt)
