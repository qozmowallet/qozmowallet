# Qozmo Wallet

## Chrome extension

Download the early-access Chrome extension from `/extension/` on the landing site, or build it with `npm run build:extension`. The ZIP is generated at `public/downloads/qozmo-wallet-chrome.zip`; the directly loadable folder is `dist/chrome/qozmo-wallet-extension`. Install with Chrome's **Developer mode → Load unpacked**. The toolbar opens a dedicated 400 × 600 Quantum wallet popup with Wallet, Receive, Send, Activity and Settings. Setup uses a dedicated Quantum tab; the EVM dashboard stays available from Settings. This is a bundled local wallet; Chrome Web Store publication and dapp provider injection are not included. Website vault data is separate and Quantum imports remain read-only. See the [installation, permissions and update guide](docs/chrome-extension.md).

The latest local additions are the **Recovery** workspace and standalone `/recovery/` research tools, explorer-indexed history with CSV export, native payment requests with receipt verification, expanded transfer reviews, and a separately operated Qozmo bundler gateway. Read [implementation, setup and limits](docs/recovery-and-product-tools.md). The offline recovery artifacts do **not** activate lost-device spending recovery on existing accounts. Their imports remain read-only.

A responsive wallet landing page and DeFi wallet workspace built with **Next.js App Router, React, TypeScript, and CSS**. The visual identity follows the supplied reference: warm white, fading grids, soft pastel gradients, oversized typography, and a photographic hand-held phone with a live wallet interface.

## Run locally

Use Node.js 22 or 24.

```bash
npm install
npm run dev
```

