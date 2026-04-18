import { Injectable, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, user, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from '@angular/fire/auth';
import { IdentityService } from './identity.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private fireAuth = inject(Auth);
  private identityService = inject(IdentityService);
  private router = inject(Router);
  private injector = inject(EnvironmentInjector);

  public readonly currentUser$ = user(this.fireAuth);

  constructor() {
    this.currentUser$.subscribe(u => {
      if (!u) {
        this.identityService.clearIdentity();
      }
    });
  }

  async login(email: string, pass: string) {
    return runInInjectionContext(this.injector, async () => {
      const credential = await signInWithEmailAndPassword(this.fireAuth, email, pass);
      this.updateIdentity(credential.user);
      return credential.user;
    });
  }

  async loginWithGoogle() {
    return runInInjectionContext(this.injector, async () => {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(this.fireAuth, provider);
      this.updateIdentity(credential.user);
      return credential.user;
    });
  }

  async register(email: string, pass: string) {
    return runInInjectionContext(this.injector, async () => {
      const credential = await createUserWithEmailAndPassword(this.fireAuth, email, pass);
      this.updateIdentity(credential.user);
      return credential.user;
    });
  }

  async resetPassword(email: string) {
    return runInInjectionContext(this.injector, async () => {
      return await sendPasswordResetEmail(this.fireAuth, email);
    });
  }

  private updateIdentity(fireUser: any) {
    this.identityService.setIdentity({
        id: fireUser.uid,
        name: fireUser.displayName || fireUser.email?.split('@')[0] || 'User',
        interests: [],
        role: 'attendee',
        ssiIdentifier: `did:firebase:${fireUser.uid}`
    });
  }

  async logout() {
    await signOut(this.fireAuth);
    this.router.navigate(['/login']);
  }
}
