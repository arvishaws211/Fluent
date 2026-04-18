// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../../../core/services/auth.service';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let authMock: { resetPassword: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authMock = { resetPassword: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authMock },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('marks the form as sent on success', fakeAsync(() => {
    authMock.resetPassword.mockResolvedValue(undefined);
    component.forgotForm.setValue({ email: 'test@example.com' });

    component.onSubmit();
    tick();

    expect(authMock.resetPassword).toHaveBeenCalledWith('test@example.com');
    expect(component.isSent).toBe(true);
    expect(component.errorMessage).toBe('');
  }));

  it('renders a translated friendly error when the reset call fails', fakeAsync(() => {
    authMock.resetPassword.mockRejectedValue({ code: 'auth/user-not-found' });
    component.forgotForm.setValue({ email: 'unknown@example.com' });

    component.onSubmit();
    tick();

    expect(component.errorMessage).toMatch(/Invalid email or password/i);
    expect(component.isSent).toBe(false);
  }));
});
