import { Component, Input } from '@angular/core';

import { LiteralPipe } from '../../core/i18n/i18n.pipes';
import { SeriesPoint } from '../../core/ui/view-models';

/**
 * Vertical volume bars on the spec's 700×170 proportions. Drawn in HTML so
 * the labels keep a legible size at any width.
 */
@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [LiteralPipe],
  template: `
    <div class="bars" role="img" [attr.aria-label]="ariaLabel">
      <div class="bars__plot">
        @for (d of data; track d.label; let i = $index) {
          <div class="bars__slot">
            <div
              class="bars__bar"
              [style.height.%]="heightOf(d.value)"
              [style.background]="color"
              [style.animation-delay.ms]="i * 60"
              [attr.title]="(d.label | lit) + ' · ' + d.value + suffix"
            >
              <span class="bars__tip">{{ d.value }}{{ suffix }}</span>
            </div>
          </div>
        }
      </div>
      <div class="bars__labels">
        @for (d of data; track d.label) {
          <span class="bars__label">
            {{ d.label | lit }}<span class="bars__label-value"> · {{ d.value }}{{ suffix }}</span>
          </span>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        container-type: inline-size;
      }
      /* the spec's 700×170 proportions, never shorter than 150px */
      .bars {
        display: flex;
        flex-direction: column;
        height: max(150px, calc(100cqw * 170 / 700));
      }
      .bars__plot {
        flex: 1;
        display: flex;
        align-items: flex-end;
        min-height: 0;
      }
      .bars__slot {
        flex: 1;
        height: 100%;
        display: flex;
        align-items: flex-end;
        justify-content: center;
      }
      .bars__bar {
        position: relative;
        width: 70%;
        opacity: 0.85;
        transform-origin: bottom;
        animation: fs-grow-y 0.6s var(--ease-out) backwards;
        transition: opacity 0.15s;
      }
      .bars__bar:hover {
        opacity: 1;
      }
      .bars__tip {
        position: absolute;
        left: 50%;
        bottom: calc(100% + 4px);
        transform: translateX(-50%);
        font-size: 11px;
        font-weight: 700;
        color: var(--color-text);
        opacity: 0;
        transition: opacity 0.15s;
        white-space: nowrap;
      }
      .bars__bar:hover .bars__tip {
        opacity: 1;
      }
      .bars__labels {
        display: flex;
        padding-top: 7px;
      }
      .bars__label {
        flex: 1;
        text-align: center;
        font-size: 11px;
        color: var(--color-neutral-700);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      @container (max-width: 520px) {
        .bars__label-value {
          display: none;
        }
      }
    `,
  ],
})
export class BarChartComponent {
  @Input() data: SeriesPoint[] = [];
  @Input() color = 'var(--color-accent-2)';
  @Input() suffix = '';
  @Input() ariaLabel = 'Bar chart';

  heightOf(value: number): number {
    const max = Math.max(1, ...this.data.map((d) => d.value));
    return (value / max) * (140 / 150) * 100;
  }
}
