'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Menu, Minus, Plus, X, XTwitter } from '@/components/icons';
import { Brand, QozmoMark } from '@/components/brand';
import { EverydayFeatures } from '@/components/everyday-features';
import { ContractAddress } from '@/components/contract-address';
import { ExtensionDownload } from '@/components/extension-download';
import { LandingEcosystem } from '@/components/landing-ecosystem';
import { MarketHero } from '@/components/market-hero';
import { BorderBeam } from '@/components/magicui/border-beam';
import { FloatingPanel, MotionProvider, useMotionSettings } from '@/components/motion-system';
import { ParallaxLayer, ParallaxScene } from '@/components/parallax';
import { useScrolled } from '@/components/use-scrolled';
import './landing-layout.css';

const faqItems = [
  { q: 'What is Qozmo?', a: 'Qozmo brings live markets and an EVM wallet workspace together. Create one encrypted Qozmo smart account on Robinhood Testnet for public ETH and ERC-20 transfers, Quantum authorization and Privacy Ring. The website shares the same address and unlock session across these features. Privacy notes require an additional encrypted backup; account imports remain read-only.' },
  { q: 'Where do the live prices come from?', a: 'The hero streams public USD market quotes from Kraken for crypto, PAX Gold, stablecoins, and tokenized stocks and ETFs including Apple, NVIDIA, Microsoft, Tesla, S&P 500 and Nasdaq 100. The percentage is the provider’s rolling 24-hour change. Each timestamp shows the latest reported trade; less frequently traded assets can have older quotes even while the feed is connected. If the feed disconnects, the page labels the last received prices and retries automatically.' },
  { q: 'Can I try it before getting started?', a: 'Select “Open wallet” to explore the dashboard and public market data. Create or import a wallet when you are ready to view your own balances. The Cards panel offers a separate 3D concept preview marked Coming soon.' },
  { q: 'Are the card and spending previews real?', a: 'The landing page shows illustrative spending and activity. Card designs are concepts marked Coming soon and cannot be ordered or used for payments. The crypto and RWA prices in the hero are live public market quotes. The dashboard reads your wallet balances; signing is available only for supported testnet transfers.' },
  { q: 'How do I install the Chrome extension?', a: 'Download the extension ZIP, extract it, then open chrome://extensions in Chrome. Enable Developer mode, select Load unpacked, and choose the extracted qozmo-wallet-extension folder. The extension has its own local vault; website data is separate. The Extension section links to the full installation guide.' },
  { q: 'Can I download Qozmo on my phone?', a: 'The Qozmo experience is currently a web preview, designed to work beautifully on mobile and desktop. An iOS or Android app is not available through this page yet.' },
  { q: 'Is there a fee to explore Qozmo?', a: 'The interactive preview is free to explore. Product pricing, supported countries, and payment services will be announced if and when the full wallet launches.' },
];

export default function HomePage() {
  return <MotionProvider><QozmoLandingPage/></MotionProvider>;
}

