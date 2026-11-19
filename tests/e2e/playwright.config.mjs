import { defineConfig } from '@playwright/test';
import { BASE_DOMAIN } from './hosts.mjs';

const useApex = BASE_DOMAIN === 'sonaraim.apulab.info';

// Playwright E2E config for Sonaraim public URLs.
// Base domain from E2E_BASE_DOMAIN (default sonaraim.apulab.info);
// subdomains derived per REMOTE.md (apex app, nodesonar, b2bsonar, adminsonar).
export default defineConfig({
  testDir: '.',
  testMatch: ['**/*.spec.mjs'],
  outputDir: '../../test-results/',
  timeout: 60_000,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: '../../playwright-report/' }]],
  use: {
    baseURL: useApex ? `https://${BASE_DOMAIN}` : `https://app.${BASE_DOMAIN}`,
    ignoreHTTPSErrors: false,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
});
