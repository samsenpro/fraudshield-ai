import { Component, Input } from '@angular/core';

/** Screen heading: 26px title, muted subtitle, actions flush right. */
@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <div class="page-header__text">
      <h2 class="page-header__title">{{ title }}</h2>
      @if (subtitle) {
        <p class="page-header__subtitle">{{ subtitle }}</p>
      }
    </div>
    <div class="page-header__actions">
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 16px;
        flex-wrap: wrap;
      }
      .page-header__text {
        min-width: 0;
      }
      .page-header__title {
        margin: 0 0 4px;
        font-size: 26px;
      }
      .page-header__subtitle {
        margin: 0;
        font-size: 13.5px;
        color: var(--color-neutral-700);
      }
      .page-header__actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        align-items: center;
      }
      .page-header__actions:empty {
        display: none;
      }
      @media (max-width: 600px) {
        .page-header__title {
          font-size: 22px;
        }
        .page-header__actions {
          width: 100%;
        }
      }
    `,
  ],
})
export class PageHeaderComponent {
  @Input({ required: true }) title = '';
  @Input() subtitle = '';
}
