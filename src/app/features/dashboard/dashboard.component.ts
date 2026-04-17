import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IdentityService } from '../../core/services/identity.service';
import { MatchmakingService } from '../../core/services/matchmaking.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-grid animate-fade-in">
      <!-- Welcome Header -->
      <section class="welcome-card glass-card full-width">
        <h2 class="gradient-text">Welcome back, {{ user()?.name || 'Attendee' }}</h2>
        <p class="text-secondary">Your personalized event experience is ready. Eliminate friction, maximize engagement.</p>
        
        <div class="quick-stats">
          <div class="stat-item">
            <span class="stat-value">12</span>
            <span class="stat-label">Upcoming Sessions</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">8</span>
            <span class="stat-label">AI Matches</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">2h</span>
            <span class="stat-label">Saved Time</span>
          </div>
        </div>
      </section>

      <!-- Smart Actions -->
      <section class="actions-grid">
        <div class="action-card glass-card" routerLink="/check-in">
          <div class="icon-box primary">⚡</div>
          <h3>Express Check-in</h3>
          <p>Use Biometric or QR scan for zero-queue entry.</p>
          <button class="btn btn-outline">Check-in Now</button>
        </div>

        <div class="action-card glass-card" routerLink="/wayfinding">
          <div class="icon-box secondary">📍</div>
          <h3>Smart Wayfinding</h3>
          <p>Find quiet routes and navigate the venue in AR.</p>
          <button class="btn btn-outline">Open Map</button>
        </div>
      </section>

      <!-- AI Insights -->
      <section class="insights-card glass-card">
        <div class="card-header">
          <h3>AI Matchmaking Insights</h3>
          <button class="btn btn-primary btn-sm" (click)="refreshMatches()">Regenerate</button>
        </div>
        
        <div class="matches-list" *ngIf="!isProcessing(); else loading">
          <div class="match-item glass" *ngFor="let match of matches()">
            <div class="match-info">
              <span class="match-name">{{ match.partnerName }}</span>
              <span class="match-reason">{{ match.reasoning }}</span>
            </div>
            <div class="match-score">
              <div class="score-ring" [style.--percent]="match.relevanceScore * 100">
                {{ (match.relevanceScore * 100).toFixed(0) }}%
              </div>
            </div>
          </div>
        </div>
        <ng-template #loading>
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Synthesizing profiles with Vertex AI...</p>
          </div>
        </ng-template>
      </section>

      <!-- Event Schedule Snapshot -->
      <section class="schedule-card glass-card">
        <h3>Live Venue Status</h3>
        <div class="status-feed">
          <div class="feed-item">
            <div class="status-dot online"></div>
            <div class="feed-content">
              <strong>Main Stage</strong>
              <p>Keynote: Future of Agentic AI (Starting in 5m)</p>
            </div>
          </div>
          <div class="feed-item">
            <div class="status-dot busy"></div>
            <div class="feed-content">
              <strong>Lounge B</strong>
              <p>High crowd density. Sensory Mode recommended.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .full-width {
      grid-column: span 2;
    }

    .welcome-card {
      padding: 40px;
    }

    .quick-stats {
      display: flex;
      gap: 40px;
      margin-top: 32px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--primary);
    }

    .stat-label {
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
    }

    .action-card {
      padding: 32px;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .action-card:hover {
      transform: translateY(-4px);
    }

    .icon-box {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      margin-bottom: 20px;
    }

    .icon-box.primary { background: rgba(99, 102, 241, 0.1); color: var(--primary); }
    .icon-box.secondary { background: rgba(236, 72, 153, 0.1); color: var(--secondary); }

    .matches-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 20px;
    }

    .match-item {
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .match-info {
      display: flex;
      flex-direction: column;
    }

    .match-name {
      font-weight: 600;
    }

    .match-reason {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .score-ring {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 3px solid var(--glass-border);
      border-top-color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 700;
    }

    .status-feed {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .feed-item {
      display: flex;
      gap: 16px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-top: 8px;
    }

    .status-dot.online { background: var(--accent); box-shadow: 0 0 8px var(--accent); }
    .status-dot.busy { background: var(--warning); box-shadow: 0 0 8px var(--warning); }

    .loading-state {
      text-align: center;
      padding: 40px;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--glass-border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 968px) {
      .dashboard-grid { grid-template-columns: 1fr; }
      .full-width { grid-column: auto; }
    }
  `]
})
export class DashboardComponent {
  private identityService = inject(IdentityService);
  private matchmakingService = inject(MatchmakingService);
  
  user = this.identityService.currentAttendee;
  matches = this.matchmakingService.matches;
  isProcessing = this.matchmakingService.isProcessing;

  constructor() {
    if (this.matches().length === 0) {
      this.refreshMatches();
    }
  }

  refreshMatches() {
    this.matchmakingService.generateMatches();
  }
}
