import { Component, Input } from '@angular/core';

import { LiteralPipe } from '../../core/i18n/i18n.pipes';
import { BarDatum } from '../../core/ui/view-models';

/**
 * Labelled horizontal bars. `stacked` puts label + value above a 6px track
 * (fraud categories, risk factors); `inline` is the 120px | track | 50px row
 * used for regional risk.
 */
@Component({
  selector: 'app-bar-list',
  standalone: true,
  imports: [LiteralPipe],
  template: `
    @for (item of items; track item.label; let i = $index) {
      @if (layout === 'stacked') {
        <div class="bar">
          <div class="bar__head">
            <span class="bar__label">{{ item.label | lit }}</span>
            <span class="bar__value">{{ (item.display | lit) || item.value + '%' }}</span>
          </div>
          <div class="track" [class.track--thin]="thickness === 'thin'">
            <div
              class="track__fill"
              [style.width.%]="widthOf(item)"
              [style.background]="item.color ?? color"
              [style.animation-delay.ms]="i * 60"
            ></div>
          </div>
        </div>
      } @else {
        <div class="bar bar--inline">
          <span class="bar__label bar__label--strong">{{ item.label | lit }}</span>
          <div class="track track--thick">
            <div
              class="track__fill"
              [style.width.%]="widthOf(item)"
              [style.background]="item.color ?? color"
              [style.animation-delay.ms]="i * 60"
            ></div>
          </div>
          <span class="bar__value bar__value--end">{{ (item.display | lit) || item.value + '%' }}</span>
        </div>
      }
    }
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--bar-gap, 11px);
      }
      .bar__head {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        font-size: 12px;
        margin-bottom: 4px;
      }
      .bar__label {
        color: var(--color-neutral-800);
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .bar__label--strong {
        color: var(--color-text);
        font-size: 12.5px;
      }
      .bar__value {
        color: var(--color-neutral-700);
        font-weight: 600;
        white-space: nowrap;
      }
      .bar--inline {
        display: grid;
        grid-template-columns: 120px 1fr 50px;
        gap: 10px;
        align-items: center;
      }
      .bar__value--end {
        font-size: 12px;
        font-weight: 400;
        text-align: right;
      }
      @media (max-width: 480px) {
        .bar--inline {
          grid-template-columns: 96px 1fr 40px;
        }
      }
    `,
  ],
})
export class BarListComponent {
  @Input() items: BarDatum[] = [];
  @Input() layout: 'stacked' | 'inline' = 'stacked';
  @Input() thickness: 'thin' | 'normal' = 'normal';
  @Input() color = 'var(--color-accent)';
  /** When set, widths scale against this max instead of being percentages. */
  @Input() max: number | null = null;

  widthOf(item: BarDatum): number {
    const max = this.max ?? 100;
    return max > 0 ? Math.min(100, (item.value / max) * 100) : 0;
  }
}
