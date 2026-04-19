// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors
import { Component, inject } from '@angular/core';

import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { getFirebaseErrorMessage, extractFirebaseErrorCode } from '../../../core/utils/validators';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="glass-card form-wrapper">
        <div class="text-center mb-6">
          <h2 class="gradient-text">Reset Password</h2>
          <p class="text-muted">Enter your email to receive a reset link</p>
        </div>

        @if (!isSent) {
          <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="alex@example.com"
                formControlName="email"
                class="glass-input"
                [class.input-error]="
                  forgotForm.get('email')?.invalid && forgotForm.get('email')?.touched
                "
              />
            </div>
            @if (errorMessage) {
              <div class="error-box mt-4 animate-shake">
                <span class="icon">⚠️</span> {{ errorMessage }}
              </div>
            }
            <button
              [disabled]="forgotForm.invalid || isLoading"
              type="submit"
              class="glass-button w-full mt-6"
            >
              {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
            </button>
            <div class="text-center mt-6 text-sm">
              <a routerLink="/login" class="gradient-text font-bold">Back to Sign In</a>
            </div>
          </form>
        }

        @if (isSent) {
          <div class="text-center animate-fade-in">
            <div class="success-icon mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="60"
                height="60"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent)"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3 class="mb-2">Email Sent!</h3>
            <p class="text-muted text-sm mb-6">
              We've sent a password reset link to <strong>{{ forgotForm.value.email }}</strong
              >. Please check your inbox and spam folder.
            </p>
            <button routerLink="/login" class="glass-button w-full">Return to Sign In</button>
          </div>
        }
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

      .form-group label {
        display: block;
        margin-bottom: 8px;
        font-size: 0.9rem;
        color: var(--text-secondary);
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
      .mb-2 {
        margin-bottom: 0.5rem;
      }
      .mb-4 {
        margin-bottom: 1rem;
      }
      .mb-6 {
        margin-bottom: 1.5rem;
      }

      .error-box {
        color: #ff6b6b;
        padding: 12px;
        background: rgba(255, 107, 107, 0.1);
        border-radius: var(--radius-md);
        font-size: 0.85rem;
        border: 1px solid rgba(255, 107, 107, 0.2);
      }

      .text-sm {
        font-size: 0.875rem;
      }
      .success-icon {
        display: flex;
        justify-content: center;
      }
    `,
  ],
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  isLoading = false;
  isSent = false;
  errorMessage = '';

  async onSubmit() {
    if (this.forgotForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      try {
        const { email } = this.forgotForm.value;
        await this.authService.resetPassword(email!);
        this.isSent = true;
      } catch (err: unknown) {
        this.errorMessage = getFirebaseErrorMessage(extractFirebaseErrorCode(err));
      } finally {
        this.isLoading = false;
      }
    } else {
      this.forgotForm.markAllAsTouched();
    }
  }
}
