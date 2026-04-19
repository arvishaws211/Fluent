// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  RunbookPriority,
  RunbookStatus,
  StaffRunbookService,
} from '../../core/services/staff-runbook.service';

const STATUSES: RunbookStatus[] = ['pending', 'in-progress', 'completed', 'blocked'];
const PRIORITIES: RunbookPriority[] = ['low', 'medium', 'high'];

@Component({
  selector: 'app-runbook',
  standalone: true,
  imports: [FormsModule, DatePipe, TitleCasePipe],
  template: `
    <div class="runbook-container animate-fade-in">
      <header class="page-header">
        <div class="header-content">
          <h2 class="gradient-text">Unified real-time runbook</h2>
          <p class="text-secondary">
            Operational source of truth synced via Firestore. Edits propagate to every staff device
            in real time, governed by Firestore security rules and App Check.
          </p>
        </div>

        <div class="header-actions">
          <span class="sync-indicator" role="status" aria-live="polite">
            <span class="pulse-dot" aria-hidden="true"></span>
            <span>Live sync — {{ completionRate() }}% complete</span>
          </span>
          <button type="button" class="btn btn-primary" (click)="toggleNew()">
            {{ showNew() ? 'Cancel' : 'New task' }}
          </button>
        </div>
      </header>

      <section class="runbook-stats glass-card" aria-label="Runbook stats">
        <div class="stat">
          <span class="label">Total</span>
          <span class="value">{{ tasks().length }}</span>
        </div>
        <div class="stat">
          <span class="label">In progress</span>
          <span class="value">{{ countStatus('in-progress') }}</span>
        </div>
        <div class="stat">
          <span class="label">Completed</span>
          <span class="value">{{ countStatus('completed') }}</span>
        </div>
        <div class="stat">
          <span class="label">High priority</span>
          <span class="value danger">{{ highPriorityTasks().length }}</span>
        </div>
      </section>

      @if (showNew()) {
        <form
          class="new-task-form glass-card"
          (ngSubmit)="createTask()"
          aria-labelledby="new-task-heading"
        >
          <h3 id="new-task-heading">Add task</h3>
          <div class="grid">
            <div class="form-group">
              <label for="t-title">Title</label>
              <input
                id="t-title"
                class="glass-input"
                [(ngModel)]="draft.title"
                name="title"
                required
              />
            </div>
            <div class="form-group">
              <label for="t-owner">Assigned to</label>
              <input
                id="t-owner"
                class="glass-input"
                [(ngModel)]="draft.assignedTo"
                name="assignedTo"
                required
              />
            </div>
            <div class="form-group">
              <label for="t-priority">Priority</label>
              <select
                id="t-priority"
                class="glass-input"
                [(ngModel)]="draft.priority"
                name="priority"
              >
                @for (p of PRIORITIES; track p) {
                  <option [value]="p">{{ p | titlecase }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label for="t-status">Status</label>
              <select id="t-status" class="glass-input" [(ngModel)]="draft.status" name="status">
                @for (s of STATUSES; track s) {
                  <option [value]="s">{{ s | titlecase }}</option>
                }
              </select>
            </div>
          </div>
          <button type="submit" class="btn btn-primary">Save task</button>
          @if (lastError()) {
            <p class="error" role="alert">{{ lastError() }}</p>
          }
        </form>
      }

      <main class="tasks-table glass-card" aria-labelledby="tasks-heading">
        <h3 id="tasks-heading" class="visually-hidden">Tasks</h3>
        <table>
          <caption class="visually-hidden">
            Live staff runbook tasks
          </caption>
          <thead>
            <tr>
              <th scope="col">Task</th>
              <th scope="col">Priority</th>
              <th scope="col">Assigned to</th>
              <th scope="col">Status</th>
              <th scope="col">Last updated</th>
            </tr>
          </thead>
          <tbody>
            @for (task of tasks(); track task.id) {
              <tr class="task-row">
                <td>
                  <span class="task-title">{{ task.title }}</span>
                </td>
                <td>
                  <span class="priority-badge" [class]="task.priority">{{ task.priority }}</span>
                </td>
                <td>{{ task.assignedTo }}</td>
                <td>
                  <label class="visually-hidden" [attr.for]="'status-' + task.id"
                    >Status for {{ task.title }}</label
                  >
                  <select
                    [id]="'status-' + task.id"
                    [value]="task.status"
                    (change)="onStatusChange(task.id, $event)"
                    class="glass-input"
                  >
                    @for (s of STATUSES; track s) {
                      <option [value]="s">{{ s | titlecase }}</option>
                    }
                  </select>
                </td>
                <td class="timestamp">{{ task.lastUpdated | date: 'shortTime' }}</td>
              </tr>
            }
            @if (!tasks().length) {
              <tr>
                <td colspan="5" class="empty">No tasks yet — add one to get started.</td>
              </tr>
            }
          </tbody>
        </table>
      </main>

      <footer class="access-warning glass" role="note">
        <strong>Restricted view.</strong>
        Visible only to authenticated users with the <code>staff</code> or
        <code>sponsor</code> custom claim. Enforced by Firestore security rules.
      </footer>
    </div>
  `,
  styles: [
    `
      .runbook-container {
        max-width: 1300px;
        margin: 0 auto;
      }
      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 24px;
        margin-bottom: 32px;
        flex-wrap: wrap;
      }
      .header-actions {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .sync-indicator {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 0.85rem;
        color: var(--accent);
        background: rgba(16, 185, 129, 0.05);
        padding: 6px 12px;
        border-radius: var(--radius-full);
        border: 1px solid rgba(16, 185, 129, 0.2);
      }
      .pulse-dot {
        width: 8px;
        height: 8px;
        background: var(--accent);
        border-radius: 50%;
        animation: pulse-sync 2s infinite;
      }
      @keyframes pulse-sync {
        0% {
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
        }
        70% {
          box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
        }
      }

      .runbook-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1px;
        background: var(--glass-border);
        padding: 0;
        overflow: hidden;
        margin-bottom: 24px;
      }
      .stat {
        background: var(--bg-card);
        padding: 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .stat .label {
        font-size: 0.8rem;
        color: var(--text-muted);
        margin-bottom: 8px;
      }
      .stat .value {
        font-size: 1.5rem;
        font-weight: 700;
      }
      .stat .value.danger {
        color: var(--danger);
      }

      .new-task-form {
        padding: 24px;
        margin-bottom: 24px;
      }
      .new-task-form .grid {
        display: grid;
        grid-template-columns: 2fr 2fr 1fr 1fr;
        gap: 16px;
        margin-bottom: 16px;
      }
      .form-group label {
        display: block;
        font-size: 0.85rem;
        color: var(--text-secondary);
        margin-bottom: 4px;
      }
      .glass-input {
        width: 100%;
        padding: 8px 10px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--glass-border);
        color: var(--text-primary);
        border-radius: var(--radius-sm);
      }
      .error {
        color: #ff6b6b;
        margin-top: 12px;
      }

      .tasks-table {
        padding: 0;
        overflow-x: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
      }
      th {
        padding: 16px 24px;
        font-size: 0.85rem;
        color: var(--text-muted);
        border-bottom: 1px solid var(--glass-border);
        font-weight: 500;
      }
      td {
        padding: 16px 24px;
        border-bottom: 1px solid var(--glass-border);
        font-size: 0.95rem;
      }
      .task-row:hover {
        background: rgba(255, 255, 255, 0.02);
      }
      .task-title {
        font-weight: 500;
      }
      .empty {
        color: var(--text-muted);
        text-align: center;
        padding: 32px;
      }

      .priority-badge {
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        padding: 2px 8px;
        border-radius: var(--radius-sm);
      }
      .priority-badge.high {
        background: rgba(239, 68, 68, 0.1);
        color: var(--danger);
      }
      .priority-badge.medium {
        background: rgba(245, 158, 11, 0.1);
        color: var(--warning);
      }
      .priority-badge.low {
        background: rgba(16, 185, 129, 0.1);
        color: var(--accent);
      }

      .timestamp {
        font-size: 0.8rem;
        color: var(--text-muted);
      }

      .access-warning {
        margin-top: 24px;
        padding: 16px;
        font-size: 0.85rem;
        color: var(--warning);
        border-color: rgba(245, 158, 11, 0.2);
      }

      @media (max-width: 768px) {
        .runbook-stats {
          grid-template-columns: repeat(2, 1fr);
        }
        .new-task-form .grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class RunbookComponent {
  private runbookService = inject(StaffRunbookService);

  readonly tasks = this.runbookService.tasks;
  readonly highPriorityTasks = this.runbookService.highPriorityTasks;
  readonly completionRate = this.runbookService.completionRate;
  readonly lastError = this.runbookService.lastError;

  readonly showNew = signal(false);
  readonly STATUSES = STATUSES;
  readonly PRIORITIES = PRIORITIES;

  draft: { title: string; assignedTo: string; priority: RunbookPriority; status: RunbookStatus } = {
    title: '',
    assignedTo: '',
    priority: 'medium',
    status: 'pending',
  };

  countStatus(status: RunbookStatus): number {
    return this.tasks().filter((t) => t.status === status).length;
  }

  toggleNew(): void {
    this.showNew.set(!this.showNew());
  }

  async updateStatus(taskId: string, status: RunbookStatus): Promise<void> {
    await this.runbookService.updateTaskStatus(taskId, status);
  }

  onStatusChange(taskId: string, event: Event): void {
    const target = event.target as HTMLSelectElement;
    void this.updateStatus(taskId, target.value as RunbookStatus);
  }

  async createTask(): Promise<void> {
    if (!this.draft.title.trim() || !this.draft.assignedTo.trim()) return;
    await this.runbookService.addTask({ ...this.draft });
    this.draft = { title: '', assignedTo: '', priority: 'medium', status: 'pending' };
    this.showNew.set(false);
  }
}
