import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StaffRunbookService, RunbookTask } from '../../core/services/staff-runbook.service';

@Component({
  selector: 'app-runbook',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="runbook-container animate-fade-in">
      <header class="page-header">
        <div class="header-content">
          <h2 class="gradient-text">Unified Real-time Runbook</h2>
          <p class="text-secondary">Sync operational data across the event team. Consistently efficient performance for mission-critical tasks.</p>
        </div>
        
        <div class="header-actions">
          <div class="sync-indicator">
            <div class="pulse-dot"></div>
            <span>Live Sync Active</span>
          </div>
          <button class="btn btn-primary" (click)="addTask()">+ New Task</button>
        </div>
      </header>

      <div class="runbook-stats glass-card">
        <div class="stat">
          <span class="label">Total Tasks</span>
          <span class="value">{{ tasks().length }}</span>
        </div>
        <div class="stat">
          <span class="label">In Progress</span>
          <span class="value">{{ countStatus('in-progress') }}</span>
        </div>
        <div class="stat">
          <span class="label">Completed</span>
          <span class="value">{{ countStatus('completed') }}</span>
        </div>
        <div class="stat">
          <span class="label">High Priority</span>
          <span class="value danger">{{ countPriority('high') }}</span>
        </div>
      </div>

      <main class="tasks-table glass-card">
        <table role="grid" aria-label="Staff Tasks">
          <thead>
            <tr>
              <th scope="col">Task</th>
              <th scope="col">Priority</th>
              <th scope="col">Assigned To</th>
              <th scope="col">Status</th>
              <th scope="col">Last Updated</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let task of tasks()" class="task-row">
              <td>
                <div class="task-title">{{ task.title }}</div>
              </td>
              <td>
                <span class="priority-badge" [class]="task.priority">{{ task.priority }}</span>
              </td>
              <td>{{ task.assignedTo }}</td>
              <td>
                <div class="status-select">
                  <select 
                    [value]="task.status" 
                    (change)="updateStatus(task.id, $any($event.target).value)"
                    class="glass"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </td>
              <td class="timestamp">{{ task.lastUpdated | date:'shortTime' }}</td>
              <td>
                <button class="btn-icon">⋮</button>
              </td>
            </tr>
          </tbody>
        </table>
      </main>

      <footer class="access-warning glass">
         <span class="icon">⚠️</span>
         <span>This view is restricted to Staff and Approved Sponsors. SSI verification active.</span>
      </footer>
    </div>
  `,
  styles: [`
    .runbook-container {
      max-width: 1300px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 32px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .sync-indicator {
      display: flex;
      align-items: center;
      gap: 10px;
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
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    .runbook-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1px;
      background: var(--glass-border);
      padding: 0;
      overflow: hidden;
      margin-bottom: 32px;
    }

    .stat {
      background: var(--bg-card);
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .stat .label { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px; }
    .stat .value { font-size: 1.5rem; font-weight: 700; }
    .stat .value.danger { color: var(--danger); }

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

    .task-row:hover { background: rgba(255,255,255,0.02); }

    .task-title { font-weight: 500; }

    .priority-badge {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: var(--radius-sm);
    }

    .priority-badge.high { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
    .priority-badge.medium { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
    .priority-badge.low { background: rgba(16, 185, 129, 0.1); color: var(--accent); }

    .status-select select {
      background: transparent;
      border: 1px solid var(--glass-border);
      color: var(--text-primary);
      padding: 4px 8px;
      font-size: 0.85rem;
      outline: none;
    }

    .timestamp { font-size: 0.8rem; color: var(--text-muted); }

    .btn-icon {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1.2rem;
    }

    .access-warning {
      margin-top: 32px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.85rem;
      color: var(--warning);
      border-color: rgba(245, 158, 11, 0.2);
    }
  `]
})
export class RunbookComponent {
  private runbookService = inject(StaffRunbookService);
  tasks = this.runbookService.tasks;

  constructor() {}

  updateStatus(taskId: string, status: any) {
    this.runbookService.updateTaskStatus(taskId, status);
  }

  addTask() {
    this.runbookService.addTask({
      title: 'New Emergency Check',
      assignedTo: 'Unassigned',
      status: 'pending',
      priority: 'high'
    });
  }

  countStatus(status: string) {
    return this.tasks().filter(t => t.status === status).length;
  }

  countPriority(priority: string) {
    return this.tasks().filter(t => t.priority === priority).length;
  }
}
