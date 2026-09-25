import { Alert } from '../models/alert.model';
import { RiskAssessment } from '../models/risk.model';
import { Transaction } from '../models/transaction.model';
import { shortRef, toPercent } from './risk';
import { AlertItem, TransactionRow } from './view-models';

/** The API status, shown the way analysts read it ("FRAUD DETECTED" for a critical block). */
function displayStatus(transaction: Transaction, risk: RiskAssessment | null): string {
  if (transaction.status === 'BLOCKED' && risk?.riskLevel === 'CRITICAL') return 'FRAUD DETECTED';
  return transaction.status;
}

export function toTransactionRow(transaction: Transaction, risk: RiskAssessment | null): TransactionRow {
  return {
    id: transaction.id,
    ref: shortRef('TX', transaction.id),
    occurredAt: transaction.occurredAt,
    party: transaction.merchant,
    partySub: [transaction.city, transaction.country].filter(Boolean).join(', '),
    amount: transaction.amount,
    currency: transaction.currency,
    risk: toPercent(risk?.riskScore),
    probability: toPercent(risk?.confidence),
    status: displayStatus(transaction, risk),
    link: ['/transactions', transaction.id],
  };
}

export function toAlertItem(alert: Alert): AlertItem {
  return {
    id: alert.id,
    severity: alert.severity,
    title: humanizeReason(alert.reason),
    txRef: shortRef('TX', alert.transactionId),
    transactionId: alert.transactionId,
    risk: null,
    status: alert.status,
    createdAt: alert.createdAt,
  };
}

/** Alert reasons arrive as signal codes ("HIGH_VELOCITY, NEW_DEVICE"); make them readable. */
export function humanizeReason(reason: string): string {
  if (!reason) return 'Suspicious transaction detected';
  if (/^[A-Z0-9_,\s]+$/.test(reason)) {
    const text = reason
      .split(',')
      .map((part) => part.trim().replaceAll('_', ' ').toLowerCase())
      .filter(Boolean)
      .join(' · ');
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  return reason;
}
