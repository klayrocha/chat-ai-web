import { Inject, Injectable } from '@angular/core';
import { APP_CONFIG, AppConfig } from '../shared/app-config';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { RegisterModel } from '../model/register-model';
import { ClientDetail } from '../model/detail.model';
import { UpdateClientReq } from '../model/update-client.mode';
import { parseApiError } from '../shared/api-error';
import { WaMessagesDayQuery } from '../model/wa.messages.day.query.model';
import { WaMessageDayResponseDTO } from '../model/wa.message.day.response.model';
import { WebMessagesDayQuery } from '../model/web.messages.day.query.model';
import { WebMessageDayResponseDTO } from '../model/web.message.day.response.model';

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

  async listWaMessagesByDay(query: WaMessagesDayQuery): Promise<WaMessageDayResponseDTO> {
    if (!query?.clientId) throw new Error('clientId é obrigatório');
    if (!query?.day) throw new Error('day é obrigatório (yyyy-MM-dd)');

    const token = this.authService.getToken();

    const base = this.config.apiBase.replace(/\/+$/, '');
    const url = new URL(`${base}/api/v1/wa/messages/day`);

    url.searchParams.set('clientId', query.clientId);
    url.searchParams.set('day', query.day);

    if (query.tz) url.searchParams.set('tz', query.tz);
    if (query.limit != null) url.searchParams.set('limit', String(query.limit));
    if (query.cursor) url.searchParams.set('cursor', query.cursor);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': token } : {})
      }
    });

    await this.handleAuthError(res);

    if (!res.ok) {
      throw await parseApiError(res, 'Falha ao buscar mensagens do WhatsApp');
    }

    return await res.json();
  }

  async listWaMessagesFirstPage(
    clientId: string,
    day: string,
    tz?: string,
    limit?: number
  ): Promise<WaMessageDayResponseDTO> {
    return this.listWaMessagesByDay({ clientId, day, tz, limit });
  }

  async listWaMessagesNextPage(
    clientId: string,
    day: string,
    cursor: string,
    tz?: string,
    limit?: number
  ): Promise<WaMessageDayResponseDTO> {
    return this.listWaMessagesByDay({ clientId, day, tz, limit, cursor });
  }

  async listWebMessagesByDay(query: WebMessagesDayQuery): Promise<WebMessageDayResponseDTO> {
    if (query?.clientUuid == null) throw new Error('clientId é obrigatório');
    if (!query?.day) throw new Error('day é obrigatório (yyyy-MM-dd)');

    const token = this.authService.getToken();

    const base = this.config.apiBase.replace(/\/+$/, '');
    const url = new URL(`${base}/api/v1/chat-messages/day`);

    url.searchParams.set('clientId', query.clientUuid);
    url.searchParams.set('day', query.day);

    if (query.tz) url.searchParams.set('tz', query.tz);
    if (query.limit != null) url.searchParams.set('limit', String(query.limit));
    if (query.cursor) url.searchParams.set('cursor', query.cursor);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...(token ? { 'Authorization': token } : {})
      }
    });

    await this.handleAuthError(res);

    if (!res.ok) {
      throw await parseApiError(res, 'Falha ao buscar mensagens da Web');
    }

    return await res.json();
  }

  async listWebMessagesFirstPage(
    clientUuid: string,
    day: string,
    tz?: string,
    limit?: number
  ): Promise<WebMessageDayResponseDTO> {
    return this.listWebMessagesByDay({ clientUuid, day, tz, limit });
  }

  async listWebMessagesNextPage(
    clientUuid: string,
    day: string,
    cursor: string,
    tz?: string,
    limit?: number
  ): Promise<WebMessageDayResponseDTO> {
    return this.listWebMessagesByDay({ clientUuid, day, tz, limit, cursor });
  }
}