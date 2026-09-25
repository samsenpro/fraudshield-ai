import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';

import { TranslatePipe } from '../../core/i18n/i18n.pipes';
import { IconComponent } from '../icon/icon.component';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal on the top elevation. Render it inside an @if; it traps focus,
 * closes on Escape or a backdrop click, and gives focus back on close.
 * Put the action buttons in an element with the `dialog-actions` attribute.
 */
@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [IconComponent, TranslatePipe],
  template: `
    <div class="dialog-backdrop" (mousedown)="onBackdrop($event)">
      <div
        #panel
        class="dialog"
        [class.dialog--wide]="wide"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
      >
        <div class="dialog__head">
          <div>
            <h2 class="dialog-title" [id]="titleId">{{ title }}</h2>
            @if (subtitle) {
              <div class="dialog__subtitle">{{ subtitle }}</div>
            }
          </div>
          <button type="button" class="icon-btn" (click)="closed.emit()" [attr.aria-label]="'common.close' | t">
            <app-icon name="x" [size]="16"></app-icon>
          </button>
        </div>
        <div class="dialog-body">
          <ng-content></ng-content>
        </div>
        <div class="dialog-actions">
          <ng-content select="[dialog-actions]"></ng-content>
        </div>
      </div>
    </div>
  `,
})
export class DialogComponent implements AfterViewInit, OnDestroy {
  private static nextId = 0;

  @Input({ required: true }) title = '';
  @Input() subtitle = '';
  @Input() wide = false;
  @Output() closed = new EventEmitter<void>();

  @ViewChild('panel', { static: true }) panel!: ElementRef<HTMLElement>;

  readonly titleId = `fs-dialog-title-${DialogComponent.nextId++}`;
  private readonly previouslyFocused = document.activeElement as HTMLElement | null;

  ngAfterViewInit(): void {
    document.body.style.overflow = 'hidden';
    const target =
      this.panel.nativeElement.querySelector<HTMLElement>('.dialog-body ' + FOCUSABLE.split(', ').join(', .dialog-body ')) ??
      this.panel.nativeElement.querySelector<HTMLElement>(FOCUSABLE);
    setTimeout(() => target?.focus());
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
    this.previouslyFocused?.focus?.();
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closed.emit();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.stopPropagation();
      this.closed.emit();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = Array.from(this.panel.nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
