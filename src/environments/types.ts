// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors
//
// This file is intentionally *outside* the `fileReplacements` graph.
// It holds the single source of truth for the shape of `environment.*.ts`
// so that `environment.local.ts` and `environment.prod.ts` can `import type`
// from it without the Angular CLI's file-replacement pipeline pointing them
// back at themselves (which produces the "declares X locally but not
// exported" error the hard way).

export interface FluentEnvironment {
  production: boolean;
  emulators: boolean;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
  googleMapsApiKey: string;
  googleMapsMapId: string;
  appCheckSiteKey: string;
  region: string;
}
