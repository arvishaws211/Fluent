// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { signal } from '@angular/core';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CheckInService } from './check-in.service';
import { IdentityService } from './identity.service';

vi.mock('@angular/fire/firestore', () => ({
  Firestore: class {},
  collection: vi.fn(() => ({})),
  addDoc: vi.fn(() => Promise.resolve({ id: 'doc-1' })),
  serverTimestamp: vi.fn(() => 'TS'),
}));

vi.mock('@zxing/browser', () => ({
  BrowserMultiFormatReader: class {
    decodeFromVideoDevice = vi.fn(() => Promise.resolve());
  },
}));

const ATTENDEE = {
  id: 'u-1',
  name: 'A',
  interests: [],
  role: 'attendee' as const,
  ssiIdentifier: 'did:firebase:u-1',
};

describe('CheckInService', () => {
  let service: CheckInService;
  let identityMock: { currentAttendee: ReturnType<typeof signal>; generateVerifiablePresentation: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    identityMock = {
      currentAttendee: signal(ATTENDEE),
      generateVerifiablePresentation: vi.fn().mockResolvedValue('vp.token'),
    };
    Object.defineProperty(globalThis.navigator, 'onLine', { configurable: true, get: () => true });

    TestBed.configureTestingModule({
      providers: [
        CheckInService,
        { provide: Firestore, useValue: {} },
        { provide: IdentityService, useValue: identityMock },
      ],
    });
    service = TestBed.inject(CheckInService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('isBiometricSupported', () => {
    it('returns true when PublicKeyCredential is defined', () => {
      Object.defineProperty(globalThis, 'PublicKeyCredential', {
        configurable: true,
        value: class {},
      });
      expect(service.isBiometricSupported()).toBe(true);
    });
  });

  describe('biometricCheckIn — edge cases', () => {
    it('fails fast when WebAuthn is unsupported', async () => {
      Object.defineProperty(globalThis, 'PublicKeyCredential', {
        configurable: true,
        value: undefined,
      });
      const status = await service.biometricCheckIn();
      expect(status.success).toBe(false);
      expect(status.errorMessage).toMatch(/biometric/i);
    });

    it('fails fast when offline', async () => {
      Object.defineProperty(globalThis, 'PublicKeyCredential', {
        configurable: true,
        value: class {},
      });
      Object.defineProperty(globalThis.navigator, 'onLine', { configurable: true, get: () => false });
      const status = await service.biometricCheckIn();
      expect(status.success).toBe(false);
      expect(status.errorMessage).toMatch(/offline/i);
    });

    it('fails when no attendee is signed in', async () => {
      Object.defineProperty(globalThis, 'PublicKeyCredential', { configurable: true, value: class {} });
      identityMock.currentAttendee.set(null);
      const status = await service.biometricCheckIn();
      expect(status.success).toBe(false);
    });
  });

  describe('qrCheckIn', () => {
    it('rejects an invalid pass code', async () => {
      const status = await service.qrCheckIn('not-a-fluent-pass');
      expect(status.success).toBe(false);
      expect(status.errorMessage).toMatch(/valid Fluent pass/i);
    });

    it('records success and writes the audit row for a valid pass', async () => {
      const { addDoc } = await import('@angular/fire/firestore');
      const status = await service.qrCheckIn('fluent:pass:u-1:abc');
      expect(status.success).toBe(true);
      expect(status.method).toBe('qr');
      expect(addDoc).toHaveBeenCalled();
    });
  });

  describe('manualCheckIn', () => {
    it('rejects empty input', async () => {
      const status = await service.manualCheckIn('   ');
      expect(status.success).toBe(false);
    });

    it('records success for a non-empty pass code', async () => {
      const status = await service.manualCheckIn('PASS-123');
      expect(status.success).toBe(true);
      expect(status.method).toBe('manual');
    });
  });

  describe('reset', () => {
    it('clears the status signal', async () => {
      await service.qrCheckIn('fluent:pass:u-1:abc');
      expect(service.status()?.success).toBe(true);
      service.reset();
      expect(service.status()).toBeNull();
    });
  });
});
