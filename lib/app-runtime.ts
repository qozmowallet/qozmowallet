/** Public website used for guides and shareable links outside the extension. */
export const QOZMO_WEBSITE = 'https://qozmo-wallet.melodicfinch.chatgpt.site';

export function isExtensionRuntime(): boolean {
  return typeof window !== 'undefined' && window.location.protocol === 'chrome-extension:';
}

/** The standalone extension has two local entry points; guides stay on the website. */
export function appHref(path: string): string {
  if (!isExtensionRuntime()) return path;
  if (path.startsWith('/docs/') || path === '/proof/') return `${QOZMO_WEBSITE}${path}`;
  if (path === '/recovery/') return '/recovery.html';
  if (path.startsWith('/dashboard/')) return path.replace('/dashboard/', '/wallet.html');
  if (path === '/') return '/wallet.html';
  throw new Error('Unknown Qozmo extension route.');
}

type ExtensionPermissions = {
  request(options: { origins: string[] }): Promise<boolean>;
};

/** Called directly from the user's Connect gesture, before any network await. */
export async function requestExtensionOrigin(endpoint: string): Promise<void> {
  if (!isExtensionRuntime()) return;
  const url = new URL(endpoint);
  if (url.protocol !== 'https:') throw new Error('The extension requires an HTTPS bundler.');
  const api = (globalThis as typeof globalThis & { chrome?: { permissions?: ExtensionPermissions } }).chrome?.permissions;
  if (!api || !await api.request({ origins: [`${url.origin}/*`] })) {
    throw new Error('Bundler access was not granted. No connection was made.');
  }
}
