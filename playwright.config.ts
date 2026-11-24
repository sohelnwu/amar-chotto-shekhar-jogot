import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run against the PRODUCTION build (service worker enabled).
 * Run `npm run build` first. Uses the locally installed Microsoft Edge or
 * Google Chrome, so no browser download is required:
 *   PW_CHANNEL=chrome npm run test:e2e
 */
const channel = process.env.PW_CHANNEL ?? 'msedge';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173/',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js preview --port 4173 --strictPort',
    url: 'http://localhost:4173/',
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    {
      name: 'android-phone',
      use: { ...devices['Pixel 7'], channel, browserName: 'chromium' },
    },
    {
      name: 'android-tablet',
      use: { ...devices['Galaxy Tab S4'], channel, browserName: 'chromium' },
      testMatch: /layout\.spec\.ts/,
    },
  ],
});
