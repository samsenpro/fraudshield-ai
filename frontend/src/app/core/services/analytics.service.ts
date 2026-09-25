import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../api-config';
import { AnalyticsResponse } from '../models/analytics.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  constructor(private readonly http: HttpClient) {}

  get(): Observable<AnalyticsResponse> {
    return this.http.get<AnalyticsResponse>(`${API_BASE_URL}/analytics`);
  }
}
