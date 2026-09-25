import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: 'dashboard', icon: 'dashboard' },
  { label: 'Transactions', path: 'transactions', icon: 'receipt_long' },
  { label: 'Alerts', path: 'alerts', icon: 'warning' },
  { label: 'Fraud Cases', path: 'fraud-cases', icon: 'gavel' },
  { label: 'Analytics', path: 'analytics', icon: 'insights' },
  { label: 'Organizations', path: 'organizations', icon: 'business' },
  { label: 'Settings', path: 'settings', icon: 'settings' },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  readonly navItems = NAV_ITEMS;

  constructor(
    readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
