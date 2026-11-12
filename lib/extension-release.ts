import manifest from '@/extension/manifest.json';

export const EXTENSION_VERSION = manifest.version;
export const EXTENSION_MIN_CHROME = manifest.minimum_chrome_version;
export const EXTENSION_DOWNLOAD = '/downloads/qozmo-wallet-chrome.zip';
export const EXTENSION_CHECKSUM = `${EXTENSION_DOWNLOAD}.sha256`;
