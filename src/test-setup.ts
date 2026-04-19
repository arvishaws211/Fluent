// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors
import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

import { environment } from './environments/environment';

(globalThis as { IS_ANGULAR_TEST?: boolean }).IS_ANGULAR_TEST = true;
environment.googleMapsApiKey = 'TEST_MAPS_API_KEY';

try {
  getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
} catch {
  // Environment already initialized
}
