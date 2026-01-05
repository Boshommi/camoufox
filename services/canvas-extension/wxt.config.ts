import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Canvas Fingerprint Capture',
    description: 'Capture canvas fingerprints for Camoufox spoofing',
    permissions: ['storage', 'activeTab'],
    host_permissions: ['<all_urls>'],
    web_accessible_resources: [
      {
        resources: ['inject.js'],
        matches: ['<all_urls>'],
      },
    ],
  },
});
