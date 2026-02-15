import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { parseApiError } from '../shared/api-error';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  apiBase = 'http://localhost:8080';

  constructor(private auth: AuthService, private router: Router) { }

  private async handleAuthError(res: Response): Promise<void> {
    if (res.status === 401 || res.status === 403) {
      this.auth.logout();
      await this.router.navigate(['/login']);
    }
  }

  async createPayPalOrder(plan: string): Promise<string> {
    const token = this.auth.getToken();
    const clientUuid = this.auth.getClientUuid();
    const res = await fetch(`${this.apiBase}/api/v1/paypal/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': token } : {})
      },
      body: JSON.stringify({ plan, clientUuid })
    });

    await this.handleAuthError(res);
    if (!res.ok) throw await parseApiError(res, 'Falha ao criar pedido PayPal');
    const data = await res.json();
    return data.orderId;
  }

  async capturePayPalOrder(orderId: string): Promise<{ ok: boolean;[k: string]: any }> {
    const token = this.auth.getToken();
    const clientUuid = this.auth.getClientUuid();
    const res = await fetch(`${this.apiBase}/api/v1/paypal/capture/${orderId}/${clientUuid}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': token } : {})
      }
    });

    await this.handleAuthError(res);

    if (!res.ok) throw await parseApiError(res, 'Falha ao capturar pagamento PayPal');
    return res.json();
  }
}