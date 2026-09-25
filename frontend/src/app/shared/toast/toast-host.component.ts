import { Component, inject } from '@angular/core';

import { TranslatePipe } from '../../core/i18n/i18n.pipes';
import { IconComponent } from '../icon/icon.component';
import { ToastService } from './toast.service';

const ICON_BY_TONE = { success: 'check', danger: 'alert', info: 'info' } as const;

@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [IconComponent, TranslatePipe],
  template: `
    @for (toast of service.toasts(); track toast.id) {
      <div class="notice notice--{{ toast.tone }} toast" role="status">
        <app-icon [name]="icons[toast.tone]" [size]="16"></app-icon>
        <div class="notice__body">
          <div class="notice__title">{{ toast.title }}</div>
          @if (toast.text) {
            <div class="toast__text">{{ toast.text }}</div>
          }
        </div>
        <button type="button" class="toast__close" (click)="service.dismiss(toast.id)" [attr.aria-label]="'common.dismiss' | t">
          <app-icon name="x" [size]="14"></app-icon>
        </button>
      </div>
    }
  `,
  styles: [
    `
      :host {
        position: fixed;
        right: 20px;
        bottom: 20px;
        z-index: 90;
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: min(360px, calc(100vw - 32px));
        pointer-events: none;
      }
      .toast {
        pointer-events: auto;
        background: var(--color-surface);
        box-shadow: var(--shadow-lg);
        animation: fs-toast-in 0.25s var(--ease-out) backwards;
      }
      .toast__text {
        font-size: 12.5px;
        color: var(--color-neutral-700);
        margin-top: 2px;
      }
      .toast__close {
        background: transparent;
        border: 0;
        color: var(--color-neutral-700);
        padding: 2px;
        cursor: pointer;
        line-height: 0;
      }
      .toast__close:hover {
        color: var(--color-text);
      }
      @media (max-width: 600px) {
        :host {
          right: 16px;
          left: 16px;
          bottom: 16px;
          width: auto;
        }
      }
    `,
  ],
})
export class ToastHostComponent {
  readonly service = inject(ToastService);
  readonly icons = ICON_BY_TONE;
}
