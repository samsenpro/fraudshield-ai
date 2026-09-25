import { Component, Input, inject } from '@angular/core';

import { I18nService } from '../../core/i18n/i18n.service';
import { RiskLevel } from '../../core/models/risk.model';
import { RISK_COLOR, riskLevelOf, toneOf } from '../../core/ui/risk';

const ARC = 251.2;

/** Semicircle risk gauge: 16px track, score / 100, level badge. */
@Component({
  selector: 'app-gauge',
  standalone: true,
  template: `
    <svg viewBox="0 0 200 120" class="gauge__svg" role="img" [attr.aria-label]="aria">
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="var(--color-neutral-200)" stroke-width="16" stroke-linecap="round"></path>
      <path
        d="M20 100 A80 80 0 0 1 180 100"
        fill="none"
        class="gauge__value"
        [attr.stroke]="color"
        stroke-width="16"
        stroke-linecap="round"
        [attr.stroke-dasharray]="arc"
        [style.stroke-dashoffset]="dashoffset"
      ></path>
    </svg>
    <div class="gauge__score">{{ rounded }}<span>/100</span></div>
    <div class="badge gauge__badge badge--{{ tone }}">{{ label }}</div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .gauge__svg {
        width: 180px;
        max-width: 100%;
      }
      .gauge__value {
        animation: gauge-sweep 1.1s var(--ease-out) backwards;
      }
      @keyframes gauge-sweep {
        from {
          stroke-dashoffset: 251.2;
        }
      }
      .gauge__score {
        font-family: var(--font-heading);
        font-weight: 800;
        font-size: 34px;
        line-height: 1.2;
        margin-top: -6px;
      }
      .gauge__score span {
        font-size: 16px;
        color: var(--color-neutral-700);
      }
      .gauge__badge {
        font-size: 11px;
        padding: 3px 10px;
        margin-top: 4px;
      }
    `,
  ],
})
export class GaugeComponent {
  private readonly i18n = inject(I18nService);

  @Input() score = 0;
  /** The engine's own classification; derived from the score when absent. */
  @Input() level: RiskLevel | null = null;

  readonly arc = ARC;

  get rounded(): number {
    return Math.round(this.score);
  }

  get dashoffset(): number {
    return +(ARC - (Math.min(100, Math.max(0, this.score)) / 100) * ARC).toFixed(1);
  }

  private get resolvedLevel(): RiskLevel {
    return this.level ?? riskLevelOf(this.score);
  }

  get color(): string {
    const level = this.resolvedLevel;
    return level === 'LOW' ? 'var(--color-accent-2)' : RISK_COLOR[level];
  }

  get label(): string {
    const level = this.resolvedLevel;
    if (level === 'LOW') return this.i18n.t(this.score >= 20 ? 'gauge.lowMedium' : 'gauge.low');
    return this.i18n.t(`gauge.${level.toLowerCase()}`);
  }

  get aria(): string {
    return this.i18n.t('gauge.aria', { n: this.rounded });
  }

  get tone(): string {
    return toneOf(this.resolvedLevel);
  }
}
