// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IdentityService } from '../../core/services/identity.service';
import { MatchmakingService } from '../../core/services/matchmaking.service';

const SUGGESTED_INTERESTS = [
  'Agentic AI',
  'Sustainability',
  'Web3',
  'Edge Computing',
  'Sponsorship',
  'Hiring',
  'Healthcare AI',
  'Fintech',
  'Robotics',
  'Climate Tech',
];

@Component({
  selector: 'app-matchmaking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="matchmaking-container animate-fade-in">
      <header class="page-header">
        <h2 class="gradient-text">AI matchmaking</h2>
        <p class="text-secondary">
          Vertex AI synthesizes attendee profiles and sponsor missions to surface high-value introductions —
          all without exposing your identity to the model.
        </p>
      </header>

      <div class="matchmaking-layout">
        <main class="results-section" aria-labelledby="results-heading">
          <h3 id="results-heading" class="visually-hidden">Match results</h3>

          <div class="status-bar glass" *ngIf="isProcessing()" aria-live="polite">
            <div class="loader-line" aria-hidden="true"></div>
            <span>Synthesizing matches via Vertex AI…</span>
          </div>

          <div class="error-bar glass" *ngIf="error()" role="alert">
            <strong>Heads up.</strong> {{ error() }}
          </div>

          <div class="results-grid" *ngIf="!isProcessing() && matches().length">
            <article class="match-card glass-card" *ngFor="let match of matches()" [attr.aria-label]="'Match: ' + match.partnerName">
              <header class="match-header">
                <span class="match-badge" [class]="match.type">{{ match.type | titlecase }}</span>
                <span class="match-score" [attr.aria-label]="'Relevance ' + (match.relevanceScore * 100).toFixed(0) + ' percent'">
                  {{ (match.relevanceScore * 100).toFixed(0) }}% match
                </span>
              </header>
              <div class="match-content">
                <h4>{{ match.partnerName }}</h4>
                <p class="reasoning">{{ match.reasoning }}</p>
              </div>
              <footer class="match-actions">
                <button type="button" class="btn btn-primary w-full">Schedule meeting</button>
                <button type="button" class="btn btn-outline w-full">View profile</button>
              </footer>
            </article>
          </div>

          <p class="empty-state" *ngIf="!isProcessing() && !matches().length && !error()">
            Add a few interests on the right, then tap <em>Update AI agent</em> to generate fresh matches.
          </p>
        </main>

        <aside class="intent-section glass-card" aria-labelledby="intent-heading">
          <h3 id="intent-heading">Your AI agent intent</h3>
          <p class="text-secondary small">Refine what the AI should look for when matching you.</p>

          <form class="intent-form" (ngSubmit)="updateAgent()">
            <div class="form-group">
              <label for="match-goal">Match goal</label>
              <select id="match-goal" class="glass-input" [(ngModel)]="goal" name="goal">
                <option value="collaboration">Technical collaboration</option>
                <option value="funding">Investment / Funding</option>
                <option value="hiring">Hiring / Talent</option>
                <option value="sponsor">Sponsorship info</option>
              </select>
            </div>

            <fieldset class="form-group">
              <legend>Priority interests</legend>
              <div class="interest-tags" role="list">
                <button type="button" role="listitem"
                        *ngFor="let tag of SUGGESTED"
                        class="tag"
                        [class.active]="selected().includes(tag)"
                        [attr.aria-pressed]="selected().includes(tag)"
                        (click)="toggleInterest(tag)">
                  {{ tag }}
                </button>
              </div>
            </fieldset>

            <button type="submit" class="btn btn-primary" [disabled]="isProcessing()">
              {{ isProcessing() ? 'Updating…' : 'Update AI agent' }}
            </button>
          </form>

          <p class="privacy-note glass" role="note">
            <span aria-hidden="true">SSI</span>
            <span>Your PII stays on-device. The AI only sees a synthesized interest vector.</span>
          </p>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .matchmaking-container { max-width: 1200px; margin: 0 auto; }
    .page-header { margin-bottom: 32px; }
    .matchmaking-layout { display: grid; grid-template-columns: 1fr 320px; gap: 32px; }

    .visually-hidden {
      position: absolute; width: 1px; height: 1px;
      padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0);
      white-space: nowrap; border: 0;
    }

    .status-bar, .error-bar { padding: 16px 24px; margin-bottom: 24px; display: flex; gap: 16px; align-items: center; }
    .error-bar { color: #ff6b6b; }

    .loader-line { flex: 1; height: 2px; background: var(--glass-border); position: relative; overflow: hidden; }
    .loader-line::after {
      content: ''; position: absolute; left: -30%; top: 0;
      height: 100%; width: 30%; background: var(--primary);
      animation: slide 1.5s infinite ease-in-out;
    }
    @keyframes slide { from { left: -30%; } to { left: 100%; } }

    .results-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
    .match-card { display: flex; flex-direction: column; gap: 16px; padding: 24px; }
    .match-header { display: flex; justify-content: space-between; align-items: center; }
    .match-badge { font-size: .7rem; font-weight: 700; padding: 4px 10px; border-radius: var(--radius-sm); text-transform: uppercase; }
    .match-badge.sponsor  { background: rgba(99,102,241,.1); color: var(--primary); }
    .match-badge.attendee { background: rgba(16,185,129,.1); color: var(--accent); }
    .match-badge.session  { background: rgba(236,72,153,.1); color: var(--secondary); }
    .match-score { font-weight: 600; font-size: .85rem; color: var(--primary); }
    .reasoning { font-size: .95rem; color: var(--text-secondary); line-height: 1.5; }
    .match-actions { display: flex; gap: 12px; margin-top: auto; }
    .w-full { width: 100%; }

    .empty-state { color: var(--text-muted); padding: 24px; text-align: center; }

    .intent-form { margin-top: 16px; display: flex; flex-direction: column; gap: 20px; }
    .form-group label, .form-group legend { display: block; font-size: .85rem; font-weight: 500; margin-bottom: 8px; color: var(--text-secondary); }
    .glass-input {
      width: 100%; padding: 10px 12px;
      background: rgba(255,255,255,.05);
      border: 1px solid var(--glass-border);
      color: var(--text-primary); border-radius: var(--radius-sm);
    }
    .interest-tags { display: flex; flex-wrap: wrap; gap: 8px; }
    .tag {
      font-size: .75rem; padding: 6px 12px;
      background: var(--glass-bg); color: var(--text-muted);
      border: 1px solid var(--glass-border); border-radius: var(--radius-sm);
      cursor: pointer;
    }
    .tag.active { background: var(--primary); color: white; border-color: var(--primary); }
    .tag:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }

    .privacy-note {
      margin-top: 24px; padding: 16px; font-size: .8rem;
      color: var(--text-muted); display: flex; gap: 12px; align-items: center;
    }

    @media (max-width: 900px) {
      .matchmaking-layout { grid-template-columns: 1fr; }
    }
  `],
})
export class MatchmakingComponent {
  private matchmakingService = inject(MatchmakingService);
  private identityService = inject(IdentityService);

  readonly matches = this.matchmakingService.matches;
  readonly isProcessing = this.matchmakingService.isProcessing;
  readonly error = this.matchmakingService.error;
  readonly SUGGESTED = SUGGESTED_INTERESTS;

  readonly selected = signal<string[]>([]);
  goal = 'collaboration';

  constructor() {
    effect(() => {
      const user = this.identityService.currentAttendee();
      if (user?.interests) this.selected.set([...user.interests]);
    });
  }

  toggleInterest(tag: string): void {
    const current = this.selected();
    this.selected.set(
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
    );
  }

  async updateAgent(): Promise<void> {
    await this.identityService.updateInterests(this.selected());
    await this.matchmakingService.generateMatches();
  }
}
