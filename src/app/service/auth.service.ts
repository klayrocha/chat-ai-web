import { Injectable } from '@angular/core';

export type LoginRequest = {
  email: string;
  passwordHash: string;
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  apiBase = 'http://localhost:8080';
  private tokenKey = 'auth_token';
  private clientUuid = 'client_uuid';

  async login(req: LoginRequest): Promise<void> {
    const res = await fetch(`${this.apiBase}/api/v1/auth`, {
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

    sessionStorage.setItem(this.tokenKey, authHeader);
    sessionStorage.setItem(this.clientUuid, clientUuid);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  getClientUuid(): string | null {
    return sessionStorage.getItem(this.clientUuid);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.clientUuid);
  }
}