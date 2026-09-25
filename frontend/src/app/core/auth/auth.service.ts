import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { API_BASE_URL } from '../api-config';
import { AuthResponse, CurrentUser, LoginRequest, RegisterRequest, Role } from '../models/auth.model';
import { decodeJwt, isExpired } from './jwt.util';

const TOKEN_KEY = 'fraudshield.token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly currentUserSignal = signal<CurrentUser | null>(this.readUserFromStorage());

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);

  constructor(private readonly http: HttpClient) {}

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_BASE_URL}/auth/login`, request)
      .pipe(tap((response) => this.storeSession(response)));
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_BASE_URL}/auth/register`, request)
      .pipe(tap((response) => this.storeSession(response)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.currentUserSignal.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  hasAnyRole(...roles: Role[]): boolean {
    const user = this.currentUserSignal();
    return user !== null && roles.includes(user.role);
  }

  private storeSession(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    this.currentUserSignal.set(this.toCurrentUser(response.accessToken));
  }

  private readUserFromStorage(): CurrentUser | null {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? this.toCurrentUser(token) : null;
  }

  private toCurrentUser(token: string): CurrentUser | null {
    const claims = decodeJwt(token);
    if (!claims || isExpired(claims)) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return {
      email: claims.sub,
      role: claims.role as Role,
      organizationId: claims.organizationId,
      userId: claims.userId,
    };
  }
}
