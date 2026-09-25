import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { riskColorOf } from '../../core/ui/risk';

/** 50px track + colored score, as in the transactions table. */
@Component({
  selector: 'app-risk-meter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (score === null) {
      <span class="risk-meter__none">—</span>
    } @else {
      <div class="risk-meter__track">
        <div class="risk-meter__fill" [style.width.%]="score" [style.background]="color"></div>
      </div>
      <span class="risk-meter__value" [style.color]="color">{{ rounded }}</span>
    }
  `,
  styles: [
    `
      :host {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .risk-meter__track {
        width: 50px;
        height: 5px;
        background: var(--color-neutral-200);
        flex: none;
      }
      .risk-meter__fill {
        height: 100%;
        transform-origin: left;
        animation: fs-grow-x 0.6s var(--ease-out) backwards;
      }
      .risk-meter__value {
        font-size: 12px;
        font-weight: 700;
      }
      .risk-meter__none {
        color: var(--color-neutral-600);
        font-size: 12px;
      }
    `,
  ],
})
export class RiskMeterComponent {
  @Input() score: number | null = null;

  get color(): string {
    return riskColorOf(this.score ?? 0);
  }

  get rounded(): number {
    return Math.round(this.score ?? 0);
  }
}
