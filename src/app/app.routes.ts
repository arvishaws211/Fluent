import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) 
  },
  { 
    path: 'check-in', 
    loadComponent: () => import('./features/check-in/check-in.component').then(m => m.CheckInComponent) 
  },
  { 
    path: 'wayfinding', 
    loadComponent: () => import('./features/wayfinding/wayfinding.component').then(m => m.WayfindingComponent) 
  },
  { 
    path: 'matchmaking', 
    loadComponent: () => import('./features/matchmaking/matchmaking.component').then(m => m.MatchmakingComponent) 
  },
  { 
    path: 'runbook', 
    loadComponent: () => import('./features/runbook/runbook.component').then(m => m.RunbookComponent) 
  }
];
