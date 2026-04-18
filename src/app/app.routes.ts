import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'register', 
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) 
  },
  { 
    path: 'forgot-password', 
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) 
  },
  { 
    path: 'dashboard', 
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) 
  },
  { 
    path: 'check-in', 
    canActivate: [authGuard],
    loadComponent: () => import('./features/check-in/check-in.component').then(m => m.CheckInComponent) 
  },
  { 
    path: 'wayfinding', 
    canActivate: [authGuard],
    loadComponent: () => import('./features/wayfinding/wayfinding.component').then(m => m.WayfindingComponent) 
  },
  { 
    path: 'matchmaking', 
    canActivate: [authGuard],
    loadComponent: () => import('./features/matchmaking/matchmaking.component').then(m => m.MatchmakingComponent) 
  },
  { 
    path: 'runbook', 
    canActivate: [authGuard],
    loadComponent: () => import('./features/runbook/runbook.component').then(m => m.RunbookComponent) 
  }
];
