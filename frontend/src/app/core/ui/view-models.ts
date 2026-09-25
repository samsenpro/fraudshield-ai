import { RiskLevel } from '../models/risk.model';

/** A transaction row as every table in the app renders it (real or sample). */
export interface TransactionRow {
  id: string;
  ref: string;
  /** ISO timestamp. */
  occurredAt: string;
  party: string;
  partySub: string | null;
  amount: number;
  currency: string;
  risk: number | null;
  probability: number | null;
  status: string;
  /** Router link to the detail page, or null when the row can't be opened. */
  link: string[] | null;
}

export interface AlertItem {
  id: string;
  severity: RiskLevel;
  title: string;
  txRef: string;
  transactionId: string | null;
  risk: number | null;
  status: string | null;
  /** ISO timestamp. */
  createdAt: string;
}

export interface Kpi {
  /** i18n key. */
  label: string;
  value: string;
  delta: string;
  deltaColor: string;
  icon: string;
  tone: 'teal' | 'red';
}

export interface Stat {
  /** i18n key. */
  label: string;
  value: string;
  color?: string;
}

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
  /** Text on the right; defaults to `${value}%`. */
  display?: string;
}

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface DonutSlice {
  label: string;
  pct: number;
  color: string;
}
