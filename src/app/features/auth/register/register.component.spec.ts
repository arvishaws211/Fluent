// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';

const STRONG_PASSWORD = 'Str0ng!Pwd';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authMock: { register: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    authMock = { register: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [RegisterComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authMock },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('rejects a weak password and accepts a strong one', () => {
    const pw = component.registerForm.controls.password;
    pw.setValue('password');
    expect(pw.errors?.['passwordStrength']).toBeTruthy();

    pw.setValue(STRONG_PASSWORD);
    expect(pw.errors).toBeNull();
  });

  it('treats the form as valid only when all fields are filled correctly', () => {
    expect(component.registerForm.valid).toBe(false);
    component.registerForm.setValue({
      displayName: 'Alex Smith',
      email: 'alex@example.com',
      password: STRONG_PASSWORD,
    });
    expect(component.registerForm.valid).toBe(true);
  });

  it('registers and navigates to /dashboard after the success delay', async () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    authMock.register.mockResolvedValue({ uid: 'u1' });

    component.registerForm.setValue({
      displayName: 'Alex Smith',
      email: 'alex@example.com',
      password: 'Str0ng!Pass',
    });

    await component.onSubmit();
    
    expect(authMock.register).toHaveBeenCalledWith('alex@example.com', 'Str0ng!Pass');
    expect(component.successMessage).toMatch(/successful/i);

    vi.advanceTimersByTime(1600);
    expect(spy).toHaveBeenCalledWith(['/dashboard']);
    vi.useRealTimers();
  });

  it('renders a translated friendly error on registration failure', async () => {
    authMock.register.mockRejectedValue({ code: 'auth/email-already-in-use' });
    component.registerForm.setValue({
      displayName: 'Alex',
      email: 'ex@example.com',
      password: 'Str0ng!Pass',
    });

    await component.onSubmit();

    expect(component.errorMessage).toMatch(/already registered/i);
    expect(component.isLoading).toBe(false);
  });
});
