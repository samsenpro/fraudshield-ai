import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';

import { DEMO_AVG_RISK, DEMO_REGION_RISK, DEMO_RISK_FACTORS } from '../../core/demo/demo-data';
import { I18N_PIPES } from '../../core/i18n/i18n.pipes';
import { I18nService, activeLocale } from '../../core/i18n/i18n.service';
import { AnalyticsResponse } from '../../core/models/analytics.model';
import { RiskLevel } from '../../core/models/risk.model';
import { AnalyticsService } from '../../core/services/analytics.service';
import { RISK_COLOR, formatNumber, toPercent } from '../../core/ui/risk';
import { BarDatum, SeriesPoint } from '../../core/ui/view-models';
import { BarListComponent } from '../../shared/bar-list/bar-list.component';
import { BarChartComponent } from '../../shared/charts/bar-chart.component';
import { GaugeComponent } from '../../shared/charts/gauge.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/states/states.component';

const LEVELS: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const CASE_COLORS: Record<string, string> = {
  OPEN: 'var(--risk-high)',
  IN_REVIEW: 'var(--risk-medium)',
  RESOLVED: 'var(--risk-low)',
};

@Component({
  selector: 'app-risk-analysis',
  standalone: true,
  imports: [PageHeaderComponent, GaugeComponent, BarListComponent, BarChartComponent, EmptyStateComponent, ...I18N_PIPES],
  templateUrl: './risk-analysis.component.html',
  styleUrl: './risk-analysis.component.scss',
})
export class RiskAnalysisComponent implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly i18n = inject(I18nService);

  readonly riskFactors = DEMO_RISK_FACTORS;
  readonly regionRisk = DEMO_REGION_RISK;

  readonly loading = signal(true);
  readonly analytics = signal<AnalyticsResponse | null>(null);

  readonly live = computed(() => (this.analytics()?.transactionsAnalyzed ?? 0) > 0);

  readonly avgScore = computed(() => {
    const a = this.analytics();
    return this.live() && a ? toPercent(a.averageRiskScore) ?? 0 : DEMO_AVG_RISK;
  });

  readonly riskDistribution = computed<BarDatum[]>(() => this.countsToBars(this.analytics()?.riskDistribution, LEVELS, RISK_COLOR));
  readonly alertsBySeverity = computed<BarDatum[]>(() => this.countsToBars(this.analytics()?.alertsBySeverity, LEVELS, RISK_COLOR));
  readonly casesByStatus = computed<BarDatum[]>(() =>
    this.countsToBars(this.analytics()?.fraudCasesByStatus, ['OPEN', 'IN_REVIEW', 'RESOLVED'], CASE_COLORS),
  );

  readonly overTime = computed<SeriesPoint[]>(() => {
    this.i18n.lang();
    return (this.analytics()?.transactionsOverTime ?? []).map((d) => ({
      label: new Date(d.date + 'T00:00:00').toLocaleDateString(activeLocale(), { month: 'short', day: 'numeric' }),
      value: d.count,
    }));
  });

  ngOnInit(): void {
    this.analyticsService
      .get()
      .pipe(catchError(() => of(null)))
      .subscribe((a) => {
        this.analytics.set(a);
        this.loading.set(false);
      });
  }

  private countsToBars(
    counts: Partial<Record<string, number>> | undefined,
    keys: string[],
    colors: Record<string, string>,
  ): BarDatum[] {
    this.i18n.lang();
    if (!counts) return [];
    const total = keys.reduce((sum, k) => sum + (counts[k] ?? 0), 0);
    if (total === 0) return [];
    return keys.map((k) => {
      const value = counts[k] ?? 0;
      return {
        // English label; the bar list translates it as a data literal.
        label: k.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
        value: Math.round((value / total) * 100),
        display: `${formatNumber(value)} · ${Math.round((value / total) * 100)}%`,
        color: colors[k],
      };
    });
  }
}
