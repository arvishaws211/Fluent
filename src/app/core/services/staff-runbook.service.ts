// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  collection,
  collectionData,
  doc,
  Firestore,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  type DocumentData,
} from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { logger } from '../utils/logger';

export type RunbookStatus = 'pending' | 'in-progress' | 'completed' | 'blocked';
export type RunbookPriority = 'low' | 'medium' | 'high';

export interface RunbookTask {
  id: string;
  title: string;
  assignedTo: string;
  status: RunbookStatus;
  priority: RunbookPriority;
  lastUpdated: Date;
}

interface RunbookDoc extends DocumentData {
  title: string;
  assignedTo: string;
  status: RunbookStatus;
  priority: RunbookPriority;
  lastUpdated: Timestamp | null;
}

const RUNBOOK_COLLECTION = 'runbook';

/**
 * Real-time runbook backed by Firestore.
 *
 * The previous in-memory implementation made the dashboard look populated
 * but defeated the entire point of "Unified Real-time Runbook" — multiple
 * staff members on different devices were each seeing their own private list.
 *
 * This service now binds a Firestore `onSnapshot` stream to a signal via
 * `toSignal`, which gives us:
 *   1. Multi-device convergence with sub-second latency.
 *   2. Offline support via Firestore's persistence layer (PWA cache).
 *   3. Read access gated by `firestore.rules` -> only staff/sponsor roles.
 */
@Injectable({ providedIn: 'root' })
export class StaffRunbookService {
  private firestore = inject(Firestore);

  private readonly tasks$: Observable<RunbookTask[]> = (() => {
    try {
      const ref = collection(this.firestore, RUNBOOK_COLLECTION);
      const q = query(ref, orderBy('lastUpdated', 'desc'));
      return collectionData(q, { idField: 'id' }).pipe(
        map((rows) =>
          (rows as Array<RunbookDoc & { id: string }>).map((r) => ({
            id: r.id,
            title: r.title,
            assignedTo: r.assignedTo,
            status: r.status,
            priority: r.priority,
            lastUpdated: r.lastUpdated?.toDate?.() ?? new Date(),
          }))
        ),
        catchError((err) => {
          logger.error('runbook.snapshot', err);
          return of<RunbookTask[]>([]);
        })
      );
    } catch (err) {
      logger.error('runbook.subscribe', err);
      return of<RunbookTask[]>([]);
    }
  })();

  readonly tasks: Signal<RunbookTask[]> = toSignal(this.tasks$, { initialValue: [] });

  readonly highPriorityTasks = computed(() =>
    this.tasks().filter((t) => t.priority === 'high' && t.status !== 'completed')
  );

  readonly completionRate = computed(() => {
    const list = this.tasks();
    if (!list.length) return 0;
    const done = list.filter((t) => t.status === 'completed').length;
    return Math.round((done / list.length) * 100);
  });

  // Local-only error surface for UI; not piped through Firestore.
  private readonly lastErrorSignal = signal<string | null>(null);
  readonly lastError = this.lastErrorSignal.asReadonly();

  async updateTaskStatus(taskId: string, status: RunbookStatus): Promise<void> {
    try {
      await updateDoc(doc(this.firestore, `${RUNBOOK_COLLECTION}/${taskId}`), {
        status,
        lastUpdated: serverTimestamp(),
      });
      this.lastErrorSignal.set(null);
    } catch (err) {
      logger.error('runbook.updateTaskStatus', err);
      this.lastErrorSignal.set('Could not update task. Check your role permissions.');
      throw err;
    }
  }

  async addTask(task: Omit<RunbookTask, 'id' | 'lastUpdated'>): Promise<string> {
    const id = crypto.randomUUID();
    try {
      await setDoc(doc(this.firestore, `${RUNBOOK_COLLECTION}/${id}`), {
        ...task,
        lastUpdated: serverTimestamp(),
      });
      this.lastErrorSignal.set(null);
      return id;
    } catch (err) {
      logger.error('runbook.addTask', err);
      this.lastErrorSignal.set('Could not create task. Check your role permissions.');
      throw err;
    }
  }
}
