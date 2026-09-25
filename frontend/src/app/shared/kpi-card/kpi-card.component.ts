import { Component, Input } from '@angular/core';

import { LiteralPipe, TranslatePipe } from '../../core/i18n/i18n.pipes';
import { Kpi } from '../../core/ui/view-models';
import { IconComponent } from '../icon/icon.component';

/** Dashboard KPI: tinted icon square, delta flush right, 26px value, label. */
@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [IconComponent, TranslatePipe, LiteralPipe],
  template: `
    @if (kpi; as k) {
      <div class="kpi__top">
        <div class="kpi__icon" [class.kpi__icon--red]="k.tone === 'red'">
          <app-icon [name]="k.icon" [size]="15"></app-icon>
        </div>
        <span class="kpi__delta" [style.color]="k.deltaColor">
          @if (k.delta === 'LIVE') {
            <span class="kpi__live"></span>
          }
          {{ k.delta | lit }}
        </span>
      </div>
      <div class="kpi__value">{{ k.value }}</div>
      <div class="kpi__label">{{ k.label | t }}</div>
    } @else {
      <div class="kpi__top">
        <span class="skeleton" style="width: 30px; height: 30px"></span>
        <span class="skeleton" style="width: 40px; height: 11px"></span>
      </div>
      <span class="skeleton" style="width: 70%; height: 30px"></span>
      <span class="skeleton" style="width: 50%; height: 12px"></span>
    }
  `,
  styles: [
    `
      :host {
        background: var(--color-surface);
        border: 1px solid var(--color-divider);
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-width: 0;
        position: relative;
        overflow: hidden;
        animation: fs-fade-up 0.35s var(--ease-out) backwards;
        transition: border-color 0.2s, transform 0.2s var(--ease-out);
      }
      :host::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 2px;
        background: var(--color-accent-2);
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.3s var(--ease-out);
      }
      :host(:hover) {
        border-color: color-mix(in srgb, var(--color-text) 18%, transparent);
        transform: translateY(-1px);
      }
      :host(:hover)::after {
        transform: scaleX(1);
      }
      .kpi__top {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .kpi__icon {
        width: 30px;
        height: 30px;
        background: rgba(45, 212, 191, 0.12);
        color: #2dd4bf;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .kpi__icon--red {
        background: rgba(236, 48, 19, 0.12);
        color: #ec3013;
      }
      .kpi__delta {
        font-size: 11px;
        font-weight: 700;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        white-space: nowrap;
      }
      .kpi__live {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
        animation: fs-pulse 2s ease-in-out infinite;
      }
      .kpi__value {
        font-family: var(--font-heading);
        font-weight: 800;
        font-size: 26px;
        line-height: 1.2;
        letter-spacing: -0.01em;
        color: var(--color-text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .kpi__label {
        font-size: 12px;
        color: var(--color-neutral-700);
      }
      @media (max-width: 600px) {
        :host {
          padding: 14px;
        }
        .kpi__value {
          font-size: 22px;
        }
      }
    `,
  ],
})
export class KpiCardComponent {
  /** Null renders the loading skeleton. */
  @Input() kpi: Kpi | null = null;
}
