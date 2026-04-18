// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

import { FormControl } from '@angular/forms';
import { describe, it, expect } from 'vitest';
import { getFirebaseErrorMessage, passwordValidator } from './validators';

describe('passwordValidator', () => {
  it('accepts a strong password', () => {
    const ctrl = new FormControl('Str0ng!Pwd');
    expect(passwordValidator(ctrl)).toBeNull();
  });

  it('flags missing uppercase, special char, or digit', () => {
    const ctrl = new FormControl('weakpwd');
    const result = passwordValidator(ctrl) as { passwordStrength: Record<string, boolean> };
    expect(result.passwordStrength.hasUpperCase).toBe(false);
    expect(result.passwordStrength.hasSpecialChar).toBe(false);
    expect(result.passwordStrength.hasNumeric).toBe(false);
  });

  it('returns null on empty', () => {
    expect(passwordValidator(new FormControl(''))).toBeNull();
  });

  it('flags too-short passwords', () => {
    const ctrl = new FormControl('A1!a');
    const result = passwordValidator(ctrl) as { passwordStrength: Record<string, boolean> };
    expect(result.passwordStrength.isValidLength).toBe(false);
  });
});

describe('getFirebaseErrorMessage', () => {
  it('translates invalid credential codes', () => {
    expect(getFirebaseErrorMessage('auth/invalid-login-credentials')).toMatch(/Invalid email or password/i);
    expect(getFirebaseErrorMessage('auth/user-not-found')).toMatch(/Invalid email or password/i);
  });

  it('translates email-already-in-use', () => {
    expect(getFirebaseErrorMessage('auth/email-already-in-use')).toMatch(/already registered/i);
  });

  it('translates network errors', () => {
    expect(getFirebaseErrorMessage('auth/network-request-failed')).toMatch(/Network error/i);
  });

  it('falls back to a generic message for unknown codes', () => {
    expect(getFirebaseErrorMessage('auth/something-novel')).toMatch(/Authentication failed/i);
  });

  it('handles empty / undefined codes safely', () => {
    expect(getFirebaseErrorMessage('')).toMatch(/Authentication failed/i);
  });
});
