import { Inject, Injectable } from '@angular/core';
import { APP_CONFIG, AppConfig } from '../shared/app-config';

export type LoginRequest = {
  email: string;
  passwordHash: string;
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly tokenKey = 'auth_token';
  private readonly clientUuidKey = 'client_uuid';

  constructor(@Inject(APP_CONFIG) private config: AppConfig) { }

  async login(req: LoginRequest): Promise<void> {
    const res = await fetch(`${this.config.apiBase}/api/v1/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(req)
    });

    if (!res.ok) {
      throw new Error('Falha no Login');
    }

    const authHeader = res.headers.get('Authorization');
    const clientUuid = res.headers.get('ClientUuid');

    if (!authHeader) {
      throw new Error('Authorization header not found');
    }

    if (!clientUuid) {
      throw new Error('clientUuid header not found');
    }

    this.setToken(authHeader);
    this.setClientUuid(clientUuid);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    if (!token || !token.trim()) return;
    sessionStorage.setItem(this.tokenKey, token);
  }

  getClientUuid(): string | null {
    return sessionStorage.getItem(this.clientUuidKey);
  }

  setClientUuid(clientUuid: string): void {
    if (!clientUuid || !clientUuid.trim()) return;
    sessionStorage.setItem(this.clientUuidKey, clientUuid);
  }

  updateTokenFromResponse(res: Response): void {
    const renewedToken = res.headers.get('Authorization');
    if (renewedToken && renewedToken.trim()) {
      this.setToken(renewedToken);
    }

    const renewedClientUuid = res.headers.get('ClientUuid');
    if (renewedClientUuid && renewedClientUuid.trim()) {
      this.setClientUuid(renewedClientUuid);
    }
  }

  buildAuthHeaders(extraHeaders?: Record<string, string>): Record<string, string> {
    const token = this.getToken();

    return {
      ...(extraHeaders ?? {}),
      ...(token ? { 'Authorization': token } : {})
    };
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.clientUuidKey);
  }
}