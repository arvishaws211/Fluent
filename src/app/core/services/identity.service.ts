// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Auth, user } from '@angular/fire/auth';
import {
  doc,
  docData,
  Firestore,
  serverTimestamp,
  setDoc,
  type DocumentData,
} from '@angular/fire/firestore';
import { Observable, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { logger } from '../utils/logger';

export type AttendeeRole = 'attendee' | 'speaker' | 'sponsor' | 'staff';

export interface AttendeeProfile {
  id: string;
  name: string;
  interests: string[];
  role: AttendeeRole;
  ssiIdentifier: string;
}

interface AttendeeDoc extends DocumentData {
  displayName?: string;
  interests?: string[];
  role?: AttendeeRole;
  ssiIdentifier?: string;
}

const ROLE_VALUES: readonly AttendeeRole[] = ['attendee', 'speaker', 'sponsor', 'staff'];

function coerceRole(raw: unknown): AttendeeRole {
  return typeof raw === 'string' && (ROLE_VALUES as readonly string[]).includes(raw)
    ? (raw as AttendeeRole)
    : 'attendee';
}

/**
 * Identity façade. Two reactive sources of truth combined into one signal:
 *
 *   1. `Auth.user()` -> who is currently signed in
 *   2. Firestore `attendees/{uid}` -> profile, interests, role
 *
 * The Cloud Function `onAttendeeCreate` seeds the profile doc *before* the
 * user finishes signing up, so by the time the client subscribes the doc
 * exists and `docData` resolves immediately.
 *
 * Note on SSI: this iteration uses `did:firebase:{uid}` as the decentralized
 * identifier — sufficient for the demo's "verifiable credential" pattern but
 * NOT a full DID-Document implementation. To upgrade, swap `generateVP` for a
 * real signed JWT VP using the user's local key (see SECURITY.md).
 */
@Injectable({ providedIn: 'root' })
export class IdentityService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  private profile$: Observable<AttendeeProfile | null> = user(this.auth).pipe(
    switchMap((u) => {
      if (!u) return of<AttendeeProfile | null>(null);
      const ref = doc(this.firestore, `attendees/${u.uid}`);
      return docData(ref).pipe(
        switchMap((d) => {
          const data = (d as AttendeeDoc | undefined) ?? {};
          const profile: AttendeeProfile = {
            id: u.uid,
            name: data.displayName ?? u.displayName ?? u.email?.split('@')[0] ?? 'Attendee',
            interests: Array.isArray(data.interests) ? data.interests : [],
            role: coerceRole(data.role),
            ssiIdentifier: data.ssiIdentifier ?? `did:firebase:${u.uid}`,
          };
          return of(profile);
        }),
        catchError((err) => {
          logger.warn('identity.profile.read', err);
          return of<AttendeeProfile | null>({
            id: u.uid,
            name: u.displayName ?? u.email?.split('@')[0] ?? 'Attendee',
            interests: [],
            role: 'attendee',
            ssiIdentifier: `did:firebase:${u.uid}`,
          });
        })
      );
    })
  );

  readonly currentAttendee: Signal<AttendeeProfile | null> = toSignal(this.profile$, {
    initialValue: null,
  });

  readonly isAuthenticated = computed(() => this.currentAttendee() !== null);
  readonly isStaff = computed(() => {
    const r = this.currentAttendee()?.role;
    return r === 'staff' || r === 'sponsor';
  });

  // Local-only: VP minting status for the SSI handshake flow.
  private vpInFlight = signal<boolean>(false);
  readonly mintingVP = this.vpInFlight.asReadonly();

  async updateInterests(interests: string[]): Promise<void> {
    const me = this.currentAttendee();
    if (!me) throw new Error('Not authenticated');
    const cleaned = interests
      .map((i) => i.trim())
      .filter(Boolean)
      .slice(0, 20);
    await setDoc(
      doc(this.firestore, `attendees/${me.id}`),
      { interests: cleaned, updatedAt: serverTimestamp() },
      { merge: true }
    );
  }

  /**
   * Verifiable Presentation handshake. Today this returns a non-cryptographic
   * token bound to the user's uid + nonce; sufficient as a placeholder for
   * the SSI flow but TO REPLACE with a signed JWT VP using a key kept in
   * IndexedDB / WebCrypto. Tracked in SECURITY.md.
   */
  async generateVerifiablePresentation(challenge: string): Promise<string> {
    const me = this.currentAttendee();
    if (!me) throw new Error('Cannot mint VP without an active session.');
    this.vpInFlight.set(true);
    try {
      const nonce = crypto.getRandomValues(new Uint8Array(8));
      const hex = Array.from(nonce, (b) => b.toString(16).padStart(2, '0')).join('');
      const payload = `${me.ssiIdentifier}::${challenge}::${hex}`;
      const enc = new TextEncoder().encode(payload);
      const digest = await crypto.subtle.digest('SHA-256', enc);
      const sig = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
      return `vp.${btoa(payload)}.${sig}`;
    } finally {
      this.vpInFlight.set(false);
    }
  }
}
