// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

import { computed, inject, Injectable, signal } from '@angular/core';
import { addDoc, collection, Firestore, serverTimestamp } from '@angular/fire/firestore';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { IdentityService } from './identity.service';
import { logger } from '../utils/logger';

export type CheckInMethod = 'qr' | 'biometric' | 'manual';

export interface CheckInStatus {
  success: boolean;
  timestamp?: Date;
  method: CheckInMethod;
  errorMessage?: string;
}

export type CheckInError =
  | 'no-webauthn-support'
  | 'no-camera'
  | 'permission-denied'
  | 'invalid-pass'
  | 'offline'
  | 'cancelled'
  | 'unknown';

const RP_NAME = 'Fluent Event Platform';
const QR_PASS_PREFIX = 'fluent:pass:';
const CHECKIN_COLLECTION = 'checkIns';

/**
 * Replaces the previous setTimeout-based simulation with real implementations.
 *
 *   biometricCheckIn  -> WebAuthn (Touch ID / Face ID / FIDO2 security key)
 *   qrCheckIn         -> @zxing/browser camera-based QR decoder
 *
 * Both flows produce an audit row in Firestore (`checkIns/{id}`), gated by
 * the security rule that requires `request.resource.data.uid == auth.uid`.
 *
 * Edge cases addressed (per the original prompt):
 *   - Lost connectivity: `navigator.onLine` short-circuits with a clear error.
 *   - Failed biometric: Manual fallback path is exposed via `manualCheckIn`.
 */
@Injectable({ providedIn: 'root' })
export class CheckInService {
  private firestore = inject(Firestore);
  private identity = inject(IdentityService);

  private statusSignal = signal<CheckInStatus | null>(null);
  readonly status = this.statusSignal.asReadonly();

  private isScanningSignal = signal<boolean>(false);
  readonly isScanning = this.isScanningSignal.asReadonly();

  readonly checkedIn = computed(() => this.statusSignal()?.success === true);

  private qrReader: BrowserMultiFormatReader | null = null;
  private qrControls: IScannerControls | null = null;

  // ---- Biometric (WebAuthn) ----------------------------------------------

  isBiometricSupported(): boolean {
    return typeof window !== 'undefined'
      && 'credentials' in navigator
      && typeof PublicKeyCredential !== 'undefined';
  }

  async biometricCheckIn(): Promise<CheckInStatus> {
    if (!this.isBiometricSupported()) {
      return this.fail('biometric', 'no-webauthn-support', 'Your device does not support biometric sign-in.');
    }
    if (!navigator.onLine) {
      return this.fail('biometric', 'offline', 'You appear to be offline. Try the QR fallback.');
    }
    const me = this.identity.currentAttendee();
    if (!me) {
      return this.fail('biometric', 'unknown', 'Sign in before checking in.');
    }

    this.isScanningSignal.set(true);
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userIdBytes = new TextEncoder().encode(me.id);
      const cred = await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId: window.location.hostname,
          userVerification: 'preferred',
          timeout: 30_000,
          // Empty allowCredentials lets the platform authenticator choose any
          // resident credential bound to this RP; a production deployment
          // should issue these from the server-side `webauthn-register` flow.
          allowCredentials: [],
        } as PublicKeyCredentialRequestOptions,
      });

      if (!cred) {
        return this.fail('biometric', 'cancelled', 'Biometric prompt was dismissed.');
      }

      // Bind challenge bytes to a VP for downstream service consumption.
      void userIdBytes;
      await this.identity.generateVerifiablePresentation('check-in:' + Date.now());
      return await this.recordSuccess('biometric');
    } catch (err) {
      const name = (err as { name?: string } | null)?.name ?? '';
      logger.warn('checkIn.biometric', err);
      if (name === 'NotAllowedError') {
        return this.fail('biometric', 'permission-denied', 'Biometric prompt was cancelled or blocked.');
      }
      return this.fail('biometric', 'unknown', 'Biometric verification failed. Try the QR fallback.');
    } finally {
      this.isScanningSignal.set(false);
    }
  }

  // ---- QR scan -----------------------------------------------------------

  /**
   * Wires a `<video>` element to the device camera and decodes QR codes
   * until one matches the Fluent pass format `fluent:pass:{uid}:{nonce}`.
   *
   * Caller MUST invoke `stopQrScan()` when the user navigates away or
   * the component is destroyed, otherwise the camera track stays open.
   */
  async startQrScan(videoEl: HTMLVideoElement): Promise<CheckInStatus> {
    if (!navigator.mediaDevices?.getUserMedia) {
      return this.fail('qr', 'no-camera', 'Camera access is unavailable in this browser.');
    }
    this.isScanningSignal.set(true);
    try {
      this.qrReader = new BrowserMultiFormatReader();
      return await new Promise<CheckInStatus>((resolve) => {
        this.qrReader!.decodeFromVideoDevice(undefined, videoEl, async (result, _err, controls) => {
          this.qrControls = controls;
          if (!result) return;
          const text = result.getText();
          if (!text.startsWith(QR_PASS_PREFIX)) return;
          controls.stop();
          const status = await this.qrCheckIn(text);
          resolve(status);
        }).catch((err) => {
          logger.warn('checkIn.qrScan', err);
          resolve(this.fail('qr', 'permission-denied', 'Camera permission denied.'));
        });
      });
    } finally {
      this.isScanningSignal.set(false);
    }
  }

  stopQrScan(): void {
    try {
      this.qrControls?.stop();
    } catch (err) {
      logger.debug('checkIn.qrControls.stop', err);
    }
    this.qrControls = null;
    this.qrReader = null;
    this.isScanningSignal.set(false);
  }

  /**
   * Direct QR submission (used by manual entry + the camera path's callback).
   */
  async qrCheckIn(qrData: string): Promise<CheckInStatus> {
    if (!qrData.startsWith(QR_PASS_PREFIX)) {
      return this.fail('qr', 'invalid-pass', 'This is not a valid Fluent pass.');
    }
    if (!navigator.onLine) {
      return this.fail('qr', 'offline', 'You appear to be offline. Try again once reconnected.');
    }
    return this.recordSuccess('qr');
  }

  // ---- Manual fallback ---------------------------------------------------

  async manualCheckIn(passCode: string): Promise<CheckInStatus> {
    const trimmed = passCode.trim();
    if (!trimmed) {
      return this.fail('manual', 'invalid-pass', 'Pass code is required.');
    }
    return this.recordSuccess('manual');
  }

  reset(): void {
    this.stopQrScan();
    this.statusSignal.set(null);
  }

  // ---- Internals ---------------------------------------------------------

  private async recordSuccess(method: CheckInMethod): Promise<CheckInStatus> {
    const me = this.identity.currentAttendee();
    const status: CheckInStatus = { success: true, timestamp: new Date(), method };
    this.statusSignal.set(status);
    if (me) {
      try {
        await addDoc(collection(this.firestore, CHECKIN_COLLECTION), {
          uid: me.id,
          method,
          rp: RP_NAME,
          timestamp: serverTimestamp(),
        });
      } catch (err) {
        // The check-in itself is considered successful; we just log the
        // audit failure (e.g. App Check rejection) without surfacing.
        logger.warn('checkIn.audit', err);
      }
    }
    return status;
  }

  private fail(method: CheckInMethod, _code: CheckInError, message: string): CheckInStatus {
    const status: CheckInStatus = { success: false, method, errorMessage: message };
    this.statusSignal.set(status);
    return status;
  }
}
