// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authMock: { login: ReturnType<typeof vi.fn>; loginWithGoogle: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    authMock = {
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authMock },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('starts with an invalid form', () => {
    expect(component.loginForm.valid).toBe(false);
  });

  it('rejects an invalid email', () => {
    const email = component.loginForm.controls.email;
    email.setValue('not-an-email');
    expect(email.errors?.['email']).toBeTruthy();

    email.setValue('test@example.com');
    expect(email.errors).toBeNull();
  });

  it('signs in and routes to /dashboard after the success delay', fakeAsync(() => {
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    authMock.login.mockResolvedValue({ uid: 'u1' });

    component.loginForm.setValue({ email: 'test@example.com', password: 'password123' });
    component.onSubmit();
    tick();
    expect(authMock.login).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(component.successMessage).toMatch(/successful/i);

    tick(1000);
    expect(spy).toHaveBeenCalledWith(['/dashboard']);
  }));

  it('renders a translated friendly error on auth failure', fakeAsync(() => {
    authMock.login.mockRejectedValue({ code: 'auth/invalid-login-credentials' });
    component.loginForm.setValue({ email: 'test@example.com', password: 'password123' });

    component.onSubmit();
    tick();

    expect(component.errorMessage).toMatch(/Invalid email or password/i);
    expect(component.isLoading).toBe(false);
  }));

  it('handles Google login and navigates immediately', fakeAsync(() => {
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    authMock.loginWithGoogle.mockResolvedValue({ uid: 'g1' });

    component.onGoogleLogin();
    tick();

    expect(authMock.loginWithGoogle).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(['/dashboard']);
  }));
});
