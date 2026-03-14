/* global chrome */
const DEFAULTS_VERSION = '1.0.0';

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.sync.get({
      installedDate: null,
      version: DEFAULTS_VERSION
    }, (current) => {
      if (!current.installedDate) {
        chrome.storage.sync.set({
          installedDate: new Date().toISOString(),
          version: DEFAULTS_VERSION
        });
      }
    });
  }
});
