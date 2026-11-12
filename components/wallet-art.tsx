'use client';

import { useState, useId } from 'react';
import { ArrowDownLeft, ArrowUpRight, Bell, Linear, Spotify, Check, ChevronDown, ChevronLeft, CreditCard, Eye, EyeOff, Home, MoreHorizontal, Plus, Radio, Send, Sparkles, TrendingUp } from '@/components/icons';
import { HandStar, ScribbleArrow } from './brand';
import { motion } from 'motion/react';
import { BorderBeam } from './magicui/border-beam';
import { FloatingPanel, useMotionSettings } from './motion-system';
import { ParallaxLayer, ParallaxScene } from './parallax';

const chartData = {
  Daily: { amount: '53', cents: '.48', path: 'M0 101C18 112 25 40 47 58S74 115 99 71 122 47 142 57 164 104 187 64 201 18 227 30 249 59 271 17', ticks: ['8am', '10am', '12pm', '2pm', '4pm', '6pm'] },
  Weekly: { amount: '280', cents: '.35', path: 'M0 91C23 109 27 112 37 55S67 39 83 72 111 131 118 65 151 51 168 77 196 122 195 54 218 58 226 40 226 0 246 20 258 59 271 25', ticks: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
  Monthly: { amount: '1,240', cents: '.80', path: 'M0 111C23 97 26 107 46 79S71 91 88 67 116 100 133 55 158 83 180 43 209 72 226 25 255 45 271 8', ticks: ['Week 1', 'Week 2', 'Week 3', 'Week 4'] },
};
type Period = keyof typeof chartData;

export function MiniChart({ period = 'Weekly', className = '' }: { period?: Period; className?: string }) {
  const id = useId().replace(/:/g, '');
  const { enabled } = useMotionSettings();
  return <svg className={`mini-chart ${className}`} viewBox="0 0 272 140" fill="none" role="img" aria-label={`${period} sample spending chart`}>
    <defs><linearGradient id={`${id}line`} x1="0" y1="0" x2="272" y2="0" gradientUnits="userSpaceOnUse"><stop stopColor="#7BD6E7"/><stop offset=".5" stopColor="#C9BAE9"/><stop offset="1" stopColor="#EC8BB7"/></linearGradient><linearGradient id={`${id}area`} x1="0" y1="0" x2="0" y2="140" gradientUnits="userSpaceOnUse"><stop stopColor="#EED7EB" stopOpacity=".45"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient></defs>
    <path d={`${chartData[period].path} L271 140H0Z`} fill={`url(#${id}area)`}/>
    <motion.path key={period} className="animated-chart-line" d={chartData[period].path} stroke={`url(#${id}line)`} strokeWidth="2.7" strokeLinecap="round" initial={enabled ? { pathLength: 0, opacity: 0.4 } : false} whileInView={{ pathLength: 1, opacity: 1 }} viewport={{ once: true }} transition={{ duration: enabled ? 1.1 : 0, delay: enabled ? 0.15 : 0, ease: 'easeOut' }}/>
  </svg>;
}

export function PaymentCard({ mini = false, variant = 'pink' }: { mini?: boolean; variant?: 'pink' | 'blue' | 'dark' }) {
  return <div className={`payment-card card-${variant} ${mini ? 'payment-card-mini' : ''}`}>
    <div className="card-top"><span>qozmo<span>.</span></span><Radio size={20}/></div>
    <div className="card-chip"><span/><span/><span/></div>
    <div className="card-number">•••• &nbsp; •••• &nbsp; •••• &nbsp; 8394</div>
    <div className="card-bottom"><div><small>CARDHOLDER</small><span>Alex Morgan</span></div><div className="card-circles"><i/><i/></div></div>
  </div>;
}

export function WalletArt({ openDemo }: { openDemo: () => void }) {
  const { enabled } = useMotionSettings();
  const [period, setPeriod] = useState<Period>('Weekly');
  const [hidden, setHidden] = useState(false);
  const chart = chartData[period];
  return <ParallaxScene className="wallet-art" pointer aria-label="Qozmo sample wallet preview">
    <ParallaxLayer className="wallet-depth-layer depth-glow" y={72} x={-14} pointerDepth={-8} aria-hidden="true"><div className="art-glow"/></ParallaxLayer>
    <ParallaxLayer className="wallet-depth-layer depth-doodle" y={-36} x={8} rotate={-6} pointerDepth={5} aria-hidden="true"><ScribbleArrow className="hero-arrow"/></ParallaxLayer>
    <ParallaxLayer className="wallet-depth-layer depth-doodle" y={48} rotate={12} pointerDepth={-8} aria-hidden="true"><HandStar className="art-star"/></ParallaxLayer>
    <ParallaxLayer className="wallet-depth-layer depth-wallet" y={-62} x={8} rotate={0.6} pointerDepth={8} mobileScale={0.18}>
    <FloatingPanel className="wallet-window" distance={7} duration={7.5}>
      <BorderBeam size={95} duration={11} colorFrom="#8ecfdf" colorTo="#dd91bd" borderWidth={1.5} disabled={!enabled}/>
      <div className="wallet-topline"><div className="wallet-avatar">a<span/></div><span>Good morning, Alex <span className="wave">✦</span></span><Bell size={17}/></div>
      <div className="wallet-balance-label">Total balance <button className="icon-button tiny" onClick={() => setHidden(!hidden)} aria-label={hidden ? 'Show sample balance' : 'Hide sample balance'}>{hidden ? <EyeOff size={14}/> : <Eye size={14}/>}</button></div>
      <div className="wallet-balance" aria-live="polite">{hidden ? '••••••' : <><span>$</span>23,350<span>.35</span></>}</div>
      <div className="wallet-change"><TrendingUp size={12}/> A fresh perspective on your money</div>
      <div className="card-stack"><div className="card-under under-one"/><div className="card-under under-two"/><PaymentCard/></div>
      <div className="wallet-actions"><button onClick={openDemo}><span><ArrowUpRight size={17}/></span>Send</button><button onClick={openDemo}><span><ArrowDownLeft size={17}/></span>Receive</button><button onClick={openDemo}><span><Plus size={17}/></span>Add money</button><button onClick={openDemo}><span><MoreHorizontal size={17}/></span>More</button></div>
      <div className="recent-heading"><h3>Recent activity</h3><button onClick={openDemo}>View all <ArrowUpRight size={10}/></button></div>
      <div className="hero-transactions">
        <div className="hero-transaction"><span className="merchant-icon spotify"><Spotify size={22}/></span><div><strong>Spotify Premium</strong><span>Subscription</span></div><strong>−$12.99</strong></div>
        <div className="hero-transaction"><span className="merchant-icon transfer"><ArrowDownLeft size={20}/></span><div><strong>From Alex</strong><span>Transfer received</span></div><strong className="positive">+$480.00</strong></div>
        <div className="hero-transaction"><span className="merchant-icon linear"><Linear size={18}/></span><div><strong>Linear</strong><span>Subscription</span></div><strong>−$10.00</strong></div>
      </div>
      <div className="wallet-bottom-nav"><span className="selected"><Home size={17}/></span><CreditCard size={17}/><Send size={16}/><span className="avatar-small">a</span></div>
      <span className="sample-label">Sample wallet</span>
    </FloatingPanel>
    </ParallaxLayer>
    <ParallaxLayer className="wallet-depth-layer depth-spending" y={45} x={-6} rotate={-0.8} pointerDepth={-10} mobileScale={0.22}>
    <FloatingPanel className="spending-window" distance={5} duration={8.5} delay={1.4}>
      <div className="spending-title"><ChevronLeft size={17}/><h3>Spending overview</h3><MoreHorizontal size={17}/></div>
      <div className="period-tabs" role="group" aria-label="Sample spending period">{(Object.keys(chartData) as Period[]).map(p => <button key={p} className={p === period ? 'active' : ''} aria-pressed={p === period} onClick={() => setPeriod(p)}>{p}</button>)}</div>
      <div className="spending-amount" aria-live="polite"><span>$</span>{chart.amount}<span>{chart.cents}</span></div>
      <MiniChart period={period}/>
      <div className="chart-ticks">{chart.ticks.map(t => <span key={t}>{t}</span>)}</div>
      <div className="spending-note"><span className="spending-dot"/>Your everyday, at a glance <Sparkles size={12}/></div>
    </FloatingPanel>
    </ParallaxLayer>
    <ParallaxLayer className="wallet-depth-layer depth-pill" y={-32} pointerDepth={14} mobileScale={0.18}><FloatingPanel className="floating-pill" distance={3} duration={6.5} delay={0.7}><span><Check size={15} strokeWidth={2.6}/></span>A little more peace of mind.</FloatingPanel></ParallaxLayer>
    <div className="art-caption"><span/> A glimpse of your new everyday</div>
  </ParallaxScene>;
}
