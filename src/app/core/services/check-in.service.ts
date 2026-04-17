import { Injectable, signal } from '@angular/core';

export interface CheckInStatus {
  success: boolean;
  timestamp?: Date;
  method: 'qr' | 'biometric' | 'manual';
  errorMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CheckInService {
  private statusSignal = signal<CheckInStatus | null>(null);
  readonly status = this.statusSignal.asReadonly();
  
  private isScanningSignal = signal<boolean>(false);
  readonly isScanning = this.isScanningSignal.asReadonly();

  constructor() {}

  /**
   * Biometric check-in facade.
   * In a real implementation, this would call Google Cloud Vision API
   * or a native biometric prompt (WebAuthn).
   */
  async biometricCheckIn() {
    this.isScanningSignal.set(true);
    
    // Simulate biometric analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulation logic for failure/success
    const success = Math.random() > 0.1; 
    
    if (success) {
      this.statusSignal.set({
        success: true,
        timestamp: new Date(),
        method: 'biometric'
      });
    } else {
      this.statusSignal.set({
        success: false,
        method: 'biometric',
        errorMessage: 'Biometric scan failed. Please use QR fallback.'
      });
    }
    
    this.isScanningSignal.set(false);
  }

  async qrCheckIn(qrData: string) {
    this.isScanningSignal.set(true);
    
    // Simulate Decryption & SSI verification
    await new Promise(resolve => setTimeout(resolve, 1000));

    this.statusSignal.set({
      success: true,
      timestamp: new Date(),
      method: 'qr'
    });
    
    this.isScanningSignal.set(false);
  }

  reset() {
    this.statusSignal.set(null);
  }
}
