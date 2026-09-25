/**
 * Sample data from the redesign spec. Screens fall back to it when the API
 * has nothing to show yet, and it backs the panels the API doesn't serve
 * (model registry, reports, team, fraud categories, regional risk).
 */
import { RiskLevel } from '../models/risk.model';
import { riskColorOf } from '../ui/risk';
import { AlertItem, BarDatum, DonutSlice, Kpi, SeriesPoint, Stat, TransactionRow } from '../ui/view-models';

const TX_RAW: [string, string, string, number, number, string, number][] = [
  ['TX-98231', '2026-09-24T14:32:00', 'Maria Chen', 2480.00, 94, 'FRAUD DETECTED', 91],
  ['TX-98214', '2026-09-24T13:58:00', 'James Okafor', 156.20, 12, 'APPROVED', 3],
  ['TX-98203', '2026-09-24T13:41:00', 'Elena Petrova', 8920.00, 78, 'REVIEW', 64],
  ['TX-98197', '2026-09-24T12:55:00', 'David Kim', 45.99, 5, 'APPROVED', 1],
  ['TX-98188', '2026-09-24T12:20:00', 'Sara Al-Farsi', 3210.50, 67, 'REVIEW', 48],
  ['TX-98175', '2026-09-24T11:47:00', 'Lucas Ferreira', 99.00, 8, 'APPROVED', 2],
  ['TX-98162', '2026-09-24T11:12:00', 'Anika Sharma', 12400.00, 88, 'BLOCKED', 82],
  ['TX-98150', '2026-09-24T10:38:00', 'Tom Richardson', 310.75, 22, 'APPROVED', 6],
  ['TX-98141', '2026-09-24T09:59:00', 'Nina Kowalski', 5670.00, 55, 'REVIEW', 37],
  ['TX-98129', '2026-09-24T09:21:00', 'Carlos Mendes', 74.30, 9, 'APPROVED', 2],
  ['TX-98118', '2026-09-24T08:47:00', 'Yuki Tanaka', 1980.00, 34, 'APPROVED', 11],
  ['TX-98105', '2026-09-24T08:02:00', 'Omar Haddad', 18200.00, 96, 'FRAUD DETECTED', 93],
  ['TX-98097', '2026-09-23T22:14:00', 'Grace Adeyemi', 220.00, 15, 'APPROVED', 4],
  ['TX-98084', '2026-09-23T21:30:00', 'Peter Novak', 4050.00, 61, 'REVIEW', 44],
  ['TX-98071', '2026-09-23T20:47:00', 'Chloe Martin', 68.50, 7, 'APPROVED', 1],
  ['TX-98063', '2026-09-23T19:59:00', 'Ahmed Youssef', 9875.00, 83, 'BLOCKED', 77],
  ['TX-98052', '2026-09-23T19:12:00', 'Ingrid Larsen', 132.40, 18, 'APPROVED', 5],
  ['TX-98041', '2026-09-23T18:30:00', 'Ravi Patel', 2760.00, 41, 'APPROVED', 14],
];

export const DEMO_TRANSACTIONS: TransactionRow[] = TX_RAW.map(([id, occurredAt, user, amount, risk, status, prob]) => ({
  id,
  ref: id,
  occurredAt,
  party: user,
  partySub: null,
  amount,
  currency: 'USD',
  risk,
  probability: prob,
  status,
  link: ['/transactions', id],
}));

export const DEMO_TX_TOTAL = 1284392;

export const DEMO_KPIS: Kpi[] = [
  { label: 'kpi.totalTransactions', value: '1,284,392', delta: '+4.2%', deltaColor: 'var(--color-accent-2-800)', icon: 'bars', tone: 'teal' },
  { label: 'kpi.monitored', value: '184/sec', delta: 'LIVE', deltaColor: 'var(--color-accent-2-800)', icon: 'activity', tone: 'teal' },
  { label: 'kpi.fraudDetected', value: '3,842', delta: '-12.4%', deltaColor: 'var(--color-accent-2-800)', icon: 'alert', tone: 'red' },
  { label: 'kpi.blocked', value: '2,156', delta: '+6.1%', deltaColor: 'var(--color-accent-2-800)', icon: 'lock', tone: 'teal' },
  { label: 'kpi.avgRisk', value: '27', delta: '-3 pts', deltaColor: 'var(--color-accent-2-800)', icon: 'trend', tone: 'teal' },
  { label: 'kpi.detectionRate', value: '98.7%', delta: '+0.4%', deltaColor: 'var(--color-accent-2-800)', icon: 'shield-check', tone: 'teal' },
];

/** Daily detections; labels are ISO dates, formatted per locale by the dashboard. */
export const DEMO_FRAUD_DAILY: SeriesPoint[] = [42, 38, 51, 47, 63, 58, 72, 66, 49, 55, 61, 44, 39, 35].map((value, i) => ({
  label: `2026-09-${String(11 + i).padStart(2, '0')}`,
  value,
}));

