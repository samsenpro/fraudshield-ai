import { Component, Input, OnChanges, computed, inject } from '@angular/core';

import { I18nService } from '../../core/i18n/i18n.service';

const WINDOWS = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];

interface Cell {
  color: string;
  day: number;
  block: number;
  value: number;
  delay: number;
}

/** Suspicious-activity heatmap: 7 days × 6 four-hour windows, accent at 0.08 + v·0.22 alpha. */
@Component({
  selector: 'app-heatmap',
  standalone: true,
  template: `
    <div class="heatmap">
      <div class="heatmap__days">
        @for (day of days(); track day) {
          <span>{{ day }}</span>
        }
      </div>
      <div class="heatmap__grid">
        @for (cell of cells; track $index) {
          <div
            class="heatmap__cell"
            [style.background]="cell.color"
            [style.animation-delay.ms]="cell.delay"
            [attr.title]="labelOf(cell)"
          ></div>
        }
      </div>
      <span></span>
      <div class="heatmap__axis">
        @for (w of windows; track w) {
          <span>{{ w }}</span>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .heatmap {
        display: grid;
        grid-template-columns: 34px 1fr;
        column-gap: 8px;
      }
      .heatmap__days {
        display: grid;
        grid-template-rows: repeat(7, 1fr);
        gap: 4px;
        font-size: 10.5px;
        color: var(--color-neutral-700);
      }
      .heatmap__days span {
        display: flex;
        align-items: center;
      }
      .heatmap__grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        grid-auto-rows: 30px;
        gap: 4px;
      }
      .heatmap__cell {
        animation: fs-fade-in 0.4s ease backwards;
        transition: outline-color 0.15s, transform 0.15s;
        outline: 1px solid transparent;
        outline-offset: -1px;
      }
      .heatmap__cell:hover {
        outline-color: var(--color-text);
      }
      .heatmap__axis {
        display: flex;
        justify-content: space-between;
        margin-top: 8px;
        font-size: 10.5px;
        color: var(--color-neutral-700);
      }
      @media (max-width: 600px) {
        .heatmap__grid {
          grid-auto-rows: 24px;
          gap: 3px;
        }
        .heatmap__days {
          gap: 3px;
        }
        .heatmap__axis span:nth-child(even) {
          visibility: hidden;
        }
      }
    `,
  ],
})
export class HeatmapComponent implements OnChanges {
  /** 42 intensities, row-major by day, each 0–4. */
  @Input() values: number[] = [];

  private readonly i18n = inject(I18nService);
  readonly days = computed(() => this.i18n.t('heatmap.days').split(','));
  readonly windows = WINDOWS;
  cells: Cell[] = [];

  ngOnChanges(): void {
    this.cells = [];
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 6; h++) {
        const v = this.values[d * 6 + h] ?? 0;
        this.cells.push({
          color: this.colorOf(v),
          day: d,
          block: h + 1,
          value: v,
          delay: (d + h) * 25,
        });
      }
    }
  }

  labelOf(cell: Cell): string {
    return this.i18n.t('heatmap.cell', { day: this.days()[cell.day], block: cell.block, v: cell.value });
  }

  private colorOf(v: number): string {
    return `rgba(236, 48, 19, ${(0.08 + v * 0.22).toFixed(2)})`;
  }
}
