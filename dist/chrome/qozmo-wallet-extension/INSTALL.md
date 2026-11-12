# Qozmo Wallet for Chrome — early access

Version 0.7.0 is a Manifest V3 extension that opens Qozmo Quantum in **Chrome’s native side panel** when its toolbar icon is clicked. The wallet follows the panel’s width and height while only its content scrolls. Create and import stay inside the panel. A legacy 360 × 600 popup entry and dedicated Quantum tab remain packaged. Assets, Activity and Keys form the main navigation. Receive and Security open from the quick actions; Send opens an internal transfer screen with the existing password-confirmed review. The EVM dashboard remains available from Settings. All executable code is bundled locally. It does not embed the website, remotely load executable code, inject an EIP-1193 provider, or connect dapps. It is not yet published on the Chrome Web Store.

## Multichain accounts

Version 0.7.0 adds a network picker for **Robinhood Quantum, Solana Devnet and Bitcoin Signet**. WOTS remains on Robinhood only. Native SOL/BTC derive separate addresses from the standard EVM vault and use standard signatures. They have balance, Receive, Send with a password-confirmed review, native outgoing activity and encrypted standard backups. Native mainnet signing and token transfers outside the Quantum ERC-20 flow are not enabled. See [multichain account and transfer guide](multichain-wallet.md) for exact derivation paths, network/fee checks, supported recipients, limits and validation scope.

## Alpine appearance

Version 0.6.1 aligns the extension with the Qozmo website: warm white backgrounds, charcoal primary actions, lavender accents and solid white panels. The paper and ink colors inherit the website’s shared variables; extension controls use a compact set of brand tokens. A fixed solid navigation bar and readable security sheets retain the opaque appearance introduced in 0.6.0. A locally bundled mountain-and-stag scene forms the balance, welcome and locked-screen backdrop. Artwork loads from the extension package; no image service receives account information. [Artwork provenance and generation prompt](extension-alpine-theme.md).

## Testnet transaction demo status

The extension implements native test ETH and inspected ERC-20 transfers through an explicitly connected HTTPS ERC-4337 bundler for Robinhood Testnet (46630), EntryPoint v0.7. There is no built-in managed transaction service in this release. A funded, installed-extension transfer has **not yet been confirmed in this release’s validation**. The published WOTS-core reference is separate evidence and must not be represented as an extension-originated transaction.

To perform the remaining end-to-end demo:

1. Reload the same unpacked extension folder in the same Chrome profile. Unlock the original signing account. A restored/imported Quantum account remains read-only.
2. Use **Receive** to confirm the distinct Quantum account address and fund it with test ETH for the transfer, deployment and operation fees.
3. Open **Send** and connect a compatible HTTPS bundler supporting chain 46630 and the pinned EntryPoint. Approve only that server’s origin. An ordinary JSON-RPC URL is not an ERC-4337 bundler.
4. Choose Test ETH or inspect the testnet ERC-20 contract. Enter the test recipient and a small test amount. Review the deployment, recipient, asset, amount and fees. The account owner completes the password confirmation and submission.
5. Keep the panel visible. Confirm **Execution succeeded** in Activity and inspect the transaction on the testnet explorer. Key consumption alone does not prove successful execution. Preserve a fresh encrypted archive after signing. If submission is uncertain, inspect the stored operation; do not recreate or reset the account.
6. Verify the resulting transaction with the read-only `/proof/` verifier or `npm run verify:wots -- --tx HASH --account ADDRESS`. A valid receipt, successful UserOperation and matching WOTS/key rotation must all pass before calling the demo successful.

## Install

Requires Chrome 137 or newer (native Ed25519 signing).

1. Download `qozmo-wallet-chrome.zip` from Qozmo's `/extension/` page, or use `public/downloads/qozmo-wallet-chrome.zip` from this checkout.
2. Extract the archive. Keep the `qozmo-wallet-extension` folder in a permanent location.
3. Open `chrome://extensions` in Chrome and enable **Developer mode**.
4. Select **Load unpacked**, then select the extracted folder containing `manifest.json`.
5. Pin Qozmo using Chrome's extensions menu. Click its icon to open **Qozmo Quantum** in the browser side panel. You can keep browsing beside it.

