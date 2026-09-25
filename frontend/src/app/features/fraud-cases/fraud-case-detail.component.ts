import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { FraudCase, FraudCaseDecision } from '../../core/models/fraud-case.model';
import { FraudCaseService } from '../../core/services/fraud-case.service';
import { StatusChipComponent } from '../../shared/status-chip/status-chip.component';

const DECISIONS: FraudCaseDecision[] = ['CONFIRMED_FRAUD', 'FALSE_POSITIVE', 'UNDETERMINED'];

@Component({
  selector: 'app-fraud-case-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    StatusChipComponent,
  ],
  templateUrl: './fraud-case-detail.component.html',
  styleUrl: './fraud-case-detail.component.scss',
})
export class FraudCaseDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly decisions = DECISIONS;
  readonly loading = signal(true);
  readonly fraudCase = signal<FraudCase | null>(null);
  readonly working = signal(false);
  readonly actionError = signal<string | null>(null);

  readonly resolveForm = this.fb.group({
    decision: ['UNDETERMINED' as FraudCaseDecision, Validators.required],
    notes: [''],
  });

  private caseId = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly fraudCaseService: FraudCaseService,
  ) {}

  ngOnInit(): void {
    this.caseId = this.route.snapshot.paramMap.get('id')!;
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.fraudCaseService.get(this.caseId).subscribe({
      next: (fraudCase) => {
        this.fraudCase.set(fraudCase);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  takeForReview(): void {
    this.working.set(true);
    this.actionError.set(null);
    this.fraudCaseService.review(this.caseId).subscribe({
      next: (fraudCase) => {
        this.fraudCase.set(fraudCase);
        this.working.set(false);
      },
      error: (err) => {
        this.working.set(false);
        this.actionError.set(err?.error?.message ?? 'Could not take this case for review.');
      },
    });
  }

  resolve(): void {
    if (this.resolveForm.invalid) {
      return;
    }
    this.working.set(true);
    this.actionError.set(null);

    const { decision, notes } = this.resolveForm.getRawValue();
    this.fraudCaseService.resolve(this.caseId, { decision: decision!, notes: notes || undefined }).subscribe({
      next: (fraudCase) => {
        this.fraudCase.set(fraudCase);
        this.working.set(false);
      },
      error: (err) => {
        this.working.set(false);
        this.actionError.set(err?.error?.message ?? 'Could not resolve this case.');
      },
    });
  }
}
