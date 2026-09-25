import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { DEMO_API_KEYS, DEMO_TEAM } from '../../core/demo/demo-data';
import { I18N_PIPES } from '../../core/i18n/i18n.pipes';
import { I18nService } from '../../core/i18n/i18n.service';
import { DialogComponent } from '../../shared/dialog/dialog.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { LanguageSwitchComponent } from '../../shared/language-switch/language-switch.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { ToastService } from '../../shared/toast/toast.service';

type SettingsTab = 'org' | 'team' | 'security' | 'api';

interface ApiKey {
  name: string;
  masked: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [PageHeaderComponent, IconComponent, DialogComponent, StatusBadgeComponent, LanguageSwitchComponent, ...I18N_PIPES],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18nService);

  readonly tabs: { key: SettingsTab; label: string }[] = [
    { key: 'org', label: 'settings.tabOrg' },
    { key: 'team', label: 'settings.tabTeam' },
    { key: 'security', label: 'settings.tabSecurity' },
    { key: 'api', label: 'settings.tabApi' },
  ];
  readonly team = DEMO_TEAM;
  readonly timeouts = [15, 30, 60, 120];

  readonly tab = signal<SettingsTab>('org');
  readonly twoFactor = signal(true);
  readonly ipAllowlist = signal(false);
  readonly sessionTimeout = signal(30);
  readonly apiKeys = signal<ApiKey[]>(DEMO_API_KEYS);
  readonly regenerating = signal<ApiKey | null>(null);

  selectTab(key: SettingsTab): void {
    this.tab.set(key);
  }

  onTabKeydown(event: KeyboardEvent, index: number): void {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + this.tabs.length) % this.tabs.length;
    this.tab.set(this.tabs[next].key);
    const buttons = (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLElement>('[role="tab"]');
    buttons?.[next]?.focus();
  }

  toggleTwoFactor(): void {
    this.twoFactor.update((v) => !v);
    this.toast.info(
      this.i18n.t(this.twoFactor() ? 'settings.twoFactorOn' : 'settings.twoFactorOff'),
      this.i18n.t('settings.appliesAnalysts'),
    );
  }

  toggleIpAllowlist(): void {
    this.ipAllowlist.update((v) => !v);
    this.toast.info(this.i18n.t(this.ipAllowlist() ? 'settings.ipOn' : 'settings.ipOff'));
  }

  setTimeoutMinutes(event: Event): void {
    this.sessionTimeout.set(+(event.target as HTMLSelectElement).value);
    this.toast.info(this.i18n.t('settings.timeoutUpdated'), this.i18n.t('settings.timeoutUpdatedText', { n: this.sessionTimeout() }));
  }

  confirmRegenerate(key: ApiKey): void {
    this.regenerating.set(key);
  }

  regenerate(): void {
    const key = this.regenerating();
    if (!key) return;
    const prefix = key.masked.slice(0, 8);
    const suffix = Math.floor(1000 + Math.random() * 9000);
    this.apiKeys.update((keys) => keys.map((k) => (k === key ? { ...k, masked: `${prefix}••••••••••••${suffix}` } : k)));
    this.regenerating.set(null);
    this.toast.success(this.i18n.t('settings.regenerated', { name: this.i18n.lit(key.name) }), this.i18n.t('settings.regeneratedText'));
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
