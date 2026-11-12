import type { Address, Hash } from 'viem';
export type PrivacyResearchPins = { chainId: 46630; pool: Address; verifier: Address; denomination: string; deployBlock: bigint; domain: string; poolCodeHash: Hash; verifierCodeHash: Hash; manifestHash: string };
/** Public research deployment pins. No wallet credentials or note secrets belong in this module. */
export const PRIVACY_RESEARCH: PrivacyResearchPins = {
  chainId: 46630,
  pool: '0x1bF754aCec18E5025Cd5a64F95C76A4B7F3eed0F',
  verifier: '0x16bE8A958188C55EFc385ECa5D2a1Ea04d34dB82',
  denomination: '1000000000000000',
  deployBlock: 151864532n,
  domain: '3921783283555207517042311844485044688320644701004583208018395134405716381915',
  poolCodeHash: '0xb1268734ec971791e49212e88455a1e83ef125abf789a4278dea8b5e6c27e4a7',
  verifierCodeHash: '0x21adb0dcebb833982837bd58589e5072981e038addb1330b22fc409586d89ede',
  manifestHash: '23c992a98db9c84c17c5910115e088828cbef6f61505636817c12e9814fa7af1',
} as const;
