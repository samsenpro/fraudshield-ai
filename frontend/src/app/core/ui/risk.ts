import { activeLocale } from '../i18n/i18n.service';
import { RiskLevel } from '../models/risk.model';

export type BadgeTone = 'danger' | 'warning' | 'success' | 'neutral';

export const RISK_COLOR: Record<RiskLevel, string> = {
  LOW: 'var(--risk-low)',
  MEDIUM: 'var(--risk-medium)',
  HIGH: 'var(--risk-high)',
  CRITICAL: 'var(--risk-critical)',
};

/** Level for a 0–100 score, on the same cut points the redesign uses. */
export function riskLevelOf(score: number): RiskLevel {
  if (score >= 90) return 'CRITICAL';
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

export function riskColorOf(score: number): string {
  return RISK_COLOR[riskLevelOf(score)];
}

/** The API scores 0–1; every screen shows 0–100. */
export function toPercent(value: number | null | undefined): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return Math.round((value <= 1 ? value * 100 : value) * 10) / 10;
}

const TONE_BY_STATUS: Record<string, BadgeTone> = {
  'FRAUD DETECTED': 'danger',
  BLOCKED: 'danger',
  BLOCK: 'danger',
  FAILED: 'danger',
  CRITICAL: 'danger',
  HIGH: 'danger',
  CONFIRMED_FRAUD: 'danger',
  OPEN: 'danger',
  REVIEW: 'warning',
  MEDIUM: 'warning',
  IN_REVIEW: 'warning',
  INVESTIGATING: 'warning',
  TRAINING: 'warning',
  ANALYZING: 'warning',
  AWAY: 'warning',
  APPROVED: 'success',
  APPROVE: 'success',
  LOW: 'success',
  RESOLVED: 'success',
  FALSE_POSITIVE: 'success',
  ACTIVE: 'success',
  READY: 'success',
  PENDING: 'neutral',
  DISMISSED: 'neutral',
  UNDETERMINED: 'neutral',
  GENERATING: 'neutral',
};

export function toneOf(status: string): BadgeTone {
  return TONE_BY_STATUS[status.toUpperCase()] ?? 'neutral';
}

export function statusLabel(status: string): string {
  return status.replaceAll('_', ' ').toUpperCase();
}

export const SEVERITY_COLOR: Record<RiskLevel, string> = {
  CRITICAL: 'var(--risk-critical)',
  HIGH: 'var(--risk-high)',
  MEDIUM: 'var(--risk-medium)',
  LOW: 'var(--risk-low)',
};

export function relativeTime(iso: string, lang: 'en' | 'es' = 'en', now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  const es = lang === 'es';
  if (min < 1) return es ? 'justo ahora' : 'just now';
  if (min < 60) return es ? `hace ${min} min` : `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return es ? `hace ${hr} h` : `${hr} hr ago`;
  const days = Math.floor(hr / 24);
  if (days === 1) return es ? 'Ayer' : 'Yesterday';
  return es ? `hace ${days} días` : `${days} days ago`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(activeLocale()).format(value);
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(activeLocale(), { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString(activeLocale(), { month: 'short', day: 'numeric', year: 'numeric' });
  const time = d.toLocaleTimeString(activeLocale(), { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date} ${time}`;
}

/** Short, human-scannable reference for a UUID ("TX-3F9A21"). */
export function shortRef(prefix: string, id: string): string {
  return `${prefix}-${id.replaceAll('-', '').slice(0, 6).toUpperCase()}`;
}

export function downloadFile(filename: string, content: string, type = 'text/csv;charset=utf-8'): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function toCsv(rows: (string | number | null)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const text = cell === null ? '' : String(cell);
          return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
        })
        .join(','),
    )
    .join('\n');
}
