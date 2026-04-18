// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Fluent Project Contributors

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { IdentityService } from './core/services/identity.service';
import { logger } from './core/utils/logger';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <a class="skip-link" href="#main-content">Skip to main content</a>

    <div class="app-container">
      <nav class="glass nav-bar" aria-label="Primary">
        <div class="nav-content">
          <a routerLink="/" class="logo" aria-label="Fluent home">
            <h1 class="gradient-text">Fluent</h1>
          </a>

          <ul class="nav-links" *ngIf="user()" role="list">
            <li>
              <a routerLink="/dashboard" routerLinkActive="active"
                 [routerLinkActiveOptions]="{ exact: false }"
                 ariaCurrentWhenActive="page">Dashboard</a>
            </li>
            <li><a routerLink="/check-in" routerLinkActive="active" ariaCurrentWhenActive="page">Check-in</a></li>
            <li><a routerLink="/wayfinding" routerLinkActive="active" ariaCurrentWhenActive="page">Wayfinding</a></li>
            <li><a routerLink="/matchmaking" routerLinkActive="active" ariaCurrentWhenActive="page">Networking</a></li>
            <li *ngIf="isStaff()">
              <a routerLink="/runbook" routerLinkActive="active" ariaCurrentWhenActive="page">Staff Dashboard</a>
            </li>
          </ul>

          <div class="auth-links" *ngIf="!user()">
            <a routerLink="/login" class="btn btn-outline scale-sm">Sign In</a>
            <a routerLink="/register" class="glass-button scale-sm">Get Started</a>
          </div>

          <div class="user-profile" *ngIf="user() as u">
            <div class="user-badge glass">
              <span>{{ u.name }}</span>
              <span class="role-chip" [attr.data-role]="u.role">{{ u.role }}</span>
              <button type="button" (click)="logout()" class="logout-btn"
                      aria-label="Sign out of Fluent">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                     viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                     aria-hidden="true" focusable="false">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main id="main-content" class="main-content" tabindex="-1">
        <router-outlet></router-outlet>
      </main>

      <footer class="glass-card footer">
        <p>&copy; 2026 Fluent Project Contributors. MIT licensed.</p>
        <p class="text-muted">Built with Angular 21 Signals, Firestore, Vertex AI, and App Check.</p>
      </footer>
    </div>
  `,
  styles: [`
    .skip-link {
      position: absolute;
      left: -1000px;
      top: 0;
      padding: 12px 16px;
      background: var(--primary);
      color: white;
      border-radius: 0 0 8px 0;
      z-index: 2000;
      font-weight: 600;
    }
    .skip-link:focus { left: 0; }

    .app-container { display: flex; flex-direction: column; min-height: 100vh; }
    .nav-bar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
      padding: 0 40px; height: 70px; border-radius: 0;
      border-bottom: 1px solid var(--glass-border);
    }
    .nav-content {
      max-width: 1400px; margin: 0 auto; height: 100%;
      display: flex; align-items: center; justify-content: space-between;
    }
    .logo { text-decoration: none; }
    .logo h1 { font-size: 1.5rem; margin-bottom: 0; }
    .nav-links { display: flex; list-style: none; gap: 32px; padding: 0; margin: 0; }
    .nav-links a {
      color: var(--text-secondary); text-decoration: none;
      font-weight: 500; transition: color 0.2s; position: relative;
      padding: 4px 2px;
    }
    .nav-links a:hover, .nav-links a.active { color: var(--text-primary); }
    .nav-links a:focus-visible { outline: 2px solid var(--primary); outline-offset: 4px; border-radius: 4px; }
    .nav-links a.active::after {
      content: ''; position: absolute; bottom: -8px; left: 0; right: 0;
      height: 2px; background: var(--primary); border-radius: var(--radius-full);
    }
    .user-badge {
      padding: 6px 12px; display: flex; align-items: center; gap: 12px; font-size: 0.9rem;
    }
    .role-chip {
      background: var(--primary); color: white;
      padding: 2px 8px; border-radius: var(--radius-sm);
      font-size: 0.75rem; text-transform: uppercase; font-weight: 700;
    }
    .role-chip[data-role="staff"], .role-chip[data-role="sponsor"] { background: var(--accent); }
    .main-content {
      margin-top: 70px; flex: 1; padding: 40px;
      max-width: 1400px; width: 100%; margin-left: auto; margin-right: auto;
    }
    .main-content:focus { outline: none; }
    .footer {
      border-radius: 0; border-top: 1px solid var(--glass-border);
      text-align: center; padding: 32px; margin-top: 60px;
    }
    .text-muted { font-size: 0.8rem; margin-top: 8px; }
    .auth-links { display: flex; align-items: center; gap: 20px; }
    .scale-sm { transform: scale(0.9); transform-origin: right center; }
    .logout-btn {
      background: none; border: none; color: var(--text-secondary);
      cursor: pointer; display: flex; align-items: center;
      padding: 4px; border-radius: 50%; transition: all 0.2s;
    }
    .logout-btn:hover { background: rgba(255, 255, 255, 0.1); color: #ff6b6b; }
    .logout-btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
  `]
})
export class AppComponent {
  private identity = inject(IdentityService);
  private authService = inject(AuthService);

  readonly user = this.identity.currentAttendee;
  readonly isStaff = this.identity.isStaff;

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
    } catch (err) {
      logger.error('app.logout', err);
    }
  }
}
