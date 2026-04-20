// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors
/**
 * Vitest configuration for the Fluent Angular 21 client.
 *
 * - `@analogjs/vite-plugin-angular` compiles components AOT through Vite so
 *   Angular templates and signals work inside Vitest's worker pool.
 * - `server.deps.inline` forces Vite to transform `rxfire` and `@angular/fire`
 *   on the fly. Both packages ship `.esm.js` files declared as CJS in their
 *   package.json, which Node's loader rejects when imported through the
 *   Firebase modular SDK (`auth`, `firestore`, `functions`, ...).
 * - `setupFiles` boot the Angular `TestBed` and polyfill `crypto.subtle` for
 *   tests that exercise the verifiable-presentation helper.
 */
import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [angular()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    server: {
      deps: {
        inline: ['rxfire', '@angular/fire'],
      },
    },
  },
});
