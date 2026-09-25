import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { I18N_PIPES } from '../../core/i18n/i18n.pipes';
import { I18nService } from '../../core/i18n/i18n.service';
import { FraudCase, FraudCaseDecision, FraudCaseStatus } from '../../core/models/fraud-case.model';
import { FraudCaseService } from '../../core/services/fraud-case.service';
import { shortRef, statusLabel } from '../../core/ui/risk';
import { IconComponent } from '../../shared/icon/icon.component';
import { EmptyStateComponent, ErrorStateComponent } from '../../shared/states/states.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';
import { ToastService } from '../../shared/toast/toast.service';

const DECISIONS: FraudCaseDecision[] = ['CONFIRMED_FRAUD', 'FALSE_POSITIVE', 'UNDETERMINED'];
const STEPS: FraudCaseStatus[] = ['OPEN', 'IN_REVIEW', 'RESOLVED'];

@Component({
  selector: 'app-fraud-case-detail',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, IconComponent, StatusBadgeComponent, EmptyStateComponent, ErrorStateComponent, ...I18N_PIPES],
  templateUrl: './fraud-case-detail.component.html',
  styleUrl: './fraud-case-detail.component.scss',
})
export class FraudCaseDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18nService);

  readonly decisions = DECISIONS;
  readonly steps = STEPS;
  readonly statusLabel = statusLabel;
  readonly shortRef = shortRef;

  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly fraudCase = signal<FraudCase | null>(null);
  readonly working = signal(false);
  readonly actionError = signal<string | null>(null);

  readonly stepIndex = computed(() => STEPS.indexOf(this.fraudCase()?.status ?? 'OPEN'));

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
    this.failed.set(false);
    this.fraudCaseService.get(this.caseId).subscribe({
      next: (fraudCase) => {
        this.fraudCase.set(fraudCase);
        this.loading.set(false);
      },
      error: (err) => {
        this.failed.set(err?.status !== 404);
        this.loading.set(false);
      },
    });
  }

  takeForReview(): void {
    this.working.set(true);
    this.actionError.set(null);
    this.fraudCaseService.review(this.caseId).subscribe({
      next: (fraudCase) => {
        this.fraudCase.set(fraudCase);
        this.working.set(false);
        this.toast.success(this.i18n.t('caseDetail.assigned'), this.i18n.t('caseDetail.assignedText'));
      },
      error: (err) => {
        this.working.set(false);
        this.actionError.set(err?.error?.message ?? this.i18n.t('caseDetail.takeError'));
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
        this.toast.success(
          this.i18n.t('caseDetail.resolvedToast'),
          this.i18n.t('caseDetail.resolvedToastText', { decision: this.i18n.lit(statusLabel(decision!)) }),
        );
      },
      error: (err) => {
        this.working.set(false);
        this.actionError.set(err?.error?.message ?? this.i18n.t('caseDetail.resolveError'));
      },
    });
  }
}
