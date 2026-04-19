// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors
import { Component, inject, signal } from '@angular/core';

import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import {
  passwordValidator,
  getFirebaseErrorMessage,
  extractFirebaseErrorCode,
} from '../../../core/utils/validators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="glass-card form-wrapper">
        <div class="text-center mb-6">
          <h2 class="gradient-text">Create Account</h2>
          <p class="text-muted">Join Fluent and start connecting</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <!-- Name Field -->
          <div class="form-group">
            <label for="displayName">Full Name</label>
            <input
              id="displayName"
              type="text"
              placeholder="Alex Smith"
              formControlName="displayName"
              class="glass-input"
              [class.input-error]="
                registerForm.get('displayName')?.invalid && registerForm.get('displayName')?.touched
              "
            />
          </div>

          <!-- Email Field -->
          <div class="form-group mt-4">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="alex@example.com"
              formControlName="email"
              class="glass-input"
              [class.input-error]="
                registerForm.get('email')?.invalid && registerForm.get('email')?.touched
              "
            />
            @if (
              registerForm.get('email')?.errors?.['email'] && registerForm.get('email')?.touched
            ) {
              <div class="field-error">Please enter a valid email.</div>
            }
          </div>

          <!-- Password Field -->
          <div class="form-group mt-4">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              formControlName="password"
              class="glass-input"
              [class.input-error]="
                registerForm.get('password')?.invalid && registerForm.get('password')?.touched
              "
            />

            <!-- Specific Password Requirements -->
            @if (registerForm.get('password')?.touched) {
              <div class="password-checks mt-2">
                <div
                  class="check-item"
                  [class.valid]="
                    !registerForm.get('password')?.errors?.['passwordStrength']?.isValidLength
                  "
                >
                  8+ characters
                </div>
                <div
                  class="check-item"
                  [class.valid]="
                    !registerForm.get('password')?.errors?.['passwordStrength']?.hasUpperCase
                  "
                >
                  Uppercase
                </div>
                <div
                  class="check-item"
                  [class.valid]="
                    !registerForm.get('password')?.errors?.['passwordStrength']?.hasNumeric
                  "
                >
                  Number
                </div>
                <div
                  class="check-item"
                  [class.valid]="
                    !registerForm.get('password')?.errors?.['passwordStrength']?.hasSpecialChar
                  "
                >
                  Special char
                </div>
              </div>
            }
          </div>

          @if (errorMessage) {
            <div class="error-box mt-4 animate-shake">
              <span class="icon">⚠️</span> {{ errorMessage }}
            </div>
          }

          @if (successMessage) {
            <div class="success-box mt-4 animate-fade-in">
              <span class="icon">✅</span> {{ successMessage }}
            </div>
          }

          <button
            [disabled]="registerForm.invalid || isLoading"
            type="submit"
            class="glass-button w-full mt-6"
          >
            {{ isLoading ? 'Verifying security...' : 'Create Account' }}
          </button>

          <div class="text-center mt-6 text-sm">
            <span class="text-secondary">Already have an account? </span>
            <a routerLink="/login" class="gradient-text font-bold">Sign In</a>
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
        max-width: 420px;
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

      .field-error {
        color: #ff6b6b;
        font-size: 0.75rem;
        margin-top: 4px;
      }

      .password-checks {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px;
        font-size: 0.7rem;
      }

      .check-item {
        color: rgba(255, 255, 255, 0.3);
      }
      .check-item.valid {
        color: var(--accent);
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
      .w-full {
        width: 100%;
      }
      .mt-2 {
        margin-top: 0.5rem;
      }
      .mt-4 {
        margin-top: 1rem;
      }
      .mt-6 {
        margin-top: 1.5rem;
      }
      .mt-8 {
        margin-top: 2rem;
      }

      .recaptcha-footer {
        font-size: 0.7rem;
        line-height: 1.4;
        opacity: 0.7;
      }
      .recaptcha-footer a {
        color: var(--primary);
        text-decoration: underline;
        transition: opacity 0.2s;
      }
      .recaptcha-footer a:hover {
        opacity: 1;
      }
    `,
  ],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, passwordValidator]],
  });

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  async onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';
      try {
        const { email, password, displayName } = this.registerForm.value;
        await this.authService.register(email!, password!);
        this.successMessage = 'Account created successfully! Redirecting...';
        setTimeout(() => this.router.navigate(['/dashboard']), 1500);
      } catch (err: unknown) {
        this.errorMessage = getFirebaseErrorMessage(extractFirebaseErrorCode(err));
      } finally {
        this.isLoading = false;
      }
    } else {
      this.errorMessage = 'Please fix the errors in the form.';
      this.registerForm.markAllAsTouched();
    }
  }
}
