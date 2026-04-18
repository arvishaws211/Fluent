// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors
/**
 * Smoke pass: prove the unauthenticated landing surface renders, has no
 * critical a11y violations, and exposes the expected sign-in CTAs.
 */

import { test, expect } from './fixtures/test';

test.describe('public surface', () => {
  test('landing renders the brand wordmark and auth CTAs', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /fluent/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /get started/i })).toBeVisible();
  });

  test('skip-to-content link is present and focusable', async ({ page }) => {
    await page.goto('/');
    const skip = page.locator('.skip-link');
    await expect(skip).toHaveAttribute('href', '#main-content');
    await page.keyboard.press('Tab');
    await expect(skip).toBeFocused();
  });

  test('login form renders with required fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('axe finds no critical/serious accessibility violations on /login', async ({ page, axe }) => {
    await page.goto('/login');
    const results = await axe(page).withTags(['wcag2a', 'wcag2aa']).analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
});
