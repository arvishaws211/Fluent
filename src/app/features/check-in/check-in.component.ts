// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

import type { AfterViewInit, ElementRef, OnDestroy } from '@angular/core';
import { Component, ViewChild, computed, inject, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckInService } from '../../core/services/check-in.service';

@Component({
  selector: 'app-check-in',
  standalone: true,
  imports: [FormsModule, TitleCasePipe],
  template: `
    <section class="check-in-container animate-fade-in" aria-labelledby="check-in-heading">
      <header class="page-header">
        <h2 id="check-in-heading" class="gradient-text">Express Check-in</h2>
        <p class="text-secondary">
          Skip the queue. Verify your identity using a biometric, QR pass, or pass code.
        </p>
      </header>

      <div class="check-in-modes">
        <div class="scanner-section glass-card" [class.success]="checkedIn()">
          <div class="mode-tabs" role="tablist" aria-label="Check-in method">
            <button
              type="button"
              role="tab"
              class="mode-tab"
              [class.active]="mode() === 'biometric'"
              [attr.aria-selected]="mode() === 'biometric'"
              (click)="setMode('biometric')"
            >
              Biometric
            </button>
            <button
              type="button"
              role="tab"
              class="mode-tab"
              [class.active]="mode() === 'qr'"
              [attr.aria-selected]="mode() === 'qr'"
              (click)="setMode('qr')"
            >
              QR Scan
            </button>
            <button
              type="button"
              role="tab"
              class="mode-tab"
              [class.active]="mode() === 'manual'"
              [attr.aria-selected]="mode() === 'manual'"
              (click)="setMode('manual')"
            >
              Manual
            </button>
          </div>

          @if (!checkedIn()) {
            <div class="scanner-viewport glass">
              @switch (mode()) {
                @case ('biometric') {
                  <div class="biometric-pane" role="region" aria-labelledby="bio-label">
                    <p id="bio-label" class="text-secondary">
                      Tap the button to use Touch ID, Face ID, or your security key.
                    </p>
                    <button
                      type="button"
                      class="btn btn-primary"
                      [disabled]="isScanning()"
                      (click)="startBiometric()"
                    >
                      {{ isScanning() ? 'Verifying…' : 'Start biometric check-in' }}
                    </button>
                    @if (!biometricSupported) {
                      <p class="hint" role="note">
                        This device does not support WebAuthn. Please use the QR or Manual tab.
                      </p>
                    }
                  </div>
                }
                @case ('qr') {
                  <div class="qr-pane">
                    <video
                      #qrVideo
                      class="qr-video"
                      muted
                      playsinline
                      aria-label="Live camera feed for QR scanning"
                    ></video>
                    <div class="scanner-controls">
                      <button
                        type="button"
                        class="btn btn-primary"
                        [disabled]="isScanning()"
                        (click)="startQr()"
                      >
                        {{ isScanning() ? 'Watching for pass…' : 'Start QR scan' }}
                      </button>
                      @if (isScanning()) {
                        <button type="button" class="btn btn-outline" (click)="stopQr()">
                          Stop
                        </button>
                      }
                    </div>
                  </div>
                }
                @case ('manual') {
                  <div class="manual-pane">
                    <label for="manual-pass" class="text-secondary"
                      >Enter the pass code printed on your ticket.</label
                    >
                    <input
                      id="manual-pass"
                      type="text"
                      class="glass-input"
                      [(ngModel)]="manualCode"
                      placeholder="e.g. PASS-1234"
                      autocomplete="off"
                      inputmode="text"
                    />
                    <button
                      type="button"
                      class="btn btn-primary"
                      [disabled]="!manualCode || isScanning()"
                      (click)="startManual()"
                    >
                      Submit pass code
                    </button>
                  </div>
                }
              }
            </div>
          }

          @if (checkedIn()) {
            <div class="success-animation" role="status" aria-live="polite">
              <div class="checkmark-circle" aria-hidden="true">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3>Check-in successful</h3>
              <p>Welcome to Fluent.</p>
              <dl class="pass-details glass">
                <div class="detail">
                  <dt class="label">Method</dt>
                  <dd class="value">{{ status()?.method | titlecase }}</dd>
                </div>
                <div class="detail">
                  <dt class="label">Verified via</dt>
                  <dd class="value">SSI Vault</dd>
                </div>
              </dl>
              <button type="button" class="btn btn-primary" (click)="reset()">Done</button>
            </div>
          }

          <div class="check-in-status" aria-live="polite" role="status">
            @if (status() && !status()?.success) {
              <p class="error-box">
                {{ status()?.errorMessage }}
              </p>
            }
          </div>
        </div>

        <aside class="guidance-section glass-card" aria-labelledby="ssi-heading">
          <h3 id="ssi-heading">Self-Sovereign Identity</h3>
          <p class="text-secondary">
            Your data never leaves your device. We only verify the cryptographic proof of your
            identity.
          </p>
          <ol class="guidance-steps">
            <li>Pick a check-in method.</li>
            <li>Approve the prompt on your device.</li>
            <li>Your pass unlocks the personalized experience.</li>
          </ol>
        </aside>
      </div>
    </section>
  `,
  styles: [
    `
      .check-in-container {
        max-width: 1000px;
        margin: 0 auto;
      }
      .page-header {
        margin-bottom: 32px;
        text-align: center;
      }
      .check-in-modes {
        display: grid;
        grid-template-columns: 1fr 320px;
        gap: 32px;
      }
      .scanner-section {
        padding: 32px;
        min-height: 460px;
        transition: all 0.3s;
      }
      .scanner-section.success {
        border-color: var(--accent);
        background: rgba(16, 185, 129, 0.05);
      }

      .mode-tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 24px;
      }
      .mode-tab {
        flex: 1;
        padding: 10px 16px;
        border-radius: var(--radius-md);
        background: var(--glass-bg);
        border: 1px solid var(--glass-border);
        color: var(--text-secondary);
        cursor: pointer;
        font-weight: 500;
      }
      .mode-tab.active {
        background: var(--primary);
        color: white;
        border-color: var(--primary);
      }
      .mode-tab:focus-visible {
        outline: 2px solid var(--primary);
        outline-offset: 2px;
      }

      .scanner-viewport {
        padding: 24px;
        border-radius: var(--radius-lg);
      }
      .biometric-pane,
      .manual-pane,
      .qr-pane {
        display: flex;
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }
      .qr-video {
        width: 100%;
        max-height: 320px;
        border-radius: var(--radius-md);
        background: #000;
      }
      .scanner-controls {
        display: flex;
        gap: 12px;
      }
      .glass-input {
        padding: 12px 16px;
        border-radius: var(--radius-md);
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--glass-border);
        color: var(--text-primary);
      }
      .hint {
        font-size: 0.85rem;
        color: var(--warning);
      }

      .check-in-status {
        margin-top: 16px;
        min-height: 1.5rem;
      }
      .error-box {
        color: #ff6b6b;
        padding: 12px;
        background: rgba(255, 107, 107, 0.1);
        border-radius: var(--radius-md);
        font-size: 0.85rem;
      }

      .success-animation {
        text-align: center;
        padding: 16px 0;
      }
      .checkmark-circle {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: var(--accent);
        margin: 0 auto 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .pass-details {
        margin: 24px 0;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        list-style: none;
      }
      .detail {
        display: flex;
        justify-content: space-between;
        font-size: 0.9rem;
      }
      .detail .label {
        color: var(--text-muted);
        margin: 0;
      }
      .detail .value {
        font-weight: 600;
        margin: 0;
      }

      .guidance-section h3 {
        margin-bottom: 16px;
      }
      .guidance-steps {
        padding-left: 20px;
        line-height: 1.8;
        color: var(--text-secondary);
      }

      @media (max-width: 850px) {
        .check-in-modes {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class CheckInComponent implements AfterViewInit, OnDestroy {
  private checkInService = inject(CheckInService);
  @ViewChild('qrVideo') qrVideo?: ElementRef<HTMLVideoElement>;

  readonly isScanning = this.checkInService.isScanning;
  readonly status = this.checkInService.status;
  readonly checkedIn = computed(() => this.status()?.success === true);

  readonly mode = signal<'biometric' | 'qr' | 'manual'>('biometric');
  manualCode = '';
  biometricSupported = true;

  ngAfterViewInit(): void {
    this.biometricSupported = this.checkInService.isBiometricSupported();
    if (!this.biometricSupported) this.mode.set('qr');
  }

  ngOnDestroy(): void {
    this.checkInService.stopQrScan();
  }

  setMode(next: 'biometric' | 'qr' | 'manual'): void {
    this.checkInService.stopQrScan();
    this.mode.set(next);
  }

  async startBiometric(): Promise<void> {
    await this.checkInService.biometricCheckIn();
  }

  async startQr(): Promise<void> {
    if (!this.qrVideo) return;
    await this.checkInService.startQrScan(this.qrVideo.nativeElement);
  }

  stopQr(): void {
    this.checkInService.stopQrScan();
  }

  async startManual(): Promise<void> {
    await this.checkInService.manualCheckIn(this.manualCode);
  }

  reset(): void {
    this.manualCode = '';
    this.checkInService.reset();
  }
}
