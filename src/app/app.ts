import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IdentityService } from './core/services/identity.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="app-container">
      <nav class="glass nav-bar" role="navigation" aria-label="Main Navigation">
        <div class="nav-content">
          <div class="logo">
            <h1 class="gradient-text">Fluent</h1>
          </div>
          
          <ul class="nav-links">
            <li><a routerLink="/dashboard" routerLinkActive="active" aria-current="page">Dashboard</a></li>
            <li><a routerLink="/check-in" routerLinkActive="active">Check-in</a></li>
            <li><a routerLink="/wayfinding" routerLinkActive="active">Wayfinding</a></li>
            <li><a routerLink="/matchmaking" routerLinkActive="active">Networking</a></li>
            <li *ngIf="isStaff()"><a routerLink="/runbook" routerLinkActive="active">Staff Dashboard</a></li>
          </ul>

          <div class="user-profile" *ngIf="user()">
            <div class="user-badge glass">
              <span>{{ user()?.name }}</span>
              <span class="role-chip">{{ user()?.role }}</span>
            </div>
          </div>
        </div>
      </nav>

      <main class="main-content" role="main">
        <router-outlet></router-outlet>
      </main>

      <footer class="glass-card footer" role="contentinfo">
        <p>&copy; 2026 Fluent Event Management. All rights reserved.</p>
        <p class="text-muted">Built with Angular 21 & Vertex AI</p>
      </footer>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .nav-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      padding: 0 40px;
      height: 70px;
      border-radius: 0;
      border-bottom: 1px solid var(--glass-border);
    }

    .nav-content {
      max-width: 1400px;
      margin: 0 auto;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .logo h1 {
      font-size: 1.5rem;
      margin-bottom: 0;
    }

    .nav-links {
      display: flex;
      list-style: none;
      gap: 32px;
    }

    .nav-links a {
      color: var(--text-secondary);
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
      position: relative;
    }

    .nav-links a:hover, .nav-links a.active {
      color: var(--text-primary);
    }

    .nav-links a.active::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--primary);
      border-radius: var(--radius-full);
    }

    .user-badge {
      padding: 6px 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.9rem;
    }

    .role-chip {
      background: var(--primary);
      color: white;
      padding: 2px 8px;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 700;
    }

    .main-content {
      margin-top: 70px;
      flex: 1;
      padding: 40px;
      max-width: 1400px;
      width: 100%;
      margin-left: auto;
      margin-right: auto;
    }

    .footer {
      border-radius: 0;
      border-top: 1px solid var(--glass-border);
      text-align: center;
      padding: 32px;
      margin-top: 60px;
    }

    .text-muted {
      font-size: 0.8rem;
      margin-top: 8px;
    }
  `]
})
export class AppComponent {
  private identityService = inject(IdentityService);
  user = this.identityService.currentAttendee;
  
  constructor() {}

  isStaff() {
    return this.user()?.role === 'staff' || this.user()?.role === 'sponsor';
  }
}
