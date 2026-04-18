// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

import { TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { StaffRunbookService } from './staff-runbook.service';

const SAMPLE_TASKS = [
  {
    id: 't1',
    title: 'Stage check',
    assignedTo: 'John',
    status: 'completed',
    priority: 'high',
    lastUpdated: { toDate: () => new Date('2026-04-18T08:00:00Z') },
  },
  {
    id: 't2',
    title: 'Catering',
    assignedTo: 'Jane',
    status: 'in-progress',
    priority: 'medium',
    lastUpdated: { toDate: () => new Date('2026-04-18T09:00:00Z') },
  },
  {
    id: 't3',
    title: 'Crowd control',
    assignedTo: 'Sec',
    status: 'pending',
    priority: 'high',
    lastUpdated: { toDate: () => new Date('2026-04-18T10:00:00Z') },
  },
];

vi.mock('@angular/fire/firestore', () => ({
  Firestore: class {},
  collection: vi.fn(() => ({})),
  collectionData: vi.fn(() => of(SAMPLE_TASKS)),
  doc: vi.fn(() => ({})),
  updateDoc: vi.fn(() => Promise.resolve()),
  setDoc: vi.fn(() => Promise.resolve()),
  query: vi.fn((...args: unknown[]) => args),
  orderBy: vi.fn(() => ({})),
  serverTimestamp: vi.fn(() => 'TS'),
  Timestamp: class {},
}));

describe('StaffRunbookService', () => {
  let service: StaffRunbookService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StaffRunbookService,
        { provide: Firestore, useValue: {} },
      ],
    });
    service = TestBed.inject(StaffRunbookService);
  });

  it('exposes tasks from the Firestore stream', () => {
    expect(service.tasks().length).toBe(3);
    expect(service.tasks()[0].title).toBe('Stage check');
  });

  it('filters high-priority non-complete tasks', () => {
    const high = service.highPriorityTasks();
    expect(high.length).toBe(1);
    expect(high[0].title).toBe('Crowd control');
  });

  it('computes completion rate as a percentage', () => {
    expect(service.completionRate()).toBe(33);
  });

  it('updateTaskStatus calls Firestore updateDoc with serverTimestamp', async () => {
    const { updateDoc } = await import('@angular/fire/firestore');
    await service.updateTaskStatus('t2', 'completed');
    expect(updateDoc).toHaveBeenCalled();
    const [, payload] = (updateDoc as ReturnType<typeof vi.fn>).mock.calls.at(-1)!;
    expect(payload).toEqual({ status: 'completed', lastUpdated: 'TS' });
  });

  it('addTask returns a uuid and writes via setDoc', async () => {
    const { setDoc } = await import('@angular/fire/firestore');
    const id = await service.addTask({
      title: 'New task',
      assignedTo: 'Crew',
      status: 'pending',
      priority: 'low',
    });
    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');
    expect(setDoc).toHaveBeenCalled();
  });
});
