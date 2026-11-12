# Recovery research and product tools

Implemented locally on 10 November 2026 (Asia/Makassar). This change adds usable offline cryptographic research tools and everyday wallet features. It does **not** implement lost-device spending recovery for deployed WOTS accounts, deploy a new contract, publish a gateway, complete an audit, or perform a funded transaction.

## Where to find the features

| Route | Behavior |
| --- | --- |
| `/dashboard/#recovery` | Current account boundary, authenticated archive inspection without import, public inspection/readiness downloads |
| `/recovery/` | Standalone four-step recovery research workbench; no market feed or RPC requests |
| `/dashboard/#activity` | Existing local submission log plus paginated explorer history and CSV export |
| `/dashboard/#payments` | Native payment requests, QR/URI/link export, explicit transaction-hash verification |
| `/dashboard/#quantum` | Qozmo gateway option in addition to custom bundler and browser gas payer; expanded transfer-impact review |

## Chosen recovery direction

The owner retains an **independent offline stateless recovery authority** using SLH-DSA-SHA2-256f from the existing pinned `@noble/post-quantum` dependency. The public standard is [NIST FIPS 205](https://csrc.nist.gov/pubs/fips/205/final). Use of this algorithm is not certification or independent review of Qozmo.

The recovery authority is generated from fresh 32-byte cryptographic entropy, not from the EVM phrase, WOTS phrase or replacement seed. HKDF-SHA256 expands that entropy to the library's 96-byte key-generation input under `qozmo/recovery-rehearsal/slh-dsa-sha2-256f/v1`; expansion does not add entropy. This avoids introducing another cloned **stateful recovery signing counter**. It does not solve cloned normal WOTS signing state, stolen recovery credentials, compromised devices or loss of every credential.

### What the workbench actually does

1. On an isolated offline device, generate a research authority for a testnet account. Download the private encrypted kit and a separate public identity. Keep the kit password separately. The public identity contains no ciphertext or private key.
2. On the proposed replacement device, import only the public identity and generate a fresh candidate. Download its encrypted seed file and public request. Neither is installed into the existing wallet.
3. Move the request to the offline device. Import the encrypted authority kit, inspect the request, and sign that exact request with the kit password. Export only the research approval to the replacement device.
4. Verify the approval against the original retained request and an independently retained authority fingerprint. Optionally decrypt the candidate to check its WOTS root and authenticated request commitment. Nothing in this flow calls a signer installer, contract recovery function or broadcast API.

The tools are a rehearsal for a future account version. **Do not replace existing wallet phrases, journals or backups with this kit.** No enrollment exists for the current account. Possession of a kit or a valid approval is not evidence of ownership of an onchain account.

Kit/candidate secrets use PBKDF2-SHA256 (600,000 iterations, fresh 16-byte salt) and AES-256-GCM (fresh 12-byte IV). Format, kind, account, chain, public key, commitment and KDF identifier are authenticated as associated data. Files are bounded before expensive work. A candidate uses fresh randomness and an account/chain/namespace-bound derivation, and its ciphertext authenticates the complete request commitment. No recovery secret is automatically persisted by the workbench. Passwords clear after operations; leaving/hiding the page discards retained UI state. Mutable key buffers are cleared where possible; JavaScript cannot guarantee erasure of every runtime copy.

### Exact approval scope

Canonical JSON has the explicit ordered fields in `parseRecoveryIntent`: version, `research-only-no-activation` purpose, chain 46630, checksummed account, authority public key, hypothetical epochs 0 → 1, fresh namespace, replacement signing root, random nonce, creation and expiry. A request lasts at most 24 hours. The signature uses the separate SLH-DSA context above. Verifying requires exact equality with the original request and its separately trusted public-key fingerprint. Unknown fields, expired requests, changed account/chain/epoch/root/nonce and substituted fingerprints fail.

Epochs in these files are **research values**, not observations of deployed contract state. The verifier is intentionally stateless and does not establish one-time onchain consumption, finality, ownership, enrollment, authority retirement or permission to spend. A research approval is reusable as a verification artifact during its validity window; it is never sent as an executable transaction.

### Protocol work required for actual recovery

A new reviewed account/factory version must establish all of the following before any activation path can be implemented:

- Enrollment of the independent authority at account creation, with an explicitly pinned stateless verifier and immutable authority policy. An ordinary compromised transaction key must not silently replace or disable that authority.
- A versioned signing namespace and unambiguous pre-address derivation identity. Do not derive genesis commitments from a final CREATE2 address that itself depends on those commitments.
- Domain binding of account, chain, EntryPoint, implementation, active authority epoch, recovery nonce, replacement root/namespace, successor authority policy and expiry. Current research files are not the final contract wire format.
- Atomic retirement of the old signing/recovery namespace, replay rejection and explicit treatment of pending operations. Check the authorized epoch again **during execution**, including operations validated before cutover by ERC-4337. Cover every execution and module path; a validation-only check is insufficient.
- Fresh replacement secret custody, quarantine until the canonical cutover satisfies a documented finality policy, and reorg handling that preserves all known exposures. Imported old backups never become new signing authority.
- Stateless-verifier correctness vectors, realistic gas/bundler admission measurements for 49,856-byte signatures, contract/client correspondence tests, adversarial cutover schedules and independent security review. No dummy verifier or ECDSA fallback is provided here.

Existing legacy account addresses cannot acquire these rules through a frontend update. Recovery also cannot reverse assets already spent before cutover. All gates in `RECOVERY_RELEASE_GATES` remain false.

### Existing archive inspection

`inspectQuantumBackup` authenticates/decrypts a compatible archive using existing strict backup parsing and WOTS signature checks. It compares deployment identity, account and retained local signed bytes under the existing journal lock. Results distinguish different deployment/account, no local comparison, missing local history, conflicting exposure and agreement with **known local history only**. Returned summaries exclude seeds, passwords, signatures and calldata. Inspection never installs a vault, modifies a journal or changes read-only import policy. Agreement cannot establish complete global history or freshness across devices.

## Explorer history

Sync is explicit. The browser queries a chain-specific Blockscout account API; if `NEXT_PUBLIC_QOZMO_GATEWAY_URL` is set, requests go through the Qozmo gateway instead. This discloses the queried public account to the provider. Normal transactions, internal transfers and ERC-20 events have independent pagination/error states. Failed categories remain visibly unavailable; a failed refresh preserves previously loaded rows. Each request loads up to 100 records per category. Load more until each category is exhausted.

The interface exports the currently filtered **loaded** rows as CSV with formula-injection protection and exact decimal formatting. Native and internal transfers are separate records, not a portfolio sum. Native transactions have stable hash identities; token/trace identifiers use provider indices when available. Pagination is not a chain-wide snapshot: new activity during pagination can shift pages, and providers may omit or limit indexed data. NFT activity, validator withdrawals and comprehensive UserOperation indexing are outside this view. Unsupported/rate-limited/CORS-blocked providers remain unavailable; neither empty history nor complete chain coverage is inferred from an error. Indexer status is explicitly not independently verified chain evidence.

## Payment requests

Native requests encode the exact integer wei amount and chain in an [ERC-681 URI](https://eips.ethereum.org/EIPS/eip-681), with a matching QR and a Qozmo link. Links include public invoice metadata and no signing secret. Requests are unsigned instructions and do not authenticate a merchant. Mainnet payment receiving instructions do not enable mainnet sending in Qozmo.

Each local request has an immutable UUID, recipient, chain, amount, label and validity interval (at most 30 days). The UI currently offers 1 hour, 24 hours or 7 days. Up to 100 requests are stored per browser; concurrent writes use Web Locks. Malformed storage is preserved and reported rather than overwritten.

Payment matching is explicit by transaction hash. RPC verification requires the right chain, successful receipt, exact recipient and native amount, empty calldata, matching transaction/receipt block hash, canonical block and at least three confirmations. The mined timestamp must be within the invoice window. One transaction can be assigned to only one invoice per chain in this browser. Three confirmations are not a guarantee of irreversible finality. The saved result is a dated observation; recheck after reorgs or on another browser. Failed rechecks remove the local verification observation.

Internal smart-account transfers and ERC-20 payments are deliberately not matched by this first invoice verifier. There is no automatic debit, automatic transaction signing, cross-browser invoice ledger or independent merchant identity service.

## Transaction review

Both EVM and Quantum review screens show the amount, fee reserve and arithmetic projected remaining balance. Self-transfers and token fee separation are handled explicitly. Quantum review also exposes the existing pinned-block execution check, including unavailable pre-deployment simulation. Projection is not a guarantee: nonstandard tokens, network changes and actual fee settlement can differ. Existing password confirmation, two-minute review expiry, nonce/balance/fee rechecks, read-only restore guard and testnet-only signing gates remain enforced.

## Qozmo gateway

The browser remains a static export. `scripts/gateway.mjs` is a separate Node 22/24 service. Provider credentials must exist only on that service.

Local setup:

1. Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_QOZMO_GATEWAY_URL=http://127.0.0.1:8787` for browser builds/dev. Set `QOZMO_BUNDLER_URL` locally to your credentialed HTTPS ERC-4337 provider supporting chain 46630 and EntryPoint v0.7. Never paste that credential into chat or a `NEXT_PUBLIC_*` variable.
2. Run `npm run gateway` in one terminal and `npm run dev -- --port 3001` in another. Restart/rebuild the frontend after changing public configuration.
3. Quantum Wallet → Qozmo bundler → Check and connect. The service does not become ready without a valid provider. There is no hosted service or free-gas claim.

Production should route the same-origin `/api/qozmo/*` prefix to the gateway's root endpoints, or set an HTTPS gateway URL and its exact allowed frontend origin. The built-in listener binds loopback; put an appropriate reverse proxy in front of it. Keep TLS, secret storage, provider quotas, trusted proxy configuration and edge abuse controls in the deployment environment. CORS is not authentication. The in-process per-IP limit is 90 requests/minute and is not a replacement for edge controls, especially behind a proxy. No forwarded client IP is trusted automatically.

Endpoints:

- `GET /health`: `not-configured`, ready, wrong-network/EntryPoint or unavailable.
- `GET /history`: fixed chain host, address, one of three account actions and bounded page. No user-selected upstream URL.
- `POST /bundler`: one JSON-RPC request, fixed method allowlist, expected EntryPoint, 160 KB body limit, bounded upstream responses, 12-second timeout and redacted provider errors. Signed/estimated operation forwarding rechecks provider chain/EntryPoint first. There is no automatic retry of submissions or silent relay fallback.

The gateway holds no signing seed or relayer private key. UserOperation calldata/signatures pass through it for intended forwarding but are not logged. This is a bundler proxy, not a gas sponsor or a replacement for client-side deployment and signing guards. A transport failure after forwarding may be ambiguous; preserve the client's write-ahead journal and use exact-byte retry.

## Validation scope

Tests cover recovery cryptography/encrypted artifacts and domain substitution, no-install archive inspection, history parsing, exact payment amounts, receipt/network/window/canonical-block checks, duplicate invoice claims, gateway allowlists/redaction and wrong-network submission rejection. Existing WOTS signing/storage/review tests remain part of the regression suite. UI checks used a separate local origin without existing wallet data. No broadcast or funded recovery/payment/bundler acceptance is inferred from these checks.


### Observed local checks on 10 November 2026

- Full regression: 99 tests passed, no failures, cancellations or skips. TypeScript and the production static build passed.
- The standalone workbench, candidate tab, Recovery dashboard and Payment Requests/Activity navigation rendered in Safari on an isolated local origin. These checks covered page structure and empty-state controls, not a complete funded browser journey or mobile/device acceptance.
- The real gateway returned HTTP 200 for health with `bundler:not-configured`, accurately reflecting the absent provider credential. No provider was configured, no managed-bundler UserOperation was broadcast, and no service was published.
- A read-only Robinhood Testnet explorer query through the gateway returned 100 indexed records. The application's native-history parser also loaded 100 real records and reported another page. This does not validate all configured explorer hosts, all event categories or complete indexer coverage. A parallel direct-provider probe initially failed transiently; a subsequent single request and parser check succeeded.
- No blockchain write, recovery enrollment/cutover or independently audited contract was produced. Existing accounts, original signing journals and the Winternitz source checkout were not changed by a recovery operation.


## Unified account workspace

The website’s Backup Center (`/dashboard/#backup`), Activity and transaction connection share the canonical Qozmo account. These additions do not enroll or activate the separate recovery research authority described above.

### Complete wallet backup

Unlock the wallet and open **Backup Center** from the sidebar, Settings or Wallet & security. Confirm the existing wallet password to download one `qozmo-wallet-backup` JSON file. Its AES-256-GCM outer envelope uses a fresh 16-byte salt and 12-byte IV with PBKDF2-SHA256 at exactly 600,000 iterations. Owner, chain, version, export date and KDF parameters are authenticated. Inside are the compatible encrypted WOTS account archive and the authenticated account-note archive; no cleartext seed or note is persisted in the downloaded file.

The exporter serializes with the operation and note locks, checks the current account identity, authenticates all notes and rejects a history snapshot that changes during capture. The stored download receipt fingerprints the captured local signing history and encrypted notes. New signatures, journal reconciliation or new notes make the previous receipt stale. The receipt is not evidence that a downloaded file was retained elsewhere, and fingerprints do not establish complete global signing exposure.

**Check completeness** bounds file size (12 MB) and exact envelope/KDF settings before expensive work, authenticates the outer file, validates the inner WOTS signatures/account identity, decrypts/authenticates all note commitments for that owner, and checks the included counts/fingerprint. Inspection compares known local history without installing a record or modifying its journal. Wrong passwords, tampering and unsupported formats fail; prior browser data is preserved.

On a browser with no existing Qozmo account, choose **Import wallet → Encrypted archive** and select the complete file. It is fully authenticated before its encrypted notes are merged and its read-only account/journal installed. Existing records are not overwritten. Note merging preserves existing authenticated entries and writes the merged archive once; if persistence fails, retain the source file. Notes may remain encrypted in storage if later account installation fails, permitting a later explicit retry. No backup grants restored-account spending.

Privacy Ring accepts a current complete-backup receipt for its backup prerequisite, or an explicitly downloaded notes-only archive. Account-only and notes-only legacy files remain compatible with their existing import paths. Lock, disconnect and unmount cancel pending local work and clear password/file fields. JavaScript cannot guarantee erasure of all runtime copies.

### Shared activity and execution checks

Activity decodes the actual stored `execute` calldata. It identifies ETH transfers, exact raw ERC-20 units (without inventing token decimals), pinned-pool deposits and withdrawals, and labels unknown/batch/recovery operations separately. Amounts describe signed intent; reverted operations retain their consumed-key history. Fees come only from a matching EntryPoint operation event and canonical receipt, and exclude any distinct outer gas-payer cost. Confirmations are computed from a fresh head relative to the included block and remain dated observations.

Refresh rechecks up to the latest 20 known transaction hashes; every row with a hash has **Recheck execution & fees**. Failed fresh checks remove old success/fee observations. A successful outer receipt or journal status `confirmed` alone is insufficient to display confirmed execution. Filters scope public/privacy operations and execution status. The separate explorer history remains an indexer view rather than independently verified evidence.

### Connection experience

The same connection panel is available in Wallet & security and Privacy Ring. Qozmo gateway is the default, with explicit browser gas-payer and custom HTTPS options. Health failures distinguish missing configuration, wrong chain/EntryPoint, and unavailable services. Ready status requires the existing chain/contract runtime/link checks and connection compatibility checks; a health response alone cannot enable signing. A successful connection also refreshes account state. The panel reports when it was checked and supports explicit retry without silently falling back or resubmitting operations.

Disconnect, offline events, and changes to the connected browser payer/network invalidate active reviews and pending UI work while retaining the encrypted account and signing journal. Lock clears the connection and endpoint details. The gateway must still be configured and operated with a suitable provider; this UI does not publish a service, supply credentials, sponsor gas or claim live provider acceptance.
