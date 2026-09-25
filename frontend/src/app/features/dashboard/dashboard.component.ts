import { Component, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AnalyticsService } from '../../core/services/analytics.service';
import { AnalyticsResponse } from '../../core/models/analytics.model';
import { BarItem, BarListComponent } from '../../shared/bar-list/bar-list.component';
import { StatTileComponent } from '../../shared/stat-tile/stat-tile.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatProgressSpinnerModule, StatTileComponent, BarListComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
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
}
