import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, interval } from 'rxjs';

import { DEMO_TRANSACTIONS, demoRiskFor } from '../../core/demo/demo-data';
import { I18N_PIPES } from '../../core/i18n/i18n.pipes';
import { RiskAssessment } from '../../core/models/risk.model';
import { Transaction } from '../../core/models/transaction.model';
import { TransactionService } from '../../core/services/transaction.service';
import { SEVERITY_COLOR, shortRef, toPercent } from '../../core/ui/risk';
import { BarDatum, TransactionRow } from '../../core/ui/view-models';
import { BarListComponent } from '../../shared/bar-list/bar-list.component';
import { GaugeComponent } from '../../shared/charts/gauge.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { EmptyStateComponent, ErrorStateComponent } from '../../shared/states/states.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 10;

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [
    RouterLink,
    IconComponent,
    StatusBadgeComponent,
    GaugeComponent,
    BarListComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    ...I18N_PIPES,
  ],
  templateUrl: './transaction-detail.component.html',
  styleUrl: './transaction-detail.component.scss',
})
export class TransactionDetailComponent implements OnInit, OnDestroy {
  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly transaction = signal<Transaction | null>(null);
  readonly risk = signal<RiskAssessment | null>(null);
  readonly riskPending = signal(false);
  /** Set when the id belongs to a sample row instead of a real transaction. */
  readonly demo = signal<TransactionRow | null>(null);

  readonly ref = computed(() => {
    const demo = this.demo();
    if (demo) return demo.ref;
    const tx = this.transaction();
    return tx ? shortRef('TX', tx.id) : '';
  });

  readonly riskScore = computed(() => toPercent(this.risk()?.riskScore) ?? 0);
  readonly confidence = computed(() => toPercent(this.risk()?.confidence) ?? 0);

  readonly signalBars = computed<BarDatum[]>(() => {
    const demo = this.demo();
    if (demo) {
      const color = demoRiskFor(demo).color;
      return demoRiskFor(demo).signals.map((s) => ({ label: this.humanize(s.code), value: s.value, color }));
    }
    return (this.risk()?.signals ?? []).map((s) => {
      const score = toPercent(s.score);
      return {
        label: this.humanize(s.code),
        value: score ?? 100,
        display: score !== null ? `${score}%` : s.severity,
        color: SEVERITY_COLOR[s.severity],
      };
    });
  });

  private pollSubscription?: Subscription;
  private transactionId = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly transactionService: TransactionService,
  ) {}

  ngOnInit(): void {
    this.transactionId = this.route.snapshot.paramMap.get('id')!;
    const demo = DEMO_TRANSACTIONS.find((t) => t.id === this.transactionId);
    if (demo) {
      this.demo.set(demo);
      this.loading.set(false);
      return;
    }
    this.load();
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.transactionService.get(this.transactionId).subscribe({
      next: (transaction) => {
        this.transaction.set(transaction);
        this.loading.set(false);
        this.loadRisk();
      },
      error: (err) => {
        this.failed.set(err?.status !== 404);
        this.loading.set(false);
      },
    });
  }

  demoScore(row: TransactionRow): number {
    return row.risk ?? 0;
  }

  private loadRisk(pollCount = 0): void {
    this.transactionService.getRisk(this.transactionId).subscribe({
      next: (risk) => {
        this.risk.set(risk);
        this.riskPending.set(false);
      },
      error: () => {
        const status = this.transaction()?.status;
        const stillAnalyzing = status === 'PENDING' || status === 'ANALYZING';
        if (stillAnalyzing && pollCount < MAX_POLLS) {
          this.riskPending.set(true);
          this.pollSubscription = interval(POLL_INTERVAL_MS).subscribe(() => {
            this.pollSubscription?.unsubscribe();
            this.refreshTransactionThenRisk(pollCount + 1);
          });
        } else {
          this.riskPending.set(false);
        }
      },
    });
  }

  private refreshTransactionThenRisk(pollCount: number): void {
    this.transactionService.get(this.transactionId).subscribe((transaction) => {
      this.transaction.set(transaction);
      this.loadRisk(pollCount);
    });
  }

  private humanize(code: string): string {
    const text = code.replaceAll('_', ' ').toLowerCase();
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}
