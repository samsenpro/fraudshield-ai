import { ChangeDetectionStrategy, Component, Input, OnChanges, signal } from '@angular/core';

import { SeriesPoint } from '../../core/ui/view-models';

interface PlotPoint {
  x: number;
  y: number;
  label: string;
  value: number;
}

const W = 700;
const H = 200;
const BASE = 190;
const SPAN = 160;

/** Area + line chart on the 700×200 grid of the spec, with hover read-out. */
@Component({
  selector: 'app-line-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="line-chart" (mouseleave)="active.set(null)">
      <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" preserveAspectRatio="none" role="img" [attr.aria-label]="ariaLabel">
        <line x1="0" y1="50" [attr.x2]="W" y2="50" class="grid"></line>
        <line x1="0" y1="100" [attr.x2]="W" y2="100" class="grid"></line>
        <line x1="0" y1="150" [attr.x2]="W" y2="150" class="grid"></line>
        <path [attr.d]="areaPath" class="area" [attr.fill]="color"></path>
        <path
          [attr.d]="linePath"
          class="line"
          [attr.stroke]="color"
          vector-effect="non-scaling-stroke"
        ></path>
        @if (active(); as a) {
          <line [attr.x1]="a.x" y1="0" [attr.x2]="a.x" [attr.y2]="BASE" class="cursor"></line>
        }
      </svg>
      <!-- points drawn in HTML so they stay round when the SVG stretches -->
      @for (p of points; track p.x; let i = $index) {
        <button
          type="button"
          class="dot"
          [class.is-active]="active() === p"
          [style.left.%]="(p.x / W) * 100"
          [style.top.%]="(p.y / H) * 100"
          [style.background]="color"
          [style.animation-delay.ms]="300 + i * 35"
          (mouseenter)="active.set(p)"
          (focus)="active.set(p)"
          (blur)="active.set(null)"
          [attr.aria-label]="p.label + ': ' + p.value + ' ' + unit"
        ></button>
      }
      @if (active(); as a) {
        <div
          class="tip"
          [style.left.%]="(a.x / W) * 100"
          [style.top.%]="(a.y / H) * 100"
          [class.tip--left]="a.x > W * 0.8"
          [class.tip--right]="a.x < W * 0.2"
        >
          <span class="tip__label">{{ a.label }}</span>
          <span class="tip__value">{{ a.value }} {{ unit }}</span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        container-type: inline-size;
      }
      /* the spec's 700×200 proportions, never shorter than 170px */
      .line-chart {
        position: relative;
        height: max(170px, calc(100cqw * 200 / 700));
      }
      svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
        overflow: visible;
        animation: line-reveal 1s var(--ease-out) backwards;
      }
      @keyframes line-reveal {
        from {
          clip-path: inset(0 100% 0 0);
        }
        to {
          clip-path: inset(0 0 0 0);
        }
      }
      .grid {
        stroke: var(--color-divider);
        stroke-width: 1;
        vector-effect: non-scaling-stroke;
      }
      .area {
        fill-opacity: 0.1;
        animation: fs-fade-in 0.8s ease 0.25s backwards;
      }
      .line {
        fill: none;
        stroke-width: 2.5;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .cursor {
        stroke: var(--color-neutral-500);
        stroke-width: 1;
        stroke-dasharray: 3 3;
        vector-effect: non-scaling-stroke;
      }
      .dot {
        position: absolute;
        width: 6px;
        height: 6px;
        padding: 0;
        margin: -3px 0 0 -3px;
        border: 0;
        border-radius: 50%;
        cursor: pointer;
        animation: fs-fade-in 0.3s ease backwards;
        transition: transform 0.15s var(--ease-out), box-shadow 0.15s;
      }
      .dot::before {
        content: '';
        position: absolute;
        inset: -8px;
      }
      .dot.is-active,
      .dot:focus-visible {
        transform: scale(1.8);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-bg) 70%, transparent);
        outline: none;
      }
      .tip {
        position: absolute;
        transform: translate(-50%, calc(-100% - 12px));
        background: var(--color-bg);
        border: 1px solid var(--color-divider);
        box-shadow: var(--shadow-md);
        padding: 6px 10px;
        display: flex;
        flex-direction: column;
        pointer-events: none;
        white-space: nowrap;
        z-index: 2;
        animation: fs-fade-in 0.12s ease backwards;
      }
      .tip--left {
        transform: translate(calc(-100% + 12px), calc(-100% - 12px));
      }
      .tip--right {
        transform: translate(-12px, calc(-100% - 12px));
      }
      .tip__label {
        font-size: 10.5px;
        color: var(--color-neutral-700);
      }
      .tip__value {
        font-size: 13px;
        font-weight: 700;
      }
    `,
  ],
})
export class LineChartComponent implements OnChanges {
  @Input() data: SeriesPoint[] = [];
  @Input() color = 'var(--color-accent)';
  @Input() unit = '';
  @Input() ariaLabel = 'Line chart';
  /** Fixed ceiling (the spec uses 80); defaults to a padded max of the data. */
  @Input() max: number | null = null;

  readonly W = W;
  readonly H = H;
  readonly BASE = BASE;
  readonly active = signal<PlotPoint | null>(null);

  points: PlotPoint[] = [];
  linePath = '';
  areaPath = '';

  ngOnChanges(): void {
    const values = this.data.map((d) => d.value);
    const ceiling = this.max ?? Math.max(1, Math.ceil(Math.max(0, ...values) * 1.15));
    const step = this.data.length > 1 ? W / (this.data.length - 1) : 0;
    this.points = this.data.map((d, i) => ({
      x: +(i * step).toFixed(1),
      y: +(BASE - (d.value / ceiling) * SPAN).toFixed(1),
      label: d.label,
      value: d.value,
    }));
    if (this.points.length === 1) {
      this.points = [{ ...this.points[0], x: W / 2 }];
    }
    this.linePath = this.points.length ? 'M' + this.points.map((p) => `${p.x},${p.y}`).join(' L') : '';
    const first = this.points[0]?.x ?? 0;
    const last = this.points[this.points.length - 1]?.x ?? W;
    this.areaPath = this.linePath ? `${this.linePath} L${last},${BASE} L${first},${BASE} Z` : '';
    this.active.set(null);
  }
}
