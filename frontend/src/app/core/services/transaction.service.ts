import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../api-config';
import { Page } from '../models/page.model';
import { RiskAssessment } from '../models/risk.model';
import { CreateTransactionRequest, Transaction } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  constructor(private readonly http: HttpClient) {}

  list(page: number, size: number): Observable<Page<Transaction>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', 'createdAt,desc');
    return this.http.get<Page<Transaction>>(`${API_BASE_URL}/transactions`, { params });
  }

  get(id: string): Observable<Transaction> {
    return this.http.get<Transaction>(`${API_BASE_URL}/transactions/${id}`);
  }

  getRisk(id: string): Observable<RiskAssessment> {
    return this.http.get<RiskAssessment>(`${API_BASE_URL}/transactions/${id}/risk`);
  }

  create(request: CreateTransactionRequest): Observable<Transaction> {
    return this.http.post<Transaction>(`${API_BASE_URL}/transactions`, request);
  }
}
