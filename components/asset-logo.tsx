import type { CSSProperties } from 'react';
import { ASSET_LOGOS, type AssetLogoId } from '@/lib/asset-logos';
import styles from './asset-logo.module.css';

type AssetLogoProps = {
  assetId: AssetLogoId;
  size?: number;
  className?: string;
  /** Adjacent asset names already identify decorative logos to assistive technology. */
  decorative?: boolean;
};

/** One image treatment for original token artwork across the phone and dashboard. */
export function AssetLogo({ assetId, size = 32, className = '', decorative = true }: AssetLogoProps) {
  const logo = ASSET_LOGOS[assetId];
  return <span
    aria-hidden={decorative ? true : undefined}
    style={{ width: size, height: size, '--asset-logo-size': `${size}px` } as CSSProperties}
    className={`${styles.logo} ${className}`.trim()}
    data-asset-logo={assetId}
  ><img
    src={logo.src}
    alt={decorative ? '' : `${logo.name} logo`}
    aria-hidden={decorative ? true : undefined}
    width={size}
    height={size}
    className={styles.artwork}
    decoding="async"
    draggable={false}
  /></span>;
}
