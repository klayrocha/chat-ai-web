import { Inject, Injectable } from '@angular/core';
import { APP_CONFIG, AppConfig } from '../shared/app-config';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { RegisterModel } from '../model/register-model';
import { ClientDetail } from '../model/detail.model';
import { UpdateClientReq } from '../model/update-client.mode';
import { parseApiError } from '../shared/api-error';

type ChatReq = { clientId: string; sessionId: string; message: string };

@Injectable({
  providedIn: 'root'
})
export class ChatapiService {


  constructor(
    @Inject(APP_CONFIG) private config: AppConfig,
    private authService: AuthService,
    private router: Router
  ) { }



  /** Se receber 401/403, faz logout e redireciona pro login */
  private async handleAuthError(res: Response): Promise<void> {
    if (res.status === 401 || res.status === 403) {
      this.authService.logout();
      await this.router.navigate(['/login']);
    }
  }

  async sendMessage(req: ChatReq, apiBaseOverride?: string): Promise<string> {
    const base = (apiBaseOverride || this.config.apiBase).replace(/\/+$/, '');

    const res = await fetch(`${base}/api/v1/chat-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(req),
    });

    await this.handleAuthError(res);

    if (!res.ok) throw await parseApiError(res, `Falha ao enviar mensagem`);
    const data = await res.json();
    return data.answer ?? data.content ?? String(data);
  }

  async registerClient(req: RegisterModel): Promise<void> {
    const res = await fetch(`${this.config.apiBase}/api/v1/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(req)
    });

    await this.handleAuthError(res);

    if (!res.ok) {
      throw await parseApiError(res, 'Falha no cadastro');
    }
  }

  async getClientDetail(clientUUID: string): Promise<ClientDetail> {
    const token = this.authService.getToken();
    const res = await fetch(`${this.config.apiBase}/api/v1/clients/${clientUUID}`, {
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': token } : {})
      }
    });

    await this.handleAuthError(res);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return res.json();
  }


  async getWidgetConfig(clientId: string): Promise<any> {
    const r = await fetch(`${this.config.apiBase}/api/v1/widget-config?clientUuid=${encodeURIComponent(clientId)}`, {
      method: 'GET'
    });
    return await r.json();
  }

  async updateClient(req: UpdateClientReq): Promise<void> {
    const token = this.authService.getToken();

    const res = await fetch(`${this.config.apiBase}/api/v1/clients`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': token } : {})
      },
      body: JSON.stringify(req)
    });

    await this.handleAuthError(res);

    if (!res.ok) {
      throw await parseApiError(res, 'Falha ao atualizar');
    }
  }
}