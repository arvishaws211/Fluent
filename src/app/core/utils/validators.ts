import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const passwordValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (!value) return null;

  const hasUpperCase = /[A-Z]/.test(value);
  const hasLowerCase = /[a-z]/.test(value);
  const hasNumeric = /[0-9]/.test(value);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
  const isValidLength = value.length >= 8;

  const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar && isValidLength;

  if (!passwordValid) {
    return {
      passwordStrength: {
        hasUpperCase,
        hasLowerCase,
        hasNumeric,
        hasSpecialChar,
        isValidLength
      }
    };
  }

  return null;
};

/**
 * Safely extracts a Firebase-style error code or fallback message from an
 * `unknown` catch variable. Avoids the `err: any` anti-pattern at call sites.
 */
export function extractFirebaseErrorCode(err: unknown): string {
  if (err && typeof err === 'object') {
    const candidate = err as { code?: unknown; message?: unknown };
    if (typeof candidate.code === 'string') return candidate.code;
    if (typeof candidate.message === 'string') return candidate.message;
  }
  return '';
}

export function getFirebaseErrorMessage(code: string): string {
  // Normalize the code (Firebase SDK codes are like 'auth/user-not-found', 
  // but raw REST API errors can be 'INVALID_LOGIN_CREDENTIALS')
  const errorCode = code?.toLowerCase() || '';

  if (errorCode.includes('user-not-found') || 
      errorCode.includes('wrong-password') || 
      errorCode.includes('invalid_login_credentials') ||
      errorCode.includes('invalid-login-credentials')) {
    return 'Invalid email or password. Please try again.';
  }

  if (errorCode.includes('email_exists') || 
      errorCode.includes('email-already-in-use')) {
    return 'This email is already registered. Please sign in instead.';
  }

  if (errorCode.includes('invalid-email') || errorCode.includes('invalid_email')) {
    return 'Please enter a valid email address.';
  }

  if (errorCode.includes('weak-password') || errorCode.includes('weak_password')) {
    return 'The password is too weak. Please use a stronger password.';
  }

  if (errorCode.includes('too-many-requests') || errorCode.includes('too_many_attempts')) {
    return 'Too many failed attempts. Please try again later or reset your password.';
  }

  if (errorCode.includes('user-disabled') || errorCode.includes('user_disabled')) {
    return 'This account has been disabled. Please contact support.';
  }

  if (errorCode.includes('popup-closed-by-user')) {
    return 'Sign-in window was closed. Please try again.';
  }

  if (errorCode.includes('network-request-failed')) {
    return 'Network error. Please check your internet connection.';
  }

  console.warn('Unhandled Auth error:', code);
  return 'Authentication failed. Please check your details and try again.';
}
