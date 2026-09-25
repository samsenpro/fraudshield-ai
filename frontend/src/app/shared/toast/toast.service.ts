import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'danger' | 'info';

export interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  text?: string;
}

/** Transient notifications, rendered by <app-toast-host> in the app root. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  readonly toasts = signal<Toast[]>([]);

  show(tone: ToastTone, title: string, text?: string, durationMs = 4000): void {
    const toast: Toast = { id: this.nextId++, tone, title, text };
    this.toasts.update((list) => [...list.slice(-3), toast]);
    setTimeout(() => this.dismiss(toast.id), durationMs);
  }

  success(title: string, text?: string): void {
    this.show('success', title, text);
  }

  error(title: string, text?: string): void {
    this.show('danger', title, text, 6000);
  }

  info(title: string, text?: string): void {
    this.show('info', title, text);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