Do not select the ZIP itself in Load unpacked. Chrome does not provide automatic one-click installation from this website. Normal store installation requires a separately reviewed Chrome Web Store release.

The source checkout also produces the directly loadable directory `dist/chrome/qozmo-wallet-extension`.

## Data and account boundaries

- Extension storage is a separate origin from the website. Existing website data is never copied automatically.
- The EVM vault remains password-encrypted in local storage. Quantum's encrypted vault and durable one-time-key journal remain local to the extension origin. Secrets are held only in the memory of the panel, popup or tab that was unlocked, never in extension sync storage or a background worker.
- Use a standard encrypted EVM backup to migrate an ordinary account. Quantum imports remain **read-only**, including when migrating from the website to this extension. A copied Quantum backup cannot establish complete signing history or revoke the old device.
- Mainnets are view-only. EVM native test transfers and the separate Robinhood Testnet Quantum workspace retain their existing guards. Recovery research does not activate lost-device spending recovery.
- Each panel, popup or tab has an independent unlocked session and the existing five-minute inactivity lock. A hidden side panel locks its context on the document visibility event. Closing the popup or tab ends that context’s session; another already-open tab is independent. Reopening the popup requires unlocking again. No unlocked seed is passed between contexts.
- Export a fresh encrypted backup before removing the extension or removing the Chrome profile. Keep Quantum archives current after signing. Never remove or recreate an original Quantum signing environment just to test installation.


## Assets and token visibility

Version 0.5.0 adds an asset manager with **Your tokens**, **Import**, and **Find tokens**. Open **Manage** beside the asset list or **Manage assets** in Settings.

- Import an ERC-20 contract on Robinhood Testnet (46630). Qozmo checks the RPC chain, contract code, symbol, decimals, and account balance at one block before showing the import confirmation. The name is read when supported. Imported metadata does not verify the issuer. Unknown token icons use a local monogram; matching symbols never borrow an official token logo.
- Use each asset’s switch to show or hide it, including native ETH. Hidden assets remain available in the manager. **Hide zero balances** filters only verified zeros; unavailable reads remain visible. A hidden imported token can also be removed from the display list and imported again later.
- **Find tokens** queries the configured Robinhood Testnet explorer for up to 50 ERC-20 suggestions from its first page. The explorer may be incomplete or delayed. Qozmo ignores remote icon URLs, NFTs, malformed entries and flagged spam; each selected contract still needs RPC inspection and explicit import.
- Open an asset for its exact balance and contract, or select a tracked token in Send. The shared password-confirmed transfer review and existing signing guards still apply. Mainnet contracts are never used as a testnet catalog.
- Display preferences are stored separately from the encrypted vault and signing journal, scoped to chain and Quantum address. They sync across extension contexts. Hiding/removing a row does not move funds or delete signing history. Balances are read live and are not persisted as wallet secrets or USD valuations.

## Quantum panel workflow

Version 0.4.0 adds a UI-only service worker that configures toolbar clicks with `sidePanel.setPanelBehavior({ openPanelOnActionClick: true })`. The manifest requests only `sidePanel` as a required Chrome API permission; the worker does not import wallet modules, open tabs, access storage, or hold secrets. Chrome provides the native panel close/pin controls. The panel header does not automatically expand the wallet into a full tab.

Version 0.3.2 combines navigation and release context into one inset glass footer, aligned with the content cards. The footer retains Assets/Activity/Keys and a compact testnet/unaudited label. Welcome and secondary screens use the same footer surface without navigation.

Version 0.3.1 follows the compact account-first layout of the local Winternitz extension reference while retaining Qozmo’s pearl/lavender liquid glass styling. The header shows the account name, copyable address, expand/settings/lock controls and Robinhood Testnet pill. Assets use a left-aligned ETH balance, live key/deployment footer, Send/Receive/Security/Faucet actions, session-only bundler status, and archive shortcut. The bottom navigation is Assets, Activity and Keys. Secondary screens use a back control and the full scrollable content area.

