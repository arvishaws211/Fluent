// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors
/**
 * Shared Playwright fixture that pre-seeds the IdentityService signal as if a
 * user had completed authentication, so each E2E test can start from any
 * deep link without going through the (mock-emulator-dependent) login flow.
 *
 * The fixture installs a small bridge in the page that bypasses Firebase Auth
 * and writes a known attendee blob into the page's window context. Production
 * services read from that as a feature-flagged shim driven by URL param
 * `?e2e=1`. NEVER ship the bridge enabled in production builds.
 */

import { test as base, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

interface Fixtures {
  authedPage: Page;
  axe: (page: Page) => AxeBuilder;
}

export const test = base.extend<Fixtures>({
  authedPage: async ({ page }, use) => {
    await page.addInitScript(() => {
      (window as unknown as Record<string, unknown>)['__FLUENT_E2E__'] = {
        attendee: {
          id: 'e2e-user',
          name: 'E2E Tester',
          interests: ['Angular', 'Firebase', 'GenAI'],
          role: 'attendee',
          ssiIdentifier: 'did:firebase:e2e-user',
        },
      };
    });
    await use(page);
  },
  axe: async ({}, use) => {
    await use((p: Page) => new AxeBuilder({ page: p }));
  },
});

export { expect } from '@playwright/test';
