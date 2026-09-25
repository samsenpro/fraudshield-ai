import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/** Lucide-style outline paths (24×24, stroke 2) used across the app. */
const ICONS: Record<string, string> = {
  dashboard: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
  transactions: 'M4 7h16M8 7v13a1 1 0 001 1h6a1 1 0 001-1V7M9 11h6M9 15h6',
  fraud: 'M12 2l8 4v6c0 5-3.5 8.9-8 11-4.5-2.1-8-6-8-11V6l8-4zM12 8v5M12 16h.01',
  risk: 'M3 17l6-6 4 4 8-8M14 3h7v7',
  trend: 'M3 17l6-6 4 4 8-8M14 3h7v7',
  cpu: 'M9 2h6v3H9zM9 19h6v3H9zM2 9h3v6H2zM19 9h3v6h-3zM7 7h10v10H7z',
  reports: 'M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zM15 2v5h5M8 13h8M8 17h8',
  settings:
    'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82M4.6 9a1.65 1.65 0 00-.33-1.82M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M3 12h2M19 12h2',
  logo: 'M12 2l8 4v6c0 5-3.5 8.9-8 11-4.5-2.1-8-6-8-11V6l8-4zM9.5 12l1.8 1.8L15 10',
  shield: 'M12 2l8 4v6c0 5-3.5 8.9-8 11-4.5-2.1-8-6-8-11V6l8-4z',
  'shield-check': 'M9 12l2 2 4-4M12 2l8 4v6c0 5-3.5 8.9-8 11-4.5-2.1-8-6-8-11V6l8-4z',
  bars: 'M3 7h5v13H3zM10 3h4v17h-4zM17 11h4v9h-4z',
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  pulse: 'M3 12h4l3-8 4 16 3-8h4',
  layers: 'M4 4h16v4H4zM4 10h10v4H4zM4 16h7v4H4',
  alert: 'M12 9v4M12 17h.01M10.3 3.9L2.7 17.1a1.7 1.7 0 001.5 2.5h15.6a1.7 1.7 0 001.5-2.5L13.7 3.9a1.7 1.7 0 00-3.4 0z',
  lock: 'M5 11h14v9H5zM8 11V7a4 4 0 018 0v4',
  download: 'M12 3v12m0 0l-4-4m4 4l4-4M4 21h16',
  bell: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
  menu: 'M3 6h18M3 12h18M3 18h18',
  'chevron-left': 'M15 18l-6-6 6-6',
  'chevron-right': 'M9 18l6-6-6-6',
  'chevron-down': 'M6 9l6 6 6-6',
  'arrow-left': 'M19 12H5M11 18l-6-6 6-6',
  'arrow-right': 'M5 12h14M13 6l6 6-6 6',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35',
  plus: 'M12 5v14M5 12h14',
  x: 'M18 6L6 18M6 6l12 12',
  check: 'M20 6L9 17l-5-5',
  info: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 16v-4M12 8h.01',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  key: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  building: 'M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1',
  file: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6',
  inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z',
  'wifi-off': 'M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01',
  clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
  globe: 'M12 22a10 10 0 100-20 10 10 0 000 20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z',
  gavel: 'M14 13l-7.5 7.5a2.12 2.12 0 01-3-3L11 10M16 16l6-6M8 8l6-6M9 7l8 8M21 11l-8-8',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 100-6 3 3 0 000 6z',
  copy: 'M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2zM5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1',
};

@Component({
  selector: 'app-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="none"
      [attr.stroke]="color"
      [attr.stroke-width]="stroke"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path [attr.d]="path"></path>
    </svg>
  `,
  styles: [':host { display: inline-flex; flex: none; line-height: 0; } svg { display: block; }'],
})
export class IconComponent {
  @Input({ required: true }) name = '';
  @Input() size = 18;
  @Input() stroke = 2;
  @Input() color = 'currentColor';

  get path(): string {
    return ICONS[this.name] ?? ICONS['info'];
  }
}
