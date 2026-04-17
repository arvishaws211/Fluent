import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CheckInService } from '../../core/services/check-in.service';

@Component({
  selector: 'app-check-in',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="check-in-container animate-fade-in">
      <header class="page-header">
        <h2 class="gradient-text">Express Check-in</h2>
        <p class="text-secondary">Avoid the queues. Verify your identity securely using SSI.</p>
      </header>

      <div class="check-in-modes">
        <!-- Main Scanner Area -->
        <main class="scanner-section glass-card" [class.success]="status()?.success">
          <div class="scanner-viewport glass" *ngIf="!status()?.success; else successView">
            <div class="scanner-overlay">
              <div class="scan-frame"></div>
              <div class="scan-line" *ngIf="isScanning()"></div>
            </div>
            
            <div class="scanner-label">
              <span *ngIf="!isScanning()">Ready to Scan</span>
              <span *ngIf="isScanning()" class="pulse">Analyzing Biometrics...</span>
            </div>
          </div>

          <ng-template #successView>
            <div class="success-animation">
              <div class="checkmark-circle">
                <div class="checkmark draw"></div>
              </div>
              <h3>Check-in Successful</h3>
              <p>Welcome to Fluent 2026</p>
              <div class="pass-details glass">
                <div class="detail">
                  <span class="label">Method</span>
                  <span class="value">{{ status()?.method | titlecase }}</span>
                </div>
                <div class="detail">
                  <span class="label">Verified via</span>
                  <span class="value">SSI Vault</span>
                </div>
              </div>
              <button class="btn btn-primary" (click)="reset()">Done</button>
            </div>
          </ng-template>

          <footer class="scanner-controls" *ngIf="!status()?.success">
            <button class="btn btn-primary" (click)="startBiometric()" [disabled]="isScanning()">
              <span>Check-in with Biometrics</span>
            </button>
            <button class="btn btn-outline" (click)="startQR()" [disabled]="isScanning()">
              <span>Scan QR Pass</span>
            </button>
          </footer>
        </main>

        <!-- Sidebar / Guidance -->
        <aside class="guidance-section glass-card">
          <h3>Self-Sovereign Identity</h3>
          <p class="text-secondary">Your data never leaves your device. We only verify the cryptographic proof of your identity.</p>
          
          <div class="guidance-steps">
            <div class="step">
              <div class="step-num">1</div>
              <p>Select check-in method</p>
            </div>
            <div class="step">
              <div class="step-num">2</div>
              <p>Scan your face or QR pass</p>
            </div>
            <div class="step">
              <div class="step-num">3</div>
              <p>Unlock your personalized experience</p>
            </div>
          </div>

          <div class="fallback-links">
            <p>Issues scanning? <a class="gradient-text">Manual entry</a></p>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .check-in-container {
      max-width: 1000px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 40px;
      text-align: center;
    }

    .check-in-modes {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 32px;
    }

    .scanner-section {
      min-height: 500px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 40px;
      transition: all 0.5s ease;
    }

    .scanner-section.success {
      border-color: var(--accent);
      background: rgba(16, 185, 129, 0.05);
    }

    .scanner-viewport {
      flex: 1;
      position: relative;
      border-radius: var(--radius-lg);
      overflow: hidden;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 32px;
    }

    .scan-frame {
      width: 250px;
      height: 250px;
      border: 2px solid rgba(99, 102, 241, 0.5);
      border-radius: 40px;
      position: relative;
    }

    .scan-frame::before, .scan-frame::after {
      content: '';
      position: absolute;
      width: 40px;
      height: 40px;
      border-color: var(--primary);
      border-style: solid;
    }

    /* Target Corners */
    .scan-frame {
      box-shadow: 0 0 0 1000px rgba(0,0,0,0.5);
    }

    .scan-line {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background: var(--primary);
      box-shadow: 0 0 15px var(--primary);
      animation: scan 2s linear infinite;
    }

    @keyframes scan {
      0% { top: 20%; }
      50% { top: 80%; }
      100% { top: 20%; }
    }

    .scanner-label {
      position: absolute;
      bottom: 24px;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .pulse {
      animation: pulse 1.5s infinite;
      color: var(--primary);
    }

    @keyframes pulse {
      0% { opacity: 0.5; }
      50% { opacity: 1; }
      100% { opacity: 0.5; }
    }

    .scanner-controls {
      display: flex;
      gap: 16px;
      justify-content: center;
    }

    /* Success View */
    .success-animation {
      text-align: center;
    }

    .checkmark-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: block;
      margin: 0 auto 24px;
      background: var(--accent);
      position: relative;
    }

    .pass-details {
      margin: 32px 0;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .detail {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
    }

    .detail .label { color: var(--text-muted); }
    .detail .value { font-weight: 600; }

    /* Aside */
    .guidance-section h3 {
      margin-bottom: 16px;
    }

    .guidance-steps {
      margin: 32px 0;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .step {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .step-num {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 700;
    }

    .fallback-links {
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid var(--glass-border);
      font-size: 0.9rem;
    }

    @media (max-width: 850px) {
      .check-in-modes { grid-template-columns: 1fr; }
    }
  `]
})
export class CheckInComponent {
  private checkInService = inject(CheckInService);
  isScanning = this.checkInService.isScanning;
  status = this.checkInService.status;

  constructor() {}

  startBiometric() {
    this.checkInService.biometricCheckIn();
  }

  startQR() {
    this.checkInService.qrCheckIn('dummy_qr_data');
  }

  reset() {
    this.checkInService.reset();
  }
}
