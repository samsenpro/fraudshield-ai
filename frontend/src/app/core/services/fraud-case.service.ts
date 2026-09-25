import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../api-config';
import { FraudCase, ResolveFraudCaseRequest } from '../models/fraud-case.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class FraudCaseService {
  constructor(private readonly http: HttpClient) {}

  list(page: number, size: number): Observable<Page<FraudCase>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', 'createdAt,desc');
    return this.http.get<Page<FraudCase>>(`${API_BASE_URL}/fraud-cases`, { params });
  }

  get(id: string): Observable<FraudCase> {
    return this.http.get<FraudCase>(`${API_BASE_URL}/fraud-cases/${id}`);
  }

  createFromAlert(alertId: string): Observable<FraudCase> {
    return this.http.post<FraudCase>(`${API_BASE_URL}/fraud-cases`, { alertId });
  }

  review(id: string): Observable<FraudCase> {
    return this.http.post<FraudCase>(`${API_BASE_URL}/fraud-cases/${id}/review`, {});
  }

  resolve(id: string, request: ResolveFraudCaseRequest): Observable<FraudCase> {
    return this.http.patch<FraudCase>(`${API_BASE_URL}/fraud-cases/${id}`, request);
  }
}
