// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IdentityService } from '../../core/services/identity.service';
import { MatchmakingService } from '../../core/services/matchmaking.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-grid animate-fade-in">
      <section class="welcome-card glass-card full-width" aria-labelledby="welcome-heading">
        <h2 id="welcome-heading" class="gradient-text">Welcome back, {{ user()?.name || 'Attendee' }}</h2>
        <p class="text-secondary">
          Your personalized event experience is ready. Eliminate friction, maximize engagement.
        </p>

        <dl class="quick-stats" aria-label="Personal event stats">
          <div class="stat-item">
            <dt class="stat-label">Upcoming Sessions</dt>
            <dd class="stat-value">{{ sessionsCount }}</dd>
          </div>
          <div class="stat-item">
            <dt class="stat-label">AI Matches</dt>
            <dd class="stat-value">{{ matchCount() }}</dd>
          </div>
          <div class="stat-item">
            <dt class="stat-label">Time Saved</dt>
            <dd class="stat-value">2h</dd>
          </div>
        </dl>
      </section>

      <nav class="actions-grid" aria-label="Quick actions">
        <a routerLink="/check-in" class="action-card glass-card">
          <span class="icon-box primary" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="13 2 13 10 21 10"/><polyline points="22 18 13 18 13 22"/><line x1="2" y1="12" x2="11" y2="12"/>
            </svg>
          </span>
          <h3>Express check-in</h3>
          <p>Use biometric, QR, or pass-code entry — no queues.</p>
        </a>

        <a routerLink="/wayfinding" class="action-card glass-card">
          <span class="icon-box secondary" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
          </span>
          <h3>Smart wayfinding</h3>
          <p>Find quiet routes with the IoT sensory map.</p>
        </a>
      </nav>

      <section class="insights-card glass-card" aria-labelledby="ai-heading" aria-busy="{{ isProcessing() }}">
        <header class="card-header">
          <h3 id="ai-heading">AI matchmaking insights</h3>
          <button type="button" class="btn btn-primary btn-sm" (click)="refreshMatches()"
                  [disabled]="isProcessing()">
            {{ isProcessing() ? 'Synthesizing…' : 'Regenerate' }}
          </button>
        </header>

        <div class="matches-list" *ngIf="!isProcessing(); else loading" aria-live="polite">
          <article class="match-item glass" *ngFor="let match of matches()">
            <div class="match-info">
              <span class="match-name">{{ match.partnerName }}</span>
              <span class="match-reason">{{ match.reasoning }}</span>
            </div>
            <span class="score-ring" [attr.aria-label]="'Match score ' + (match.relevanceScore * 100).toFixed(0) + ' percent'">
              {{ (match.relevanceScore * 100).toFixed(0) }}%
            </span>
          </article>
          <p *ngIf="!matches().length" class="text-muted">
            No matches yet — click <em>Regenerate</em> after adding interests on your profile.
          </p>
        </div>
        <ng-template #loading>
          <div class="loading-state">
            <div class="spinner" aria-hidden="true"></div>
            <p>Synthesizing profiles with Vertex AI…</p>
          </div>
        </ng-template>
      </section>

      <section class="schedule-card glass-card" aria-labelledby="venue-heading">
        <h3 id="venue-heading">Live venue status</h3>
        <ul class="status-feed" role="list">
          <li class="feed-item">
            <span class="status-dot online" aria-hidden="true"></span>
            <div>
              <strong>Main Stage</strong>
              <p>Keynote: Future of Agentic AI (starting in 5m)</p>
            </div>
          </li>
          <li class="feed-item">
            <span class="status-dot busy" aria-hidden="true"></span>
            <div>
              <strong>Lounge B</strong>
              <p>High crowd density. Sensory mode recommended.</p>
            </div>
          </li>
        </ul>
      </section>
    </div>
  `,
  styles: [`
    .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .full-width { grid-column: span 2; }
    .welcome-card { padding: 40px; }
    .quick-stats { display: flex; gap: 40px; margin: 32px 0 0; padding: 0; }
    .stat-item { display: flex; flex-direction: column; }
    .stat-value { font-size: 2rem; font-weight: 700; color: var(--primary); margin: 0; }
    .stat-label { color: var(--text-muted); font-size: .9rem; margin: 0; }

    .actions-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
    .action-card {
      padding: 32px; cursor: pointer; transition: transform .2s;
      text-decoration: none; color: inherit; display: block;
    }
    .action-card:hover { transform: translateY(-4px); }
    .action-card:focus-visible { outline: 2px solid var(--primary); outline-offset: 4px; }

    .icon-box {
      width: 48px; height: 48px; border-radius: var(--radius-md);
      display: inline-flex; align-items: center; justify-content: center;
      margin-bottom: 20px;
    }
    .icon-box.primary { background: rgba(99,102,241,.1); color: var(--primary); }
    .icon-box.secondary { background: rgba(236,72,153,.1); color: var(--secondary); }

    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }

    .matches-list { display: flex; flex-direction: column; gap: 16px; margin-top: 8px; }
    .match-item { padding: 16px; display: flex; justify-content: space-between; align-items: center; }
    .match-info { display: flex; flex-direction: column; }
    .match-name { font-weight: 600; }
    .match-reason { font-size: .85rem; color: var(--text-secondary); }

    .score-ring {
      width: 56px; height: 56px; border-radius: 50%;
      border: 3px solid var(--glass-border); border-top-color: var(--primary);
      display: flex; align-items: center; justify-content: center;
      font-size: .8rem; font-weight: 700;
    }

    .status-feed { margin-top: 20px; display: flex; flex-direction: column; gap: 20px; padding: 0; list-style: none; }
    .feed-item { display: flex; gap: 16px; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 8px; }
    .status-dot.online { background: var(--accent); box-shadow: 0 0 8px var(--accent); }
    .status-dot.busy { background: var(--warning); box-shadow: 0 0 8px var(--warning); }

    .loading-state { text-align: center; padding: 40px; }
    .spinner {
      width: 32px; height: 32px;
      border: 3px solid var(--glass-border); border-top-color: var(--primary);
      border-radius: 50%; animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 968px) {
      .dashboard-grid { grid-template-columns: 1fr; }
      .full-width { grid-column: auto; }
    }
  `],
})
export class DashboardComponent {
  private identityService = inject(IdentityService);
  private matchmakingService = inject(MatchmakingService);

  readonly user = this.identityService.currentAttendee;
  readonly matches = this.matchmakingService.matches;
  readonly isProcessing = this.matchmakingService.isProcessing;
  readonly matchCount = computed(() => this.matches().length);

  readonly sessionsCount = 12;

  constructor() {
    if (this.matches().length === 0) {
      this.refreshMatches();
    }
  }

  refreshMatches(): void {
    void this.matchmakingService.generateMatches();
  }
}
