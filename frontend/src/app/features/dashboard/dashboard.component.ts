import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';

import {
  DEMO_ALERTS,
  DEMO_AVG_RISK,
  DEMO_FRAUD_CATEGORIES,
  DEMO_FRAUD_DAILY,
  DEMO_HEATMAP,
  DEMO_KPIS,
  DEMO_MODEL_STATUS_MINI,
  DEMO_RISK_DISTRIBUTION,
  DEMO_TRANSACTIONS,
  DEMO_VOLUME,
} from '../../core/demo/demo-data';
import { I18N_PIPES } from '../../core/i18n/i18n.pipes';
import { I18nService, activeLocale } from '../../core/i18n/i18n.service';
import { AnalyticsResponse, DailyCount } from '../../core/models/analytics.model';
import { RiskLevel } from '../../core/models/risk.model';
import { AlertService } from '../../core/services/alert.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { TransactionFeedService } from '../../core/services/transaction-feed.service';
import { toAlertItem } from '../../core/ui/mappers';
import { RISK_COLOR, SEVERITY_COLOR, downloadFile, formatNumber, riskColorOf, toCsv, toPercent } from '../../core/ui/risk';
import { AlertItem, DonutSlice, Kpi, SeriesPoint, TransactionRow } from '../../core/ui/view-models';
import { BarListComponent } from '../../shared/bar-list/bar-list.component';
import { BarChartComponent } from '../../shared/charts/bar-chart.component';
import { DonutChartComponent } from '../../shared/charts/donut-chart.component';
import { HeatmapComponent } from '../../shared/charts/heatmap.component';
import { LineChartComponent } from '../../shared/charts/line-chart.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { KpiCardComponent } from '../../shared/kpi-card/kpi-card.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { SegOption, SegmentedComponent } from '../../shared/segmented/segmented.component';
import { EmptyStateComponent, SkeletonRowsComponent } from '../../shared/states/states.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { ToastService } from '../../shared/toast/toast.service';

type Range = '24H' | '7D' | '30D' | '14D';

interface DashboardData {
  analytics: AnalyticsResponse | null;
  alerts: AlertItem[] | null;
  transactions: TransactionRow[] | null;
}

const DEMO_RANGES: SegOption[] = [
  { value: '24H', label: '24H' },
  { value: '7D', label: '7D' },
  { value: '30D', label: '30D' },
];
const LIVE_RANGES: SegOption[] = [
  { value: '7D', label: '7D' },
  { value: '14D', label: '14D' },
];

