import { defineConfig } from '@playwright/test'

export default defineConfig({
  expect: { timeout: 5_000 },
  fullyParallel: false,
  outputDir: 'test-results',
  reporter: 'line',
  testDir: './tests',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    colorScheme: 'dark',
    deviceScaleFactor: 1,
    locale: 'en-US',
    screenshot: 'only-on-failure',
    timezoneId: 'Asia/Bangkok',
    viewport: { height: 896, width: 414 },
  },
  webServer: {
    command: 'pnpm dev --host 127.0.0.1 --port 4173',
    reuseExistingServer: true,
    timeout: 120_000,
    url: 'http://127.0.0.1:4173',
  },
})