Open the local URL printed by Next.js (normally http://localhost:3000).

## Production

```bash
npm run typecheck
npm run build
```

The project uses Next.js static export. `npm run build` creates the deployable `out/` directory. Publish `out/` on a static hosting service, or import the repository into Vercel. The static frontend embeds no provider secrets. The optional Qozmo gateway uses server-side environment variables; see the setup guide linked above.

## Qozmo documentation

Open `/docs/` from the landing navigation or the dashboard’s **Documentation** link. The 18 guides cover wallet setup, backups, receiving, testnet transfers, assets, networks, Qozmo Quantum, security, troubleshooting and developer setup. The docs include grouped navigation, full-text search (`⌘/Ctrl K`), section links and previous/next guides.

Content lives in `lib/docs-content.ts`, the shared interface in `components/docs/`, and scoped styling in `app/docs/docs.css`. Each guide is generated as static HTML with its own metadata and direct URL.

## DeFi dashboard and wallet

The website uses one Qozmo WOTS smart account for public transfers, Quantum security and Privacy Ring on Robinhood Testnet (46630). Create once, then share its address, password and unlock session across dashboard features. An existing Quantum account opens automatically; previous EOA vaults remain preserved in Settings with no automatic asset migration. Other EVM networks are observation only; the picker separates Mainnet/Testnet from Chain.

- **Backup Center** at `/dashboard/#backup` packages the account archive, known signed-operation history and encrypted Privacy Ring notes in one authenticated encrypted file. It records the last download locally, detects changes since that download, and can authenticate a file without installing it. Complete-file restoration uses Import wallet → Encrypted archive and remains read-only.
- **Activity** distinguishes native ETH, ERC-20 base-unit transfers, privacy deposits/withdrawals and other account calls from their actual signed calldata. Expand a row for account fees, confirmations, hashes, public references and explorer links. Consumed keys alone never imply successful execution; failed fresh receipt checks clear earlier success/fee observations. Refresh checks the latest 20 known transaction receipts; individual rows support explicit rechecking.
- **Shared connection** offers Qozmo gateway, browser gas payer or an HTTPS bundler from Wallet & security and Privacy Ring. It shows checking, connected, unconfigured, wrong-network or unavailable status with explicit retry. Connections and endpoint details clear on lock. Selecting a different connection does not silently retry a signed operation.
- Native/token balances, public crypto/RWA quotes, price history, explorer-indexed history, payment requests and DeFi discovery remain available within their documented scopes.
- The Chrome extension also supports native SOL on Solana Devnet and BTC on Bitcoin Signet using their separate standard-vault addresses. Website and extension storage origins remain distinct; WOTS remains exclusive to the Robinhood smart account.

Complete backups use PBKDF2-SHA256 (600,000 iterations) and AES-256-GCM, authenticating account identity, chain and export metadata. Every contained WOTS archive and note is checked before completeness is reported. A download timestamp cannot prove off-device retention or complete cross-device history. Keep the original signing device; imported accounts never become active signers through inspection or restoration.

See [workspace backup, activity and connections](docs/recovery-and-product-tools.md#unified-account-workspace) and [Privacy Ring implementation](docs/privacy-ring.md).

```bash
npm test
npm run typecheck
npm run wallet:unified:test
```

## Landing-page features

- Live crypto and real-world asset prices streamed from Kraken
- Crypto, stock, ETF, gold and stablecoin selection, rolling 24-hour price change, and real daily low/high range
- Tokenized gold, equity, and ETF quotes with individual trade timestamps
- Automatic reconnect, offline status, and preserved last-received prices
- Responsive navigation and section links
- Sample wallet balance visibility
- Illustrative spending and activity panels and charts
- Card color customization
- Dedicated wallet dashboard and a 3D Mastercard/Visa card concept dialog
- Searchable sample activity
- Keyboard-accessible FAQ accordion
- Reduced-motion preferences

## Live crypto and RWA prices

The hero opens one public WebSocket connection to `wss://ws.kraken.com/v2`, subscribes to the `ticker` channel, receives initial snapshots, and merges subsequent trade updates. The static Next.js export needs no server, API key, or private account. A visitor's browser must be able to reach Kraken.

| Asset | Kraken pair | Category |
| --- | --- | --- |
| Bitcoin | `BTC/USD` | Cryptocurrency |
| Ethereum | `ETH/USD` | Cryptocurrency |
| Solana | `SOL/USD` | Cryptocurrency |
| PAX Gold | `PAXG/USD` | Tokenized gold |
| NVIDIA xStock | `NVDAx/USD` | Tokenized equity |
| SP500 xStock | `SPYx/USD` | Tokenized ETF |
| Apple xStock | `AAPLx/USD` | Tokenized equity |
| Microsoft xStock | `MSFTx/USD` | Tokenized equity |
| Tesla xStock | `TSLAx/USD` | Tokenized equity |
| Nasdaq 100 xStock | `QQQx/USD` | Tokenized ETF |
| USD Coin | `USDC/USD` | Stablecoin |

Prices are the provider's last traded USD prices. `change_pct`, `low`, and `high` supply the actual rolling 24-hour percentage and range; the range is not a fabricated historical chart. Every quote retains its provider timestamp. A connected feed does not mean that an illiquid asset has traded recently, so older trade times remain visible.

The client validates asset symbols and numeric data, ignores malformed quotes, and prevents older trades from overwriting newer ones. Connection and silence timeouts detect failures. It resubscribes with exponential backoff and jitter, handles browser offline/online events, and reconnects stale connections when the tab becomes visible. Disconnected prices are labeled as last received; no example prices are substituted. Subscription or snapshot failures show a partial feed state.

Implementation: `lib/market-data.ts`, `components/use-market-prices.ts`, `components/market-phone-screen.tsx`, and `app/market-phone.css`. The photographic scene is composed in `components/market-hero.tsx` and `app/market-hero.css`.

Provider references: [Kraken ticker v2](https://docs.kraken.com/exchange/api-reference/spot-websocket-v2/ticker), [reconnection guidance](https://docs.kraken.com/exchange/guides/websockets/reconnection), [PAX Gold](https://www.paxos.com/assets/paxg), and [xStocks](https://defi.xstocks.fi/).

## Hand-held phone hero

The right side of the hero uses an original photorealistic hand-and-phone cutout generated with ImageGen. The screen is live React UI: the expanded watchlist, asset selection, range, retry control, provider attribution, and the wallet-demo button remain interactive.

The image and screen overlay share a fixed 1086×1448 coordinate canvas. The 504×1040 screen aperture is positioned at (171,120); a 360px UI scales 1.4× into it. CSS scales the entire composition responsively, and tilt, float, scroll depth, and pointer parallax are applied to their shared parent so the hand, bezel, and UI stay aligned. The small-screen layout centers the display while the wrist naturally extends toward the edge of the hero.

Asset: `public/images/hand-phone.png`. The full generation prompt and asset details are in `docs/hand-phone-asset.md`. No image is hotlinked from the reference website.

## Clean hero and sticky navigation

The hero uses a text eyebrow, balanced typography, two plain actions, and one concise supporting line. Decorative stars, sketch arrows, the hero grid, and repeated CTA icons have been removed. The hand-held phone keeps its live data and parallax, with a calmer segmented asset selector and fewer icons.

The main header is a page-level sibling of the hero rather than a child of its clipped parallax scene. `position: sticky` keeps it at the top throughout the page; the translucent background and subtle border preserve legibility. Desktop navigation is centered between the brand and demo action. Mobile navigation closes on selection, outside click, Escape, or a transition to desktop width. Anchor spacing accounts for the sticky header.

The navbar now uses a rounded floating frame and pill-shaped active links. After 24 px of scrolling, the landing navbar and dashboard topbar switch to a translucent glass surface with blur, saturation and a soft shadow. Their dimensions stay fixed during the transition to avoid layout jumps. Mobile menus retain their existing dismissal behavior, with rounded styling and a bounded scroll area. Unsupported blur falls back to an opaque surface; reduced motion and reduced transparency preferences are respected. Scroll state is shared through `components/use-scrolled.ts`.

Styles for these refinements live in `app/landing-refinement.css`. Asset symbols, menu controls, and other meaningful interface icons continue to use Font Awesome.

## Font Awesome icons

Interface icons throughout the landing page and wallet demo use the official Font Awesome React component with the free Solid, Regular, and Brands icon packs. The icon mapping is centralized in `components/icons.tsx`, including Spotify and Dribbble brand marks. Icons are bundled with the application, so no external Font Awesome Kit or API key is needed.

The shared icon wrapper preserves the page's existing sizing and accessible button labels. Font Awesome's styles are loaded once in the root layout, and automatic style injection is disabled for Next.js. Custom Qozmo branding, the spending charts, and decorative artwork remain SVG illustrations.

## Magic UI animations

The page includes four components adapted from the official [Magic UI](https://magicui.design) registry: **Blur Fade**, **Shimmer Button**, **Border Beam**, and **Animated Shiny Text**. Their original animation mechanisms are retained, with Tailwind classes translated to the project's scoped CSS. The upstream MIT license is included in `components/magicui/LICENSE`.

- Staggered hero entrances and section/card reveals on scroll
- Soft shimmer around primary buttons
- A subtle pastel border beam on the final call to action
- Floating hand-held phone and logo tile, with their original rotations preserved
- Animated chart drawing, gradient drift, and occasional card highlights
- A footer **Pause motion / Play motion** control
- Automatic respect for system reduced-motion preferences and a no-JavaScript content fallback

Floating panels pause when hovered, focused, or outside the viewport. Animation settings are shared through `components/motion-system.tsx`; scoped styles live in `app/magicui.css` and `app/qozmo-motion.css`.

## Interactive parallax

Scroll through the page to see the hand-held phone, soft glow, and decorative shapes move at different speeds. The orbit illustration and closing banner use the same depth effect. On a desktop with a mouse, the market artwork and orbit illustration also respond gently to the pointer.

The implementation uses the existing Motion dependency, with stationary scene measurements, bounded layer movement, and spring smoothing. Each moving wrapper preserves its child's original rotation and floating animation. Headings and primary calls to action remain in the page layout; navigation stays visible at the top. Normal browser scrolling is preserved.

- Narrow screens and coarse pointers use smaller vertical travel, with no horizontal movement or extra rotation.
- Mouse movement is suspended over interactive controls and while they have keyboard focus.
- The existing **Pause motion** control and system reduced-motion setting disable parallax as well as the other animations.
- The static layout remains readable without JavaScript.

`components/parallax.tsx` contains the reusable `ParallaxScene` and `ParallaxLayer` components. `app/parallax.css` handles layer stacking, pointer access, and background coverage. Adjust a layer's `y`, `x`, `rotate`, `pointerDepth`, or `mobileScale` props to tune its depth.

## Public proof and project status

Open `/proof/` to reverify WOTS execution, inspect the attributed pre-Qozmo core reference, check anonymous GitHub access, and see mainnet release criteria and the current $QZO integration status. Verification is read-only and never accesses a seed or signing journal. See [proof and release status](docs/proof-and-release-status.md).

```bash
npm run verify:wots -- --tx <transaction-hash> --account <quantum-address>
npm run verify:qzo
```

## Extension asset manager

The Quantum extension’s **Manage** control supports ERC-20 import, explorer suggestions, per-account token visibility and a zero-balance filter on Robinhood Testnet. Imported tokens are checked against the chain RPC before adding them. Token details route into the existing reviewed send flow. Public display preferences use a separate storage namespace from the encrypted vault and one-time-key journal. See [Chrome extension guide](docs/chrome-extension.md).

## Project structure

- `app/docs/`: static documentation routes and responsive docs styles
- `components/docs/`: documentation shell, search and article renderer
- `lib/docs-content.ts`: guide content, navigation and search index
- `app/dashboard/`: DeFi workspace route and scoped styles
- `components/dashboard/`: dashboard, wallet dialogs, markets, protocol discovery, and Qozmo Quantum
- `lib/wallet/`: encrypted vault, network configuration, transactions, activity, the integrated WOTS core, and optional quantum proofs
- `tests/`: meaningful cryptographic and transaction guard checks
- `app/page.tsx`: page composition and landing-page interactions
- `app/globals.css`: base responsive page styling
- `app/landing-refinement.css`: clean hero and sticky navigation
- `components/market-hero.tsx`: photographic hand-held phone composition
- `components/market-phone-screen.tsx`: interactive live market screen
- `components/use-market-prices.ts`: public market connection and recovery
- `lib/market-data.ts`: asset metadata, quote validation, and formatting
- `app/market-hero.css`: responsive photo/screen alignment and phone tilt
- `app/market-phone.css`: wallet screen interface styling
- `components/wallet-art.tsx`: sample wallet cards and spending chart
- `components/wallet-demo.tsx`: interactive demo dialog
- `app/demo.css`: demo styles
- `components/brand.tsx`: Qozmo identity and decorative SVGs
- `app/layout.tsx`: metadata, font, and global styles
- `public/`: favicon and social preview artwork

## Product boundary

The landing page includes real public market quotes and illustrative spending/activity panels and Coming soon card concepts. The `/dashboard/` route uses one encrypted Qozmo WOTS smart account for Wallet, Quantum and Privacy Ring. Earlier EOA vaults are preserved in Settings without automatic migration. Live prices are a watchlist, separate from holdings; native and ERC-20 balance reads use blockchain RPCs. Tokenized stock holdings are raw token units; they are not underlying-share counts. Kraken xStocks prices are never used to value Robinhood-issued tokens. Mainnet signing, everyday-EOA ERC-20 sends, token approvals, swaps and staking transactions remain disabled. The shared Wallet & security workspace supports ETH/ERC-20 testnet transfers through a connected ERC-4337 bundler or an explicitly connected browser gas-payer wallet. No provider credentials are bundled with the static application. No payment card or mobile application is issued through this website.

The Manrope font is self-hosted through its npm package. No third-party analytics or external image requests are required.

## Privacy Ring research

Phase 1 includes a fixed-denomination ETH pool, Circom/Groth16 circuit and verifier pipeline, TypeScript note/calldata SDK, encrypted backups, and a dashboard demo at `/dashboard/#privacy`. A research pool with denomination 0.001 test ETH is deployed on Robinhood Testnet at [`0x1bF754aCec18E5025Cd5a64F95C76A4B7F3eed0F`](https://explorer.testnet.chain.robinhood.com/address/0x1bF754aCec18E5025Cd5a64F95C76A4B7F3eed0F). A real testnet deposit/proof/withdrawal round-trip completed; the dashboard explores its three stages and can freshly verify receipts, public proof and spent state. The unified dashboard also prepares live deposit/withdrawal operations from the same Qozmo smart account, generates withdrawal proofs locally in a worker, and confirms with the existing wallet password. New unified account operations have been verified on isolated Anvil; the older recorded run remains separate testnet evidence. The proving setup remains research only; the same-wallet round-trip publishes both receipts and makes no anonymity claim. Run `npm run privacy:demo` for preview, or `npm run privacy:demo -- --broadcast` to resume the recorded demo without duplicate transactions. See [demo evidence, recovery and implementation limits](docs/privacy-ring.md#dashboard-demo).

For Robinhood Testnet deployment, save a dedicated private key as `WALLET_TESTNET` in local `.env`, then run `npm run privacy:deploy` for preflight. `npm run privacy:deploy -- --broadcast` deploys four contracts with a 0.005 test ETH gas-fee budget and records resumable receipts. `npm run privacy:verify` tests the deployed verifier using read-only proof calls. See the [deployment procedure](docs/privacy-ring.md#deploy-to-robinhood-testnet) for artifact backup and journal recovery. Run `npm run wallet:unified:test` for the isolated account/privacy integration check.
