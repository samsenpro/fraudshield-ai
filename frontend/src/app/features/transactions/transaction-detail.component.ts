import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, interval } from 'rxjs';

import { RiskAssessment } from '../../core/models/risk.model';
import { Transaction } from '../../core/models/transaction.model';
import { TransactionService } from '../../core/services/transaction.service';
import { StatusChipComponent } from '../../shared/status-chip/status-chip.component';

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 10;

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, StatusChipComponent],
  templateUrl: './transaction-detail.component.html',
  styleUrl: './transaction-detail.component.scss',
})
export class TransactionDetailComponent implements OnInit, OnDestroy {
  readonly loading = signal(true);
  readonly transaction = signal<Transaction | null>(null);
  readonly risk = signal<RiskAssessment | null>(null);
  readonly riskPending = signal(false);

  private pollSubscription?: Subscription;
  private transactionId = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly transactionService: TransactionService,
  ) {}

  ngOnInit(): void {
    this.transactionId = this.route.snapshot.paramMap.get('id')!;
    this.load();
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
  }

  load(): void {
    this.loading.set(true);
    this.transactionService.get(this.transactionId).subscribe({
      next: (transaction) => {
        this.transaction.set(transaction);
        this.loading.set(false);
        this.loadRisk();
      },
      error: () => this.loading.set(false),
    });
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
}
