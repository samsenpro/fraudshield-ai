import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

export interface BarItem {
  label: string;
  value: number;
  colorClass?: 'gray' | 'blue' | 'green' | 'orange' | 'red';
}

@Component({
  selector: 'app-bar-list',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="bar-list">
      @for (item of items; track item.label) {
        <div class="bar-list__row">
          <span class="bar-list__label">{{ item.label }}</span>
          <div class="bar-list__track">
            <div
              class="bar-list__fill"
              [ngClass]="'bar-list__fill--' + (item.colorClass ?? 'blue')"
              [style.width.%]="widthPercent(item.value)"
            ></div>
          </div>
          <span class="bar-list__value">{{ item.value }}</span>
        </div>
      } @empty {
        <p class="bar-list__empty">No data yet.</p>
      }
    </div>
  `,
  styles: [
    `
      .bar-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .bar-list__row {
        display: grid;
        grid-template-columns: 110px 1fr 40px;
        align-items: center;
        gap: 8px;
      }
      .bar-list__label {
        font-size: 13px;
        color: #455a64;
        text-transform: capitalize;
      }
      .bar-list__track {
        height: 10px;
        border-radius: 6px;
        background: #eceff1;
        overflow: hidden;
      }
      .bar-list__fill {
        height: 100%;
        border-radius: 6px;
        transition: width 0.2s ease;
      }
      .bar-list__fill--gray {
        background: #90a4ae;
      }
      .bar-list__fill--blue {
        background: #42a5f5;
      }
      .bar-list__fill--green {
        background: #66bb6a;
      }
      .bar-list__fill--orange {
        background: #ffa726;
      }
      .bar-list__fill--red {
        background: #ef5350;
      }
      .bar-list__value {
        text-align: right;
        font-size: 13px;
        font-weight: 600;
        color: #37474f;
      }
      .bar-list__empty {
        color: #90a4ae;
        font-size: 13px;
      }
    `,
  ],
})
export class BarListComponent {
  @Input() items: BarItem[] = [];

  widthPercent(value: number): number {
    const max = Math.max(...this.items.map((i) => i.value), 1);
    return (value / max) * 100;
  }
}
