import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

export const ENTRYPOINT = '0x0000000071727De22E5E9d8BAf0edAc6f37da032';
const methods = new Set(['eth_chainId', 'eth_supportedEntryPoints', 'eth_estimateUserOperationGas', 'eth_sendUserOperation', 'eth_getUserOperationReceipt', 'eth_getUserOperationByHash', 'rundler_maxPriorityFeePerGas', 'pimlico_getUserOperationGasPrice']);
export const explorers = Object.freeze({
  1: 'https://eth.blockscout.com', 8453: 'https://base.blockscout.com',
  42161: 'https://arbitrum.blockscout.com', 10: 'https://optimism.blockscout.com',
  137: 'https://polygon.blockscout.com', 11155111: 'https://eth-sepolia.blockscout.com',
  84532: 'https://base-sepolia.blockscout.com', 4663: 'https://robinhoodchain.blockscout.com',
  46630: 'https://explorer.testnet.chain.robinhood.com',
});

export function validateBundlerRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || body.jsonrpc !== '2.0' || !methods.has(body.method) || !Array.isArray(body.params) || !['string', 'number'].includes(typeof body.id) || (typeof body.id === 'number' && !Number.isSafeInteger(body.id))) throw new Error('Unsupported RPC request.');
  const { method, params } = body;
  if (method === 'eth_sendUserOperation' || method === 'eth_estimateUserOperationGas') {
    if (params.length !== 2 || params[1]?.toLowerCase() !== ENTRYPOINT.toLowerCase() || !params[0] || typeof params[0] !== 'object' || Array.isArray(params[0]) || !/^0x[0-9a-fA-F]{40}$/.test(params[0].sender)) throw new Error('Unsupported operation or EntryPoint.');
  } else if (method === 'eth_getUserOperationReceipt' || method === 'eth_getUserOperationByHash') {
    if (params.length !== 1 || !/^0x[0-9a-fA-F]{64}$/.test(params[0])) throw new Error('Invalid operation hash.');
  } else if (params.length) throw new Error('Unexpected RPC parameters.');
  return { jsonrpc: '2.0', id: body.id, method, params };
}

export function historyTarget(search) {
  const chain = search.get('chainId'); const address = search.get('address');
  const action = search.get('action'); const page = Number(search.get('page') || '1');
  if (!Object.hasOwn(explorers, chain) || !/^0x[0-9a-fA-F]{40}$/.test(address || '') || !['txlist', 'tokentx', 'txlistinternal'].includes(action) || !Number.isSafeInteger(page) || page < 1 || page > 10000) throw new Error('Invalid history query.');
  const url = new URL('/api', explorers[chain]);
  url.search = new URLSearchParams({ module: 'account', action, address, page: String(page), offset: '100', sort: 'desc' }).toString();
  return url;
}

