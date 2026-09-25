import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';

import { Alert } from '../../core/models/alert.model';
import { AlertService } from '../../core/services/alert.service';
import { FraudCaseService } from '../../core/services/fraud-case.service';
import { StatusChipComponent } from '../../shared/status-chip/status-chip.component';

@Component({
  selector: 'app-alerts-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    StatusChipComponent,
  ],
  templateUrl: './alerts-list.component.html',
  styleUrl: './alerts-list.component.scss',
})
export class AlertsListComponent implements OnInit {
  readonly columns = ['severity', 'reason', 'status', 'createdAt', 'actions'];
  readonly loading = signal(true);
  readonly alerts = signal<Alert[]>([]);
  readonly totalElements = signal(0);
  readonly pageSize = signal(10);
  readonly pageIndex = signal(0);
  readonly openingCaseFor = signal<string | null>(null);

  constructor(
    private readonly alertService: AlertService,
    private readonly fraudCaseService: FraudCaseService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.alertService.list(this.pageIndex(), this.pageSize()).subscribe({
      next: (page) => {
        this.alerts.set(page.content);
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

  openCase(alert: Alert): void {
    this.openingCaseFor.set(alert.id);
    this.fraudCaseService.createFromAlert(alert.id).subscribe({
      next: (fraudCase) => {
        this.openingCaseFor.set(null);
        this.router.navigate(['/fraud-cases', fraudCase.id]);
      },
      error: (err) => {
        this.openingCaseFor.set(null);
        this.snackBar.open(err?.error?.message ?? 'Could not open a case for this alert.', 'Dismiss', {
          duration: 4000,
        });
      },
    });
  }
}
