import { Component, DestroyRef, ElementRef, HostListener, OnInit, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { catchError, filter, of } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { DEMO_ALERTS } from '../../core/demo/demo-data';
import { I18N_PIPES } from '../../core/i18n/i18n.pipes';
import { I18nService } from '../../core/i18n/i18n.service';
import { AlertService } from '../../core/services/alert.service';
import { toAlertItem } from '../../core/ui/mappers';
import { SEVERITY_COLOR } from '../../core/ui/risk';
import { AlertItem } from '../../core/ui/view-models';
import { IconComponent } from '../../shared/icon/icon.component';
import { LanguageSwitchComponent } from '../../shared/language-switch/language-switch.component';

interface NavItem {
  /** i18n key. */
  label: string;
  path: string;
  icon: string;
  /** Extra URL prefixes that should light this item up. */
  also?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'nav.dashboard', path: '/dashboard', icon: 'dashboard' },
  { label: 'nav.transactions', path: '/transactions', icon: 'transactions' },
  { label: 'nav.fraud', path: '/alerts', icon: 'fraud', also: ['/fraud-cases'] },
  { label: 'nav.risk', path: '/risk', icon: 'risk' },
  { label: 'nav.models', path: '/models', icon: 'cpu' },
  { label: 'nav.reports', path: '/reports', icon: 'reports' },
  { label: 'nav.settings', path: '/settings', icon: 'settings' },
];

const MOBILE_BREAKPOINT = 900;
const TABLET_BREAKPOINT = 1200;
const COLLAPSED_KEY = 'fraudshield.sidebar.collapsed';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, IconComponent, LanguageSwitchComponent, ...I18N_PIPES],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly alertService = inject(AlertService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  readonly navItems = NAV_ITEMS;
  readonly severityColor = SEVERITY_COLOR;

  readonly isMobile = signal(window.innerWidth <= MOBILE_BREAKPOINT);
  readonly collapsedPref = signal<boolean>(this.readCollapsedPreference());
  readonly mobileOpen = signal(false);
  readonly notificationsOpen = signal(false);
  readonly userMenuOpen = signal(false);
  /** i18n key of the current screen title. */
  private readonly titleKey = signal('titles.dashboard');
  readonly pageTitle = computed(() => this.i18n.t(this.titleKey()));
  readonly currentUrl = signal(this.router.url);

  readonly notifications = signal<AlertItem[] | null>(null);
  readonly hasUnread = signal(true);

  /** The desktop rail collapses; the mobile drawer always shows labels. */
  readonly collapsed = computed(() => !this.isMobile() && this.collapsedPref());
  readonly showLabels = computed(() => !this.collapsed());

  readonly initials = computed(() => {
    const email = this.auth.currentUser()?.email ?? '';
    const local = email.split('@')[0] ?? '';
    const parts = local.split(/[._-]+/).filter(Boolean);
    const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : local.slice(0, 2);
    return (letters || 'FS').toUpperCase();
  });

  constructor() {
    // The browser tab follows the screen and the language.
    effect(() => {
      document.title = `${this.pageTitle()} · FraudShield AI`;
    });
  }

  ngOnInit(): void {
    this.updateTitle();
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.currentUrl.set(this.router.url);
        this.updateTitle();
        this.mobileOpen.set(false);
        this.closePopovers();
      });
  }

  isActive(item: NavItem): boolean {
    const url = this.currentUrl().split('?')[0];
    return [item.path, ...(item.also ?? [])].some((prefix) => url === prefix || url.startsWith(prefix + '/'));
  }

  toggleCollapse(): void {
    const next = !this.collapsedPref();
    this.collapsedPref.set(next);
    try {
      localStorage.setItem(COLLAPSED_KEY, String(next));
    } catch {
      /* storage unavailable: keep the in-memory state */
    }
  }

  openMobileNav(): void {
    this.mobileOpen.set(true);
  }

  closeMobileNav(): void {
    this.mobileOpen.set(false);
  }

  toggleNotifications(): void {
    const open = !this.notificationsOpen();
    this.closePopovers();
    this.notificationsOpen.set(open);
    if (open) {
      this.hasUnread.set(false);
      this.loadNotifications();
    }
  }

  toggleUserMenu(): void {
    const open = !this.userMenuOpen();
    this.closePopovers();
    this.userMenuOpen.set(open);
  }

  openAlert(item: AlertItem): void {
    this.closePopovers();
    if (item.transactionId && !item.id.startsWith('demo-')) {
      this.router.navigate(['/transactions', item.transactionId]);
    } else {
      this.router.navigate(['/alerts']);
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  @HostListener('window:resize')
  onResize(): void {
    const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
    if (mobile !== this.isMobile()) {
      this.isMobile.set(mobile);
      this.mobileOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.mobileOpen.set(false);
    this.closePopovers();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target || !this.host.nativeElement.contains(target)) return;
    if (!target.closest('[data-popover-root]')) {
      this.closePopovers();
    }
  }

  private closePopovers(): void {
    this.notificationsOpen.set(false);
    this.userMenuOpen.set(false);
  }

  private loadNotifications(): void {
    this.alertService
      .list(0, 5)
      .pipe(catchError(() => of(null)))
      .subscribe((page) => {
        const items = page?.content.map(toAlertItem) ?? [];
        this.notifications.set(items.length ? items : DEMO_ALERTS.slice(0, 4));
      });
  }

  private updateTitle(): void {
    let snapshot = this.route.snapshot;
    let title: string | undefined;
    while (snapshot) {
      title = (snapshot.data['title'] as string | undefined) ?? title;
      snapshot = snapshot.firstChild!;
    }
    this.titleKey.set(title ?? 'titles.dashboard');
  }

  private readCollapsedPreference(): boolean {
    try {
      const stored = localStorage.getItem(COLLAPSED_KEY);
      if (stored !== null) return stored === 'true';
    } catch {
      /* fall through to the width-based default */
    }
    return window.innerWidth <= TABLET_BREAKPOINT;
  }
}
