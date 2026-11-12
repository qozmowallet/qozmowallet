'use client';

import { useEffect, useRef } from 'react';
import { DEFAULT_NETWORK_ID, WALLET_NETWORKS, type WalletNetwork } from '@/lib/wallet/networks';

export function NetworkPicker({ network, onChange }: { network: WalletNetwork; onChange: (chainId: number) => void }) {
  const remembered = useRef<Record<WalletNetwork['kind'], number>>({ mainnet: DEFAULT_NETWORK_ID, testnet: 46630 });
  useEffect(() => { remembered.current[network.kind] = network.id; }, [network.id, network.kind]);
  const chains = WALLET_NETWORKS.filter(chain => chain.kind === network.kind);

  return <div className={`qd-network-picker is-${network.kind}`} role="group" aria-label="Network and chain selection">
    <label className="qd-network-kind">
      <span>Network</span>
      <select aria-label="Network environment" value={network.kind} onChange={event => {
        const kind = event.target.value;
        if (kind === 'mainnet' || kind === 'testnet') onChange(remembered.current[kind]);
      }}>
        <option value="mainnet">Mainnet</option>
        <option value="testnet">Testnet</option>
      </select>
    </label>
    <label className="qd-network-chain">
      <span>Chain <i style={{ background: network.color }}/></span>
      <select aria-label="Selected chain" value={network.id} onChange={event => {
        const id = Number(event.target.value);
        if (chains.some(chain => chain.id === id)) onChange(id);
      }}>
        {chains.map(chain => <option key={chain.id} value={chain.id}>{chain.label}</option>)}
      </select>
    </label>
  </div>;
}