Keys displays the verified current/initial public key hash, key indices, pending/signing restrictions and known local journal records. It does not invent retired keys or claim that a pending key is reusable. No signing, storage, account import or network permission changes are introduced. Recovery and transaction review sheets keep an opaque background.

Version 0.2.1 selects three distinct recovery-word positions using WebCrypto randomness for each new phrase. The selection stays fixed while typing or revisiting the phrase, and answers are cleared when going back. EVM and Quantum setup share the same check UI and fail-closed answer validation.

- **Create / Import:** uses the existing setup and recovery-word check inside the side panel. No setup tab is opened automatically. Hidden panels close their local setup dialog; start again with a fresh phrase if the panel was hidden mid-setup. Imports remain read-only. The legacy popup entry still sends setup to a dedicated tab because popups close when focus is lost.
- **Assets:** unlock locally, check the pinned testnet deployment, sync actual ETH balance, hide/show it, copy the public address, refresh, and see the next one-time key. Unknown balances are shown as unavailable, never as a fabricated zero or USD valuation.
- **Receive:** shows the real account address and QR, explicit chain 46630, faucet and explorer links. No unlock is required to view the public receive address.
- **Send:** connect a compatible HTTPS bundler, choose native test ETH or a checked ERC-20 contract, prepare the transfer, inspect the shared review, and confirm with the Quantum password. Read-only imports, missing/unsafe key state and unresolved pending operations block new signing. Keep the side panel visible during review and submission. Optional custom-bundler host access still follows the existing per-origin permission flow.
- **Activity:** reads known signing history after unlock, checks execution separately from key consumption, and supports the existing exact-byte retry review. A popup closing during submission never makes a one-time key reusable; preserve the pending record and check it before retrying.
- **Keys:** inspect the verified account key state and public signing hash after unlock. Initial undeployed state is explicitly labeled. Known journal entries are distinct from onchain key state.
- **Security / Settings:** export an encrypted archive after unlock, lock this context, open recovery research, guides, or the separate EVM workspace. No recovery activation, account deletion or permission broadening is introduced.

`sidepanel.html`, `popup.html` and `quantum.html` share the same encrypted account and journal because they have the same extension origin. They share no in-memory unlocked session. The web wallet has a separate origin. Reload the extension using the same folder and Chrome profile to update an earlier version; do not uninstall it.

## Network access

The required `sidePanel` permission provides the native wallet panel. The background worker configures only its toolbar behavior. Required host permissions are limited to the configured RPCs, Solana Devnet (`api.devnet.solana.com`), the Bitcoin Signet API (`mempool.space`), explorer APIs, Kraken REST API and DefiLlama API. Kraken's public ticker uses `wss://ws.kraken.com`. Public addresses and operations reach the selected RPC/bundler; saved seed phrases and local vault passwords do not.

A user-supplied HTTPS ERC-4337 bundler requests access to its specific origin only when the user selects **Connect bundler**. Optional `https://*/*` eligibility allows this per-origin request; it does not grant every HTTPS host on installation. Connection details stay in the session. Browser-wallet gas-payer injection is unavailable on extension pages, and this standalone build includes no configured managed gateway. A compatible Robinhood Testnet / EntryPoint v0.7 bundler is required for Quantum submissions.

Payment request links use the public Qozmo website so another person can open them; they never contain an installation-specific `chrome-extension://` address. Only the public invoice is included in the link. Documentation also opens on the public Qozmo website.

No content scripts, page injection, browsing-history permission, remote script sources, or public web-accessible extension resources are included.

## Rebuild and update

Use Node 22 or 24, npm, and the `zip` command (provided on macOS; install your OS package on Linux).

```sh
npm ci
npm run build:extension
npm run verify:extension
```

`npm run build` regenerates the extension download before building the static website. Outputs:

