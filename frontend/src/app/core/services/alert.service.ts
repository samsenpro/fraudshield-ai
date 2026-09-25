import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../api-config';
import { Alert } from '../models/alert.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class AlertService {
  constructor(private readonly http: HttpClient) {}

  list(page: number, size: number): Observable<Page<Alert>> {
    const params = new HttpParams().set('page', page).set('size', size).set('sort', 'createdAt,desc');
    return this.http.get<Page<Alert>>(`${API_BASE_URL}/alerts`, { params });
  }

  get(id: string): Observable<Alert> {
    return this.http.get<Alert>(`${API_BASE_URL}/alerts/${id}`);
  }
}
