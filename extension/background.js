// The worker configures browser UI only. It never opens a tab or handles wallet data.
function configureWalletPanel() {
  return chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
    console.warn('Qozmo could not configure its side panel. Reload the extension and try again.');
  });
}

chrome.runtime.onInstalled.addListener(configureWalletPanel);
chrome.runtime.onStartup.addListener(configureWalletPanel);
void configureWalletPanel();
