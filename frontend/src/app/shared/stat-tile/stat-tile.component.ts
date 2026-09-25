import { Component, Input } from '@angular/core';

import { TranslatePipe } from '../../core/i18n/i18n.pipes';

/** Compact number tile used in the stat rows of every secondary screen. */
@Component({
  selector: 'app-stat-tile',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    @if (loading) {
      <span class="skeleton" style="height: 26px; width: 60%"></span>
      <span class="skeleton" style="height: 12px; width: 45%; margin-top: 6px"></span>
    } @else {
      <div class="stat-tile__value" [style.color]="color || null">{{ value }}</div>
      <div class="stat-tile__label">{{ label | t }}</div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        background: var(--color-surface);
        border: 1px solid var(--color-divider);
        padding: 14px;
        min-width: 0;
        animation: fs-fade-up 0.3s var(--ease-out) backwards;
        transition: border-color 0.2s;
      }
      :host(:hover) {
        border-color: color-mix(in srgb, var(--color-text) 18%, transparent);
      }
      .stat-tile__value {
        font-size: 22px;
        font-weight: 800;
        font-family: var(--font-heading);
        line-height: 1.25;
        letter-spacing: -0.01em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .stat-tile__label {
        font-size: 11.5px;
        color: var(--color-neutral-700);
      }
    `,
  ],
})
export class StatTileComponent {
  /** i18n key. */
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() color: string | undefined = undefined;
  @Input() loading = false;
}
