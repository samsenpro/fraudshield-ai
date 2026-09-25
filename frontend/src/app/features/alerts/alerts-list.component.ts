import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { DEMO_ALERTS } from '../../core/demo/demo-data';
import { I18N_PIPES } from '../../core/i18n/i18n.pipes';
import { I18nService } from '../../core/i18n/i18n.service';
import { RiskLevel } from '../../core/models/risk.model';
import { AlertService } from '../../core/services/alert.service';
import { FraudCaseService } from '../../core/services/fraud-case.service';
import { toAlertItem } from '../../core/ui/mappers';
import { SEVERITY_COLOR } from '../../core/ui/risk';
import { AlertItem } from '../../core/ui/view-models';
import { IconComponent } from '../../shared/icon/icon.component';
import { PageChange, PaginatorComponent } from '../../shared/paginator/paginator.component';
import { SegOption, SegmentedComponent } from '../../shared/segmented/segmented.component';
import { EmptyStateComponent } from '../../shared/states/states.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { ToastService } from '../../shared/toast/toast.service';
import { FraudOverviewComponent } from './fraud-overview.component';

type SeverityFilter = 'ALL' | RiskLevel;

const SEVERITY_FILTERS: SeverityFilter[] = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'];
const FILTER_KEYS: Record<string, string> = {
  ALL: 'common.all',
  CRITICAL: 'common.critical',
  HIGH: 'common.high',
  MEDIUM: 'common.medium',
};

@Component({
  selector: 'app-alerts-list',
  standalone: true,
  imports: [
    FraudOverviewComponent,
    SegmentedComponent,
    IconComponent,
    StatusBadgeComponent,
    PaginatorComponent,
    EmptyStateComponent,
    ...I18N_PIPES,
  ],
  templateUrl: './alerts-list.component.html',
  styleUrl: './alerts-list.component.scss',
})
export class AlertsListComponent implements OnInit {
  private readonly alertService = inject(AlertService);
  private readonly fraudCaseService = inject(FraudCaseService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18nService);

  readonly severityColor = SEVERITY_COLOR;
  readonly severityFilters = computed<SegOption[]>(() =>
    SEVERITY_FILTERS.map((value) => ({ value, label: this.i18n.t(FILTER_KEYS[value]) })),
  );

  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly alerts = signal<AlertItem[]>([]);
  readonly totalElements = signal(0);
  readonly pageSize = signal(10);
  readonly pageIndex = signal(0);
  readonly openingCaseFor = signal<string | null>(null);
  readonly severity = signal<SeverityFilter>('ALL');

  readonly sample = computed(() => !this.loading() && (this.failed() || this.totalElements() === 0));

  readonly visible = computed(() => {
    const list = this.sample() ? DEMO_ALERTS : this.alerts();
    const filter = this.severity();
    return filter === 'ALL' ? list : list.filter((a) => a.severity === filter);
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.alertService.list(this.pageIndex(), this.pageSize()).subscribe({
      next: (page) => {
        this.alerts.set(page.content.map(toAlertItem));
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  onPage(event: PageChange): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  noneTitle(): string {
    const level = this.severity();
    return level === 'ALL'
      ? this.i18n.t('alerts.none')
      : this.i18n.t('alerts.noneLevel', { level: this.i18n.t(FILTER_KEYS[level]).toLowerCase() });
  }

  setSeverity(value: string): void {
    this.severity.set(value as SeverityFilter);
  }

  review(alert: AlertItem): void {
    if (alert.transactionId) {
      this.router.navigate(['/transactions', alert.transactionId]);
    }
  }

  openCase(alert: AlertItem): void {
    this.openingCaseFor.set(alert.id);
    this.fraudCaseService.createFromAlert(alert.id).subscribe({
      next: (fraudCase) => {
        this.openingCaseFor.set(null);
        this.toast.success(this.i18n.t('alerts.caseOpened'), this.i18n.t('alerts.caseOpenedText', { ref: alert.txRef }));
        this.router.navigate(['/fraud-cases', fraudCase.id]);
      },
      error: (err) => {
        this.openingCaseFor.set(null);
        this.toast.error(this.i18n.t('alerts.caseError'), err?.error?.message ?? this.i18n.t('alerts.caseErrorText'));
      },
    });
  }
}
