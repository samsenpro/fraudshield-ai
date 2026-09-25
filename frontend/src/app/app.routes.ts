import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./features/transactions/transactions-list.component').then((m) => m.TransactionsListComponent),
      },
      {
        path: 'transactions/:id',
        loadComponent: () =>
          import('./features/transactions/transaction-detail.component').then((m) => m.TransactionDetailComponent),
      },
      {
        path: 'alerts',
        loadComponent: () => import('./features/alerts/alerts-list.component').then((m) => m.AlertsListComponent),
      },
      {
        path: 'fraud-cases',
        loadComponent: () =>
          import('./features/fraud-cases/fraud-cases-list.component').then((m) => m.FraudCasesListComponent),
      },
      {
        path: 'fraud-cases/:id',
        loadComponent: () =>
          import('./features/fraud-cases/fraud-case-detail.component').then((m) => m.FraudCaseDetailComponent),
      },
      {
        path: 'analytics',
        loadComponent: () => import('./features/analytics/analytics.component').then((m) => m.AnalyticsComponent),
      },
      {
        path: 'organizations',
        loadComponent: () =>
          import('./features/organizations/organizations.component').then((m) => m.OrganizationsComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
