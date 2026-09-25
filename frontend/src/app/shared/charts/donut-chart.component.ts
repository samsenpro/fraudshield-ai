import { Component, Input, OnChanges, signal } from '@angular/core';

import { LiteralPipe } from '../../core/i18n/i18n.pipes';
import { DonutSlice } from '../../core/ui/view-models';

interface Segment extends DonutSlice {
  dasharray: string;
  dashoffset: string;
}

const R = 70;
const C = 2 * Math.PI * R;

/** 150px donut with a centered figure and a legend underneath. */
@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [LiteralPipe],
  template: `
    <div class="donut">
      <svg viewBox="0 0 180 180" class="donut__svg" role="img" [attr.aria-label]="centerLabel + ' ' + centerValue">
        <g transform="rotate(-90 90 90)">
          <circle cx="90" cy="90" r="70" fill="none" stroke="var(--color-neutral-200)" stroke-width="20"></circle>
          @for (seg of segments; track seg.label; let i = $index) {
            <circle
              cx="90"
              cy="90"
              r="70"
              fill="none"
              class="donut__seg"
              [class.is-dim]="hovered() !== null && hovered() !== seg.label"
              [attr.stroke]="seg.color"
              stroke-width="20"
              [attr.stroke-dasharray]="seg.dasharray"
              [attr.stroke-dashoffset]="seg.dashoffset"
              [style.animation-delay.ms]="i * 90"
              (mouseenter)="hovered.set(seg.label)"
              (mouseleave)="hovered.set(null)"
            ></circle>
          }
        </g>
      </svg>
      <div class="donut__center">
        <div class="donut__value">{{ hoveredSlice()?.pct ?? centerValue }}{{ hoveredSlice() ? '%' : '' }}</div>
        <div class="donut__label">{{ hoveredSlice() ? (hoveredSlice()!.label | lit).toUpperCase() : centerLabel }}</div>
      </div>
    </div>
    <div class="legend">
      @for (seg of segments; track seg.label) {
        <div
          class="legend__row"
          [class.is-active]="hovered() === seg.label"
          (mouseenter)="hovered.set(seg.label)"
          (mouseleave)="hovered.set(null)"
        >
          <span class="legend__swatch" [style.background]="seg.color"></span>
          <span class="legend__label">{{ seg.label | lit }}</span>
          <span class="legend__pct">{{ seg.pct }}%</span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        flex: 1;
      }
      .donut {
        position: relative;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 150px;
      }
      .donut__svg {
        width: 150px;
        height: 150px;
      }
      .donut__seg {
        cursor: pointer;
        animation: fs-fade-in 0.5s ease backwards;
        transition: opacity 0.2s, stroke-width 0.2s;
      }
      .donut__seg.is-dim {
        opacity: 0.3;
      }
      .donut__center {
        position: absolute;
        text-align: center;
        pointer-events: none;
      }
      .donut__value {
        font-family: var(--font-heading);
        font-weight: 800;
        font-size: 22px;
        line-height: 1.2;
      }
      .donut__label {
        font-size: 10px;
        color: var(--color-neutral-700);
        max-width: 90px;
      }
      .legend {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 8px;
      }
      .legend__row {
        display: flex;
        align-items: center;
        gap: 7px;
        font-size: 12px;
        cursor: default;
        transition: opacity 0.15s;
      }
      .legend__swatch {
        width: 8px;
        height: 8px;
        flex: none;
      }
      .legend__label {
        color: var(--color-neutral-800);
        flex: 1;
      }
      .legend__pct {
        color: var(--color-neutral-700);
        font-weight: 600;
      }
      .legend__row.is-active .legend__label {
        color: var(--color-text);
      }
    `,
  ],
})
export class DonutChartComponent implements OnChanges {
  @Input() slices: DonutSlice[] = [];
  @Input() centerValue: string | number = '';
  @Input() centerLabel = '';

  readonly hovered = signal<string | null>(null);
  segments: Segment[] = [];

  hoveredSlice(): DonutSlice | undefined {
    const label = this.hovered();
    return label === null ? undefined : this.segments.find((s) => s.label === label);
  }

  ngOnChanges(): void {
    let cumulative = 0;
    this.segments = this.slices.map((slice) => {
      const len = (C * slice.pct) / 100;
      const segment = {
        ...slice,
        dasharray: `${len.toFixed(1)} ${(C - len).toFixed(1)}`,
        dashoffset: (-cumulative).toFixed(1),
      };
      cumulative += len;
      return segment;
    });
  }
}
