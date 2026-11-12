'use client';
import { lazy, Suspense, useState } from 'react';
import QuantumWallet from './dashboard/quantum-wallet';
import { QozmoMark } from './brand';
import type { QuantumExtensionSurface, QuantumExtensionView } from './quantum-extension';
import { NATIVE_NETWORKS, type ExtensionNetworkId } from '@/lib/wallet/multichain/networks';
import '../app/quantum-extension.css';
const NativeWallet=lazy(()=>import('./native-extension-wallet'));
export function ExtensionNetworkSelect({value,onChange,disabled=false}:{value:ExtensionNetworkId;onChange(value:ExtensionNetworkId):void;disabled?:boolean}) {
  return <label className="qx-network-picker">{value==='quantum-robinhood'?<QozmoMark/>:<img src={NATIVE_NETWORKS[value].icon} width={17} height={17} alt=""/>}<span className="qx-sr-only">Wallet network</span><select aria-label="Wallet network" value={value} disabled={disabled} onChange={event=>{const next=event.target.value;if(next==='quantum-robinhood'||next==='solana-devnet'||next==='bitcoin-signet')onChange(next);}}><option value="quantum-robinhood">Quantum · Robinhood Testnet</option><option value="solana-devnet">Solana · Devnet</option><option value="bitcoin-signet">Bitcoin · Signet</option></select></label>;
}
export default function ExtensionWallet({surface,initialSetup,initialView}:{surface:QuantumExtensionSurface;initialSetup?:'create'|'import';initialView?:QuantumExtensionView}) {
  const [network,setNetwork]=useState<ExtensionNetworkId>(()=>{
    // Explicit Quantum setup links always open the Quantum account.
    if(initialSetup||typeof window==='undefined')return 'quantum-robinhood';
    const parameter=new URLSearchParams(window.location.search).get('network');
    return parameter==='solana-devnet'||parameter==='bitcoin-signet'?parameter:'quantum-robinhood';
  });
  function change(next:ExtensionNetworkId){if(next===network)return;window.dispatchEvent(new Event('qozmo:lock-all'));setNetwork(next);}
  const networkSelect=(disabled:boolean)=><ExtensionNetworkSelect value={network} onChange={change} disabled={disabled}/>;
  return network==='quantum-robinhood'?<QuantumWallet layout="extension" surface={surface} initialSetup={initialSetup} initialView={initialView} networkSelect={networkSelect}/>:<Suspense fallback={<p className="qe-fallback">Opening Qozmo multichain…</p>}><NativeWallet key={network} surface={surface} network={network} networkSelect={networkSelect}/></Suspense>;
}
