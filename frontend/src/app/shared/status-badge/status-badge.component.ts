import { Component, Input, inject } from '@angular/core';

import { I18nService } from '../../core/i18n/i18n.service';
import { statusLabel, toneOf } from '../../core/ui/risk';

/** Square status badge tinted from the danger / warning / success / neutral pairs. */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `<span class="badge badge--{{ tone }}" [class.badge--sm]="size === 'sm'">{{ label }}</span>`,
  styles: [':host { display: inline-flex; }'],
})
export class StatusBadgeComponent {
  private readonly i18n = inject(I18nService);

  @Input({ required: true }) status = '';
  @Input() size: 'sm' | 'md' = 'md';

  get tone(): string {
    return toneOf(this.status);
  }

  get label(): string {
    return this.i18n.lit(statusLabel(this.status));
  }
}
