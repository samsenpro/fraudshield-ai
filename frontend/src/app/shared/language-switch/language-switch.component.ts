import { Component, inject } from '@angular/core';

import { TranslatePipe } from '../../core/i18n/i18n.pipes';
import { I18nService, LANGUAGES, Lang } from '../../core/i18n/i18n.service';

/** Compact EN | ES toggle, styled as the design system's segmented control. */
@Component({
  selector: 'app-language-switch',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="seg lang" role="radiogroup" [attr.aria-label]="'shell.language' | t">
      @for (option of languages; track option.value) {
        <button
          type="button"
          role="radio"
          class="seg__opt"
          [class.is-active]="i18n.lang() === option.value"
          [attr.aria-checked]="i18n.lang() === option.value"
          [attr.lang]="option.value"
          [attr.title]="option.name"
          (click)="select(option.value)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        flex: none;
      }
      .lang .seg__opt {
        padding: 7px 9px;
        font-size: 11px;
        letter-spacing: 0.04em;
      }
    `,
  ],
})
export class LanguageSwitchComponent {
  readonly i18n = inject(I18nService);
  readonly languages = LANGUAGES;

  select(lang: Lang): void {
    this.i18n.set(lang);
  }
}
