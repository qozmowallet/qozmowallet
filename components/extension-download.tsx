import { faChrome } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { EXTENSION_DOWNLOAD, EXTENSION_VERSION, EXTENSION_MIN_CHROME } from '@/lib/extension-release';
import '../app/extension/extension.css';

export function ExtensionDownload() {
  return <section className="qex-banner container" id="extension" aria-labelledby="extension-heading">
    <div className="qex-banner-copy"><span className="section-eyebrow">YOUR WALLET, A LITTLE CLOSER</span><h2 id="extension-heading">A home in your browser.</h2><p>Quantum on Robinhood. Native SOL and BTC.<br/>Review test transfers in one multichain side panel.</p><span className="qex-release">CHROME {EXTENSION_MIN_CHROME}+ <i/> v{EXTENSION_VERSION} EARLY ACCESS</span></div>
    <div className="qex-banner-action"><span className="qex-chrome-symbol"><FontAwesomeIcon icon={faChrome} aria-hidden="true"/></span><a className="button button-black" href={EXTENSION_DOWNLOAD} download>Download for Chrome <span aria-hidden="true">↓</span></a><a className="qex-install-link" href="/extension/">Installation guide <span aria-hidden="true">↗</span></a><small>ZIP download · Install with Developer mode</small></div>
  </section>;
}