async function jsonFetch(url, init, fetcher) {
  const response = await fetcher(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error('Upstream unavailable.');
  const chunks = []; let length = 0;
  for await (const chunk of response.body) { length += chunk.length; if (length > 2_000_000) throw new Error('Response too large.'); chunks.push(chunk); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export function createGateway({ bundlerUrl = process.env.QOZMO_BUNDLER_URL, origins = (process.env.QOZMO_ALLOWED_ORIGINS || 'http://localhost:3001,http://127.0.0.1:3001').split(','), fetcher = fetch } = {}) {
  let upstream;
  if (bundlerUrl) { upstream = new URL(bundlerUrl); if (upstream.protocol !== 'https:' || upstream.username || upstream.password || upstream.hash) throw new Error('QOZMO_BUNDLER_URL must be an HTTPS provider URL.'); }
  const quotas = new Map();
  return createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Vary', 'Origin');
    const send = (code, body) => { res.writeHead(code); res.end(JSON.stringify(body)); };
    const origin = req.headers.origin;
    if (origin && !origins.includes(origin)) return send(403, { error: 'Origin not allowed.' });
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); return send(204, null); }
    const now = Date.now();
    for (const [key, value] of quotas) if (value.reset <= now) quotas.delete(key);
    const ip = req.socket.remoteAddress || 'unknown'; const quota = quotas.get(ip) || { reset: now + 60000, count: 0 };
    if (++quota.count > 90 || quotas.size > 10000) return send(429, { error: 'Rate limit exceeded. Retry later.' });
    quotas.set(ip, quota);
    const url = new URL(req.url, 'http://gateway.local');
    try {
      if (req.method === 'GET' && url.pathname === '/health') {
        if (!upstream) return send(200, { chainId: 46630, bundler: 'not-configured' });
        const [chain, points] = await Promise.all(['eth_chainId', 'eth_supportedEntryPoints'].map((method, id) => jsonFetch(upstream, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id, method, params: [] }) }, fetcher)));
        const ready = chain.result === '0xb626' && Array.isArray(points.result) && points.result.some(point => typeof point === 'string' && point.toLowerCase() === ENTRYPOINT.toLowerCase());
        return send(ready ? 200 : 503, { chainId: 46630, bundler: ready ? 'ready' : 'wrong-network-or-entrypoint', observedAt: new Date().toISOString() });
      }
      if (req.method === 'GET' && url.pathname === '/history') {
        const target = historyTarget(url.searchParams);
        const body = await jsonFetch(target, {}, fetcher);
        if (body.status === '0' && typeof body.result === 'string' && /no (transactions|token transfers|internal transactions|records) found/i.test(body.result)) return send(200, { rows: [], pageSize: 100, source: target.origin });
        if (body.status !== '1' || !Array.isArray(body.result) || body.result.length > 100) throw new Error('History unavailable.');
        return send(200, { rows: body.result, pageSize: 100, source: target.origin });
      }
      if (req.method === 'POST' && url.pathname === '/bundler') {
        if (!upstream) return send(503, { jsonrpc: '2.0', id: null, error: { code: -32000, message: 'Qozmo bundler is not configured.' } });
        if (!req.headers['content-type']?.startsWith('application/json')) return send(415, { error: 'JSON required.' });
        const chunks = []; let size = 0;
        for await (const chunk of req) { size += chunk.length; if (size > 160000) return send(413, { error: 'Request too large.' }); chunks.push(chunk); }
        const body = validateBundlerRequest(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        // Recheck the upstream chain/EntryPoint before forwarding every signed operation.
        if (body.method === 'eth_sendUserOperation' || body.method === 'eth_estimateUserOperationGas') {
          const [chain, points] = await Promise.all(['eth_chainId', 'eth_supportedEntryPoints'].map((method, id) => jsonFetch(upstream, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id, method, params: [] }) }, fetcher)));
          if (chain.result !== '0xb626' || !Array.isArray(points.result) || !points.result.some(p => typeof p === 'string' && p.toLowerCase() === ENTRYPOINT.toLowerCase())) throw new Error('Wrong bundler network.');
        }
        const result = await jsonFetch(upstream, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, fetcher);
        if (result.error) return send(200, { jsonrpc: '2.0', id: body.id, error: { code: -32000, message: 'Provider rejected the operation. Preserve signed bytes and refresh before retrying.' } });
        if (result.jsonrpc !== '2.0' || result.id !== body.id || !Object.hasOwn(result, 'result')) throw new Error('Invalid provider response.');
        return send(200, { jsonrpc: '2.0', id: body.id, result: result.result });
      }
      return send(404, { error: 'Unknown endpoint.' });
    } catch { return send(502, { error: 'Service unavailable or request rejected. No automatic resubmission was performed.' }); }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.QOZMO_GATEWAY_PORT || 8787);
  const server = createGateway(); server.requestTimeout = 15000; server.headersTimeout = 10000;
  server.listen(port, '127.0.0.1', () => console.log(`Qozmo gateway: http://127.0.0.1:${port}`));
}
