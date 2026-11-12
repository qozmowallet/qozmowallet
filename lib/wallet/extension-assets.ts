import { erc20Abi, getAddress, isAddress, zeroAddress, type Address, type PublicClient } from 'viem';

export const EXTENSION_ASSET_CHAIN = 46630;
export const MAX_EXTENSION_TOKENS = 50;
const EXPLORER = 'https://explorer.testnet.chain.robinhood.com';
export type ExtensionToken = { address: Address; name: string; symbol: string; decimals: number; visible: boolean };
export type ExtensionAssetPreferences = { version: 1; chainId: 46630; account: Address; nativeVisible: boolean; hideZero: boolean; tokens: ExtensionToken[] };
export type ExtensionTokenPreview = ExtensionToken & { balance: bigint; blockNumber: bigint };
export type ExtensionTokenBalance = { address: Address } & ({ status: 'ready'; balance: bigint } | { status: 'error' });
export type DiscoveredToken = { address: Address; symbol: string; name: string };
const invalid = (): never => { throw new Error('Token preferences could not be read. Existing data has been preserved.'); };
function address(value: unknown): Address {
  if (typeof value !== 'string' || !isAddress(value, { strict: true }) || value.toLowerCase() === zeroAddress) throw new Error('Enter a valid token contract on Robinhood Testnet.');
  return getAddress(value);
}
function text(value: unknown, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/.test(value)) throw new Error('This token returned unsupported metadata.');
  return value.trim();
}
function fields(value: object, names: string) { return Object.keys(value).sort().join(',') === names; }
export function extensionAssetKey(account: Address) { return `qozmo.quantum.assets.v1:${EXTENSION_ASSET_CHAIN}:${address(account).toLowerCase()}`; }
export function defaultExtensionAssets(account: Address): ExtensionAssetPreferences { return {version:1,chainId:EXTENSION_ASSET_CHAIN,account:address(account),nativeVisible:true,hideZero:false,tokens:[]}; }
export function parseExtensionAssets(value: unknown, account: Address): ExtensionAssetPreferences {
  try {
    const r = value as ExtensionAssetPreferences;
    if (!r || !fields(r,'account,chainId,hideZero,nativeVisible,tokens,version') || r.version !== 1 || r.chainId !== EXTENSION_ASSET_CHAIN || address(r.account) !== address(account) || typeof r.nativeVisible !== 'boolean' || typeof r.hideZero !== 'boolean' || !Array.isArray(r.tokens) || r.tokens.length > MAX_EXTENSION_TOKENS) return invalid();
    const seen = new Set<string>();
    const tokens = r.tokens.map(token => {
      if (!token || !fields(token,'address,decimals,name,symbol,visible') || typeof token.visible !== 'boolean' || !Number.isInteger(token.decimals) || token.decimals < 0 || token.decimals > 36) return invalid();
      const contract = address(token.address);
      if (seen.has(contract.toLowerCase())) return invalid();
      seen.add(contract.toLowerCase());
      return {address:contract,name:text(token.name,80),symbol:text(token.symbol,32),decimals:token.decimals,visible:token.visible};
    });
    return {...defaultExtensionAssets(account),nativeVisible:r.nativeVisible,hideZero:r.hideZero,tokens};
  } catch { return invalid(); }
}
export function readExtensionAssets(account: Address, storage: Pick<Storage,'getItem'> = localStorage): ExtensionAssetPreferences {
  const raw = storage.getItem(extensionAssetKey(account));
  if (raw === null) return defaultExtensionAssets(account);
  if (raw.length > 32_768) return invalid();
  try { return parseExtensionAssets(JSON.parse(raw),account); } catch { return invalid(); }
}
/** Writes only public display preferences. The encrypted vault and signing journal are never accessed. */
export function updateExtensionAssets(account: Address, change: (current: ExtensionAssetPreferences) => ExtensionAssetPreferences, storage: Pick<Storage,'getItem'|'setItem'> = localStorage): ExtensionAssetPreferences {
  const next = parseExtensionAssets(change(readExtensionAssets(account,storage)),account);
  try { storage.setItem(extensionAssetKey(account),JSON.stringify(next)); } catch { throw new Error('Token preferences could not be saved. Your previous list is unchanged.'); }
  return next;
}
export function addExtensionToken(current: ExtensionAssetPreferences, token: ExtensionToken): ExtensionAssetPreferences {
  const contract = address(token.address);
  const previous = current.tokens.find(item => item.address === contract);
  if (previous) return {...current,tokens:current.tokens.map(item => item.address === contract ? {address:contract,name:token.name,symbol:token.symbol,decimals:token.decimals,visible:true} : item)};
  if (current.tokens.length >= MAX_EXTENSION_TOKENS) throw new Error(`You can track up to ${MAX_EXTENSION_TOKENS} tokens in this account.`);
  return {...current,tokens:[...current.tokens,{address:contract,name:token.name,symbol:token.symbol,decimals:token.decimals,visible:true}]};
}
async function verifiedBlock(client: PublicClient, signal?: AbortSignal) {
  signal?.throwIfAborted();
  let chainId:number;
  try { chainId=await client.getChainId(); } catch { throw new Error('The testnet RPC is unavailable. Try again shortly.'); }
  if (chainId !== EXTENSION_ASSET_CHAIN) throw new Error('The RPC is not on Robinhood Testnet. No token was added.');
  signal?.throwIfAborted();
  const block=await client.getBlockNumber({cacheTime:0}).catch(()=>{throw new Error('The current testnet block could not be read. Try again.');});
  signal?.throwIfAborted();return block;
}
function checkedBalance(value: unknown): bigint {
  if (typeof value !== 'bigint' || value < 0n || value >= 2n ** 256n) throw new Error('Token balance is unavailable.');
  return value;
}
export async function inspectExtensionToken(client: PublicClient, account: Address, input: string, signal?: AbortSignal): Promise<ExtensionTokenPreview> {
  const contract = address(input.trim()); const owner = address(account);
  const blockNumber = await verifiedBlock(client,signal);
  const [code,symbol,decimals,balance,name] = await Promise.all([
    client.getCode({address:contract,blockNumber}),
    client.readContract({address:contract,abi:erc20Abi,functionName:'symbol',blockNumber}),
    client.readContract({address:contract,abi:erc20Abi,functionName:'decimals',blockNumber}),
    client.readContract({address:contract,abi:erc20Abi,functionName:'balanceOf',args:[owner],blockNumber}),
    client.readContract({address:contract,abi:erc20Abi,functionName:'name',blockNumber}).catch(() => null),
  ]).catch(()=>{throw new Error('This token contract could not be read. Check its address and try again.');});
  signal?.throwIfAborted();
  if (!code || code === '0x' || !Number.isInteger(decimals) || decimals < 0 || decimals > 36) throw new Error('This address is not a supported ERC-20 contract on Robinhood Testnet.');
  const safeSymbol = text(symbol,32);
  return {address:contract,name:name === null ? safeSymbol : text(name,80),symbol:safeSymbol,decimals,balance:checkedBalance(balance),visible:true,blockNumber};
}
export async function readExtensionTokenBalances(client: PublicClient, account: Address, tokens: readonly ExtensionToken[], signal?: AbortSignal): Promise<{blockNumber:bigint;tokens:ExtensionTokenBalance[]}> {
  const owner = address(account); const blockNumber = await verifiedBlock(client,signal);
  if (tokens.length > MAX_EXTENSION_TOKENS) throw new Error('Too many tracked tokens.');
  let index=0; const results: ExtensionTokenBalance[] = new Array(tokens.length);
  async function worker() {
    while(index < tokens.length) {
      const i=index++; const token=tokens[i]; signal?.throwIfAborted();
      try {
        const contract=address(token.address);
        const [balance,decimals,code] = await Promise.all([
          client.readContract({address:contract,abi:erc20Abi,functionName:'balanceOf',args:[owner],blockNumber}),
          client.readContract({address:contract,abi:erc20Abi,functionName:'decimals',blockNumber}),
          client.getCode({address:contract,blockNumber}),
        ]);
        signal?.throwIfAborted();
        if(decimals !== token.decimals || !code || code === '0x') throw new Error('Token metadata changed.');
        results[i]={address:contract,status:'ready',balance:checkedBalance(balance)};
      } catch { signal?.throwIfAborted(); results[i]={address:token.address,status:'error'}; }
    }
  }
  await Promise.all(Array.from({length:Math.min(4,tokens.length)},worker));
  return {blockNumber,tokens:results};
}
/** Explorer suggestions are untrusted. RPC inspection is still required before importing. */
export function parseDiscoveredTokens(value: unknown): DiscoveredToken[] {
  const data=value as {items?:unknown[]};
  if (!data || !Array.isArray(data.items) || data.items.length > 100) throw new Error('Token discovery is unavailable. Import by contract instead.');
  const found=new Map<string,DiscoveredToken>();
  for(const item of data.items) {
    try {
      const token=(item as {token:{type:string;address_hash:string;symbol:string;name:string;reputation?:string}}).token;
      if(token.type !== 'ERC-20' || ['scam','spam'].includes(token.reputation??'')) continue;
      const contract=address(token.address_hash);
      found.set(contract.toLowerCase(),{address:contract,symbol:text(token.symbol,32),name:text(token.name??token.symbol,80)});
    } catch { /* Ignore malformed suggestions, NFT records and untrusted image URLs. */ }
  }
  return [...found.values()].slice(0,MAX_EXTENSION_TOKENS);
}
export async function discoverExtensionTokens(account: Address, signal?: AbortSignal, fetcher: typeof fetch = fetch): Promise<DiscoveredToken[]> {
  const owner=address(account);
  const response=await fetcher(`${EXPLORER}/api/v2/addresses/${owner}/tokens?type=ERC-20`,{signal:AbortSignal.any([...(signal?[signal]:[]),AbortSignal.timeout(15_000)]),credentials:'omit',referrerPolicy:'no-referrer'});
  if(!response.ok) throw new Error('The explorer is unavailable. You can still import a token by contract.');
  const body=await response.text();
  if(body.length > 500_000) throw new Error('Token discovery response was too large. Import by contract instead.');
  try { return parseDiscoveredTokens(JSON.parse(body)); } catch { throw new Error('Token discovery is unavailable. Import by contract instead.'); }
}
