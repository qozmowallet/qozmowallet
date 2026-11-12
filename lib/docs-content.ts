export type DocIcon = 'welcome' | 'rocket' | 'wallet' | 'key' | 'receive' | 'send' | 'layers' | 'assets' | 'network' | 'quantum' | 'shield' | 'backup' | 'activity' | 'code' | 'help';
export type DocBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'steps'; items: { title: string; text: string }[] }
  | { type: 'callout'; tone: 'info' | 'tip' | 'warning'; title: string; text: string }
  | { type: 'cards'; items: { title: string; text: string; href: string; icon: DocIcon }[] }
  | { type: 'table'; columns: string[]; rows: string[][] }
  | { type: 'code'; language: string; text: string };
export type DocSection = { id: string; title: string; blocks: DocBlock[] };
export type DocPage = { slug: string; title: string; navTitle?: string; description: string; group: string; icon: DocIcon; readTime: string; sections: DocSection[] };
const p = (text: string): DocBlock => ({ type: 'paragraph', text });
const list = (...items: string[]): DocBlock => ({ type: 'list', items });
const note = (tone: 'info' | 'tip' | 'warning', title: string, text: string): DocBlock => ({ type: 'callout', tone, title, text });
const steps = (...items: [string,string][]): DocBlock => ({ type: 'steps', items: items.map(([title,text]) => ({ title,text })) });
const table = (columns: string[], rows: string[][]): DocBlock => ({ type: 'table', columns, rows });
const section = (id: string, title: string, ...blocks: DocBlock[]): DocSection => ({ id,title,blocks });
export const DOC_GROUPS = ['Start here','Your wallet','Assets & networks','Qozmo Quantum','Resources'] as const;

