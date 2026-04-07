import { defineConfig, devices } from '@playwright/test';

const isDeployedTarget = Boolean(process.env.BASE_URL);

export default defineConfig({
  testDir: './tests/smoke',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:4173',
    serviceWorkers: 'block',
    trace: 'on-first-retry',
  },
  webServer: isDeployedTarget
    ? undefined
    : {
        command: 'npm run preview -- --host 127.0.0.1 --port 4173',
        port: 4173,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 7'],
      },
    },
  ],
});
