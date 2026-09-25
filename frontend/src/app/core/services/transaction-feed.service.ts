import { Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';

import { toTransactionRow } from '../ui/mappers';
import { TransactionRow } from '../ui/view-models';
import { TransactionService } from './transaction.service';

export interface TransactionPage {
  rows: TransactionRow[];
  total: number;
}

/**
 * A page of transactions joined with each one's risk assessment, so tables
 * can show risk score and confidence next to the transaction.
 */
@Injectable({ providedIn: 'root' })
export class TransactionFeedService {
  constructor(private readonly transactions: TransactionService) {}

  page(pageIndex: number, pageSize: number): Observable<TransactionPage> {
    return this.transactions.list(pageIndex, pageSize).pipe(
      switchMap((page) => {
        if (page.content.length === 0) {
          return of({ rows: [], total: page.totalElements });
        }
        const withRisk = page.content.map((tx) =>
          this.transactions.getRisk(tx.id).pipe(
            catchError(() => of(null)),
            map((risk) => toTransactionRow(tx, risk)),
          ),
        );
        return forkJoin(withRisk).pipe(map((rows) => ({ rows, total: page.totalElements })));
      }),
    );
  }
}
