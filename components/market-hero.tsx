'use client';

import { FloatingPanel } from '@/components/motion-system';
import { ParallaxLayer, ParallaxScene } from '@/components/parallax';
import { MarketPhoneScreen } from '@/components/market-phone-screen';

/** The photograph and live HTML share one coordinate system and all motion. */
export function MarketHero({ onOpenDemo }: { onOpenDemo: () => void }) {
  return <ParallaxScene id="live-assets" className="market-art" pointer aria-label="Qozmo live markets on a phone held in your hand">
    <ParallaxLayer className="phone-depth-layer phone-depth-glow" y={45} pointerDepth={-6} aria-hidden="true">
      <div className="phone-hero-glow"/>
    </ParallaxLayer>
    <ParallaxLayer className="phone-depth-layer phone-depth-handset" y={-34} x={5} rotate={0.6} pointerDepth={8} mobileScale={0.12}>
      <FloatingPanel className="phone-handset" distance={5} duration={8}>
        <div className="phone-angle">
          <div className="phone-canvas">
            <img className="phone-hand-photo" src="/images/hand-phone.png" width={1086} height={1448} alt="" aria-hidden="true" loading="eager" fetchPriority="high" draggable={false}/>
            <div className="phone-screen">
              <div className="phone-screen-fit"><MarketPhoneScreen onOpenDemo={onOpenDemo}/></div>
            </div>
          </div>
        </div>
      </FloatingPanel>
    </ParallaxLayer>
  </ParallaxScene>;
}