- `dist/chrome/qozmo-wallet-extension/` — unpacked installation folder
- `public/downloads/qozmo-wallet-chrome.zip` — downloadable package
- `public/downloads/qozmo-wallet-chrome.zip.sha256` — checksum for this build
- `public/downloads/qozmo-wallet-chrome.json` — version, size and checksum

To update an unpacked installation, first export backups, replace the files **in the same folder**, and select Reload on `chrome://extensions`. Preserve the folder path and Chrome profile. Do not uninstall the old extension as an update method. After any reload the wallet must be unlocked again.

## Validation scope

Version 0.7.0 adds native adapter tests using public development vectors and mocked network services, plus isolated DOM component tests for standard-vault unlock, native Receive addresses, exact SOL/BTC reviews, account switching and hidden-panel stale-response handling. The native tests never contact a live broadcast endpoint. Browser access was unavailable during this version's visual check, so the new network picker and native screens still require visual inspection in an installed Chrome extension. Build/package verification and DOM tests do not establish a funded on-chain transfer or a Chrome installation test.

Version 0.6.0 passed the 120-test wallet regression suite and production static build. The Alpine asset view was visually checked at 360 × 600, 420 × 800 and 320 × 680 in Safari using an isolated presentation fixture with synthetic balances and public dummy addresses. Asset details, token selection into Send, the disconnected-bundler form, asset visibility manager and locked screen were checked. The packaged production welcome page and initial Create dialog were also checked over localhost. No wallet credentials were entered, no account was installed, and no operation was signed or submitted. Native installed-Chrome behavior and the funded transaction demo remain separate checks. The temporary fixture is not shipped.

Package verification checks the Manifest V3 contract, packaged entry points/assets, local executable code, declared network coverage, checksum and ZIP integrity. The normal wallet regression tests also apply to the shared implementation. A real funded extension transaction and Chrome Web Store review are separate release checks; packaging alone is not proof of either.

The download page was visually checked in Chrome. The standalone launcher, dashboard, Quantum testnet selection and recovery entry were exercised in a local HTTP preview with the manifest CSP applied. This preview does not replace a real `chrome-extension://` installation test; no user Chrome profile was modified and no funded operation was submitted during this check. Version 0.2.0 was also checked with a disposable public BIP-39 fixture on an isolated localhost origin: import into read-only mode, popup storage synchronization, password unlock, actual testnet balance read, Receive QR/copy, Activity, backup password dialog and session lock. Send stayed disabled on the imported account. No signed operation was submitted; actual Chrome installation and funded transfers remain separate checks.

Version 0.3.0 was visually checked in Safari using a 400 × 600 local popup preview with the manifest CSP. A separate temporary presentation fixture covered the unlocked balance/asset view, hidden balances, Receive QR/address, Send form, empty Activity, Settings and locked screen. Fixture balances and account state were synthetic; no account was installed, network permissions granted or transfer signed. The fixture is excluded from the release package.

Version 0.3.1 was checked at 360 × 600 in the local preview: actual packaged onboarding, fixture account header/balance/actions, Keys with a full public hash, and a read-only account with Send disabled. No wallet was installed or operation signed. The Winternitz checkout was inspected as a layout reference only.

Version 0.3.2 footer alignment and readability were visually checked at 360 × 600 in the local UI fixture.

Version 0.4.0 validates the side-panel manifest/worker bundle and exercises worker load/startup/update/error handling with restricted Chrome API mocks. The actual packaged side-panel page and in-panel Create/Import dialogs were visually checked in Safari over localhost with manifest CSP applied. Panel dialog entrance animations are disabled to avoid an observed invisible-sheet rendering issue. Native Chrome toolbar opening, panel resizing/visibility events and funded transactions have not been exercised in an installed extension during this check.

References: [Chrome installation guide](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked), [extension CSP](https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy), [optional host permissions](https://developer.chrome.com/docs/extensions/reference/api/permissions), [Chrome Side Panel API](https://developer.chrome.com/docs/extensions/reference/api/sidePanel).
