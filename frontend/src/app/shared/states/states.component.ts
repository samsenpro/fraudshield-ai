import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { TranslatePipe } from '../../core/i18n/i18n.pipes';
import { IconComponent } from '../icon/icon.component';

/** Empty result: icon square, title, one line of guidance, optional action slot. */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [IconComponent, TranslatePipe],
  template: `
    <div class="state">
      <div class="state__icon"><app-icon [name]="icon" [size]="18"></app-icon></div>
      <p class="state__title">{{ title || ('states.emptyTitle' | t) }}</p>
      @if (text) {
        <p class="state__text">{{ text }}</p>
      }
      <ng-content></ng-content>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = '';
  @Input() text = '';
}

/** Failed request: red icon square, message, retry button. */
@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [IconComponent, TranslatePipe],
  template: `
    <div class="state state--error" role="alert">
      <div class="state__icon"><app-icon name="wifi-off" [size]="18"></app-icon></div>
      <p class="state__title">{{ title || ('states.errorTitle' | t) }}</p>
      <p class="state__text">{{ text || ('states.errorText' | t) }}</p>
      @if (retryable) {
        <button type="button" class="btn btn-secondary btn-sm" (click)="retry.emit()">
          <app-icon name="refresh" [size]="14"></app-icon>
          {{ 'common.tryAgain' | t }}
        </button>
      }
    </div>
  `,
})
export class ErrorStateComponent {
  @Input() title = '';
  @Input() text = '';
  @Input() retryable = true;
  @Output() retry = new EventEmitter<void>();
}

/** Skeleton rows for tables and lists while a request is in flight. */
@Component({
  selector: 'app-skeleton-rows',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (row of rowsArray; track $index) {
      <div class="skeleton-row" [style.animation-delay.ms]="$index * 40">
        @for (col of colsArray; track $index) {
          <span class="skeleton" [style.width.%]="widthFor($index)"></span>
        }
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .skeleton-row {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: 1fr;
        gap: 16px;
        padding: 12px 8px;
        border-bottom: 1px solid var(--color-divider);
        animation: fs-fade-in 0.3s ease backwards;
      }
      .skeleton {
        height: 12px;
      }
    `,
  ],
  host: { 'aria-busy': 'true', role: 'progressbar' },
})
export class SkeletonRowsComponent {
  @Input() rows = 6;
  @Input() cols = 5;

  get rowsArray(): number[] {
    return Array.from({ length: this.rows }, (_, i) => i);
  }

  get colsArray(): number[] {
    return Array.from({ length: this.cols }, (_, i) => i);
  }

  widthFor(i: number): number {
    return [70, 55, 85, 45, 60, 40, 75][i % 7];
  }
}