function QozmoLandingPage() {
  const { enabled } = useMotionSettings();
  const scrolled = useScrolled();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [faq, setFaq] = useState<number | null>(0);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setActiveSection(entry.target.id); });
    }, { rootMargin: '-20% 0px -55% 0px' });
    ['home', 'features', 'ecosystem', 'how-it-works', 'extension', 'faq'].forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    const handleOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const desktop = window.matchMedia('(min-width: 981px)');
    const handleWidth = () => { if (desktop.matches) setMenuOpen(false); };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('pointerdown', handleOutside);
    desktop.addEventListener('change', handleWidth);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('pointerdown', handleOutside);
      desktop.removeEventListener('change', handleWidth);
    };
  }, [menuOpen]);

  const navItems = [{ id: 'features', label: 'Features', href: '#features' }, { id: 'ecosystem', label: 'Ecosystem', href: '#ecosystem' }, { id: 'extension', label: 'Extension', href: '#extension' }, { id: 'faq', label: 'FAQs', href: '#faq' }, { id: 'docs', label: 'Docs', href: '/docs/' }];

  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className={`site-header-shell landing-header${scrolled ? ' is-scrolled' : ''}`} ref={headerRef}>
      <div className="site-header container">
        <Brand/>
        <nav className="desktop-nav" aria-label="Main navigation">{navItems.map(item => <a key={item.id} className={activeSection === item.id ? 'active' : ''} aria-current={activeSection === item.id ? 'location' : undefined} href={item.href}>{item.label}</a>)}</nav>
        <div className="header-actions">
          <a className="button button-black header-cta" href="/dashboard/">Open wallet</a>
          <button ref={menuButtonRef} className="menu-toggle icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="mobile-navigation">{menuOpen ? <X size={19}/> : <Menu size={19}/>}</button>
        </div>
        {menuOpen && <nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation">{navItems.map(item => <a key={item.id} className={activeSection === item.id ? 'active' : ''} aria-current={activeSection === item.id ? 'location' : undefined} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>)}<a className="button button-black" href="/dashboard/">Open wallet</a></nav>}
      </div>
    </header>
    <main id="main" className="landing-main">
    <ParallaxScene className="top-surface" id="home">
        <section className="hero container" aria-labelledby="hero-heading">
          <div className="hero-copy">
            <p className="hero-eyebrow"><span aria-hidden="true"/>A LITTLE MORE CLARITY. A LOT MORE YOU.</p>
            <h1 id="hero-heading">Your assets.<br/>Your space.<br/><span className="gradient-text">Your Qozmo.</span></h1>
            <p className="hero-description">Live markets. A wallet of your own.<br/>Explore crypto and real-world assets, with your keys kept close.</p>
            <div className="hero-buttons"><a className="button button-black button-large" href="/dashboard/">Open wallet <ArrowUpRight size={14}/></a><a className="button button-outline button-large" href="/extension/">Get the extension <ArrowUpRight size={13}/></a></div>
            <p className="hero-note"><span>No sign-up. Encrypted on your device.</span><button type="button" onClick={() => document.getElementById('live-assets')?.scrollIntoView({ behavior: enabled ? 'smooth' : 'auto', block: 'center' })}>Explore live markets <ArrowUpRight size={10}/></button></p>
            <div className="hero-details" aria-label="Wallet highlights"><span><i/>Local keys</span><span><i/>9 EVM networks</span><a href="/dashboard/#quantum"><i/>Quantum testnet <ArrowUpRight size={9}/></a></div>
          </div>
          <div className="hero-art-reveal"><MarketHero onOpenDemo={() => window.location.assign("/dashboard/")}/></div>
        </section>
    </ParallaxScene>

    <LandingEcosystem/>

    <section className="features-section section-space container" id="features" aria-labelledby="features-heading">
      <div className="section-heading"><div><span className="section-eyebrow">THOUGHTFULLY PUT TOGETHER</span><h2 id="features-heading">Little details.<br/>Big difference<span className="pink-dot">.</span></h2></div><p>A clear overview. The details that matter.<br/>And a first look at what comes next.</p></div>
      <EverydayFeatures/>
    </section>

    <section className="how-section" id="how-it-works" aria-labelledby="how-heading"><div className="container how-layout"><ParallaxScene className="how-visual" pointer>
        <ParallaxLayer className="how-depth-layer depth-ring" y={38} rotate={14} pointerDepth={-5} aria-hidden="true"><div className="orbital-ring ring-one"/></ParallaxLayer>
        <ParallaxLayer className="how-depth-layer depth-ring" y={-26} rotate={-12} pointerDepth={-8} aria-hidden="true"><div className="orbital-ring ring-two"/></ParallaxLayer>
        <ParallaxLayer className="how-depth-layer depth-label" y={-42} pointerDepth={12}><div className="orbit-label orbit-top">A fresh perspective</div></ParallaxLayer>
        <ParallaxLayer className="how-depth-layer depth-tile" y={-28} rotate={3} pointerDepth={8}><FloatingPanel className="qozmo-tile" distance={6} duration={8}><QozmoMark/><span>qozmo.</span></FloatingPanel></ParallaxLayer>
        <ParallaxLayer className="how-depth-layer depth-label" y={38} pointerDepth={-10}><div className="orbit-label orbit-bottom">Made for your everyday</div></ParallaxLayer>
        <ParallaxLayer className="how-depth-layer depth-doodle" y={-52} pointerDepth={14} aria-hidden="true"><span className="orbit-dot"/></ParallaxLayer>
      </ParallaxScene><div className="how-content"><span className="section-eyebrow">GOOD THINGS COME SIMPLY</span><h2 id="how-heading">Make yourself<br/>right at home.</h2><p className="how-intro">A familiar feeling. A fresh start.<br/>Get a feel for Qozmo in three little steps.</p><ol className="steps"><li><span className="step-number">01</span><div><h3>Take a look around.</h3><p>Open the dashboard. Explore your wallet workspace.</p></div></li><li><span className="step-number">02</span><div><h3>Find your kind of flow.</h3><p>Explore markets, networks, and your wallet activity.</p></div></li><li><span className="step-number">03</span><div><h3>Choose your next step.</h3><p>Create or import a wallet when you are ready.</p></div></li></ol><a className="text-link" href="/dashboard/">Come on in </a></div></div></section>

    <ExtensionDownload/>

    <section className="faq-section section-space container" id="faq" aria-labelledby="faq-heading"><ParallaxScene className="faq-intro"><span className="section-eyebrow">A LITTLE MORE CLARITY</span><h2 id="faq-heading">Good questions.<br/>Simple answers.</h2><p>A few things you might<br/>be wondering about Qozmo.</p></ParallaxScene><div className="faq-list">{faqItems.map((item,index) => <div key={item.q} className={`faq-item ${faq === index ? 'open' : ''}`}><h3><button aria-expanded={faq === index} aria-controls={`faq-answer-${index}`} onClick={() => setFaq(faq === index ? null : index)} id={`faq-question-${index}`}>{item.q}<span>{faq === index ? <Minus size={17}/> : <Plus size={17}/>}</span></button></h3><div id={`faq-answer-${index}`} className="faq-answer" role="region" aria-labelledby={`faq-question-${index}`} hidden={faq !== index}><p>{item.a}</p></div></div>)}</div></section>

    <ParallaxScene as="section" className="closing-section container" aria-labelledby="closing-heading"><ParallaxLayer className="closing-grid" y={46} mobileScale={0.24} aria-hidden="true"/><BorderBeam size={180} duration={14} colorFrom="#80cbdc" colorTo="#db98c3" borderWidth={1.5} disabled={!enabled}/><span className="section-eyebrow">LESS JUGGLING. MORE LIVING.</span><h2 id="closing-heading">Meet your money’s<br/><span>happy place.</span></h2><p>A little more clarity. A lot more possibility.</p><a className="button button-black button-large" href="/dashboard/">Say hello to Qozmo </a><span className="closing-note">Free to explore. Easy to feel at home.</span></ParallaxScene>

    </main>

    <footer className="site-footer landing-footer container">
      <div className="footer-top">
        <div className="footer-brand-group">
          <Brand/>
          <p>A little wallet. A world of possibility.</p>
        </div>
        <div className="footer-navigation-group">
          <span className="footer-group-title">Explore Qozmo</span>
          <nav aria-label="Footer navigation"><a href="#features">Features</a><a href="#how-it-works">How it works</a><a href="#faq">FAQs</a><a href="/docs/">Documentation</a><a href="/proof/">Proof & status</a><a href="/extension/">Chrome extension</a><a href="/dashboard/">Open wallet</a></nav>
        </div>
        <div className="footer-community-group">
          <span className="footer-group-title">Stay connected</span>
          <a className="footer-x-link" href="https://x.com/qozmowallet" target="_blank" rel="noopener noreferrer" aria-label="Follow Qozmo's official X account @qozmowallet, opens in a new tab">
            <span className="footer-x-symbol"><XTwitter size={16}/></span>
            <span className="footer-x-label"><strong>@qozmowallet</strong><small>Official X account</small></span>
            <ArrowUpRight size={12}/>
          </a>
        </div>
      </div>
      <ContractAddress/>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Qozmo. Made for your everyday.</span>
        <span>Live market quotes · EVM wallet early access.</span>
        <div className="footer-controls"><a href="#home" aria-label="Back to top">Back to top</a></div>
      </div>
    </footer>
  </>;
}
