// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from './auth.service';

vi.mock('@angular/fire/auth', () => ({
  Auth: class {},
  user: vi.fn(() => of(null)),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: class {
    setCustomParameters = vi.fn();
  },
  sendPasswordResetEmail: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    const fireAuth = await import('@angular/fire/auth');
    (fireAuth.signInWithEmailAndPassword as ReturnType<typeof vi.fn>).mockReset();
    (fireAuth.signInWithPopup as ReturnType<typeof vi.fn>).mockReset();
    (fireAuth.createUserWithEmailAndPassword as ReturnType<typeof vi.fn>).mockReset();
    (fireAuth.signOut as ReturnType<typeof vi.fn>).mockReset();
    (fireAuth.sendPasswordResetEmail as ReturnType<typeof vi.fn>).mockReset();

    routerMock = { navigate: vi.fn().mockResolvedValue(true) };
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Auth, useValue: {} },
        { provide: Router, useValue: routerMock },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('creates the service', () => {
    expect(service).toBeTruthy();
  });

  it('login forwards to Firebase signInWithEmailAndPassword and returns the user', async () => {
    const { signInWithEmailAndPassword } = await import('@angular/fire/auth');
    (signInWithEmailAndPassword as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { uid: 'u-1', email: 'a@b.co' },
    });

    const result = await service.login('a@b.co', 'pw');

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'a@b.co', 'pw');
    expect(result.uid).toBe('u-1');
  });

  it('register forwards to Firebase createUserWithEmailAndPassword', async () => {
    const { createUserWithEmailAndPassword } = await import('@angular/fire/auth');
    (createUserWithEmailAndPassword as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { uid: 'u-2', email: 'new@user.co' },
    });

    const result = await service.register('new@user.co', 'pw');

    expect(createUserWithEmailAndPassword).toHaveBeenCalled();
    expect(result.uid).toBe('u-2');
  });

  it('loginWithGoogle uses the popup flow with select_account prompt', async () => {
    const { signInWithPopup, GoogleAuthProvider } = await import('@angular/fire/auth');
    (signInWithPopup as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { uid: 'u-3', email: 'g@user.co', displayName: 'G User' },
    });

    const result = await service.loginWithGoogle();

    expect(signInWithPopup).toHaveBeenCalled();
    const providerArg = (signInWithPopup as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(providerArg).toBeInstanceOf(GoogleAuthProvider);
    expect(result.uid).toBe('u-3');
  });

  it('resetPassword forwards to sendPasswordResetEmail', async () => {
    const { sendPasswordResetEmail } = await import('@angular/fire/auth');
    (sendPasswordResetEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await service.resetPassword('a@b.co');

    expect(sendPasswordResetEmail).toHaveBeenCalledWith(expect.anything(), 'a@b.co');
  });

  it('logout signs out and navigates to /login', async () => {
    const { signOut } = await import('@angular/fire/auth');
    (signOut as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    await service.logout();

    expect(signOut).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });
});
