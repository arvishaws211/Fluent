import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatchmakingService, MatchResult } from '../../core/services/matchmaking.service';

@Component({
  selector: 'app-matchmaking',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="matchmaking-container animate-fade-in">
      <header class="page-header">
        <h2 class="gradient-text">AI Matchmaking</h2>
        <p class="text-secondary">Synthesizing attendee profiles and sponsor missions to find your perfect professional matches.</p>
      </header>

      <div class="matchmaking-layout">
        <main class="results-section">
          <div class="status-bar glass" *ngIf="isProcessing()">
            <div class="loader-line"></div>
            <span>Analyzing 500+ attendee profiles via Vertex AI...</span>
          </div>

          <div class="results-grid" *ngIf="!isProcessing()">
            <div class="match-card glass-card" *ngFor="let match of matches()">
              <div class="match-header">
                <div class="match-badge" [class]="match.type">{{ match.type | titlecase }}</div>
                <div class="match-score">{{ (match.relevanceScore * 100).toFixed(0) }}% Match</div>
              </div>
              
              <div class="match-content">
                <h3>{{ match.partnerName }}</h3>
                <p class="reasoning">{{ match.reasoning }}</p>
                
                <div class="tag-cloud">
                  <span class="tag glass">AI Infrastructure</span>
                  <span class="tag glass">Scalability</span>
                </div>
              </div>

              <footer class="match-actions">
                <button class="btn btn-primary w-full">Schedule Meeting</button>
                <button class="btn btn-outline w-full">View Profile</button>
              </footer>
            </div>
          </div>
        </main>

        <aside class="intent-section glass-card">
          <h3>Your AI Agent Intent</h3>
          <p class="text-secondary small">Refine what the AI should look for when matching you.</p>
          
          <div class="intent-form">
            <div class="form-group">
              <label>Match Goal</label>
              <select class="glass">
                <option>Technical Collaboration</option>
                <option>Investment/Funding</option>
                <option>Hiring/Talent</option>
                <option>Sponsorship Info</option>
              </select>
            </div>

            <div class="form-group">
              <label>Priority Interests</label>
              <div class="interest-tags">
                <span class="tag active">Agentic AI</span>
                <span class="tag active">Sustainability</span>
                <span class="tag">Web3</span>
                <span class="tag">Edge Computing</span>
              </div>
            </div>

            <button class="btn btn-primary" (click)="reMatch()">Update AI Agent</button>
          </div>

          <div class="privacy-note glass">
             <span class="icon">🔒</span>
             <span>Your PII is protected by SSI. Agents only see synthesized interest vectors.</span>
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .matchmaking-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header { margin-bottom: 40px; }

    .matchmaking-layout {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 32px;
    }

    .status-bar {
      padding: 16px 24px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 0.9rem;
      color: var(--primary);
    }

    .loader-line {
      flex: 1;
      height: 2px;
      background: var(--glass-border);
      position: relative;
      overflow: hidden;
    }

    .loader-line::after {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 30%;
      background: var(--primary);
      animation: slide 1.5s infinite ease-in-out;
    }

    @keyframes slide {
      0% { left: -30%; }
      100% { left: 100%; }
    }

    .results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 24px;
    }

    .match-card {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 24px;
      transition: all 0.3s;
    }

    .match-card:hover {
      border-color: var(--primary);
      box-shadow: 0 8px 32px rgba(99, 102, 241, 0.1);
    }

    .match-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .match-badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: var(--radius-sm);
      text-transform: uppercase;
    }

    .match-badge.sponsor { background: rgba(99, 102, 241, 0.1); color: var(--primary); }
    .match-badge.attendee { background: rgba(16, 185, 129, 0.1); color: var(--accent); }
    .match-badge.session { background: rgba(236, 72, 153, 0.1); color: var(--secondary); }

    .match-score {
      font-weight: 600;
      font-size: 0.85rem;
      color: var(--primary);
    }

    .reasoning {
      font-size: 0.95rem;
      color: var(--text-secondary);
      line-height: 1.5;
      margin: 12px 0;
    }

    .tag-cloud {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tag {
      font-size: 0.75rem;
      padding: 4px 10px;
      color: var(--text-muted);
    }

    .tag.active {
      background: var(--primary);
      color: white;
      border: none;
    }

    .match-actions {
      display: flex;
      gap: 12px;
      margin-top: auto;
    }

    .w-full { width: 100%; }

    .intent-form {
      margin-top: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group label {
      display: block;
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 8px;
      color: var(--text-secondary);
    }

    .form-group select {
      width: 100%;
      padding: 10px;
      background: var(--bg-surface);
      border: 1px solid var(--glass-border);
      color: var(--text-primary);
      border-radius: var(--radius-sm);
    }

    .interest-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .privacy-note {
      margin-top: 32px;
      padding: 16px;
      font-size: 0.8rem;
      color: var(--text-muted);
      display: flex;
      gap: 12px;
      align-items: center;
    }

    @media (max-width: 900px) {
      .matchmaking-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class MatchmakingComponent {
  private matchmakingService = inject(MatchmakingService);
  matches = this.matchmakingService.matches;
  isProcessing = this.matchmakingService.isProcessing;

  constructor() {}

  reMatch() {
    this.matchmakingService.generateMatches();
  }
}
