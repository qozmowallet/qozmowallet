/** The URL is public configuration; upstream provider credentials belong only on the gateway. */
export function gatewayBase(): string {
  const configured = process.env.NEXT_PUBLIC_QOZMO_GATEWAY_URL || '/api/qozmo';
  if (configured.startsWith('/') && !configured.startsWith('//')) return configured.replace(/\/$/, '');
  const url = new URL(configured);
  if ((url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) || url.username || url.password || url.search || url.hash) throw new Error('Invalid Qozmo gateway configuration.');
  return url.href.replace(/\/$/, '');
}

export function managedBundlerUrl(): string {
  return new URL(`${gatewayBase()}/bundler`, window.location.origin).href;
}
