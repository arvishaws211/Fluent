// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors
import { Component, inject } from '@angular/core';

import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { getFirebaseErrorMessage, extractFirebaseErrorCode } from '../../../core/utils/validators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="glass-card form-wrapper">
        <div class="text-center mb-6">
          <h2 class="gradient-text">Welcome Back</h2>
          <p class="text-muted">Sign in to your Fluent account</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <!-- Email Field -->
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="alex@example.com"
              formControlName="email"
              class="glass-input"
              [class.input-error]="
                loginForm.get('email')?.invalid && loginForm.get('email')?.touched
              "
            />
          </div>

          <!-- Password Field -->
          <div class="form-group mt-4">
            <div class="flex justify-between items-center mb-2">
              <label for="password" class="mb-0">Password</label>
              <a routerLink="/forgot-password" class="text-xs gradient-text font-semibold"
                >Forgot Password?</a
              >
            </div>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              formControlName="password"
              class="glass-input"
              [class.input-error]="
                loginForm.get('password')?.invalid && loginForm.get('password')?.touched
              "
            />
          </div>

          <!-- Global Feedback -->
          @if (errorMessage) {
            <div class="error-box mt-4 animate-shake">
              <span class="icon">⚠️</span> {{ errorMessage }}
            </div>
          }

          @if (successMessage) {
            <div class="success-box mt-4"><span class="icon">✅</span> {{ successMessage }}</div>
          }

          <button
            [disabled]="loginForm.invalid || isLoading"
            type="submit"
            class="glass-button w-full mt-6"
          >
            {{ isLoading ? 'Verifying security...' : 'Sign In' }}
          </button>

          <div class="divider-text mt-6">
            <span>or continue with</span>
          </div>

          <button
            (click)="onGoogleLogin()"
            type="button"
            class="btn btn-outline w-full mt-4 google-btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
              <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
              />
              <path
                fill="#FF3D00"
                d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
              />
            </svg>
            Google
          </button>

          <div class="text-center mt-6 text-sm">
            <span class="text-secondary">Don't have an account? </span>
            <a routerLink="/register" class="gradient-text font-bold">Register</a>
          </div>

          <!-- reCAPTCHA Branding -->
          <div class="recaptcha-footer mt-8">
            <p class="text-muted text-center">
              This site is protected by reCAPTCHA Enterprise and the Google
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener"
                >Privacy Policy</a
              >
              and
              <a href="https://policies.google.com/terms" target="_blank" rel="noopener"
                >Terms of Service</a
              >
              apply.
            </p>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .auth-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: calc(100vh - 140px);
      }
      .form-wrapper {
        width: 100%;
        max-width: 400px;
        padding: 40px;
      }
      .glass-input {
        width: 100%;
        padding: 12px 16px;
        border-radius: var(--radius-md);
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--glass-border);
        color: var(--text-primary);
        transition: all 0.3s ease;
      }
      .glass-input:focus {
        outline: none;
        border-color: var(--primary);
        background: rgba(255, 255, 255, 0.1);
      }
      .input-error {
        border-color: #ff6b6b;
      }

      .error-box {
        color: #ff6b6b;
        padding: 12px;
        background: rgba(255, 107, 107, 0.1);
        border-radius: var(--radius-md);
        font-size: 0.85rem;
        border: 1px solid rgba(255, 107, 107, 0.2);
      }

      .success-box {
        color: var(--accent);
        padding: 12px;
        background: rgba(16, 185, 129, 0.1);
        border-radius: var(--radius-md);
        font-size: 0.85rem;
        border: 1px solid rgba(16, 185, 129, 0.2);
      }

      .form-group label {
        display: block;
        margin-bottom: 8px;
        font-size: 0.9rem;
        color: var(--text-secondary);
      }
      .flex {
        display: flex;
      }
      .justify-between {
        justify-content: space-between;
      }
      .items-center {
        align-items: center;
      }
      .mb-0 {
        margin-bottom: 0;
      }
      .mb-2 {
        margin-bottom: 0.5rem;
      }
      .w-full {
        width: 100%;
      }
      .mt-4 {
        margin-top: 1rem;
      }
      .mt-6 {
        margin-top: 1.5rem;
      }
      .mb-6 {
        margin-bottom: 1.5rem;
      }
      .text-xs {
        font-size: 0.75rem;
      }
      .text-sm {
        font-size: 0.875rem;
      }

      .divider-text {
        display: flex;
        align-items: center;
        text-align: center;
        color: var(--text-secondary);
        font-size: 0.8rem;
      }
      .divider-text::before,
      .divider-text::after {
        content: '';
        flex: 1;
        border-bottom: 1px solid var(--glass-border);
      }
      .divider-text:not(:empty)::before {
        margin-right: 1rem;
      }
      .divider-text:not(:empty)::after {
        margin-left: 1rem;
      }
      .google-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--glass-border) !important;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
      }
      .google-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: var(--primary) !important;
      }
      .recaptcha-footer {
        font-size: 0.7rem;
        line-height: 1.4;
        color: var(--text-secondary);
      }
      .recaptcha-footer a {
        color: #a5b4fc;
        text-decoration: underline;
        transition: color 0.2s;
      }
      .recaptcha-footer a:hover,
      .recaptcha-footer a:focus-visible {
        color: var(--text-primary);
      }
      .mt-8 {
        margin-top: 2rem;
      }
    `,
  ],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  async onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';
      try {
        const { email, password } = this.loginForm.value;
        await this.authService.login(email!, password!);
        this.successMessage = 'Login successful! Redirecting...';
        setTimeout(() => this.router.navigate(['/dashboard']), 1000);
      } catch (err: unknown) {
        this.errorMessage = getFirebaseErrorMessage(extractFirebaseErrorCode(err));
      } finally {
        this.isLoading = false;
      }
    } else {
      this.errorMessage = 'Please enter valid credentials.';
      this.loginForm.markAllAsTouched();
    }
  }

  async onGoogleLogin() {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      await this.authService.loginWithGoogle();
      this.router.navigate(['/dashboard']);
    } catch (err: unknown) {
      this.errorMessage = getFirebaseErrorMessage(extractFirebaseErrorCode(err));
    } finally {
      this.isLoading = false;
    }
  }
}
