import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';

import { FraudCase } from '../../core/models/fraud-case.model';
import { FraudCaseService } from '../../core/services/fraud-case.service';
import { StatusChipComponent } from '../../shared/status-chip/status-chip.component';

@Component({
  selector: 'app-fraud-cases-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatPaginatorModule, MatProgressSpinnerModule, MatButtonModule, StatusChipComponent],
  templateUrl: './fraud-cases-list.component.html',
  styleUrl: './fraud-cases-list.component.scss',
})
export class FraudCasesListComponent implements OnInit {
  readonly columns = ['status', 'decision', 'assignedReviewerName', 'createdAt', 'actions'];
  readonly loading = signal(true);
  readonly cases = signal<FraudCase[]>([]);
  readonly totalElements = signal(0);
  readonly pageSize = signal(10);
  readonly pageIndex = signal(0);

  constructor(
    private readonly fraudCaseService: FraudCaseService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.fraudCaseService.list(this.pageIndex(), this.pageSize()).subscribe({
      next: (page) => {
        this.cases.set(page.content);
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

  openDetail(fraudCase: FraudCase): void {
    this.router.navigate(['/fraud-cases', fraudCase.id]);
  }
}
