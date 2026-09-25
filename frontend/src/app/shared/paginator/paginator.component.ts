import { Component, EventEmitter, Input, Output, inject } from '@angular/core';

import { TranslatePipe } from '../../core/i18n/i18n.pipes';
import { I18nService } from '../../core/i18n/i18n.service';
import { formatNumber } from '../../core/ui/risk';

export interface PageChange {
  pageIndex: number;
  pageSize: number;
}

/** "Showing 1–18 of N items" + page size + Previous / Next. */
@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <span>{{ summary }}</span>
    <div class="pager">
      @if (pageSizeOptions.length > 1) {
        <label class="pager__size">
          <span>{{ 'common.rows' | t }}</span>
          <select
            class="input pager__select"
            [value]="pageSize"
            (change)="emit(0, +$any($event.target).value)"
            [attr.aria-label]="'common.rowsPerPage' | t"
          >
            @for (size of pageSizeOptions; track size) {
              <option [value]="size" [selected]="size === pageSize">{{ size }}</option>
            }
          </select>
        </label>
      }
      <button type="button" class="pager__btn" [disabled]="pageIndex === 0 || disabled" (click)="emit(pageIndex - 1, pageSize)">
        {{ 'common.previous' | t }}
      </button>
      <button
        type="button"
        class="pager__btn pager__btn--next"
        [disabled]="isLast || disabled"
        (click)="emit(pageIndex + 1, pageSize)"
      >
        {{ 'common.next' | t }}
      </button>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        color: var(--color-neutral-700);
        flex-wrap: wrap;
        gap: 8px;
      }
      .pager {
        display: flex;
        gap: 6px;
        align-items: center;
      }
      .pager__size {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-right: 6px;
      }
      .pager__select {
        min-height: 30px;
        width: auto;
        padding: 4px 28px 4px 8px;
        font-size: 12px;
        background-position: right 6px center;
      }
      .pager__btn {
        padding: 6px 12px;
        border: 1px solid var(--color-divider);
        background: transparent;
        color: var(--color-neutral-700);
        cursor: pointer;
        font-size: 12px;
        transition: background 0.15s, color 0.15s;
      }
      .pager__btn--next {
        color: var(--color-text);
      }
      .pager__btn:hover:not(:disabled) {
        background: color-mix(in srgb, var(--color-text) 7%, transparent);
        color: var(--color-text);
      }
      .pager__btn:active:not(:disabled) {
        background: color-mix(in srgb, var(--color-text) 14%, transparent);
      }
      .pager__btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
    `,
  ],
})
export class PaginatorComponent {
  private readonly i18n = inject(I18nService);

  @Input() length = 0;
  @Input() pageIndex = 0;
  @Input() pageSize = 10;
  @Input() pageSizeOptions: number[] = [10, 20, 50];
  @Input() noun = 'items';
  @Input() disabled = false;
  @Output() page = new EventEmitter<PageChange>();

  get isLast(): boolean {
    return (this.pageIndex + 1) * this.pageSize >= this.length;
  }

  get summary(): string {
    if (this.length === 0) return this.i18n.t('common.none', { noun: this.noun });
    const from = this.pageIndex * this.pageSize + 1;
    const to = Math.min(this.length, (this.pageIndex + 1) * this.pageSize);
    return this.i18n.t('common.showing', {
      from: formatNumber(from),
      to: formatNumber(to),
      total: formatNumber(this.length),
      noun: this.noun,
    });
  }

  emit(pageIndex: number, pageSize: number): void {
    this.page.emit({ pageIndex, pageSize });
  }
}
