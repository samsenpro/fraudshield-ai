import { Component, Input } from '@angular/core';

const COLOR_BY_STATUS: Record<string, 'gray' | 'blue' | 'green' | 'orange' | 'red'> = {
  PENDING: 'gray',
  ANALYZING: 'blue',
  APPROVED: 'green',
  REVIEW: 'orange',
  BLOCKED: 'red',
  FAILED: 'red',
  LOW: 'green',
  MEDIUM: 'orange',
  HIGH: 'red',
  CRITICAL: 'red',
  APPROVE: 'green',
  BLOCK: 'red',
  OPEN: 'orange',
  INVESTIGATING: 'blue',
  RESOLVED: 'green',
  DISMISSED: 'gray',
  IN_REVIEW: 'blue',
  CONFIRMED_FRAUD: 'red',
  FALSE_POSITIVE: 'green',
  UNDETERMINED: 'gray',
};

@Component({
  selector: 'app-status-chip',
  standalone: true,
  template: `<span class="status-chip status-chip--{{ color }}">{{ label }}</span>`,
  styles: [
    `
      .status-chip {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.02em;
        text-transform: capitalize;
        white-space: nowrap;
      }
      .status-chip--gray {
        background: #eceff1;
        color: #455a64;
      }
      .status-chip--blue {
        background: #e3f2fd;
        color: #1565c0;
      }
      .status-chip--green {
        background: #e8f5e9;
        color: #2e7d32;
      }
      .status-chip--orange {
        background: #fff3e0;
        color: #ef6c00;
      }
      .status-chip--red {
        background: #ffebee;
        color: #c62828;
      }
    `,
  ],
})
export class StatusChipComponent {
  @Input() status = '';

  get color(): string {
    return COLOR_BY_STATUS[this.status] ?? 'gray';
  }

  get label(): string {
    return this.status.replaceAll('_', ' ').toLowerCase();
  }
}
