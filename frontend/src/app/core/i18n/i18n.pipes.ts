import { Pipe, PipeTransform, inject } from '@angular/core';

import { formatDateTime, formatMoney, formatNumber, relativeTime } from '../ui/risk';
import { I18nService } from './i18n.service';

/** {{ 'dashboard.title' | t }} — impure so it follows a language switch. */
@Pipe({ name: 't', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: string, params?: Record<string, string | number>): string {
    return this.i18n.t(key, params);
  }
}

/** {{ status | lit }} — translates data literals such as status codes. */
@Pipe({ name: 'lit', standalone: true, pure: false })
export class LiteralPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(text: string | null | undefined): string {
    return this.i18n.lit(text);
  }
}

type DateStyle = 'datetime' | 'medium' | 'date' | 'ago';

/** Locale-aware dates: 'datetime' (Sep 24, 2026 14:32), 'medium' (with seconds), 'date', 'ago'. */
@Pipe({ name: 'fsDate', standalone: true, pure: false })
export class LocalDatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(iso: string | null | undefined, style: DateStyle = 'datetime'): string {
    if (!iso) return '';
    const lang = this.i18n.lang();
    const locale = this.i18n.locale();
    if (style === 'ago') return relativeTime(iso, lang);
    if (style === 'datetime') return formatDateTime(iso);
    // A bare "YYYY-MM-DD" is a calendar day, not UTC midnight.
    const date = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
    if (style === 'date') {
      return date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return date.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'medium' });
  }
}

/** Locale-aware money: {{ amount | fsMoney: 'USD' }}. */
@Pipe({ name: 'fsMoney', standalone: true, pure: false })
export class MoneyPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(amount: number | null | undefined, currency: string): string {
    this.i18n.lang();
    return amount === null || amount === undefined ? '' : formatMoney(amount, currency);
  }
}

/** Locale-aware integer grouping: {{ 1284392 | fsNumber }}. */
@Pipe({ name: 'fsNumber', standalone: true, pure: false })
export class NumberPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(value: number | null | undefined): string {
    this.i18n.lang();
    return value === null || value === undefined ? '' : formatNumber(value);
  }
}

export const I18N_PIPES = [TranslatePipe, LiteralPipe, LocalDatePipe, MoneyPipe, NumberPipe] as const;
