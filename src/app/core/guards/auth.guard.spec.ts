// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { authGuard } from './auth.guard';
import { IdentityService } from '../services/identity.service';

describe('authGuard', () => {
  let attendee$: ReturnType<typeof signal>;

  beforeEach(() => {
    attendee$ = signal(null);
    TestBed.configureTestingModule({
      providers: [{ provide: IdentityService, useValue: { currentAttendee: attendee$ } }],
    });
  });

  function run() {
    const route = {} as never;
    const state = {} as never;
    return TestBed.runInInjectionContext(() => authGuard(route, state));
  }

  it('returns true when an attendee is signed in', () => {
    attendee$.set({
      id: 'u1',
      name: 'A',
      interests: [],
      role: 'attendee',
      ssiIdentifier: 'did:firebase:u1',
    });
    expect(run()).toBe(true);
  });

  it('returns a UrlTree to /login when no attendee is present', () => {
    const result = run();
    expect(result).toBeInstanceOf(UrlTree);
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });
});
