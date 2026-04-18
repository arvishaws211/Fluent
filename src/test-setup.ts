import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

import { environment } from './environments/environment';

// Globally set a mock API key for tests to bypass the "starts with __" check
(globalThis as any).IS_ANGULAR_TEST = true;
environment.googleMapsApiKey = 'TEST_MAPS_API_KEY';

try {
  getTestBed().initTestEnvironment(
    BrowserDynamicTestingModule,
    platformBrowserDynamicTesting(),
  );
} catch {
  // Environment already initialized
}
