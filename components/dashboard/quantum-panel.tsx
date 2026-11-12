'use client';
import type { WalletNetwork } from '@/lib/wallet/networks';
import QuantumWallet from './quantum-wallet';
import { Message } from './ui';
export default function QuantumPanel({ network, onSelectQuantumNetwork }: { network: WalletNetwork; onSelectQuantumNetwork: () => void }) {
  return network.id === 46630 ? <QuantumWallet/> : <Message>Your same Qozmo smart account operates on Robinhood Testnet. <button className="qd-text-button" onClick={onSelectQuantumNetwork}>Use Robinhood Testnet</button></Message>;
}
