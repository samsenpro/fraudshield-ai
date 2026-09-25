import { Component, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AnalyticsResponse } from '../../core/models/analytics.model';
import { AnalyticsService } from '../../core/services/analytics.service';
import { BarItem, BarListComponent } from '../../shared/bar-list/bar-list.component';
import { StatTileComponent } from '../../shared/stat-tile/stat-tile.component';

const RISK_COLOR: Record<string, BarItem['colorClass']> = {
  LOW: 'green',
  MEDIUM: 'orange',
  HIGH: 'red',
  CRITICAL: 'red',
};

const CASE_STATUS_COLOR: Record<string, BarItem['colorClass']> = {
  OPEN: 'orange',
  IN_REVIEW: 'blue',
  RESOLVED: 'green',
};

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [MatCardModule, MatProgressSpinnerModule, StatTileComponent, BarListComponent],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss',
})
export class AnalyticsComponent implements OnInit {
  readonly loading = signal(true);
  readonly analytics = signal<AnalyticsResponse | null>(null);

  constructor(private readonly analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.analyticsService.get().subscribe({
      next: (response) => {
        this.analytics.set(response);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  transactionsOverTime(): BarItem[] {
    const data = this.analytics()?.transactionsOverTime ?? [];
    return data.map((d) => ({ label: d.date.slice(5), value: d.count, colorClass: 'blue' }));
  }

  riskDistribution(): BarItem[] {
    const data = this.analytics()?.riskDistribution ?? {};
    return Object.entries(data).map(([label, value]) => ({ label, value: value ?? 0, colorClass: RISK_COLOR[label] }));
  }

  alertsBySeverity(): BarItem[] {
    const data = this.analytics()?.alertsBySeverity ?? {};
    return Object.entries(data).map(([label, value]) => ({ label, value: value ?? 0, colorClass: RISK_COLOR[label] }));
  }

  fraudCasesByStatus(): BarItem[] {
    const data = this.analytics()?.fraudCasesByStatus ?? {};
    return Object.entries(data).map(([label, value]) => ({
      label,
      value: value ?? 0,
      colorClass: CASE_STATUS_COLOR[label],
    }));
  }
}
