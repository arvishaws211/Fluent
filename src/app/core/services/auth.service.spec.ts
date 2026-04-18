import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { IdentityService } from './identity.service';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { of } from 'rxjs';
import { vi } from 'vitest';

// Mock standalone firebase functions
vi.mock('@angular/fire/auth', () => ({
  Auth: class {},
  user: vi.fn(() => of(null)),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: class {},
  sendPasswordResetEmail: vi.fn()
}));

describe('AuthService', () => {
  let service: AuthService;
  let identityServiceMock: any;
  let routerMock: any;

  beforeEach(() => {
    identityServiceMock = {
      setIdentity: vi.fn(),
      clearIdentity: vi.fn()
    };
    routerMock = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Auth, useValue: {} },
        { provide: IdentityService, useValue: identityServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });
    service = TestBed.inject(AuthService);
  });

  it('should clear identity if no current user', () => {
    expect(identityServiceMock.clearIdentity).toHaveBeenCalled();
  });

  it('should logout and navigate', async () => {
    const { signOut } = await import('@angular/fire/auth');
    await service.logout();
    expect(signOut).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should login and set identity', async () => {
    const { signInWithEmailAndPassword } = await import('@angular/fire/auth');
    (signInWithEmailAndPassword as any).mockResolvedValue({
      user: { uid: '123', email: 'test@test.com' }
    });

    await service.login('test@test.com', 'password');
    expect(identityServiceMock.setIdentity).toHaveBeenCalledWith(
      expect.objectContaining({ id: '123' })
    );
  });

  it('should login with google and set identity', async () => {
    const { signInWithPopup } = await import('@angular/fire/auth');
    (signInWithPopup as any).mockResolvedValue({
      user: { uid: '456', email: 'google@test.com', displayName: 'Google User' }
    });

    await service.loginWithGoogle();
    expect(identityServiceMock.setIdentity).toHaveBeenCalledWith(
      expect.objectContaining({ id: '456', name: 'Google User' })
    );
  });

  it('should call resetPassword', async () => {
    const { sendPasswordResetEmail } = await import('@angular/fire/auth');
    await service.resetPassword('test@test.com');
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(expect.anything(), 'test@test.com');
  });
});
