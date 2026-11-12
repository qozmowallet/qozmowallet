import { appHref } from '@/lib/app-runtime';
import { faArrowRight, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { DIcon } from './ui';

export function QuantumIntro({ unified = false }: { unified?: boolean } = {}) {
  return <section className="qd-quantum-intro qd-qwallet-intro">
    <div className="qd-qwallet-intro-copy">
      <div className="qd-qwallet-intro-top"><span className="qd-eyebrow">QOZMO QUANTUM</span><span className="qd-qwallet-beta">TESTNET BETA</span></div>
      <h2>Your next layer<br/>of self-custody.</h2>
      <p>{unified ? 'Your Qozmo wallet. One shared address.' : 'A separate smart account. One stable address.'}<br/>A fresh signing key for every operation.</p>
      <a href={appHref('/docs/quantum/overview/')} className="qd-qwallet-intro-link">Explore how it works <DIcon icon={faArrowRight} size={12}/></a>
    </div>
    <div className="qd-qwallet-intro-visual" aria-hidden="true">
      <div className="qd-quantum-art qd-quantum-art-large"><span/><span/><span/><span/><i/></div>
      <span className="qd-qwallet-art-label"><DIcon icon={faShieldHalved} size={12}/>ONE-TIME AUTHORIZATION</span>
    </div>
    <div className="qd-qwallet-intro-meta"><span>WOTS authorization</span><span>ERC-4337 smart account</span><span><i/>Robinhood Testnet</span></div>
  </section>;
}

export function QuantumFirstSteps() {
  return <div className="qd-qwallet-first-steps">
    <span className="qd-eyebrow">YOUR FIRST THREE STEPS</span>
    <ol>
      <li><span>01</span><div><strong>Make it yours</strong><p>Create your account and save its recovery phrase.</p></div></li>
      <li><span>02</span><div><strong>Add a little test ETH</strong><p>Receive funds on Robinhood Testnet.</p></div></li>
      <li><span>03</span><div><strong>Connect and send</strong><p>Choose a relay, review your transfer, then confirm.</p></div></li>
    </ol>
  </div>;
}
