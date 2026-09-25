import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';

import { TransactionService } from '../../core/services/transaction.service';
import { Transaction } from '../../core/models/transaction.model';
import { StatusChipComponent } from '../../shared/status-chip/status-chip.component';

@Component({
  selector: 'app-transactions-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    StatusChipComponent,
  ],
  templateUrl: './transactions-list.component.html',
  styleUrl: './transactions-list.component.scss',
})
export class TransactionsListComponent implements OnInit {
  // Declared before `form` below: see the note in LoginComponent about field
  // initializer ordering with constructor parameter properties.
  private readonly fb = inject(FormBuilder);

  readonly columns = ['merchant', 'amount', 'country', 'status', 'occurredAt'];
  readonly loading = signal(true);
  readonly transactions = signal<Transaction[]>([]);
  readonly totalElements = signal(0);
  readonly pageSize = signal(10);
  readonly pageIndex = signal(0);
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

  constructor(
    private readonly transactionService: TransactionService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.transactionService.list(this.pageIndex(), this.pageSize()).subscribe({
      next: (page) => {
        this.transactions.set(page.content);
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  openDetail(transaction: Transaction): void {
    this.router.navigate(['/transactions', transaction.id]);
  }

  toggleForm(): void {
    this.showForm.update((v) => !v);
    this.formError.set(null);
  }

  submit(): void {
    if (this.form.invalid) {
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
          this.router.navigate(['/transactions', transaction.id]);
        },
        error: (err) => {
          this.submitting.set(false);
          this.formError.set(err?.error?.message ?? 'Could not create the transaction.');
        },
      });
  }
}
