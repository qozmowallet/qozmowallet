# Asset logo sources

Updated 8 November 2026. Token artwork is bundled locally and displayed through the shared AssetLogo component with original colors and proportions. These marks identify the corresponding assets; Qozmo does not claim an affiliation with the brands. UI action icons remain separate from token logos.

## BTC, ETH, SOL, and POL original logo sources

Retrieved 2026-11-08. All four assets are SVG and were copied byte for byte from the URLs below. No redraws, recoloring, gradient replacement, or shape edits.

### BTC
- Repository file: `public/assets/bitcoin.svg`
- Primary brand page: https://bitcoin.design/guide/getting-started/visual-language/
- Original file: https://bitcoin.design/assets/images/guide/getting-started/visual-language/bitcoin-symbol.svg
- Format / dimensions: SVG; viewBox `0 0 144 145`; 2,028 bytes
- SHA-256: `a772587201b7603cc316fc28fbd974d07bf47d22d0e4a25d8f076d7900f3469b`
- Provenance: Original orange Bitboy mark from Bitcoin Design. Bitcoin has no central brand authority; this community-maintained design guide documents the widely adopted mark.

### ETH
- Repository file: `public/assets/ethereum.svg`
- Primary brand page: https://ethereum.org/assets
- Original file: https://ethereum.org/images/assets/svgs/eth-diamond-purple.svg
- Format / dimensions: SVG; viewBox `0 0 1920 1920`; 476 bytes
- SHA-256: `7320e64e211db747308cc3e546e5360d42f3790b7a14fba0504573790e17f124`
- Provenance: Original purple diamond SVG downloadable from Ethereum’s official assets page. Transparent background.

### SOL
- Repository file: `public/assets/solana.svg`
- Primary brand page: https://solana.com/branding
- Original file: https://solana.com/src/img/branding/solanaLogoMark.svg
- Format / dimensions: SVG; viewBox `0 0 101 88`; 2,519 bytes
- SHA-256: `3d3401109aa061dec40a8659f1847817a8e647f98de1e65e76e86a95bbe1f08a`
- Provenance: Official Solana gradient logomark SVG linked from the Solana Foundation branding page. Transparent background.

### POL
- Repository file: `public/assets/polygon.svg`
- Primary brand page: https://polygon.technology/brand-guidelines
- Original file: https://polygon.technology/favicon.svg
- Format / dimensions: SVG; viewBox `0 0 32 32`; 515 bytes
- SHA-256: `7eda178dc46658f07c55fa47d0d4d51840547f1ff73eab4da28a22923f9baf5b`
- Provenance: Original official Polygon site favicon, linked in the official brand-guidelines page HTML. White Polygon mark on its original #670de5 rounded tile. The complete SVG is preserved, including its original background.

### Validation and use
All four downloaded SVGs parsed successfully and contain no script, event attributes, external href/src resources, remote CSS imports, foreignObject, or executable content. Solana’s gradients reference only local SVG definitions. Original colors and proportions are preserved. Marks identify the corresponding assets; no sponsorship or affiliation is implied.

## Real-world asset originals

The xStocks marks identify the tokenized products NVDAx and SPYx. They are the issuer’s product images, including their branded X artwork.

### pax-gold.png

- Repository file: `public/assets/pax-gold.png`
- Primary source page: https://www.paxos.com/brand-resources
- Original asset: https://framerusercontent.com/images/7OsnaCpXxdzsKLShNVmad8O1Ys.png?height=512&width=512
- Format: PNG, 512 × 512; 7298 bytes
- SHA-256: `0db15d4ea8f3ee8ed713a9e04dd7ef34222e8ccc7e9b3a8b5abb5ffc432b3dd3`
- Original file copied unchanged; PNG decoding and visual identity checked.

### nvidia-xstock.png

- Repository file: `public/assets/nvidia-xstock.png`
- Primary source page: https://xstocks.com/
- Original asset: https://cdn.prod.website-files.com/655f3efc4be468487052e35a/6aa0128df63915dbafacef5d_NVDAx.png
- Format: PNG, 400 × 400; 23218 bytes
- SHA-256: `6b639eff0158850c474d378ed8580375c396dda494cfff9040e6b1735b8ef623`
- Original file copied unchanged; PNG decoding and visual identity checked.

### sp500-xstock.png

- Repository file: `public/assets/sp500-xstock.png`
- Primary source page: https://assets.backed.fi/products/sp500-xstock
- Original asset: https://cdn.prod.website-files.com/655f3efc4be468487052e35a/6a9865b36967fd31d0415ecf_SPYx.png
- Format: PNG, 400 × 400; 13515 bytes
- SHA-256: `83c5db1a3c9d82482b9422bf1f850f1efe8af0ca9ed9455cb71f7830ad16b5c4`
- Original file copied unchanged; PNG decoding and visual identity checked.

## Usage locations

- Landing-page phone: BTC, ETH, SOL tabs and PAXG, NVDAx, SPYx rows.
- Dashboard market watch: all six market assets.
- Native asset balances: the ETH or POL token mark, with network names shown independently.

