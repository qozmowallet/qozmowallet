import { ArrowUpRight } from './icons';

export function LandingEcosystem() {
  return <section className="landing-ecosystem container" id="ecosystem" aria-labelledby="ecosystem-heading">
    <div className="ecosystem-intro">
      <span className="section-eyebrow">AN OPEN WORLD, WITHIN REACH</span>
      <h2 id="ecosystem-heading">A wider world<br/>of onchain.</h2>
      <p>Familiar networks. Open protocols. A little more room to explore.</p>
    </div>
    <div className="ecosystem-links">
      <a className="ecosystem-card ecosystem-robinhood" href="https://docs.robinhood.com/chain/" target="_blank" rel="noopener noreferrer" aria-label="Explore Robinhood Chain documentation, opens in a new tab">
        <div className="ecosystem-card-top"><span>THE NETWORK</span><ArrowUpRight size={15}/></div>
        <h3><img src="/assets/robinhood-chain-wordmark.svg" width={195} height={32} alt="Robinhood Chain" loading="lazy"/></h3>
        <p>An EVM-compatible network for digital assets and Stock Tokens.</p>
        <span className="ecosystem-card-bottom">Explore Robinhood Chain<ArrowUpRight size={14}/></span>
      </a>
      <a className="ecosystem-card ecosystem-uniswap" href="https://app.uniswap.org/" target="_blank" rel="noopener noreferrer" aria-label="Explore the Uniswap interface, opens in a new tab">
        <div className="ecosystem-card-top"><span>THE PROTOCOL</span><ArrowUpRight size={15}/></div>
        <h3><img src="/assets/uniswap-wordmark.svg" width={154} height={36} alt="Uniswap" loading="lazy"/></h3>
        <p>Discover decentralized exchange through the Uniswap interface.</p>
        <span className="ecosystem-card-bottom">Explore Uniswap<ArrowUpRight size={14}/></span>
      </a>
    </div>
  </section>;
}
