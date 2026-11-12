# Qozmo Quantum

Qozmo Quantum integrates the WOTS smart-account core from the supplied local project into Qozmo's dashboard. Open `/dashboard/#quantum`, select **Open Robinhood Testnet workspace**, then create or import a quantum account. The product UI uses Qozmo naming; technical source attribution, cryptographic domains and deployment constants remain intact.

## Working flows

- Generate a fresh 32-byte seed and its 24-word BIP-39 representation, save it offline and confirm three randomly selected word positions before installation.
- Encrypt a separate quantum account with a password of at least 12 characters. The everyday EVM vault is not overwritten or reused as a quantum seed.
- Receive test ETH/ERC-20 at the deterministic smart-account address, including before its first onchain deployment.
- Read account balance, deployment state, signing/recovery indices and known local exposure records.
- Connect an ERC-4337 v0.7 bundler or an injected browser wallet acting as the gas payer. The quantum seed is never passed to the gas-payer wallet.
- Review an exact ETH/ERC-20 transfer, recipient, token contract, network, deployment requirement and maximum account fee. Confirm with the quantum password.
- Sign once, persist the complete signed operation before submission, and verify the EntryPoint execution event and canonical receipt separately from key rotation.
- Retry an unresolved operation using its identical stored bytes. No automatic resubmission or second signature is generated.
- Export an encrypted archive with seed, account salt and known signing history. Import a compatible source archive or Qozmo archive with its password, or import a 24-word phrase, always read-only.

The first transfer deploys the account through its pinned factory. A receive address alone does not imply that the account is deployed. ETH for account deployment and operation fees must be held at the quantum address. A browser gas payer separately reviews/fronts the outer transaction gas through its extension.

## Network and contract policy

The adapter restricts signing/submission to **Robinhood Testnet, chain 46630**. It does not deploy new protocol contracts or enable source research/mainnet features. The imported public manifest is `lib/wallet/quantum-deployment.json`.

| Contract | Address |
| --- | --- |
| EntryPoint v0.7 | `0x0000000071727De22E5E9d8BAf0edAc6f37da032` |
| Account factory | `0xBe3a0B5f698a4F83C7679aAe7E7743D5E3d2F468` |
| Account implementation | `0xcCBA0b7B10f809e8f3B3C1e9835acDeEdC020c39` |

Before transaction preparation/confirmation/retry, Qozmo checks RPC chain identity, recorded deployment block, all three runtime bytecode hashes, factory implementation linkage and implementation EntryPoint linkage. Wrong or unavailable infrastructure blocks signing. A configured Ethereum or Robinhood mainnet entry in the everyday wallet is not quantum signing authorization.

The static app needs no embedded provider credential. An operator/user can connect a session-only HTTPS bundler endpoint that allows browser CORS and supports chain 46630 and the pinned EntryPoint. The connection checks both independently. Endpoint URLs are held in component memory, entered using a masked field, cleared on lock and excluded from persisted vaults/backups. Provider errors are reduced before display. A server-side Qozmo gateway can be added separately; this integration does not forward to the source project's hosted gateway or copy its secrets.

The browser gas-payer alternative requests accounts only after the user chooses it, asks the extension to switch to Robinhood Testnet, verifies its reported chain, and uses the supplied SDK's self-relay submitter. It does not use a bundled relayer private key.

## Account and journal storage

The Qozmo quantum record is independent from `qozmo.wallet.vault.v1`, under `qozmo.quantum.account.v1`. Its seed is encrypted using WebCrypto PBKDF2-SHA-256 (600,000 iterations, fresh 16-byte salt) and AES-256-GCM (fresh 12-byte IV). Account ID, chain, address, name, genesis commitments, salt, creation time and restored/read-only policy are authenticated as additional data. Unlocking derives both commitments and the CREATE2 address again. Editing a restored flag or another authenticated field fails decryption.