export const DOC_PAGES: DocPage[] = [
  {
    slug:'multichain',title:'One extension, separate accounts',navTitle:'Multichain extension',description:'Use Robinhood Quantum, native Solana Devnet and Bitcoin Signet without mixing accounts or recovery systems.',group:'Assets & networks',icon:'network',readTime:'5 min',
    sections:[
      section('account-boundaries','Choose the right account',
        p('The extension network picker switches between **Robinhood Quantum**, **Solana Devnet** and **Bitcoin Signet**. Switching networks locks the current session. It does not bridge assets.'),
        table(['Account','Authorization','Recovery'],[
          ['Robinhood Quantum · 46630','WOTS smart account / ERC-4337','Separate Quantum phrase, archive and original signing history. Restored accounts stay read-only.'],
          ['Native SOL · Devnet','Standard Ed25519','Standard EVM vault; Solana path m/44\'/501\'/0\'/0\'.'],
          ['Native BTC · Signet','Standard ECDSA / P2WPKH SegWit','Standard EVM vault; Bitcoin path m/84\'/1\'/0\'/0/0.'],
        ]),
        note('info','WOTS stays on Robinhood','Native SOL and BTC do not use WOTS and are not described as quantum resistant. Their addresses and standard recovery vault are separate from Quantum. Never import a Quantum phrase into standard wallet setup.')),
      section('receive-and-send','Receive and send test assets',
        steps(['Select a network','Use Chrome 137+ and select Solana Devnet or Bitcoin Signet from the extension network picker.'],['Unlock the standard vault','Use the existing standard EVM vault password, or create/import a standard vault if none is saved. The extension and website have separate storage origins.'],['Receive test funds','Copy the complete address from Receive and check the network label. The address QR does not choose the sender’s network.'],['Prepare and review','Enter the recipient and amount. SOL is simulated; BTC inputs and fee/change are checked. Inspect the exact amount, recipient, network and fee, then confirm with the standard password.'],['Check confirmation','Submitted is not confirmed. Check the stored transaction in Activity and follow its explorer link. An uncertain submission is preserved and never automatically retried.'])),
      section('transfer-limits','Know this release’s boundaries',
        list('SOL transfers support ordinary on-curve System Program accounts and up to nine decimal places. The fee and blockhash are rechecked before signing.', 'BTC sends use confirmed, unspent P2WPKH inputs, Signet SegWit/Taproot destinations, at least 546 sats, 1–100 sat/vB and a 100,000-sat fee cap. Coinbase maturity is checked.', 'The first Solana account and one Bitcoin receive/change address are derived. Other paths, Bitcoin address discovery and BIP-39 passphrases are not implemented.', 'Native mainnet signing, SPL/Token-2022, Bitcoin tokens, bridging, swaps and dapp provider injection are not enabled.', 'Native Activity contains outgoing transactions created by this installation; network balances/statuses rely on the configured RPC/indexer. It is not a local full-node/SPV verifier.')),
      section('backups','Keep both backups',
        p('Export the **encrypted standard backup** from native Security for the documented EVM, Solana and Bitcoin paths. Export a separate **Quantum archive** from the Quantum account. Preserve both passwords and keep the Quantum signing history current.'),
        note('info','Implementation is separate from live evidence','Automated tests use public development vectors and mocked network services. A funded transaction from an installed extension still needs to be demonstrated separately.')),
    ],
  },
  {
    slug: '', title: 'Welcome to Qozmo', navTitle: 'Welcome', description: 'A little clarity for your wallet. Everything you need to get started, explore your assets, and understand Qozmo Quantum.', group: 'Start here', icon: 'welcome', readTime: '3 min',
    sections: [
      section('a-clearer-view','Your assets. A clearer view.',
        p('Welcome to **Qozmo** — a self-custodial wallet workspace for one Qozmo smart account, crypto markets, Quantum authorization and Privacy Ring. These guides help you find your way, understand each account, and make informed moves.'),
        p('New here? Start with the quickstart. Already exploring hash-based accounts? Head straight to Qozmo Quantum.'),
        note('info','Know your workspace','The website uses one smart account and unlock session for Wallet, Quantum and Privacy Ring. Older EOA vaults remain preserved in Settings; their assets are not moved automatically.')),
      section('find-your-start','Find your starting point',
        { type:'cards', items:[
          {title:'Quickstart',text:'Set up your workspace and make your first move.',href:'/docs/quickstart/',icon:'rocket'},
          {title:'Your Qozmo wallet',text:'Create an account, receive assets, and manage your backup.',href:'/docs/wallet/create/',icon:'wallet'},
          {title:'Qozmo Quantum',text:'The same wallet, secured with one-time hash-based authorization.',href:'/docs/quantum/overview/',icon:'quantum'},
          {title:'Assets & markets',text:'Understand crypto, gold, stocks, ETFs, and stablecoins.',href:'/docs/assets/',icon:'assets'},
          {title:'Backups & recovery',text:'Learn what each backup restores and how to keep it.',href:'/docs/wallet/backup/',icon:'backup'},
          {title:'Frequently asked questions',text:'Clear answers to the most common Qozmo questions.',href:'/docs/faq/',icon:'help'},
        ] }),
      section('available-today','What you can do today',
        table(['Workspace','Available today'],[
          ['Everyday wallet','Create one WOTS smart account on Robinhood Testnet, receive and send ETH/ERC-20, and export account archives.'],
          ['Assets & markets','Follow crypto and tokenized-asset quotes; read curated ERC-20 holdings on Ethereum and Robinhood Chain.'],
          ['Qozmo Quantum','Create a WOTS smart account, receive and send test ETH/ERC-20, inspect activity, retry pending operations, and export encrypted archives.'],
          ['Explore DeFi','Discover protocols and their public TVL, with links to external applications.'],
        ]),
        p('Wallet and Privacy Ring signing are limited to **Robinhood Testnet (46630)**. Mainnet transfers, swaps, approvals and staking remain disabled. Imported quantum accounts stay read-only. Read [release scope](/docs/security/) for the current boundaries.')),
    ],
  },
  {
    slug:'quickstart',title:'A fresh start with Qozmo',navTitle:'Quickstart',description:'From opening the app to choosing the right account, in a few simple steps.',group:'Start here',icon:'rocket',readTime:'4 min',
    sections:[
      section('choose-your-path','Choose your path',p('Open the [Qozmo dashboard](/dashboard/). You can explore market prices and protocol information before creating a wallet. When ready, create one account for every website feature.'),table(['I want to…','Start here'],[['Explore balances and supported EVM networks','Create your Qozmo smart account once.'],['Try a hash-based smart account','Open Wallet & security on Robinhood Testnet; it uses that same account.'],['Browse market prices','Use Overview or My assets; quotes are independent from holdings.'] ])),
      section('everyday-quickstart','Start with your Qozmo wallet',steps(
        ['Create your account','Select **Create wallet**. Enter a name and a password of at least 12 characters.'],
        ['Save your recovery phrase','Write down the 24 words in order, offline. Confirm the requested words before the encrypted vault is saved.'],
        ['Choose a network','Use Robinhood Testnet (46630) for this smart account. Other networks are observation only.'],
        ['Receive, then review','Open Receive for the canonical Robinhood Testnet address. Send opens Wallet & security, where you connect a relay, review and confirm with the same wallet password.']
      ),p('See [create a wallet](/docs/wallet/create/) and [send a testnet transfer](/docs/wallet/send/) for the complete flow.')),
      section('quantum-quickstart','Try Qozmo Quantum',steps(
        ['Open Wallet & security','Your existing Qozmo account appears automatically. Do not create another wallet.'],
        ['Use the same account','If no account exists, Create wallet opens the shared setup.'],
        ['Receive test ETH','Use the quantum receive address. Its first transfer also deploys the smart account and needs test ETH for fees.'],
        ['Connect a relay','Connect a compatible HTTPS bundler or a browser wallet acting as the gas payer. Review the transfer before signing.']
      ),note('tip','One account, distinct backup data','Keep the encrypted account archive and encrypted privacy note backup. The phrase alone cannot reconstruct random note secrets or establish safe WOTS signing after a restore.')),
    ],
  },
  {
    slug:'concepts',title:'The basics, made clearer',navTitle:'Core concepts',description:'Accounts, networks, tokens, and the ideas behind your Qozmo workspace.',group:'Start here',icon:'layers',readTime:'5 min',
    sections:[
      section('self-custody','What self-custody means',p('Your wallet’s signing secret gives access to its account. Qozmo encrypts saved secrets in your browser using your password. While unlocked, the app can use the secret for the actions you explicitly confirm.'),p('There is no password-reset service for this local vault. Your recovery material matters independently from the password that unlocks this browser.')),
      section('account-types','One account, connected features',table(['Feature','Role'],[['Wallet','The public smart-account balance and transfers'],['Quantum','WOTS authorization and one-time-key history for that account'],['Privacy Ring','Encrypted notes, fixed-denomination deposits and local proofs'],['Previous EOA','Preserved archive; no automatic migration']])),
      section('networks-and-gas','Networks and gas',p('An address can look the same on multiple EVM networks, but its balances are separate. **Gas** is the network fee for processing an operation. Ethereum and Robinhood Chain use ETH; Polygon’s native gas token is POL.'),p('A network selector changes which chain you are viewing. It does not bridge assets or change their ownership.')),
      section('quotes-and-holdings','Quotes are not holdings',p('A market quote shows a provider’s reported asset price. A holding is a balance read from your address on a particular chain and contract. A token symbol by itself does not identify a contract.'),p('Kraken xStocks and Robinhood-issued stock tokens are different products. Qozmo keeps their quotes and account holdings separate.')),
      section('quantum-meaning','What “quantum” refers to',p('Qozmo Quantum uses hash-based account authorization. Each operation uses a one-time key and commits to the key that follows it. This property applies to authorization of that smart account; it does not make the browser, device, relay, or network consensus quantum-safe.'),p('Read [how Qozmo Quantum works](/docs/quantum/overview/) before funding a testnet account.')),
    ],
  },
  {
    slug:'wallet/create',title:'Create your Qozmo wallet',navTitle:'Create a wallet',description:'Create one smart account for Wallet, Quantum and Privacy Ring.',group:'Your wallet',icon:'wallet',readTime:'4 min',
    sections:[
      section('before-you-start','Before you start',p('Open Qozmo over HTTPS or localhost in an up-to-date browser. Use a device you trust, and have a private place to record your recovery phrase. This setup creates the website’s canonical WOTS smart account. Wallet, Quantum and Privacy Ring share its address and unlock session.')),
      section('create','Create and confirm',steps(['Open wallet setup','Select **Create wallet** from the dashboard.'],['Name and encrypt','Enter an account name and a password with at least 12 characters.'],['Record the phrase','Reveal the 24-word phrase and write each word in its numbered position.'],['Confirm your copy','Enter the three randomly selected word positions shown on screen. The encrypted vault is saved only after confirmation.'])),
      section('your-address','Your account address',p('The address is predicted from the pinned smart-account factory and initial WOTS commitments. It is stable before and after deployment and shared by Receive, Wallet & security, payments and Privacy Ring.'),p('Receive funds only on Robinhood Testnet (46630). Its first operation can deploy the smart account. Network selection does not activate it on another chain.')),
      section('locking','Locking your wallet',p('Use **Lock wallet** when you are finished. Reloading, page exit, relevant cross-tab vault changes, and five minutes of inactivity clear the shared unlocked session, including access to decrypted privacy notes.'),p('Saved vault data is encrypted. Browser/device compromise while unlocked is outside what local encryption can protect.')),
    ],
  },
  {
    slug:'wallet/backup',title:'Back up and restore',navTitle:'Backup & import',description:'Understand recovery phrases, encrypted files, and what each one restores.',group:'Your wallet',icon:'backup',readTime:'5 min',
    sections:[
      section('two-backups','Know your backups',table(['Backup','Purpose'],[['Account phrase','Restores account identity for read-only access; cannot establish complete key history'],['Complete wallet backup','One encrypted file with account archive, known signing history and authenticated privacy notes; imports remain read-only'],['Encrypted account archive','Legacy account-only archive; back up notes separately'],['Encrypted account notes','Random privacy note secrets, encrypted specifically for the same wallet'],['Previous EOA archive','Preserved separately in Settings; not the canonical website account']])),
      section('export','Use Backup Center',steps(['Open Backup Center','Unlock your shared Qozmo account and open the sidebar Backup Center.'],['Download complete backup','Confirm the existing wallet password to package the account, known signing history and privacy notes in one encrypted file.'],['Check freshness and completeness','The center shows when the file was downloaded and whether local data changed. Select a file and its password to authenticate both contained archives without importing.'])),
      section('import','Import a Qozmo account',p('Choose Import wallet when no Qozmo account is stored. Supply the supported 24-word Qozmo phrase, encrypted WOTS archive or complete wallet backup. A complete file restores its authenticated notes too. Imports remain read-only. Existing accounts and earlier EOA vaults are preserved. In Privacy Ring, restore this same wallet’s encrypted note backup after unlocking.')),
      section('quantum-difference','Quantum recovery is different',p('A one-time-signature account must remember every exposed signing key, including operations that never confirmed. A phrase alone cannot restore complete signing history. Even an encrypted archive records only history known to its exporting storage.'),p('Quantum imports therefore remain read-only. See [quantum archives and recovery](/docs/quantum/backup/) before importing.')),
    ],
  },
  {
    slug:'wallet/receive',title:'Receive on the right network',navTitle:'Receive assets',description:'Find your address and keep the account, network, and token contract aligned.',group:'Your wallet',icon:'receive',readTime:'3 min',
    sections:[
      section('receive','Use your receive address',steps(['Select the network','Choose the chain the sender will use.'],['Open Receive','Copy the address or display its QR code.'],['Check before sending','Confirm the full destination, network, and asset contract on the sending wallet.'],['Check the balance','Refresh Qozmo’s network balances or follow the address link to the explorer.'])),
      section('what-you-see','What appears in Qozmo',p('Native balances are read through chain RPCs. Curated token balances are available for supported issuer contracts on Ethereum and Robinhood Chain. A token that is absent from the catalog may still exist at your address; check the appropriate chain explorer.'),p('Incoming transfers and transactions made on other devices are not fully indexed by the local Activity list. The explorer gives a broader account history.')),
      section('quantum-address','Receiving into Qozmo Quantum',p('Receive and Wallet & security show the same smart-account address. Privacy Ring deposits originate from it and withdrawals return to it. The address can receive test ETH before its first operation deploys the account.'),note('warning','Quantum is testnet-only','Send quantum test assets on Robinhood Testnet (46630). The quantum receive address is not an instruction to send mainnet assets.')),
    ],
  },
  {
    slug:'wallet/send',title:'Review your next move',navTitle:'Send & activity',description:'Prepare a native testnet transfer and understand its status.',group:'Your wallet',icon:'send',readTime:'4 min',
    sections:[
      section('supported','What can be sent',p('The Qozmo account sends test ETH and manually checked ERC-20 tokens on Robinhood Testnet. The overview Send button opens the same [WOTS transfer flow](/docs/quantum/transfers/). Mainnet signing remains disabled.')),
      section('review','Send a native testnet transfer',steps(['Enter the destination','Open Send and provide a valid non-zero recipient address and decimal amount.'],['Review the details','Check the full amount, network, balance, nonce, and estimated fee. Leave enough native currency for gas.'],['Confirm with your password','Qozmo signs locally after the review checks. A review expires after two minutes.'],['Follow the receipt','Activity retains the transaction hash and monitors its receipt. Use the explorer link for independent chain details.'])),
      section('pending','Pending does not mean failed',p('A missing RPC response after broadcast can leave submission uncertain. Keep the transaction hash and check its explorer status before trying anything again. Qozmo does not automatically create a second transfer to compensate for a timeout.')),
      section('activity','Read your shared activity',table(['Status','Meaning'],[['Pending / check explorer','Submission or confirmation is still unresolved.'],['Confirmed','The native transaction succeeded according to its receipt.'],['Reverted','The transaction was included but failed execution. A network fee may still have been charged.']]),p('Activity shows the shared account’s known signing history and separately verified execution. It is not a full incoming-transaction or multi-device indexer.')),
    ],
  },
  {
    slug:'privacy',title:'Privacy Ring in your wallet',navTitle:'Privacy Ring',description:'Use the same account for public transfers and fixed-denomination privacy research.',group:'Your wallet',icon:'shield',readTime:'4 min',
    sections:[
      section('one-account','One wallet throughout Qozmo',p('Unlock your existing Qozmo wallet in Privacy Ring. Its address, WOTS journal and relay connection are shared with Wallet & security. No second wallet or note password is created. The shared pool contract is protocol infrastructure.')),
      section('deposit','Protect, back up, then deposit',steps(['Receive test ETH','Fund the Qozmo address on Robinhood Testnet for 0.001 ETH plus account gas.'],['Create protected note','The app checks pool/prover availability and durably encrypts a random note for your account.'],['Back up your wallet','Open Backup Center for one complete encrypted file, or retain the notes-only and account-only files.'],['Review deposit','Connect the shared relay, review the pool, amount and maximum fee, and confirm with the same wallet password.'])),
      section('withdraw','Verify, prove and withdraw',p('Use Verify notes onchain to reconstruct confirmed deposits and unspent status. Select a funded note, download its backup, then choose Prove & review withdrawal. A browser worker generates and locally verifies the proof. The next WOTS key authorizes the pool call and the full 0.001 ETH returns to your Qozmo account.')),
      section('boundaries','Understand the evidence',p('The interface links your verified operation receipt. The expandable recorded demo is an earlier, separate research run. Returning to the same account publicly links the endpoints and makes no anonymity claim. Amounts and timing remain public; Groth16 is not quantum-resistant. Restored accounts remain read-only.')),
    ],
  },
  {
    slug:'assets',title:'More than crypto',navTitle:'Assets & markets',description:'Explore tokenized stocks, ETFs, gold, and stablecoins alongside crypto.',group:'Assets & networks',icon:'assets',readTime:'4 min',
    sections:[
      section('categories','Find an asset category',p('Use the **All assets, Crypto, Stocks, ETFs, Gold, and Stablecoins** filters to focus your view. Search matches asset names and symbols in the market and holdings panels.'),table(['Category','Examples in Qozmo'],[['Crypto','BTC, ETH, SOL; WETH in the Robinhood holdings catalog'],['Stocks','Apple, NVIDIA, Microsoft, Tesla tokenized products'],['ETFs','S&P 500 / SPY and Nasdaq 100 / QQQ tokenized products'],['Gold','PAX Gold (PAXG)'],['Stablecoins','USDC on Ethereum; USDG on Robinhood Chain']])),
      section('holdings','Read your token holdings',p('The **Beyond crypto** panel reads supported contracts on the selected chain. Ethereum includes PAXG and USDC. Robinhood Chain includes AAPL, NVDA, MSFT, TSLA, SPY, QQQ, USDG, and WETH. Each row links to its specific contract.'),p('Successful zero balances appear as zero. Failed RPC or contract reads remain unavailable. Qozmo does not reuse mainnet token addresses as testnet holdings.')),
      section('prices','Understand market prices',p('Market watch streams public Kraken ticker quotes. Historical charts request real OHLC data; unavailable history is not replaced with synthetic prices. Each last-trade timestamp refers to the provider’s reported trade, which can be older for less active markets.'),note('info','Different issuers, different tokens','A Kraken xStock quote is not a Robinhood token quote. Qozmo does not use xStocks prices to assign a USD value to Robinhood-issued holdings.')),
      section('units','Token units and underlying assets',p('Holdings show raw token units using the token’s decimals. Robinhood stock tokens may have corporate-action multipliers; raw units are not necessarily the same as underlying share counts. Tokenized products also have issuer-specific rights and restrictions.')),
    ],
  },
  {
    slug:'networks',title:'Your networks, clearly mapped',navTitle:'Supported networks',description:'See where you can view balances and where transaction signing is available.',group:'Assets & networks',icon:'network',readTime:'4 min',
    sections:[
      section('supported-networks','Account network support',table(['Network','Qozmo smart-account support'],[['Robinhood Testnet · 46630','ETH/ERC-20 signing, receive, payments and Privacy Ring'],['Other configured EVM networks','Observation only; no activated account deployment/signing']])),
      section('quantum-network','The quantum network',p('Qozmo Quantum uses **Robinhood Testnet (46630)**. Its adapter checks chain identity, deployment bytecode, and factory/EntryPoint links before signing. Selecting another network does not enable signing or deployment there.'),p('Wallet & security offers the supported testnet workspace. Switching dashboard features preserves the shared session; locking, inactivity or a full page exit clears it.')),
      section('switching','Switching is not bridging',p('Your balance is specific to its chain. Changing the selector does not move a token between Ethereum, Robinhood Chain, or another network. Qozmo does not currently execute bridge transactions.')),
      section('connection','If a network is unavailable',p('Public RPCs may be rate limited or temporarily unavailable. Refresh the balance or retry the connection. Qozmo preserves unavailable states rather than substituting zero. A chain-ID mismatch blocks operations.'),p('For quantum service issues, follow [troubleshooting](/docs/troubleshooting/).')),
    ],
  },
  {
    slug:'quantum/overview',title:'Meet Qozmo Quantum',navTitle:'How Quantum works',description:'One Qozmo account. One stable address. A fresh signing key for every operation.',group:'Qozmo Quantum',icon:'quantum',readTime:'5 min',
    sections:[
      section('a-separate-account','Your shared smart account',p('Qozmo Quantum is an ERC-4337 smart account authorized by **WOTS / Keccak-256** hash-based signatures. This is the same account used by the website Wallet and Privacy Ring. Its phrase, encrypted vault and signing history are shared across those features. Assets at an older EOA address remain there until explicitly moved.')),
      section('one-time-keys','Why one-time keys matter',steps(['Prepare an operation','Qozmo builds the requested transfer and estimates its network requirements.'],['Review and confirm','You review the account, recipient, token, amount, network, and maximum fee, then confirm with the quantum password.'],['Sign and record','A one-time key signs the operation and its successor commitment. The full signed bytes are saved before submission.'],['Verify execution','The operation is relayed to EntryPoint. Qozmo checks execution evidence separately from the key’s retirement.'])),
      section('the-journal','Your signing journal',p('A one-time key must not authorize two different messages. Qozmo keeps a write-ahead journal, serializes signing across same-origin tabs, and blocks conflicting signatures. If submission becomes uncertain, the journal retains exactly what was signed.'),note('warning','A key can be consumed even when execution fails','A reverted transfer does not make its one-time signing key available again. Qozmo preserves the exposure record and checks execution separately.')),
      section('current-scope','Current release',list('Signing: Robinhood Testnet (46630), test assets only.','Transfers: native ETH and manually checked ERC-20 contracts.','Imports: read-only, including after reload.','Connections: a compatible HTTPS bundler or a browser gas-payer wallet.','Privacy Ring supports fixed-denomination deposit and withdrawal through the same account. Private-to-private transfers, mainnet signing, restored-account spending, swaps, bridges, sponsorship and XMSS remain unavailable.'),p('Start with [create a quantum account](/docs/quantum/create/).')),
    ],
  },
  {
    slug:'quantum/create',title:'Create your quantum wallet',navTitle:'Set up Quantum',description:'Create once and use the same account throughout the website.',group:'Qozmo Quantum',icon:'key',readTime:'4 min',
    sections:[
      section('open','Open the quantum workspace',p('In the dashboard, choose **Wallet & security**. Your Qozmo account is already connected here. If no account exists, Create wallet opens the shared setup.')),
      section('fresh-account','Create a fresh account',steps(['Choose Create wallet','Use HTTPS or localhost in a browser with secure randomness and Web Locks support.'],['Choose a name and password','Use at least 12 characters for the quantum password.'],['Save the account phrase','Write down the new 24 words in order and retain them offline. This phrase belongs to your Qozmo smart account; do not use it on another signing interface/network.'],['Confirm and encrypt','Confirm the three randomly selected word positions shown on screen. After Qozmo saves its encrypted record and initializes the signing journal, a success dialog confirms the account is ready. Choose **Explore my wallet** or **View receive address**.'])),
      section('receive','Receive before your first transfer',p('Select **View address** or the QR preview to open the receive dialog and copy the full quantum address. It is a deterministic smart-account address and can receive test assets before deployment. Its first transfer includes account deployment and requires test ETH at that address.'),p('The testnet faucet link opens an external service. A zero balance means no test ETH was found; an unavailable balance indicates a failed read.')),
      section('original-device','Keep your original signing device',p('Keep this browser’s account and journal together. Importing the phrase or archive into another location opens a read-only account. Known history in a backup cannot prove that no other device has exposed a one-time key.'),p('Export a new [encrypted quantum archive](/docs/quantum/backup/) after signing.')),
    ],
  },
  {
    slug:'quantum/transfers',title:'Make a quantum transfer',navTitle:'Transfers & relays',description:'Connect a relay, review exact transfer details, and confirm with your quantum password.',group:'Qozmo Quantum',icon:'send',readTime:'6 min',
    sections:[
      section('connect','Choose a transaction connection',table(['Connection','What it does','What you provide'],[['Browser gas payer','A connected extension relays the signed quantum operation through EntryPoint. It separately reviews/fronts the outer transaction fee.','An explicitly connected browser account on Robinhood Testnet'],['ERC-4337 bundler','A compatible service estimates and relays UserOperations.','Your HTTPS endpoint supporting chain 46630 and EntryPoint v0.7']]),p('Choose **Browser wallet** or **HTTPS bundler** in the connection panel, then connect the selected method. The quantum signing seed stays in Qozmo. Bundler endpoint details remain in this unlocked session and are cleared on lock. Provider CORS and service availability can affect browser access.')),
      section('prepare','Prepare the asset and recipient',steps(['Choose ETH or ERC-20','For an ERC-20, enter its testnet contract and use **Check token and balance**. Symbols and decimals are read from the contract; the token remains labeled unverified.'],['Enter the destination','Use the full recipient address and a positive amount within the asset’s decimal precision.'],['Review the operation','Check the quantum sender, recipient, asset contract, exact amount, network, maximum account fee, and whether first-operation deployment is included.'],['Confirm your password','Qozmo rechecks account state, fee requirements, nonce, deployment, balance and execution before signing.'])),
      section('review-rules','When a new review is needed',p('A review expires after two minutes. Changes in nonce, deployment or increased fee/gas requirements require a fresh review. Qozmo signs the originally reviewed operation rather than silently changing it.'),p('For an undeployed account, balances are checked and account deployment is included. Explicit false-returning ERC-20 calls are rejected before signing when detected by the preview.')),
      section('confirmation','After submission',p('Qozmo checks the EntryPoint operation event and canonical receipt. A successful outer transaction alone does not establish successful transfer execution. The Activity view distinguishes verified execution from a merely consumed key.'),p('If the service response is lost, follow [pending operations](/docs/quantum/pending/). Do not create a new message with the exposed key.')),
    ],
  },
  {
    slug:'quantum/pending',title:'When an operation is pending',navTitle:'Pending & activity',description:'Keep the original signed operation and resolve its state without reusing a key.',group:'Qozmo Quantum',icon:'activity',readTime:'4 min',
    sections:[
      section('what-pending-means','Why an operation can stay pending',p('A signature can be saved before a relay accepts it, or a network response can be lost after submission. In either case, the one-time key may already be exposed. A timeout is not proof that nothing happened.')),
      section('resolve','Refresh, then review an exact retry',steps(['Keep the account and journal','Do not clear browser storage or replace the saved account to make the pending state disappear.'],['Refresh status','Qozmo reads the chain and reconciles known key state. Use the explorer address or known transaction link for additional detail.'],['Inspect the signed operation','The pending panel shows its operation hash and stored public signed fields.'],['Retry exact bytes if appropriate','With a relay connected, select **Review exact retry** and confirm your password. Qozmo resubmits the stored operation without creating a new signature.'])),
      section('statuses','Read execution status',table(['Activity label','Meaning'],[['Execution succeeded','Verified operation evidence reports successful execution.'],['Execution reverted','The operation was included but its execution failed; the key was consumed.'],['Pending / check explorer','The signature is retained and its final outcome is unresolved.'],['Key consumed / verify execution','Key state advanced, but a matching successful execution receipt has not been verified.']])),
      section('unresolved','If it cannot be resolved',p('Preserve the original device, encrypted archives and journal. Exact retry retains the original fee fields; it does not raise fees or rotate a recovery authority. Qozmo does not expose a recovery-activation override or clear the one-time-key record.')),
    ],
  },
  {
    slug:'quantum/backup',title:'Protect your quantum history',navTitle:'Archives & recovery',description:'Export an encrypted archive and understand why imports remain read-only.',group:'Qozmo Quantum',icon:'backup',readTime:'5 min',
    sections:[
      section('export','Export a quantum archive',steps(['Unlock Wallet & security','Use your quantum account password on the original device.'],['Choose Export archive','Confirm the quantum password again.'],['Keep the downloaded file','The archive includes the seed, account identity/salt, and signing history known to this storage, all encrypted.'],['Export again after signing','New operations expose new keys. Retain newer archives and keep the password separately.'])),
      section('import','Import a phrase or archive',p('Choose **Import quantum account** on a browser with no existing quantum account. Enter the original 24-word phrase, or select a Qozmo/compatible WOTS encrypted archive and enter its password. The network and account version must match the supported testnet deployment.'),p('Archive imports retain known operation history. A phrase alone restores account identity with its default salt, but not known signing exposure or a custom salt from an archive. Existing quantum accounts are not silently overwritten.')),
      section('read-only','Why read-only is intentional',p('An authenticated backup can still be older than the latest key exposure or incomplete across devices. A phrase or archive therefore cannot establish safe permission to sign with a stateful one-time key.'),note('info','Importing does not reactivate spending','Imported quantum accounts remain read-only after reload. Editing the stored read-only flag invalidates authenticated vault data. The original signing device and complete known history must be preserved.')),
      section('limits','What recovery does not promise',p('This release does not activate lost-device spending recovery or claim rollback-proof browser storage. It does not provide an ECDSA recovery backdoor. The separate recovery-key index is account state, not a button that makes an old restored copy safe to use.')),
    ],
  },
  {
    slug:'security',title:'Know what is protected',navTitle:'Security & scope',description:'Understand encryption, account authorization, and the current release boundaries.',group:'Resources',icon:'shield',readTime:'5 min',
    sections:[
      section('local-encryption','Local vault encryption',p('Qozmo uses WebCrypto PBKDF2-SHA-256 with 600,000 iterations and a fresh salt, then AES-256-GCM with a fresh IV. Saved secret material is encrypted. The quantum vault also authenticates its identity, chain, genesis commitments, salt, and read-only policy.'),p('Unlocking keeps secrets in JavaScript memory for the active session. JavaScript cannot guarantee erasure of every runtime copy. Encryption while locked does not protect against a compromised device or malicious code while unlocked.')),
      section('account-authorization','Authorization belongs to an account',p('The website uses one WOTS smart account for public and Privacy Ring operations. AES-GCM note keys are domain-separated from signing keys. Groth16 proofs are not quantum-resistant. Existing EOA vaults and native extension accounts keep their original authorization.')),
      section('release-scope','Current release boundaries',table(['Capability','Status'],[['Other-network balance observations','Available through configured RPCs'],['Mainnet signing','Disabled'],['Unified public and privacy operations','Robinhood Testnet only'],['Quantum ETH/ERC-20 signing','Robinhood Testnet only'],['Imported quantum spending','Blocked; read-only'],['Swaps, approvals, bridge and staking execution','Not enabled in the Qozmo UI'],['Independent audit / production certification','Not claimed']])),
      section('practical-care','Keep your recovery material private',list('Record phrases offline and identify which account/network they belong to.','Keep encrypted files and passwords separately.','For Quantum, keep one original signing device and preserve its journal.','Do not clear an unresolved signed operation just because its relay timed out.','Use the selected chain’s explorer to inspect account or transaction details.')),
    ],
  },
  {
    slug:'troubleshooting',title:'A little help, when you need it',navTitle:'Troubleshooting',description:'Work through connection, balance, relay, backup, and pending-operation issues.',group:'Resources',icon:'help',readTime:'5 min',
    sections:[
      section('connection','Balances or prices are unavailable',p('Check your internet connection and selected network. Public RPCs and data providers may be rate limited, regionally restricted, or unavailable. Retry the balance or reconnect the market feed. An unavailable balance is not a zero balance.'),p('A connected feed can still show an older last-trade time for an inactive asset. Disconnected prices remain labeled as last received.')),
      section('secure-context','Secure context or Web Locks errors',p('Use HTTPS or localhost in a current browser. Quantum creation and signing require secure browser cryptography and Web Locks. An unsupported browser does not receive an unsafe local-only signing fallback.')),
      section('bundler','A bundler will not connect',list('Use an HTTPS endpoint without URL user-info or fragments.','Check that it reports chain 46630 and supports EntryPoint v0.7.','Check the provider’s CORS, authentication, rate limits and account/service availability.','Enter the endpoint in the current Quantum session; Qozmo does not bundle a provider API key.','Alternatively, explicitly connect a browser gas-payer wallet on Robinhood Testnet.')),
      section('review','A transfer review was rejected',p('Review again if the two-minute review window expired, the nonce changed, deployment state changed, or required gas/fees increased. For a token, confirm its chain, contract, decimals, available balance, and execution preview.')),
      section('backup','A backup or password is rejected',p('Check whether you selected an everyday EVM backup or a quantum archive; they restore different account types. Keep the original file intact and use its corresponding password. Qozmo cannot reset a local vault password.'),p('If quantum history is missing, malformed, or conflicting, preserve browser data and archives. Imports remain read-only; resetting the history is not a safe fix.')),
    ],
  },
  {
    slug:'proof-and-status',title:'Proof, mainnet & $QZO',navTitle:'Proof & project status',description:'Inspect public WOTS evidence and separate current implementation from future release decisions.',group:'Resources',icon:'shield',readTime:'5 min',
    sections:[
      section('public-evidence','Public WOTS evidence',p('Open the [Proof & Status center](/proof/) to inspect a successful WOTS-core reference transaction and recheck a transaction hash without connecting a wallet. The checks bind EntryPoint calldata and the UserOperation hash to a canonical receipt, historical protocol bytecode, a supported proxy, WOTS cryptography and key rotation.'),note('info','Reference provenance matters','The published reference is a core validation run from 19 October 2026, before the Qozmo integration. It is not claimed as a Qozmo-originated operation. Onchain cryptography cannot identify which wallet UI created a signature.')),
      section('qozmo-run','Record a Qozmo-run example',steps(['Use the original signing environment','Open your original Qozmo Quantum account on Robinhood Testnet. Imports remain read-only.'],['Review a test transfer','Use the existing Send review. Check the recipient, amount and maximum fee; confirm the transaction yourself.'],['Retain the confirmed hash','Keep the operation and transaction hashes and export a fresh encrypted archive.'],['Check the public evidence','Paste the outer transaction hash into the Proof & Status verifier. A successful outer receipt alone is insufficient. Download the public result after verification.'])),
      section('source','Public source availability',p('The Git origin is configured as github.com/imrybrndo/qozmo-wallet. An anonymous API check on 11 November 2026 returned 404. This can indicate a private, unavailable or incorrectly configured repository; public access is not established. The Proof & Status page can repeat the anonymous check.')),
      section('mainnet','Testnet first; mainnet later',p('Qozmo Quantum remains testnet-first. No mainnet launch date is announced. Release criteria include reproducible Qozmo testnet evidence, publicly reviewable source, independent security review, a reviewed stateful-key/recovery policy, and chain-specific deployment/operations checks. A token contract on mainnet is separate from mainnet Quantum wallet readiness.')),
      section('qzo','$QZO and wallet adoption',p('The token ticker is **$QZO**. The landing page lists its configured contract on Robinhood Chain mainnet (4663). Public metadata reads report the name Qozmo, symbol QZO and 18 decimals.'),p('This wallet does not integrate tokenholder fee sharing, buybacks, burns or staking rewards. Network gas is ETH. Adoption alone does not establish an implemented cash-flow right for $QZO holders. Future utility needs an explicit specification and deployed mechanics before a value-capture claim.')),
    ],
  },
  {
    slug:'developers',title:'Build with a clear picture',navTitle:'Developer reference',description:'Run Qozmo locally and understand its wallet, data, and quantum integration layers.',group:'Resources',icon:'code',readTime:'5 min',
    sections:[
      section('local','Run locally',p('Use Node.js 22 or 24. Qozmo uses Next.js App Router, React and TypeScript. The wallet requires a secure browser context; localhost supports the required cryptography.'),{type:'code',language:'bash',text:'npm ci\nnpm run dev'},p('Open the URL printed by the development server. The landing page is `/`, the app is `/dashboard/`, and this documentation is `/docs/`.')),
      section('validate','Validate and build',{type:'code',language:'bash',text:'npm run typecheck\nnpm test\nnpm run build'},p('The application uses a static export. The production output is in `out/`. A static build does not bundle a server-side relay or automatically publish the application.')),
      section('architecture','Implementation map',table(['Area','Source'],[['Everyday encrypted vault','lib/wallet/vault.ts'],['Supported networks and token holdings','lib/wallet/networks.ts · assets.ts · token-balances.ts'],['Qozmo Quantum application adapter','lib/wallet/quantum/client.ts · storage.ts'],['Integrated WOTS core','lib/wallet/quantum-sdk/'],['Quantum deployment pins','lib/wallet/quantum-deployment.json'],['Quantum UI','components/dashboard/quantum-wallet.tsx'],['Documentation content and navigation','lib/docs-content.ts · components/docs/']])),
      section('deployment','Quantum deployment and relay policy',p('Qozmo checks the chain, recorded deployment block, runtime hashes for EntryPoint/factory/implementation, and their links before signing. Adding a chain entry alone does not deploy a quantum account system or authorize mainnet signing.'),p('The existing testnet manifest pins EntryPoint `0x0000000071727De22E5E9d8BAf0edAc6f37da032`, factory `0xBe3a0B5f698a4F83C7679aAe7E7743D5E3d2F468`, and implementation `0xcCBA0b7B10f809e8f3B3C1e9835acDeEdC020c39`.'),note('tip','Keep protocol compatibility','The integrated core retains its original cryptographic derivation and wire domains. Product copy uses Qozmo. Source provenance and per-file hashes are recorded with the integrated modules.')),
      section('data','External read services',p('Prices and historical data come from Kraken, protocol TVL from DefiLlama, and balances/receipts from the selected chain RPC. These are external services, not a Qozmo account indexer or custody service. No analytics or provider credential is required to read this documentation.')),
    ],
  },
  {
    slug:'faq',title:'Good questions. Clear answers.',navTitle:'FAQs',description:'Answers to the questions you are most likely to ask about Qozmo.',group:'Resources',icon:'help',readTime:'5 min',
    sections:[
      section('what-is-qozmo','What is Qozmo?',p('Qozmo combines one encrypted testnet smart account, Quantum authorization, Privacy Ring, a market workspace and DeFi discovery.')),
      section('custody','Does Qozmo hold my keys?',p('Saved signing secrets are encrypted in your browser. Qozmo is not a custodial account service. While unlocked, the app uses secrets locally for actions you confirm. Keep your recovery material independently.')),
      section('same-wallet','Do Wallet, Quantum and Privacy Ring use the same account?',p('Yes, throughout this website. They share one Qozmo smart-account address, wallet password and unlock session. The privacy pool is shared protocol infrastructure, not a second wallet. Public balances and encrypted note balances are distinct. Older EOA vaults and extension/native accounts are not automatically migrated.')),
      section('mainnet','Can I send on mainnet?',p('Other network balances may be viewed, but the Qozmo smart account signs only on Robinhood Testnet. No mainnet account deployment or signing is activated.')),
      section('stocks','Does a stock quote mean I own that stock?',p('No. Market quotes are a watchlist. Onchain holdings come from an account and specific token contract. Tokenized products have issuer-specific rights; Kraken xStocks and Robinhood stock tokens are separate products.')),
      section('read-only-import','Why is my imported quantum wallet read-only?',p('A phrase or encrypted archive cannot prove complete one-time-key exposure history across devices. Qozmo preserves a read-only policy rather than enabling a restored key to authorize a second message.')),
      section('pending','Should I send again after a timeout?',p('Check the existing operation first. For Quantum, use the exact retry flow for its stored signed bytes. Do not clear the journal or create a second message with the exposed key.')),
      section('fees','Is the app free to explore?',p('You can browse the interface and public documentation without an account subscription. Blockchain operations have network costs. A gas-payer wallet or bundler may have its own service or transaction requirements.')),
      section('audit','Is Qozmo Quantum audited?',p('No independent security audit or production certification is claimed. It is a test-funds implementation. Hash-based account authorization is not a guarantee about the device, browser, relay, consensus, or lost-device recovery.')),
    ],
  },
];

