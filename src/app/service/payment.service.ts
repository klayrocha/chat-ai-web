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

  private updateTokenFromResponse(res: Response): void {
    this.auth.updateTokenFromResponse(res);
  }

  private async authorizedFetch(
    input: string,
    init?: RequestInit,
    includeJsonContentType: boolean = false
  ): Promise<Response> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...(includeJsonContentType ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers as Record<string, string> ?? {})
    };

    const finalHeaders = this.auth.buildAuthHeaders(headers);

    const res = await fetch(input, {
      ...init,
      headers: finalHeaders
    });

    await this.handleAuthError(res);
    this.updateTokenFromResponse(res);

    return res;
  }

  async createStripeCheckout(plan: string): Promise<void> {
    const clientUuid = this.auth.getClientUuid();

    const res = await this.authorizedFetch(
      `${this.config.apiBase}/api/v1/stripe/checkout-session`,
      {
        method: 'POST',
        body: JSON.stringify({ plan, clientUuid })
      },
      true
    );

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
    const res = await this.authorizedFetch(
      `${this.config.apiBase}/api/v1/stripe/checkout-session/${encodeURIComponent(sessionId)}/status`,
      { method: 'GET' }
    );

    if (!res.ok) {
      throw await parseApiError(res, 'Falha ao consultar status do pagamento (Stripe)');
    }

    return await res.json();
  }
}