Signing records use `qozmo.quantum.journal:<chain>:<initial-commitment>`. Same-origin Web Locks serialize operations and journal access. Every signature's exact operation is saved and read back before it can leave the signer. Missing or malformed journals fail closed; there is no fallback to an empty in-memory journal. Previously retained compatible source namespace journals are considered for known cross-network exposure conflicts. Installation never replaces an existing quantum vault or silently discards its history.

The Qozmo archive wraps the compatible original encrypted recovery format under `qozmo-quantum-backup`. Original wire-format labels and authenticated domains are preserved for interoperability. Archives contain known history only; they do not establish complete, fresh or globally synchronized history. Imported phrase/archive accounts are re-encrypted with an authenticated read-only policy. No UI or adapter clears it.

Manual quantum lock, route/network exit, page exit, changed vault storage and five minutes of inactivity invalidate the quantum session. The dashboard's global wallet-lock action also emits a quantum lock. Abort/generation checks discard stale UI results and stop submission after a lock before broadcast. If a key was already signed, its exposure remains in the journal. JavaScript cannot guarantee erasure of all immutable strings or copies, and browser storage cannot provide a hardware-backed anti-rollback guarantee.

## Transfer and receipt checks

Reviews are process-local objects, frozen and registered at preparation, valid for two minutes, and bound to the originating account. ETH amounts retain 18 decimal digits; token decimals/symbol/balance are read from the selected testnet token contract at a single block. Tokens remain labeled unverified. Calls are restricted to native sends or ERC-20 `transfer`; no arbitrary approval/call builder is exposed.

Confirmation decrypts the vault with the password again, verifies current account/policy and deployment, reconciles pending exposure, prepares a fresh fee/nonce comparison and repeats balance/execution checks. Changed nonce, deployment or increased gas/fee requirements invalidate the review before any signature is released. A token that explicitly returns false is rejected even before first account deployment. The originally reviewed operation is signed, not a silently modified request.

A rotated key is consumed even when execution reverts. Activity labels successful/reverted execution only from verified EntryPoint `UserOperationEvent` data and canonical transaction/block evidence. A consumed key without a verified receipt stays an unresolved execution state. A relay timeout retains the signed operation, and exact retry uses its existing signature and fee fields. No signed bytes are dropped to make a new operation appear sendable.

## Source and validation

Fourteen core modules were copied from `/Users/imrybrndo/Desktop/ethereum/winternitz/sdk/src`, whose source checkout reports revision `42721b4f50ef6e48291a8de862fa76e9b570d42d`. Per-file source worktree SHA-256 hashes and ESM import adaptations are recorded in `lib/wallet/quantum-sdk/provenance.json`. The source project is not modified. Cryptographic derivation, operation encoding and contract constants are preserved. The installed noble/scure packages use `.js` subpaths; known-answer tests verify compatibility.

The final suite has **85 passing tests**; production build and TypeScript checks passed. Validation includes WOTS known-answer and bit-tampering checks, source recovery/receipt/deployment suites, Qozmo authenticated-vault checks, concurrent signer exclusion, write-ahead failures, immutable installation, read-only restores, exact ETH/ERC-20 review calls, expired/forged review rejection, changed nonce/fee rejection and byte-identical ambiguous-submission retry. `tests/fixtures/quantum-runtime.json` contains public runtime bytecode used to test the adapter offline against the actual manifest pins.

The onboarding component rendered with Qozmo naming and the local dashboard responded HTTP 200. Full browser interaction QA was not completed because the user was actively changing the browser.

The live read-only deployment check on 8 November 2026 matched all seven infrastructure checks at Robinhood Testnet block **150,471,148**. It did not sign or broadcast a transaction. This integration has not performed a newly funded browser transfer, an independent audit, or a production/mainnet release.

## Remaining boundaries

This is an unaudited test-funds prototype. Independent quantum authorization does not protect the chain consensus, browser, relay or device. Cloned/rolled-back browser state and missing exposure history remain fundamental one-time-signature risks; retain one original signing device and new archives after signing. Lost-device spending recovery stays blocked. XMSS, privacy, swaps, bridges, sponsorship and other source research modules are outside this focused integration. The optional SLH-DSA proof lab remains available separately and cannot authorize the WOTS smart account.
