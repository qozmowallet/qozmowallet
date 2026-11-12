# Qozmo proof and release status

Verified on 11 November 2026 (Asia/Makassar). Work in this update is read-only chain verification and local product/documentation implementation. No new transaction, mainnet deployment, token approval, token economics contract, GitHub publication or social post was executed.

## Reverified WOTS reference

- Transaction: [0xc24e471f61c604bf48032ff734a2c967f0c8ec14dd0be675eec12339e818a376](https://explorer.testnet.chain.robinhood.com/tx/0xc24e471f61c604bf48032ff734a2c967f0c8ec14dd0be675eec12339e818a376)
- Account: `0xdb09E41fC28EDD6f2dC38C00D6A9340625Ce4A3B`
- Chain: Robinhood Testnet, `46630`; block `138564260`.
- UserOperation: `0x4910e18b580d13a43f22312e684ca2f422fa58173159993d2878fb11a575d40b`.
- Normal WOTS key `0 → 1`; `execute` value `1 wei`; matching successful EntryPoint event.
- Signature field is 2,176 bytes: next-root commitment plus a 2,144-byte WOTS signature.
- Machine-readable report: `public/evidence/wots-core-reference.json`.

**Provenance:** This is the pre-Qozmo WOTS-core validation run recorded in the supplied source project on 19 October 2026. It is not presented as a Qozmo UI-originated transaction. Chain data does not establish which frontend created a signature. The report rechecks the exact pinned implementation integrated by Qozmo.

The verifier checks chain, outer success, transaction/receipt/canonical block agreement, direct EntryPoint `handleOps`, packed v0.7 hash, one matching operation event, normal signature length, historical bytecode pins, proxy and implementation links, local WOTS recovery against the matching key-rotation event, final canonical block, and execution success. A reverted execution never becomes successful evidence. Ambiguous batches need an account or operation filter. Recovery signatures and indirect/aggregated EntryPoint calls are unsupported and remain unverified.

Historical state was unavailable from the chain's public RPC for this old transaction. The independent recheck used dRPC's [published Robinhood Testnet archive endpoint](https://drpc.org/chainlist/robinhood-testnet-rpc). The wallet signing RPC and network/signing guards are unchanged. Public verification trusts the configured RPC observation and does not claim Ethereum settlement finality or an audit.

```bash
npm run verify:wots -- \
  --tx 0xc24e471f61c604bf48032ff734a2c967f0c8ec14dd0be675eec12339e818a376 \
  --account 0xdb09E41fC28EDD6f2dC38C00D6A9340625Ce4A3B
```

`--out public/evidence/name.json` writes only a fully verified result. `QOZMO_PROOF_RPC_URL` can select another HTTPS archive endpoint for the CLI; keep any provider credential local. No `.env` file is automatically read. The browser verifier uses the public endpoint without a key.

## Qozmo-run evidence still needed

The previously displayed Qozmo account `0xb09cdc332e08d49C759469c9c2Fb85a0579bC17C` was still undeployed when checked. Funding it is not a WOTS transaction. Complete a reviewed testnet transfer from its original signing installation, retain its hashes and fresh encrypted archive, then reverify the hash at `/proof/`. Do not restore or reset an account merely to produce a demonstration.

## Public source

Git origin is `https://github.com/imrybrndo/qozmo-wallet.git`. The anonymous GitHub REST request returned 404; the available GitHub CLI session also could not resolve the repository. This does not distinguish private, absent, inaccessible or a wrong remote. No public-source claim is made until anonymous access works. The proof page can repeat that check. No visibility setting was changed and no source was pushed.

## Mainnet and $QZO

The owner confirmed **testnet first, mainnet later**. No date is promised. Mainnet release criteria are documented at `/proof/#mainnet`; signing stays testnet-only.

The landing page's configured mainnet token address is `0x5acb76ff3adb392fbdb4ec120d1494757aede484` on Robinhood Chain `4663`. Public RPC reads confirmed contract code, name `Qozmo`, symbol `QZO`, and 18 decimals. `npm run verify:qzo` regenerates a one-block metadata report in `public/evidence/qzo-token-metadata.json`. This does not certify issuer identity, supply permissions, token safety or economic value.

Token existence and wallet-linked utility are separate. The wallet has no implemented $QZO fee share, buyback, burn distribution or staking reward integration. Network gas is ETH. This update does not invent or deploy tokenomics; future utility requires an explicit approved mechanism, its funding source, accounting/permissions and a public implementation.
