// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors
/**
 * Attendee lifecycle hooks.
 *
 * - `onAttendeeCreate`: when a new Auth user is provisioned, mint an
 *   attendee profile in Firestore so the rules in `firestore.rules` allow
 *   subsequent reads.
 * - `setRoleClaim`: privileged callable that lets a staff user assign a
 *   role to another user. Uses Firebase custom claims so the role survives
 *   token refresh and is enforced by Firestore rules without an extra read.
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { beforeUserCreated } from 'firebase-functions/v2/identity';
import { logger } from 'firebase-functions/v2';

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();
const auth = getAuth();

/**
 * Identity blocking trigger: fires on user creation, *before* the auth user is
 * persisted. We use it to seed the Firestore profile in the same transaction.
 */
export const onAttendeeCreate = beforeUserCreated(async (event) => {
  const u = event.data;
  if (!u?.uid) return;
  try {
    await db
      .collection('attendees')
      .doc(u.uid)
      .set(
        {
          displayName: u.displayName ?? u.email?.split('@')[0] ?? 'Attendee',
          interests: [],
          role: 'attendee',
          ssiIdentifier: `did:firebase:${u.uid}`,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    await auth.setCustomUserClaims(u.uid, { role: 'attendee' });
  } catch (err) {
    logger.error('Failed to seed attendee profile', err);
  }
});

interface SetRoleInput {
  targetUid: string;
  role: 'attendee' | 'speaker' | 'sponsor' | 'staff';
}

export const setRoleClaim = onCall<SetRoleInput, Promise<{ ok: true }>>(
  { enforceAppCheck: true },
  async (req: CallableRequest<SetRoleInput>) => {
    if (req.auth?.token['role'] !== 'staff') {
      throw new HttpsError('permission-denied', 'Only staff can set roles.');
    }
    const { targetUid, role } = req.data ?? ({} as SetRoleInput);
    if (!targetUid || !['attendee', 'speaker', 'sponsor', 'staff'].includes(role)) {
      throw new HttpsError('invalid-argument', 'targetUid and valid role are required.');
    }
    await auth.setCustomUserClaims(targetUid, { role });
    await db
      .collection('attendees')
      .doc(targetUid)
      .set({ role, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return { ok: true };
  },
);