Files are served from `/assets/`. No image-host request is needed when a visitor loads a token logo.

## Release checks

Production build and TypeScript completed successfully. Browser inspection confirmed all six market logos load from their local image paths on both the landing phone UI and dashboard market table. The official original files were checked for valid image/XML formats, and their original hashes are recorded above. The native-token symbol lookup maps ETH and POL to the same registry. No wallet logic or market data parsing was changed.

## Robinhood Chain asset additions — 8 November 2026

The Apple, NVIDIA, Microsoft, Tesla, SPY and QQQ marks in `public/assets/robinhood-*.png` were downloaded from the `logoUrl` returned for each token by https://api.robinhood.com/rhj/assets. The CDN pattern is `https://cdn.robinhood.com/ncw_assets/logos/<lowercase-contract-address>.png`. These are separate metadata entries from Kraken xStocks. All additional xStock and stablecoin rows now use official artwork, as documented below.

## Complete official logos and rounded presentation

All 19 registry entries now point to local official artwork; ticker monogram placeholders have been removed. The shared `AssetLogo` component uses a rounded square frame, a subtle border, consistent proportional padding, and centered artwork. `object-fit: contain` preserves proportions. Source files keep their original colors; the radius is a presentation style applied in CSS. This treatment is shared by dashboard markets, token holdings, network balances, and the landing phone.

| Asset | Primary source | Downloaded artwork |
| --- | --- | --- |
| AAPLx | https://assets.backed.fi/products/apple-xstock | https://cdn.prod.website-files.com/655f3efc4be468487052e35a/6ab5589b93cedf3d16c0ef20_AAPLx.png |
| MSFTx | https://assets.backed.fi/products/microsoft-xstock | https://cdn.prod.website-files.com/655f3efc4be468487052e35a/6ab558d108ccb83892f04dd4_MSFTx.png |
| TSLAx | https://assets.backed.fi/products/tesla-xstock | https://cdn.prod.website-files.com/655f3efc4be468487052e35a/6ab558f9a5d8bb1d73db841b_TSLAx.png |
| QQQx | https://assets.backed.fi/products/nasdaq-xstock | https://cdn.prod.website-files.com/655f3efc4be468487052e35a/6a98659599bcd3762d9a1494_QQQx.png |
| USDC | https://www.circle.com/pressroom#brandkit | https://6778953.fs1.hubspotusercontent-na1.net/hubfs/6778953/Pressroom/brandkit/logo-downloads/usdc.zip — `Token Logo/USDC Token.svg` extracted unchanged |
| USDG | https://www.paxos.com/brand-resources | Official inline USDG SVG, immediately preceding the `https://globaldollar.com/brand#usdg` link, copied without altering its vector paths |

Downloaded 8 November 2026. Integrity hashes:

- `apple-xstock.png`: SHA-256 `930db19951493787ee286650222311b5158317bdb811205b450cfb412ab89295`
- `microsoft-xstock.png`: SHA-256 `254e57a4c746213c9773c00933ab360ff81ba023c3cc7ed9f2a3fd5224e4e3c2`
- `tesla-xstock.png`: SHA-256 `42cb949ac9a7e6385df10a59bcd47576260c6a78bf54df0eea962343644d7fd8`
- `nasdaq-xstock.png`: SHA-256 `ef8778ce76e2300a44cc6bd6a263336d9dac6acbfff4f09da1e8a419e7c87ee6`
- `usd-coin.svg`: SHA-256 `fe4f9d5f34ef4ebeb5d80e1f5ff63dcaf5a0d5495f4adf206e4c3011d1f5c57d`
- `global-dollar.svg`: SHA-256 `4f2c744672a37ba8ef40e7102191b56663117e977d9efc2b577321747ec955a7`

Verification: SVGs parsed and checked for executable/external content; all registry files exist; production build and TypeScript passed. Native Chrome screenshot inspection confirmed the rounded market rows and official xStock/USDC artwork load correctly. No wallet or pricing behavior changed.

## Aave and Uniswap protocol icons

Replaced the letter placeholders in Overview's compact protocol cards, Explore DeFi cards, and the DeFi orbit illustration with official logos. Both use the shared rounded `AssetLogo` frame with consistent spacing, original colors and contained proportions. No protocol links, TVL logic or wallet behavior changed.

- Aave: official DAO brand kit, purple Ghost Logomark. Source: https://github.com/aave-dao/aave-brand-kit/blob/6063f9ee53e7348e24728faf1acb1eeea85ef922/Logo/Logomark-purple.svg
- Uniswap: official Uniswap brand repository, pink unicorn icon. Source: https://github.com/Uniswap/brand-assets/blob/1d829912a8b1c154b700984f88baa83142ee1a1b/Uniswap%20Brand%20Assets/Uniswap_icon_pink.svg

Original SVG files were copied unchanged and bundled locally. Integrity checks:

- `aave.svg`: SHA-256 `1c026e8f5a16fbf2627fd409e7994b20c657149a049908395030b6935e8efca6`
- `uniswap.svg`: SHA-256 `47b703cb5ea86969c1b14b75c094f18cffbfa57a1b6e219a8db571aab087022c`
