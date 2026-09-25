import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';

import { I18N_PIPES } from '../../core/i18n/i18n.pipes';
import { FraudCase } from '../../core/models/fraud-case.model';
import { FraudCaseService } from '../../core/services/fraud-case.service';
import { shortRef } from '../../core/ui/risk';
import { FraudOverviewComponent } from '../alerts/fraud-overview.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { PageChange, PaginatorComponent } from '../../shared/paginator/paginator.component';
import { EmptyStateComponent, ErrorStateComponent, SkeletonRowsComponent } from '../../shared/states/states.component';
import { StatusBadgeComponent } from '../../shared/status-badge/status-badge.component';

@Component({
  selector: 'app-fraud-cases-list',
  standalone: true,
  imports: [
    FraudOverviewComponent,
    IconComponent,
    StatusBadgeComponent,
    PaginatorComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    SkeletonRowsComponent,
    ...I18N_PIPES,
  ],
  templateUrl: './fraud-cases-list.component.html',
  styleUrl: './fraud-cases-list.component.scss',
})
export class FraudCasesListComponent implements OnInit {
  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly cases = signal<FraudCase[]>([]);
  readonly totalElements = signal(0);
  readonly pageSize = signal(10);
  readonly pageIndex = signal(0);

  readonly shortRef = shortRef;

  constructor(
    private readonly fraudCaseService: FraudCaseService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.fraudCaseService.list(this.pageIndex(), this.pageSize()).subscribe({
      next: (page) => {
        this.cases.set(page.content);
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  onPage(event: PageChange): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  openDetail(fraudCase: FraudCase): void {
    this.router.navigate(['/fraud-cases', fraudCase.id]);
  }

  goToAlerts(): void {
    this.router.navigate(['/alerts']);
  }
}