export const DEMO_RISK_DISTRIBUTION: DonutSlice[] = [
  { label: 'Low risk', pct: 46, color: 'var(--risk-low)' },
  { label: 'Medium risk', pct: 31, color: 'var(--risk-medium)' },
  { label: 'High risk', pct: 15, color: 'var(--risk-high)' },
  { label: 'Critical', pct: 8, color: 'var(--risk-critical)' },
];

export const DEMO_AVG_RISK = 27;

export const DEMO_VOLUME: SeriesPoint[] = [812, 845, 798, 861, 902, 875, 918].map((value, i) => ({
  label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
  value,
}));

export const DEMO_FRAUD_CATEGORIES: BarDatum[] = [
  { label: 'Card Testing', value: 32 },
  { label: 'Account Takeover', value: 24 },
  { label: 'Synthetic Identity', value: 18 },
  { label: 'Chargeback Fraud', value: 14 },
  { label: 'Money Laundering', value: 8 },
  { label: 'Other', value: 4 },
];

/** 7 days × 6 four-hour windows, intensity 0–4. */
export const DEMO_HEATMAP: number[] = [
  1, 2, 4, 3, 1, 0,
  2, 3, 4, 4, 2, 1,
  0, 1, 3, 4, 3, 1,
  1, 2, 3, 3, 2, 0,
  3, 4, 4, 3, 2, 1,
  1, 1, 2, 2, 1, 0,
  0, 0, 1, 2, 1, 0,
];

/** [severity, title, transaction, risk, minutes ago] */
const ALERTS_RAW: [RiskLevel, string, string, number, number][] = [
  ['CRITICAL', 'Suspicious transaction detected', 'TX-98231', 94, 2],
  ['CRITICAL', 'Multiple failed authentication attempts', 'TX-98105', 96, 14],
  ['HIGH', 'Unusual velocity from single device', 'TX-98162', 88, 41],
  ['HIGH', 'Geolocation mismatch flagged by risk engine', 'TX-98063', 83, 60],
  ['MEDIUM', 'New payment method on high-value order', 'TX-98084', 61, 120],
  ['MEDIUM', 'Behavioral deviation from baseline', 'TX-98141', 55, 180],
];

export const DEMO_ALERTS: AlertItem[] = ALERTS_RAW.map(([severity, title, txRef, risk, minutesAgo], i) => ({
  id: `demo-alert-${i}`,
  severity,
  title,
  txRef,
  transactionId: txRef,
  risk,
  status: null,
  createdAt: new Date(Date.now() - minutesAgo * 60000).toISOString(),
}));

export const DEMO_ALERT_STATS: Stat[] = [
  { label: 'fraud.openAlerts', value: '12', color: 'var(--color-accent)' },
  { label: 'fraud.critical', value: '4', color: 'var(--color-accent)' },
  { label: 'fraud.avgResponse', value: '1.8s' },
  { label: 'fraud.casesResolved30', value: '286', color: 'var(--color-accent-2-800)' },
];

export const DEMO_TX_STATS: Stat[] = [
  { label: 'transactions.total', value: '1,284,392' },
  { label: 'transactions.approved', value: '1,231,842', color: 'var(--color-accent-2-800)' },
  { label: 'transactions.blocked', value: '2,156', color: 'var(--color-accent)' },
  { label: 'transactions.underReview', value: '648', color: 'var(--color-warning)' },
];

export interface ModelInfo {
  name: string;
  status: 'ACTIVE' | 'TRAINING';
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  trained: string;
  version: string;
}

export const DEMO_MODELS: ModelInfo[] = [
  { name: 'Anomaly Detection Engine', status: 'ACTIVE', accuracy: 96.2, precision: 94.8, recall: 95.5, f1: 95.1, trained: '2026-09-18', version: 'v3.2' },
  { name: 'Gradient Boosting Classifier', status: 'ACTIVE', accuracy: 94.8, precision: 92.1, recall: 93.4, f1: 92.7, trained: '2026-09-15', version: 'v2.9' },
  { name: 'Rule-Based Engine', status: 'ACTIVE', accuracy: 91.0, precision: 89.6, recall: 88.2, f1: 88.9, trained: '2026-09-10', version: 'v5.1' },
  { name: 'Deep Behavioral Model', status: 'TRAINING', accuracy: 88.3, precision: 85.7, recall: 86.9, f1: 86.3, trained: 'In progress', version: 'v0.8 (beta)' },
];

export const DEMO_MODEL_STATUS_MINI = [
  { name: 'Anomaly Detection Engine', status: 'ACTIVE', accuracy: 96 },
  { name: 'Gradient Boosting Classifier', status: 'ACTIVE', accuracy: 95 },
  { name: 'Rule-Based Engine', status: 'ACTIVE', accuracy: 91 },
];

