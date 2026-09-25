import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';

import { DEMO_TRANSACTIONS, DEMO_TX_STATS, DEMO_TX_TOTAL } from '../../core/demo/demo-data';
import { I18N_PIPES } from '../../core/i18n/i18n.pipes';
import { I18nService } from '../../core/i18n/i18n.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { TransactionFeedService } from '../../core/services/transaction-feed.service';
import { TransactionService } from '../../core/services/transaction.service';
import { downloadFile, formatDateTime, formatMoney, formatNumber, riskLevelOf, toCsv } from '../../core/ui/risk';
import { Stat, TransactionRow } from '../../core/ui/view-models';
import { DialogComponent } from '../../shared/dialog/dialog.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { PageChange, PaginatorComponent } from '../../shared/paginator/paginator.component';
import { RiskMeterComponent } from '../../shared/risk-meter/risk-meter.component';
import { SegOption, SegmentedComponent } from '../../shared/segmented/segmented.component';
import { StatTileComponent } from '../../shared/stat-tile/stat-tile.component';
import { EmptyStateComponent, SkeletonRowsComponent } from '../../shared/states/states.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { ToastService } from '../../shared/toast/toast.service';

type RiskFilter = 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH';

const RISK_FILTERS = ['ALL', 'LOW', 'MEDIUM', 'HIGH'] as const;
const FILTER_KEYS: Record<RiskFilter, string> = { ALL: 'common.all', LOW: 'common.low', MEDIUM: 'common.medium', HIGH: 'common.high' };

@Component({
  selector: 'app-transactions-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    StatTileComponent,
    SegmentedComponent,
    IconComponent,
    RiskMeterComponent,
    StatusBadgeComponent,
    PaginatorComponent,
    DialogComponent,
    EmptyStateComponent,
    SkeletonRowsComponent,
    ...I18N_PIPES,
  ],
  templateUrl: './transactions-list.component.html',
  styleUrl: './transactions-list.component.scss',
})
export class TransactionsListComponent implements OnInit {
  // Declared before `form` below: see the note in LoginComponent about field
  // initializer ordering with constructor parameter properties.
  private readonly fb = inject(FormBuilder);
  private readonly feed = inject(TransactionFeedService);
  private readonly transactionService = inject(TransactionService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18nService);

  readonly riskFilters = computed<SegOption[]>(() =>
    RISK_FILTERS.map((value) => ({ value, label: this.i18n.t(FILTER_KEYS[value]) })),
  );

  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly rows = signal<TransactionRow[]>([]);
  readonly totalElements = signal(0);
  readonly pageSize = signal(10);
  readonly pageIndex = signal(0);
  readonly stats = signal<Stat[] | null>(null);

  readonly search = signal('');
  readonly riskFilter = signal<RiskFilter>('ALL');

  readonly showForm = signal(false);
  readonly submitting = signal(false);
  readonly formError = signal<string | null>(null);

  readonly form = this.fb.group({
    accountId: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    currency: ['COP', [Validators.required, Validators.pattern(/^[A-Z]{3}$/)]],
    merchant: ['', Validators.required],
    country: ['CO', [Validators.required, Validators.pattern(/^[A-Z]{2}$/)]],
    city: [''],
    deviceId: [''],
    ipAddress: [''],
  });

  /** Sample mode: the API failed, or it has no transactions for this organization yet. */
  readonly sample = computed(() => !this.loading() && (this.failed() || this.totalElements() === 0));

  readonly sourceRows = computed(() => (this.sample() ? DEMO_TRANSACTIONS : this.rows()));

  readonly visibleRows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const filter = this.riskFilter();
    return this.sourceRows().filter((row) => {
      if (term && !`${row.ref} ${row.id} ${row.party}`.toLowerCase().includes(term)) return false;
      if (filter === 'ALL') return true;
      if (row.risk === null) return false;
      const level = riskLevelOf(row.risk);
      return filter === 'HIGH' ? level === 'HIGH' || level === 'CRITICAL' : level === filter;
    });
  });

  readonly isFiltered = computed(() => this.search().trim() !== '' || this.riskFilter() !== 'ALL');

  readonly visibleStats = computed(() => (this.sample() ? DEMO_TX_STATS : this.stats()));

  ngOnInit(): void {
    this.load();
    this.loadStats();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.feed.page(this.pageIndex(), this.pageSize()).subscribe({
      next: (page) => {
        this.rows.set(page.rows);
        this.totalElements.set(page.total);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  private loadStats(): void {
    this.analyticsService
      .get()
      .pipe(catchError(() => of(null)))
      .subscribe((a) => {
        if (!a) return;
        this.stats.set([
          { label: 'transactions.total', value: formatNumber(a.transactionsAnalyzed) },
          { label: 'transactions.approved', value: formatNumber(a.approved), color: 'var(--color-accent-2-800)' },
          { label: 'transactions.blocked', value: formatNumber(a.blocked), color: 'var(--color-accent)' },
          { label: 'transactions.underReview', value: formatNumber(a.underReview), color: 'var(--color-warning)' },
        ]);
      });
  }

  onPage(event: PageChange): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  setRiskFilter(value: string): void {
    this.riskFilter.set(value as RiskFilter);
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  clearFilters(): void {
    this.search.set('');
    this.riskFilter.set('ALL');
  }

  openDetail(row: TransactionRow): void {
    if (row.link) this.router.navigate(row.link);
  }

  totalLabel(): number {
    return this.sample() ? DEMO_TX_TOTAL : this.totalElements();
  }

  export(): void {
    const rows = this.visibleRows();
    const t = (key: string) => this.i18n.t(key);
    const csv = toCsv([
      [
        t('transactions.colId'),
        t('transactions.colDate'),
        t(this.sample() ? 'transactions.colUser' : 'transactions.colMerchant'),
        t('transactions.colAmount'),
        t('transactions.colRisk'),
        t(this.sample() ? 'transactions.colProbability' : 'transactions.colConfidence'),
        t('transactions.colStatus'),
      ],
      ...rows.map((r) => [
        r.ref,
        formatDateTime(r.occurredAt),
        r.party,
        formatMoney(r.amount, r.currency),
        r.risk,
        r.probability,
        this.i18n.lit(r.status),
      ]),
    ]);
    downloadFile(`fraudshield-transactions-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    this.toast.success(this.i18n.t('common.exportReady'), this.i18n.t('transactions.exportText', { n: rows.length }));
  }

  toggleForm(): void {
    this.showForm.update((v) => !v);
    this.formError.set(null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.formError.set(null);

    const value = this.form.getRawValue();
    this.transactionService
      .create({
        accountId: value.accountId!,
        amount: value.amount!,
        currency: value.currency!,
        merchant: value.merchant!,
        country: value.country!,
        city: value.city || undefined,
        deviceId: value.deviceId || undefined,
        ipAddress: value.ipAddress || undefined,
        timestamp: new Date().toISOString(),
      })
      .subscribe({
        next: (transaction) => {
          this.submitting.set(false);
          this.showForm.set(false);
          this.form.reset({ currency: 'COP', country: 'CO', amount: 0 });
          this.toast.success(this.i18n.t('transactions.submitted'), this.i18n.t('transactions.submittedText'));
          this.router.navigate(['/transactions', transaction.id]);
        },
        error: (err) => {
          this.submitting.set(false);
          this.formError.set(err?.error?.message ?? this.i18n.t('transactions.createError'));
        },
      });
  }

  invalid(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.invalid && control.touched;
  }
}
