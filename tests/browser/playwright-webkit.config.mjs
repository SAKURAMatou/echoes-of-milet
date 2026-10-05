import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  testDir: '.',
  testMatch: 'submission-webp.webkit.spec.ts',
  timeout: 90000,
  workers: 1,
  reporter: 'list',
  outputDir: '../../.ssr-runtime/submission-webp-webkit-results',
  use: { baseURL: 'http://127.0.0.1:4312', trace: 'retain-on-failure' },
  projects: [
    { name: 'webkit-desktop', use: { ...devices['Desktop Safari'] } },
    { name: 'webkit-mobile', use: { ...devices['iPhone 13'], browserName: 'webkit' } },
  ],
  webServer: {
    command: 'node scripts/verify-submission-webp-browser.mjs',
    cwd: fileURLToPath(new URL('../../', import.meta.url)),
    url: 'http://127.0.0.1:4312/tests/browser/submission-webp.html',
    reuseExistingServer: false,
    timeout: 60000,
  },
})
