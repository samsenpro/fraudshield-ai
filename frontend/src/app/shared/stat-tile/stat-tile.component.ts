import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-stat-tile',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <mat-card class="stat-tile">
      <span class="stat-tile__label">{{ label }}</span>
      <span class="stat-tile__value">{{ value }}</span>
    </mat-card>
  `,
  styles: [
    `
      .stat-tile {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 16px 20px;
        min-width: 160px;
      }
      .stat-tile__label {
        font-size: 12px;
        color: #78909c;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .stat-tile__value {
        font-size: 28px;
        font-weight: 600;
        color: #1a237e;
      }
    `,
  ],
})
export class StatTileComponent {
  @Input() label = '';
  @Input() value: string | number = '';
}
