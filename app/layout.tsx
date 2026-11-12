import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/manrope';
import '@fortawesome/fontawesome-svg-core/styles.css';
import './icons.css';
import './globals.css';
import './demo.css';
import './magicui.css';
import './qozmo-motion.css';
import './parallax.css';
import './market-hero.css';
import './market-phone.css';
import './landing-refinement.css';
import { QozmoAccountProvider } from '@/components/wallet/account-provider';

export const metadata: Metadata = {
  metadataBase: new URL('https://qozmo-wallet.melodicfinch.chatgpt.site'),
  title: 'Qozmo — Crypto & real-world assets.',
  description: 'Live crypto and real-world asset prices in one clear view. Track Bitcoin, Ethereum, Solana, tokenized gold, and xStocks with Qozmo.',
  openGraph: {
    title: 'Qozmo — Crypto & real-world assets.',
    description: 'Your crypto. Your assets. Your Qozmo. Explore live markets and a fresh wallet experience.',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Qozmo — Crypto & real-world assets.' }],
  },
  icons: {
    icon: [
      { url: '/brand/qozmo-icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/qozmo-icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/brand/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = { themeColor: '#f7f7f5', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><noscript><style>{`.mui-blur-fade{opacity:1!important;filter:none!important;transform:none!important}.qozmo-parallax-layer{transform:none!important}`}</style></noscript><QozmoAccountProvider>{children}</QozmoAccountProvider></body></html>;
}
