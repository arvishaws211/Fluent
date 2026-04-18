// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

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
