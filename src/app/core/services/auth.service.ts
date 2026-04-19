// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

import { EnvironmentInjector, inject, Injectable, runInInjectionContext } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  user,
  type User,
  type UserCredential,
} from '@angular/fire/auth';
import { Router } from '@angular/router';

/**
 * Thin wrapper over Firebase Auth.
 *
 * `runInInjectionContext` is required because `@angular/fire` callables
 * resolve injection context lazily; without it, `signInWithEmailAndPassword`
 * etc. throw `inject() must be called from an injection context` when invoked
 * from a Promise continuation.
 *
 * Identity caching has moved to `IdentityService`, which subscribes to
 * `user(this.fireAuth)` directly. Auth is responsible *only* for the auth
 * primitives + post-logout routing.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private fireAuth = inject(Auth);
  private router = inject(Router);
  private injector = inject(EnvironmentInjector);

  readonly currentUser$ = user(this.fireAuth);

  async login(email: string, pass: string): Promise<User> {
    const cred = await runInInjectionContext(this.injector, () =>
      signInWithEmailAndPassword(this.fireAuth, email, pass),
    );
    return cred.user;
  }

  async loginWithGoogle(): Promise<User> {
    const cred: UserCredential = await runInInjectionContext(this.injector, () => {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      return signInWithPopup(this.fireAuth, provider);
    });
    return cred.user;
  }

  async register(email: string, pass: string): Promise<User> {
    const cred = await runInInjectionContext(this.injector, () =>
      createUserWithEmailAndPassword(this.fireAuth, email, pass),
    );
    return cred.user;
  }

  async resetPassword(email: string): Promise<void> {
    await runInInjectionContext(this.injector, () => sendPasswordResetEmail(this.fireAuth, email));
  }

  async logout(): Promise<void> {
    await signOut(this.fireAuth);
    await this.router.navigate(['/login']);
  }
}