/** Hourly detections for the 24H view: night-time card testing + midday peak. */
const DEMO_HOURLY = [2, 3, 5, 6, 4, 3, 2, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 3, 4, 3, 2, 2, 1, 1];
/** Sixteen earlier days that extend the 14-day spec series to 30 days. */
const DEMO_EARLIER = [37, 41, 45, 40, 52, 48, 44, 50, 57, 53, 46, 42, 49, 54, 47, 43];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    PageHeaderComponent,
    SegmentedComponent,
    IconComponent,
    KpiCardComponent,
    LineChartComponent,
    DonutChartComponent,
    BarChartComponent,
    BarListComponent,
    HeatmapComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    SkeletonRowsComponent,
    ...I18N_PIPES,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly alertService = inject(AlertService);
  private readonly feed = inject(TransactionFeedService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18nService);

  readonly severityColor = SEVERITY_COLOR;
  readonly categories = DEMO_FRAUD_CATEGORIES;
  readonly heatmap = DEMO_HEATMAP;
  readonly modelStatus = DEMO_MODEL_STATUS_MINI;
  readonly riskColorOf = riskColorOf;

  readonly loading = signal(true);
  readonly data = signal<DashboardData | null>(null);
  readonly range = signal<Range>('24H');

  /** Sample mode: the API is unreachable, or this organization has no scored transactions yet. */
  readonly sample = computed(() => {
    const analytics = this.data()?.analytics;
    return !analytics || analytics.transactionsAnalyzed === 0;
  });
  readonly apiDown = computed(() => this.data() !== null && this.data()!.analytics === null);
  readonly ranges = computed(() => (this.sample() ? DEMO_RANGES : LIVE_RANGES));

  readonly kpis = computed<Kpi[] | null>(() => {
    if (this.loading()) return null;
    const a = this.data()?.analytics;
    if (this.sample() || !a) return DEMO_KPIS;
    this.i18n.lang();
    return this.liveKpis(a);
  });

  readonly trend = computed<{ title: string; meta: string; unit: string; points: SeriesPoint[] }>(() => {
    const range = this.range();
    const t = (key: string, params?: Record<string, number>) => this.i18n.t(key, params);
    if (this.sample()) {
      const title = t('dashboard.fraudOverTime');
      const unit = t('dashboard.detections');
      if (range === '24H') {
        return {
          title,
          meta: t('common.last24h'),
          unit,
          points: DEMO_HOURLY.map((value, h) => ({ label: `${String(h).padStart(2, '0')}:00`, value })),
        };
      }
      const daily = DEMO_FRAUD_DAILY.map((p) => ({ label: this.dayLabel(p.label), value: p.value }));
      if (range === '7D') {
        return { title, meta: t('common.lastDays', { n: 7 }), unit, points: daily.slice(-7) };
      }
      const earlier = DEMO_EARLIER.map((value, i) => ({
        label: this.dayLabel(new Date(Date.UTC(2026, 7, 26 + i)).toISOString().slice(0, 10)),
        value,
      }));
      return { title, meta: t('common.lastDays', { n: 30 }), unit, points: [...earlier, ...daily] };
    }
    const series = this.dailySeries(this.data()?.analytics?.transactionsOverTime ?? []);
    const points = range === '7D' ? series.slice(-7) : series;
    return {
      title: t('dashboard.scoredOverTime'),
      meta: t('common.lastDays', { n: range === '7D' ? 7 : 14 }),
      unit: t('dashboard.transactionsUnit'),
      points,
    };
  });

  readonly riskSlices = computed<DonutSlice[]>(() => {
    const a = this.data()?.analytics;
    if (this.sample() || !a) return DEMO_RISK_DISTRIBUTION;
    const levels: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    // English labels; the donut translates them as data literals.
    const labels: Record<RiskLevel, string> = { LOW: 'Low risk', MEDIUM: 'Medium risk', HIGH: 'High risk', CRITICAL: 'Critical' };
    const total = levels.reduce((sum, l) => sum + (a.riskDistribution[l] ?? 0), 0);
    return levels.map((l) => ({
      label: labels[l],
      pct: total ? Math.round(((a.riskDistribution[l] ?? 0) / total) * 100) : 0,
      color: RISK_COLOR[l],
    }));
  });

  readonly avgRisk = computed(() => {
    const a = this.data()?.analytics;
    return this.sample() || !a ? DEMO_AVG_RISK : Math.round(toPercent(a.averageRiskScore) ?? 0);
  });

  readonly volume = computed<{ points: SeriesPoint[]; suffix: string }>(() => {
    if (this.sample()) return { points: DEMO_VOLUME, suffix: 'K' };
    const series = (this.data()?.analytics?.transactionsOverTime ?? []).slice(-7);
    this.i18n.lang();
    return {
      points: series.map((d) => ({
        label: new Date(d.date + 'T00:00:00').toLocaleDateString(activeLocale(), { weekday: 'short' }),
        value: d.count,
      })),
      suffix: '',
    };
  });

  readonly alerts = computed<AlertItem[]>(() => {
    if (this.sample()) return DEMO_ALERTS.slice(0, 3);
    return this.data()?.alerts?.slice(0, 3) ?? [];
  });

  readonly recent = computed<TransactionRow[]>(() => {
    if (this.sample()) return DEMO_TRANSACTIONS.slice(0, 6);
    return this.data()?.transactions ?? [];
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    forkJoin({
      analytics: this.analyticsService.get().pipe(catchError(() => of(null))),
      alerts: this.alertService.list(0, 3).pipe(
        map((page) => page.content.map(toAlertItem)),
        catchError(() => of(null)),
      ),
      transactions: this.feed.page(0, 6).pipe(
        map((page) => page.rows),
        catchError(() => of(null)),
      ),
    }).subscribe((data) => {
      this.data.set(data);
      if (!this.ranges().some((r) => r.value === this.range())) {
        this.range.set(this.sample() ? '24H' : '14D');
      }
      this.loading.set(false);
    });
  }

  setRange(value: string): void {
    this.range.set(value as Range);
  }

  openAlert(alert: AlertItem): void {
    if (alert.transactionId) {
      this.router.navigate(['/transactions', alert.transactionId]);
    }
  }

  openTransaction(row: TransactionRow): void {
    if (row.link) this.router.navigate(row.link);
  }

  export(): void {
    const kpis = this.kpis() ?? [];
    const t = (key: string) => this.i18n.t(key);
    const rows: (string | number | null)[][] = [
      [t('dashboard.exportTitle'), new Date().toISOString()],
      [],
      [t('dashboard.metric'), t('dashboard.value'), t('dashboard.change')],
      ...kpis.map((k) => [t(k.label), k.value, this.i18n.lit(k.delta)]),
      [],
      [t('dashboard.recent')],
      [
        t('dashboard.colId'),
        t(this.sample() ? 'dashboard.colUser' : 'dashboard.colMerchant'),
        t('dashboard.colAmount'),
        t('dashboard.colRisk'),
        t('dashboard.colStatus'),
      ],
      ...this.recent().map((r) => [r.ref, r.party, `${r.amount} ${r.currency}`, r.risk, this.i18n.lit(r.status)]),
    ];
    downloadFile(`fraudshield-dashboard-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
    this.toast.success(this.i18n.t('common.exportReady'), this.i18n.t('dashboard.exportText'));
  }

  private liveKpis(a: AnalyticsResponse): Kpi[] {
    const teal = 'var(--color-accent-2-800)';
    const series = a.transactionsOverTime;
    const last7 = series.slice(-7).reduce((s, d) => s + d.count, 0);
    const prev7 = series.slice(-14, -7).reduce((s, d) => s + d.count, 0);
    const change = prev7 > 0 ? ((last7 - prev7) / prev7) * 100 : null;
    const pct = (n: number) => (a.transactionsAnalyzed ? `${((n / a.transactionsAnalyzed) * 100).toFixed(1)}%` : '0%');
    return [
      {
        label: 'kpi.totalTransactions',
        value: formatNumber(a.transactionsAnalyzed),
        delta: change === null ? '14D' : `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
        deltaColor: teal,
        icon: 'bars',
        tone: 'teal',
      },
      {
        label: 'kpi.avgAnalysis',
        value: `${Math.round(a.averageAnalysisTimeMs)} ms`,
        delta: 'LIVE',
        deltaColor: teal,
        icon: 'activity',
        tone: 'teal',
      },
      {
        label: 'kpi.fraudAlerts',
        value: formatNumber(a.fraudAlerts),
        delta:
          a.fraudCases === 1
            ? this.i18n.t('dashboard.oneCase')
            : this.i18n.t('dashboard.cases', { n: formatNumber(a.fraudCases) }),
        deltaColor: 'var(--status-danger-fg)',
        icon: 'alert',
        tone: 'red',
      },
      { label: 'kpi.blocked', value: formatNumber(a.blocked), delta: pct(a.blocked), deltaColor: teal, icon: 'lock', tone: 'teal' },
      {
        label: 'kpi.avgRisk',
        value: String(Math.round(toPercent(a.averageRiskScore) ?? 0)),
        delta: '/ 100',
        deltaColor: teal,
        icon: 'trend',
        tone: 'teal',
      },
      {
        label: 'kpi.underReview',
        value: formatNumber(a.underReview),
        delta: pct(a.underReview),
        deltaColor: 'var(--status-warning-fg)',
        icon: 'shield-check',
        tone: 'teal',
      },
    ];
  }

  private dailySeries(data: DailyCount[]): SeriesPoint[] {
    return data.map((d) => ({ label: this.dayLabel(d.date), value: d.count }));
  }

  /** "Sep 24" / "24 sept" for an ISO date, in the active language. */
  private dayLabel(isoDate: string): string {
    this.i18n.lang();
    return new Date(isoDate + 'T00:00:00').toLocaleDateString(activeLocale(), { month: 'short', day: 'numeric' });
  }
}
