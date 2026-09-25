import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface SegOption<T extends string = string> {
  value: T;
  label: string;
}

/** Bordered button group; the active option fills with the teal accent. */
@Component({
  selector: 'app-segmented',
  standalone: true,
  template: `
    <div class="seg" [class.seg--sm]="size === 'sm'" role="radiogroup" [attr.aria-label]="ariaLabel">
      @for (opt of options; track opt.value) {
        <button
          type="button"
          role="radio"
          class="seg__opt"
          [class.is-active]="opt.value === value"
          [attr.aria-checked]="opt.value === value"
          (click)="select(opt.value)"
        >
          {{ opt.label }}
        </button>
      }
    </div>
  `,
  styles: [':host { display: inline-flex; max-width: 100%; }'],
})
export class SegmentedComponent {
  @Input() options: SegOption[] = [];
  @Input() value = '';
  @Input() size: 'sm' | 'md' = 'md';
  @Input() ariaLabel = '';
  @Output() valueChange = new EventEmitter<string>();

  select(value: string): void {
    if (value !== this.value) {
      this.value = value;
      this.valueChange.emit(value);
    }
  }
}
