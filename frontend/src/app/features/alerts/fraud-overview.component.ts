import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { catchError, interval, of } from 'rxjs';

import { DEMO_ALERT_STATS } from '../../core/demo/demo-data';
import { TranslatePipe } from '../../core/i18n/i18n.pipes';
import { AnalyticsService } from '../../core/services/analytics.service';
import { formatNumber } from '../../core/ui/risk';
import { Stat } from '../../core/ui/view-models';
import { IconComponent } from '../../shared/icon/icon.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { StatTileComponent } from '../../shared/stat-tile/stat-tile.component';

/**
 * Shared top of the Fraud Detection & Alerts section: heading, stat row,
 * detection-engine status and the Alerts / Fraud cases tabs.
 */
@Component({
  selector: 'app-fraud-overview',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, PageHeaderComponent, StatTileComponent, IconComponent, TranslatePipe],
  template: `
    <app-page-header [title]="'fraud.title' | t" [subtitle]="'fraud.subtitle' | t"></app-page-header>

    <div class="grid grid--stats">
      @if (stats(); as list) {
        @for (s of list; track s.label; let i = $index) {
          <app-stat-tile [label]="s.label" [value]="s.value" [color]="s.color" [style.animation-delay.ms]="i * 50"></app-stat-tile>
        }
      } @else {
        @for (i of [0, 1, 2, 3]; track i) {
          <app-stat-tile [loading]="true"></app-stat-tile>
        }
      }
    </div>

    <section class="panel engine">
      <div class="engine__icon">
        <app-icon name="cpu" [size]="22" color="var(--color-accent-2-800)"></app-icon>
        <span class="engine__beam"></span>
      </div>
      <div class="engine__text">
        <div class="engine__row">
          <span class="engine__name">{{ 'fraud.engine' | t }}</span>
          <span class="badge badge--success badge--sm">{{ 'fraud.active' | t }}</span>
        </div>
        <div class="engine__meta">{{ 'fraud.scanning' | t: { n: lastScan() } }}</div>
      </div>
      <div class="engine__figures">
        <div>
          <div class="engine__figure">96.2%</div>
          <div class="engine__figure-label">{{ 'fraud.confidence' | t }}</div>
        </div>
        <div>
          <div class="engine__figure">184/s</div>
          <div class="engine__figure-label">{{ 'fraud.throughput' | t }}</div>
        </div>
        <div class="engine__tags">
          <span class="tag tag-accent-2">{{ 'fraud.tagAnomaly' | t }}</span>
          <span class="tag tag-accent-2">{{ 'fraud.tagMl' | t }}</span>
          <span class="tag tag-accent-2">{{ 'fraud.tagRules' | t }}</span>
        </div>
      </div>
    </section>

    <nav class="tabs" [attr.aria-label]="'fraud.views' | t">
      <a class="tabs__tab" routerLink="/alerts" routerLinkActive="is-active" ariaCurrentWhenActive="page">
        <app-icon name="alert" [size]="14"></app-icon>
        {{ 'fraud.tabAlerts' | t }}
      </a>
      <a class="tabs__tab" routerLink="/fraud-cases" routerLinkActive="is-active" ariaCurrentWhenActive="page">
        <app-icon name="gavel" [size]="14"></app-icon>
        {{ 'fraud.tabCases' | t }}
      </a>
    </nav>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        gap: 18px;
      }
      .engine {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
        align-items: center;
      }
      .engine__icon {
        width: 44px;
        height: 44px;
        background: var(--color-accent-2-100);
        display: flex;
        align-items: center;
        justify-content: center;
        flex: none;
        position: relative;
        overflow: hidden;
      }
      .engine__beam {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        width: 25%;
        background: linear-gradient(90deg, transparent, rgba(45, 212, 191, 0.3), transparent);
        animation: fs-scan 2.4s linear infinite;
      }
      .engine__text {
        flex: 1;
        min-width: 200px;
      }
      .engine__row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .engine__name {
        font-size: 14px;
        font-weight: 700;
      }
      .engine__meta {
        font-size: 12px;
        color: var(--color-neutral-700);
        margin-top: 2px;
      }
      .engine__figures {
        display: flex;
        gap: 18px;
        flex-wrap: wrap;
        align-items: center;
      }
      .engine__figure {
        font-size: 18px;
        font-weight: 800;
        font-family: var(--font-heading);
        line-height: 1.3;
      }
      .engine__figure-label {
        font-size: 10.5px;
        color: var(--color-neutral-700);
      }
      .engine__tags {
        display: flex;
        gap: 6px;
        align-items: center;
        flex-wrap: wrap;
      }
    `,
  ],
})
export class FraudOverviewComponent implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly stats = signal<Stat[] | null>(null);
  readonly lastScan = signal(2);

  ngOnInit(): void {
    // The engine scans continuously; the counter cycles like a live heartbeat.
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.lastScan.update((s) => (s >= 3 ? 0 : s + 1)));

    this.analyticsService
      .get()
      .pipe(catchError(() => of(null)))
      .subscribe((a) => {
        if (!a || a.transactionsAnalyzed === 0) {
          this.stats.set(DEMO_ALERT_STATS);
          return;
        }
        this.stats.set([
          { label: 'fraud.fraudAlerts', value: formatNumber(a.fraudAlerts), color: 'var(--color-accent)' },
          { label: 'fraud.critical', value: formatNumber(a.alertsBySeverity.CRITICAL ?? 0), color: 'var(--color-accent)' },
          { label: 'fraud.avgAnalysis', value: `${Math.round(a.averageAnalysisTimeMs)} ms` },
          {
            label: 'fraud.casesResolved',
            value: formatNumber(a.fraudCasesByStatus.RESOLVED ?? 0),
            color: 'var(--color-accent-2-800)',
          },
        ]);
      });
  }
}
