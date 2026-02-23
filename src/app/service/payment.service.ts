import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { APP_CONFIG, AppConfig } from '../shared/app-config';
import { AuthService } from './auth.service';
import { parseApiError } from '../shared/api-error';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(
    @Inject(APP_CONFIG) private config: AppConfig,
    private auth: AuthService,
    private router: Router
  ) { }

  private async handleAuthError(res: Response): Promise<void> {
    if (res.status === 401 || res.status === 403) {
      this.auth.logout();
      await this.router.navigate(['/login']);
    }
  }

  async createStripeCheckout(plan: string): Promise<void> {
    const token = this.auth.getToken();
    const clientUuid = this.auth.getClientUuid();

    const res = await fetch(`${this.config.apiBase}/api/v1/stripe/checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': token } : {}),
      },
      body: JSON.stringify({ plan, clientUuid }),
    });

    // 🔐 Se não autenticado, vai para login
    if (res.status === 401 || res.status === 403) {
      this.auth.logout();
      await this.router.navigate(['/login']);
      return;
    }

    if (!res.ok) {
      throw await parseApiError(res, 'Falha ao iniciar pagamento (Stripe)');
    }

    const data = await res.json();
    const url = data.url ?? data.sessionUrl;

    if (!url) {
      throw new Error('Stripe: URL de checkout não retornada pelo servidor.');
    }

    window.location.href = url;
  }




  async getStripeCheckoutStatus(sessionId: string): Promise<{ status: string; message?: string }> {
    const token = this.auth.getToken();

    const res = await fetch(
      `${this.config.apiBase}/api/v1/stripe/checkout-session/${encodeURIComponent(sessionId)}/status`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: token } : {}),
        },
      }
    );

    await this.handleAuthError(res);

    if (!res.ok) throw await parseApiError(res, 'Falha ao consultar status do pagamento (Stripe)');

    return res.json();
  }
}