export type Role = 'ADMIN' | 'ANALYST' | 'REVIEWER' | 'USER';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  organizationName: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  email: string;
  role: Role;
}

export interface CurrentUser {
  email: string;
  role: Role;
  organizationId: string;
  userId: string;
}