export const docHref = (page: Pick<DocPage,'slug'>) => page.slug ? `/docs/${page.slug}/` : '/docs/';
export function getDoc(slug: string) { return DOC_PAGES.find(page => page.slug === slug); }
function blockText(block: DocBlock): string {
  switch (block.type) {
    case 'paragraph': return block.text;
    case 'list': return block.items.join(' ');
    case 'steps': return block.items.map(item => `${item.title} ${item.text}`).join(' ');
    case 'callout': return `${block.title} ${block.text}`;
    case 'cards': return block.items.map(item => `${item.title} ${item.text}`).join(' ');
    case 'table': return `${block.columns.join(' ')} ${block.rows.flat().join(' ')}`;
    case 'code': return block.text;
  }
}
export const DOC_SEARCH_INDEX = DOC_PAGES.map(page => ({slug:page.slug,title:page.title,navTitle:page.navTitle,description:page.description,group:page.group,icon:page.icon,
  sections:page.sections.map(section => ({id:section.id,title:section.title,text:section.blocks.map(blockText).join(' ')}))}));
export function searchDocs(query: string) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return DOC_SEARCH_INDEX.slice(0,6).map(page => ({page,section:undefined,score:0}));
  return DOC_SEARCH_INDEX.flatMap(page => {
    const title = `${page.title} ${page.navTitle ?? ''}`.toLowerCase();
    const section = page.sections.find(item => words.every(word => `${title} ${item.title} ${item.text}`.toLowerCase().includes(word)));
    if (!section) return [];
    const score = words.reduce((total,word) => total + (title.includes(word) ? 10 : section.title.toLowerCase().includes(word) ? 5 : 1),0);
    return [{page,section,score}];
  }).sort((a,b) => b.score-a.score).slice(0,10);
}