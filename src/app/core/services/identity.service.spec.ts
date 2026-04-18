// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

import { TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { IdentityService } from './identity.service';

const userObs$ = of({
  uid: 'u-1',
  email: 'alex@fluent.dev',
  displayName: 'Alex',
});

vi.mock('@angular/fire/auth', () => ({
  Auth: class {},
  user: vi.fn(() => userObs$),
}));

vi.mock('@angular/fire/firestore', () => ({
  Firestore: class {},
  doc: vi.fn(() => ({ id: 'u-1' })),
  docData: vi.fn(() =>
    of({
      displayName: 'Alex Rivera',
      interests: ['Angular', 'Firebase'],
      role: 'attendee',
      ssiIdentifier: 'did:firebase:u-1',
    })
  ),
  setDoc: vi.fn(() => Promise.resolve()),
  serverTimestamp: vi.fn(() => 'SERVER_TS'),
}));

describe('IdentityService', () => {
  let service: IdentityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        IdentityService,
        { provide: Auth, useValue: {} },
        { provide: Firestore, useValue: {} },
      ],
    });
    service = TestBed.inject(IdentityService);
  });

  it('exposes the current attendee from Firestore docData', async () => {
    await Promise.resolve();
    const me = service.currentAttendee();
    expect(me?.id).toBe('u-1');
    expect(me?.name).toBe('Alex Rivera');
    expect(me?.interests).toContain('Angular');
    expect(me?.role).toBe('attendee');
    expect(me?.ssiIdentifier).toBe('did:firebase:u-1');
  });

  it('isAuthenticated reflects presence of the attendee', async () => {
    await Promise.resolve();
    expect(service.isAuthenticated()).toBe(true);
  });

  it('isStaff is true only for staff/sponsor roles', async () => {
    await Promise.resolve();
    expect(service.isStaff()).toBe(false);
  });

  it('updateInterests calls setDoc with cleaned interests', async () => {
    const { setDoc } = await import('@angular/fire/firestore');
    await Promise.resolve();
    await service.updateInterests([' AI ', 'GenAI', '', 'Cloud']);
    expect(setDoc).toHaveBeenCalled();
    const args = (setDoc as ReturnType<typeof vi.fn>).mock.calls.at(-1);
    expect(args?.[1]).toEqual(
      expect.objectContaining({
        interests: ['AI', 'GenAI', 'Cloud'],
        updatedAt: 'SERVER_TS',
      })
    );
  });

  it('generateVerifiablePresentation returns a structured token bound to the user DID', async () => {
    await Promise.resolve();
    const token = await service.generateVerifiablePresentation('check-in');
    expect(token.startsWith('vp.')).toBe(true);
    const [, payload] = token.split('.');
    const decoded = atob(payload);
    expect(decoded).toContain('did:firebase:u-1');
    expect(decoded).toContain('check-in');
  });
});