export const PIPELINE_STAGES = [
  { label: 'Feature Engineering', icon: 'layers', detail: 'Velocity, device, geo and behavioral features' },
  { label: 'Anomaly Detection', icon: 'pulse', detail: 'Isolation forest over the customer baseline' },
  { label: 'ML Model Scoring', icon: 'cpu', detail: 'Gradient boosting fraud probability' },
  { label: 'Risk Engine → Score', icon: 'shield', detail: 'Thresholds → approve, review or block' },
];

export const DEMO_RISK_FACTORS: BarDatum[] = [
  { label: 'Velocity anomaly', value: 72, color: 'var(--risk-high)' },
  { label: 'Device fingerprint mismatch', value: 58, color: 'var(--risk-medium)' },
  { label: 'Geolocation risk', value: 45, color: 'var(--risk-medium)' },
  { label: 'Behavioral deviation', value: 33, color: 'var(--risk-low)' },
  { label: 'Historical fraud pattern', value: 21, color: 'var(--risk-low)' },
];

export const DEMO_REGION_RISK: BarDatum[] = [
  { label: 'North America', value: 24, color: 'var(--risk-low)' },
  { label: 'Europe', value: 31, color: 'var(--risk-medium)' },
  { label: 'Southeast Asia', value: 58, color: 'var(--risk-high)' },
  { label: 'Latin America', value: 47, color: 'var(--risk-medium)' },
  { label: 'West Africa', value: 66, color: 'var(--risk-high)' },
  { label: 'Middle East', value: 29, color: 'var(--risk-low)' },
];

export interface ReportInfo {
  id: string;
  name: string;
  type: string;
  range: string;
  generated: string;
  format: 'PDF' | 'XLSX' | 'CSV';
  size: string;
  status: 'READY' | 'GENERATING';
}

export const DEMO_REPORTS: ReportInfo[] = [
  { id: 'r1', name: 'Weekly Fraud Summary', type: 'Fraud Summary', range: 'Sep 15 – Sep 21', generated: '2026-09-22', format: 'PDF', size: '2.1 MB', status: 'READY' },
  { id: 'r2', name: 'Q3 Compliance Audit', type: 'Compliance', range: 'Jul 1 – Sep 24', generated: '2026-09-24', format: 'XLSX', size: '8.6 MB', status: 'READY' },
  { id: 'r3', name: 'Transaction Audit — East Region', type: 'Transaction Audit', range: 'Sep 1 – Sep 24', generated: '2026-09-24', format: 'CSV', size: '14.2 MB', status: 'READY' },
  { id: 'r4', name: 'Risk Assessment — August', type: 'Risk Assessment', range: 'Aug 1 – Aug 31', generated: '2026-09-01', format: 'PDF', size: '3.4 MB', status: 'READY' },
  { id: 'r5', name: 'Monthly Fraud Summary', type: 'Fraud Summary', range: 'Aug 1 – Aug 31', generated: '2026-09-01', format: 'PDF', size: '2.8 MB', status: 'READY' },
  { id: 'r6', name: 'Chargeback Fraud Deep Dive', type: 'Risk Assessment', range: 'Sep 1 – Sep 24', generated: '2026-09-23', format: 'XLSX', size: '5.1 MB', status: 'READY' },
];

export const DEMO_TEAM = [
  { name: 'Sarah Kim', email: 'sarah.kim@meridianfg.com', role: 'Fraud Analyst Lead', status: 'Active', lastActive: '2 min ago' },
  { name: 'Marcus Webb', email: 'marcus.webb@meridianfg.com', role: 'Risk Analyst', status: 'Active', lastActive: '18 min ago' },
  { name: 'Priya Nair', email: 'priya.nair@meridianfg.com', role: 'Compliance Officer', status: 'Active', lastActive: '1 hr ago' },
  { name: 'Daniel Osei', email: 'daniel.osei@meridianfg.com', role: 'ML Engineer', status: 'Active', lastActive: '3 hr ago' },
  { name: 'Laura Bianchi', email: 'laura.bianchi@meridianfg.com', role: 'Fraud Analyst', status: 'Away', lastActive: 'Yesterday' },
];

export const DEMO_API_KEYS = [
  { name: 'Production API Key', masked: 'fs_live_••••••••••••8231' },
  { name: 'Sandbox API Key', masked: 'fs_test_••••••••••••4402' },
];

/** A sample risk assessment for the detail page of a sample transaction. */
export function demoRiskFor(row: TransactionRow) {
  const score = row.risk ?? 0;
  const color = riskColorOf(score);
  return {
    score,
    color,
    signals: DEMO_RISK_FACTORS.slice(0, score >= 70 ? 4 : score >= 40 ? 3 : 1).map((f) => ({
      code: f.label.toUpperCase().replaceAll(' ', '_'),
      value: Math.min(99, Math.round((f.value * score) / 60)),
    })),
  };
}
