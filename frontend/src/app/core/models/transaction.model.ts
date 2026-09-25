export type TransactionStatus = 'PENDING' | 'ANALYZING' | 'APPROVED' | 'REVIEW' | 'BLOCKED' | 'FAILED';

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  currency: string;
  merchant: string;
  country: string;
  city: string | null;
  status: TransactionStatus;
  occurredAt: string;
  createdAt: string;
}

export interface CreateTransactionRequest {
  accountId: string;
  amount: number;
  currency: string;
  merchant: string;
  country: string;
  city?: string;
  ipAddress?: string;
  deviceId?: string;
  timestamp: string;
}
