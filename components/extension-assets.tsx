'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { formatUnits, type Address } from 'viem';
import { faArrowRight, faCheck, faCirclePlus, faEyeSlash, faMagnifyingGlass, faPlus, faSliders, faSpinner, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { DIcon, formatToken, shortAddress } from './dashboard/ui';
import { AssetLogo } from './asset-logo';
import type { QuantumSession, QuantumStatus } from '@/lib/wallet/quantum/client';
import type { QuantumRecord } from '@/lib/wallet/quantum/storage';
import {
  addExtensionToken, discoverExtensionTokens, extensionAssetKey, inspectExtensionToken, readExtensionAssets,
  readExtensionTokenBalances, updateExtensionAssets,
  type DiscoveredToken, type ExtensionAssetPreferences, type ExtensionToken, type ExtensionTokenBalance, type ExtensionTokenPreview,
} from '@/lib/wallet/extension-assets';

export function useExtensionAssets(record: QuantumRecord | null, session: QuantumSession | null, status: QuantumStatus | null) {
  const [preferences,setPreferences]=useState<ExtensionAssetPreferences|null>(null);
  const [storageError,setStorageError]=useState(''); const [error,setError]=useState(''); const [message,setMessage]=useState('');
  const [snapshot,setSnapshot]=useState<{session:QuantumSession; balances:ExtensionTokenBalance[]}|null>(null);
  const [refreshing,setRefreshing]=useState(false); const [revision,setRevision]=useState(0);
  const [preview,setPreview]=useState<ExtensionTokenPreview|null>(null);
  const [discovered,setDiscovered]=useState<DiscoveredToken[]|null>(null); const [working,setWorking]=useState<'inspect'|'discover'|null>(null);
  const activeSession=useRef(session); activeSession.current=session;
  const operation=useRef(new AbortController()); const generation=useRef(0);
  useEffect(()=>{
    setPreferences(null);setStorageError('');setError('');setMessage('');
    if(!record)return;
    const load=()=>{try{setPreferences(readExtensionAssets(record.address));setStorageError('');}catch(reason){setStorageError(reason instanceof Error?reason.message:'Token preferences are unavailable.');}};
    load();
    const sync=(event:StorageEvent)=>{if(event.key===extensionAssetKey(record.address)||event.key===null)load();};
    window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);
  },[record?.id,record?.address]);
  useEffect(()=>{
    generation.current+=1;operation.current.abort();operation.current=new AbortController();setWorking(null);setPreview(null);setDiscovered(null);setError('');setSnapshot(null);
    return()=>{generation.current+=1;operation.current.abort();};
  },[session]);
  const tracked=preferences?.tokens.filter(token=>token.visible)??[];
  const trackingKey=tracked.map(token=>`${token.address}:${token.decimals}`).join(',');
  useEffect(()=>{
    setSnapshot(null);setRefreshing(false);
    if(!session || !status || !tracked.length)return;
    const controller=new AbortController();setRefreshing(true);
    void readExtensionTokenBalances(session.client,session.record.address,tracked,controller.signal).then(result=>{
      if(!controller.signal.aborted)setSnapshot({session,balances:result.tokens});
    }).catch(()=>{if(!controller.signal.aborted)setSnapshot({session,balances:tracked.map(token=>({address:token.address,status:'error'}))});})
      .finally(()=>{if(!controller.signal.aborted)setRefreshing(false);});
    return()=>controller.abort();
    // Only contract/decimal changes require a new read; visibility is encoded in trackingKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[session,status,trackingKey,revision]);
  useEffect(()=>{if(!message)return;const timer=setTimeout(()=>setMessage(''),3500);return()=>clearTimeout(timer);},[message]);
  const save=useCallback((change:(current:ExtensionAssetPreferences)=>ExtensionAssetPreferences,notice?:string)=>{
    if(!record || storageError)return false;
    try{const next=updateExtensionAssets(record.address,change);setPreferences(next);setError('');if(notice)setMessage(notice);return true;}
    catch(reason){setError(reason instanceof Error?reason.message:'Token preferences could not be saved.');return false;}
  },[record,storageError]);
  function visibility(contract:'native'|Address,visible:boolean){return save(current=>contract==='native'?{...current,nativeVisible:visible}:{...current,tokens:current.tokens.map(token=>token.address===contract?{...token,visible}:token)},visible?'Asset is now visible.':'Asset hidden. You can show it again in Manage tokens.');}
  async function inspect(input:string) {
    if(!session || storageError)return;
    operation.current.abort();operation.current=new AbortController();const controller=operation.current;const request=++generation.current;
    setWorking('inspect');setError('');setPreview(null);
    try{const next=await inspectExtensionToken(session.client,session.record.address,input,controller.signal);if(request===generation.current&&activeSession.current===session)setPreview(next);}
    catch(reason){if(request===generation.current&&!controller.signal.aborted)setError(reason instanceof Error?reason.message:'Token lookup failed. Try again.');}
    finally{if(request===generation.current)setWorking(null);}
  }
  function clearPreview(){generation.current+=1;operation.current.abort();setWorking(null);setPreview(null);setError('');}
  async function discover(){
    if(!session || storageError)return;
    operation.current.abort();operation.current=new AbortController();const controller=operation.current;const request=++generation.current;
    setWorking('discover');setError('');setDiscovered(null);
    try{
      if(await session.client.getChainId()!==46630)throw new Error('The RPC is not on Robinhood Testnet.');
      controller.signal.throwIfAborted();
      const result=await discoverExtensionTokens(session.record.address,controller.signal);
      if(request===generation.current&&activeSession.current===session)setDiscovered(result);
    }catch(reason){if(request===generation.current&&!controller.signal.aborted)setError(reason instanceof Error?reason.message:'Token discovery is unavailable. Import by contract instead.');}
    finally{if(request===generation.current)setWorking(null);}
  }
  function add(){if(!preview || !session)return false;const added=save(current=>addExtensionToken(current,preview),`${preview.symbol} added to your assets.`);if(added){setPreview(null);setRevision(value=>value+1);}return added;}
  const balances=snapshot?.session===session?snapshot?.balances??[]:[];
  const currentPreferences=record&&preferences?.account.toLowerCase()===record.address.toLowerCase()?preferences:null;
  return {preferences:currentPreferences,storageError,error,message,balances,refreshing,preview,discovered,working,
    refresh:()=>setRevision(value=>value+1),visibility,inspect,clearPreview,discover,add,
    remove:(contract:Address)=>save(current=>({...current,tokens:current.tokens.filter(token=>token.address!==contract)}),'Token removed from this list. You can import its contract again.'),
    hideZero:(value:boolean)=>save(current=>({...current,hideZero:value})),
  };
}
export type ExtensionAssetsState=ReturnType<typeof useExtensionAssets>;

export function ExtensionTokenIcon({token,size=38}:{token?:Pick<ExtensionToken,'symbol'|'address'>;size?:number}){
  if(!token)return <AssetLogo assetId="ethereum" size={size} className="qx-token-logo"/>;
  const hue=parseInt(token.address.slice(2,6),16)%65+240;
  return <span className="qx-token-monogram" style={{'--token-hue':hue,width:size,height:size} as CSSProperties} aria-hidden="true">{token.symbol.replace(/[^a-zA-Z0-9]/g,'').slice(0,2).toUpperCase()||'T'}<i/></span>;
}
export function AssetVisibilitySwitch({visible,label,onChange,disabled=false}:{visible:boolean;label:string;onChange():void;disabled?:boolean}){
  return <button type="button" className="qx-visibility-switch" role="switch" aria-checked={visible} aria-label={label==='hide zero balances'?'Hide zero balances':`Show ${label}`} onClick={onChange} disabled={disabled}><span/>{visible&&<DIcon icon={faCheck} size={8}/>}</button>;
}
export function ExtensionAssetList({state,hidden,nativeBalance,onManage,onSelect}:{state:ExtensionAssetsState;hidden:boolean;nativeBalance?:bigint;onManage():void;onSelect(address:'native'|Address):void}){
  const [query,setQuery]=useState('');
  const prefs=state.preferences;
  const balanceFor=(address:Address)=>state.balances.find(row=>row.address===address);
  const matches=(value:string)=>value.toLowerCase().includes(query.trim().toLowerCase());
  const tokens=prefs?.tokens.filter(token=>token.visible&&matches(`${token.name} ${token.symbol} ${token.address}`)&&(!prefs.hideZero||balanceFor(token.address)?.status!=='ready'||(balanceFor(token.address) as {balance:bigint}).balance!==0n))??[];
  const native=(prefs?.nativeVisible??true)&&matches('Test Ether ETH Native')&&(!prefs?.hideZero||nativeBalance!==0n);
  const count=(prefs?.tokens.filter(token=>token.visible).length??0)+(prefs?.nativeVisible!==false?1:0);
  return <section className="qx-assets-section" aria-label="Tracked assets"><div className="qx-section-heading"><h2>Assets <span className="qx-asset-count">{tokens.length+(native?1:0)}</span></h2><button className="qx-section-link" onClick={onManage}><DIcon icon={faSliders} size={11}/>Manage</button></div>
    {state.storageError&&<p className="qx-message qx-error" role="alert">{state.storageError}</p>}
    {state.message&&<p className="qx-asset-toast" role="status"><DIcon icon={faCheck} size={11}/>{state.message}</p>}
    {count>4&&<label className="qx-asset-search"><DIcon icon={faMagnifyingGlass} size={12}/><input aria-label="Search your assets" placeholder="Search assets…" value={query} onChange={event=>setQuery(event.target.value)}/></label>}
    <div className="qx-token-list">
      {native&&<button className="qx-token-row" onClick={()=>onSelect('native')}><ExtensionTokenIcon/><span className="qx-token-identity"><strong>Test Ether</strong><small>ETH · Native</small></span><span className="qx-token-value"><strong>{hidden?'••••':nativeBalance!==undefined?formatToken(nativeBalance):'—'}</strong><small>ETH</small></span><DIcon icon={faArrowRight} size={10}/></button>}
      {tokens.map(token=>{const balance=balanceFor(token.address);return <button className="qx-token-row" key={token.address} onClick={()=>onSelect(token.address)}><ExtensionTokenIcon token={token}/><span className="qx-token-identity"><strong>{token.name}</strong><small>{token.symbol} · Imported</small></span><span className="qx-token-value"><strong>{hidden?'••••':balance?.status==='ready'?formatToken(balance.balance,token.decimals):balance?.status==='error'?'Unavailable':'—'}</strong><small>{token.symbol}</small></span><DIcon icon={faArrowRight} size={10}/></button>;})}
      {!native&&!tokens.length&&<div className="qx-token-empty"><DIcon icon={query?faMagnifyingGlass:faEyeSlash} size={21}/><strong>{query?'No matching assets.':'No assets to display.'}</strong><p>{query?'Try another name, symbol, or contract.':'Show hidden tokens or turn off the zero-balance filter.'}</p></div>}
    </div>
    <button className="qx-add-token" onClick={onManage}><DIcon icon={faCirclePlus} size={14}/><span>Add another asset<small>Import a token or find it in your account.</small></span><DIcon icon={faArrowRight} size={11}/></button>
    {state.refreshing&&<p className="qx-token-read-status" role="status">Updating token balances…</p>}
  </section>;
}

export function ExtensionAssetManager({state,session,onDone}:{state:ExtensionAssetsState;session:QuantumSession|null;onDone():void}){
  const [tab,setTab]=useState<'list'|'import'|'discover'>('list');const [query,setQuery]=useState('');const [contract,setContract]=useState('');
  const prefs=state.preferences;const unavailable=!session||!!state.storageError||!!state.working;
  function review(address:Address){setContract(address);setTab('import');void state.inspect(address);}
  function lookup(event:FormEvent){event.preventDefault();void state.inspect(contract);}
  const tracked=prefs?.tokens.filter(token=>`${token.name} ${token.symbol} ${token.address}`.toLowerCase().includes(query.toLowerCase()))??[];
  const suggestions=state.discovered?.filter(token=>!prefs?.tokens.some(item=>item.address===token.address))??[];
  const preview=state.preview;
  return <div className="qx-asset-manager"><div className="qx-view-heading"><span className="qx-eyebrow">YOUR WALLET, YOUR VIEW</span><h1>Make room for more.</h1><p>Choose which assets appear in your wallet.</p></div>
    <div className="qx-manager-tabs" role="group" aria-label="Asset management"><button aria-pressed={tab==='list'} onClick={()=>{state.clearPreview();setTab('list');}}>Your tokens</button><button aria-pressed={tab==='import'} onClick={()=>{state.clearPreview();setTab('import');}}><DIcon icon={faPlus} size={9}/>Import</button><button aria-pressed={tab==='discover'} onClick={()=>{state.clearPreview();setTab('discover');}}>Find tokens</button></div>
    {(state.storageError||state.error)&&<p className="qx-message qx-error" role="alert">{state.storageError||state.error}</p>}
    {state.message&&<p className="qx-asset-toast" role="status"><DIcon icon={faCheck} size={11}/>{state.message}</p>}
    {!session?<p className="qx-message">Unlock your wallet to manage tokens.</p>:tab==='list'?<>
      <label className="qx-asset-search"><DIcon icon={faMagnifyingGlass} size={12}/><input aria-label="Search tracked tokens" placeholder="Search name, symbol, or contract" value={query} onChange={event=>setQuery(event.target.value)}/></label>
      <div className="qx-manager-list">{(!query||'test ether eth native'.includes(query.toLowerCase()))&&<div className="qx-managed-token"><ExtensionTokenIcon/><span><strong>Test Ether</strong><small>ETH · Native asset</small></span><AssetVisibilitySwitch label="Test Ether" visible={prefs?.nativeVisible??true} disabled={!prefs||unavailable} onChange={()=>state.visibility('native',!prefs?.nativeVisible)}/></div>}
        {tracked.map(token=><div className="qx-managed-token" key={token.address}><ExtensionTokenIcon token={token}/><span><strong>{token.name}</strong><small>{token.symbol} · {shortAddress(token.address)}</small></span><AssetVisibilitySwitch label={`${token.symbol} ${shortAddress(token.address)}`} visible={token.visible} disabled={unavailable} onChange={()=>state.visibility(token.address,!token.visible)}/>{!token.visible&&<button className="qx-forget-token" aria-label={`Remove ${token.symbol} from the token list`} disabled={unavailable} onClick={()=>state.remove(token.address)}><DIcon icon={faTrashCan} size={12}/></button>}</div>)}
        {query&&!tracked.length&&!('test ether eth native'.includes(query.toLowerCase()))&&<p className="qx-token-read-status">No tokens match your search.</p>}
      </div>
      <div className="qx-zero-preference"><span><strong>Hide zero balances</strong><small>Unavailable balances stay visible.</small></span><AssetVisibilitySwitch label="hide zero balances" visible={prefs?.hideZero??false} disabled={!prefs||unavailable} onChange={()=>state.hideZero(!prefs?.hideZero)}/></div>
      <p className="qx-manager-note"><DIcon icon={faEyeSlash} size={12}/>Hiding a token only changes this list. Your assets remain at the same address.</p>
      <button className="qx-button qx-primary" onClick={onDone}>Back to my assets<DIcon icon={faArrowRight} size={12}/></button>
    </>:tab==='import'?<>
      <div className="qx-import-network"><span><i/>Robinhood Testnet</span><small>CHAIN 46630</small></div>
      <form className="qx-form" onSubmit={lookup}><label>Token contract address<input value={contract} onChange={event=>{setContract(event.target.value);state.clearPreview();}} placeholder="0x…" autoComplete="off" spellCheck={false} required disabled={!!state.working}/></label><button className="qx-button qx-secondary" disabled={unavailable||!contract.trim()}>{state.working==='inspect'?<><DIcon icon={faSpinner} className="qx-spin" size={12}/>Checking contract…</>:<>Check token<DIcon icon={faArrowRight} size={12}/></>}</button></form>
      {preview&&<div className="qx-token-preview"><div><ExtensionTokenIcon token={preview} size={44}/><span><strong>{preview.name}</strong><small>{preview.symbol} · {preview.decimals} decimals</small></span><span className="qx-imported-badge">ERC-20</span></div><dl><div><dt>Current balance</dt><dd>{formatUnits(preview.balance,preview.decimals)} {preview.symbol}</dd></div><div><dt>Contract</dt><dd>{preview.address}</dd></div></dl><p>Token metadata was read from this contract. A matching name or symbol does not verify its issuer.</p><button className="qx-button qx-primary" disabled={unavailable} onClick={()=>{if(state.add()){setContract('');setTab('list');}}}><DIcon icon={faPlus} size={12}/>{prefs?.tokens.some(token=>token.address===preview.address)?'Show in my assets':'Add to my assets'}</button></div>}
      <p className="qx-fine-print">Use the ERC-20 contract on Robinhood Testnet. Tokens from Ethereum or Robinhood mainnet use different contracts.</p>
    </>:<>
      <div className="qx-discover-card"><span><DIcon icon={faMagnifyingGlass} size={22}/></span><h2>A little discovery.</h2><p>Look for ERC-20 tokens indexed at your Quantum address. Review each contract before adding it.</p><button className="qx-button qx-primary" disabled={unavailable} onClick={()=>void state.discover()}><DIcon icon={state.working==='discover'?faSpinner:faMagnifyingGlass} className={state.working==='discover'?'qx-spin':''} size={12}/>{state.working==='discover'?'Finding tokens…':state.discovered?'Search again':'Find my tokens'}</button><small>Uses the Robinhood Testnet explorer.</small></div>
      {state.discovered&&<><div className="qx-section-heading"><h2>{suggestions.length?'Tokens to review':'You’re all caught up.'}</h2><span className="qx-asset-count">{suggestions.length}</span></div>{suggestions.length?<div className="qx-discovered-list">{suggestions.map(token=><button key={token.address} onClick={()=>review(token.address)} disabled={unavailable}><ExtensionTokenIcon token={token}/><span><strong>{token.name}</strong><small>{token.symbol} · {shortAddress(token.address)}</small></span><DIcon icon={faArrowRight} size={12}/></button>)}</div>:<p className="qx-fine-print">No additional ERC-20 tokens were returned. You can import a contract directly.</p>}<p className="qx-fine-print">Up to 50 results from the explorer’s first page. Indexing may be delayed or incomplete. Suggestions are not endorsements.</p></>}
    </>}
  </div>;
}
