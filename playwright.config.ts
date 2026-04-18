// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

import { defineConfig, devices } from '@playwright/test';

const PORT = 4200;
const BASE_URL = process.env['E2E_BASE_URL'] ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    permissions: ['camera', 'microphone'],
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
    },
  ],
  webServer: process.env['E2E_BASE_URL']
    ? undefined
    : {
        command: 'npm run start -- --port 4200',
        url: BASE_URL,
        reuseExistingServer: !process.env['CI'],
        timeout: 120_000,
      },
});
