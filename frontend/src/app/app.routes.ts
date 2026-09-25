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
        data: { title: 'titles.dashboard' },
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'transactions',
        data: { title: 'titles.transactions' },
        loadComponent: () =>
          import('./features/transactions/transactions-list.component').then((m) => m.TransactionsListComponent),
      },
      {
        path: 'transactions/:id',
        data: { title: 'titles.transactionDetail' },
        loadComponent: () =>
          import('./features/transactions/transaction-detail.component').then((m) => m.TransactionDetailComponent),
      },
      {
        path: 'alerts',
        data: { title: 'titles.fraud' },
        loadComponent: () => import('./features/alerts/alerts-list.component').then((m) => m.AlertsListComponent),
      },
      {
        path: 'fraud-cases',
        data: { title: 'titles.fraud' },
        loadComponent: () =>
          import('./features/fraud-cases/fraud-cases-list.component').then((m) => m.FraudCasesListComponent),
      },
      {
        path: 'fraud-cases/:id',
        data: { title: 'titles.fraudCase' },
        loadComponent: () =>
          import('./features/fraud-cases/fraud-case-detail.component').then((m) => m.FraudCaseDetailComponent),
      },
      {
        path: 'risk',
        data: { title: 'titles.risk' },
        loadComponent: () => import('./features/risk/risk-analysis.component').then((m) => m.RiskAnalysisComponent),
      },
      {
        path: 'models',
        data: { title: 'titles.models' },
        loadComponent: () => import('./features/models/models.component').then((m) => m.ModelsComponent),
      },
      {
        path: 'reports',
        data: { title: 'titles.reports' },
        loadComponent: () => import('./features/reports/reports.component').then((m) => m.ReportsComponent),
      },
      {
        path: 'settings',
        data: { title: 'titles.settings' },
        loadComponent: () => import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
      // Screens folded into the redesign's seven sections.
      { path: 'analytics', redirectTo: 'risk' },
      { path: 'organizations', redirectTo: 'settings' },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
