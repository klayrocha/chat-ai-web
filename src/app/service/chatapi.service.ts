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
import { LeadDayResponseDTO } from '../model/lead-day-response.model';
import { LeadActionResponseDTO } from '../model/lead-action-response.model';
import { LeadStatusUpdateRequest } from '../model/lead-status-update-request.model';
import { LeadNoteRequest } from '../model/lead-note-request.model';

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

  private async handleAuthError(res: Response): Promise<void> {
    if (res.status === 401 || res.status === 403) {
      this.authService.logout();
      await this.router.navigate(['/login']);
    }
  }

  private updateTokenFromResponse(res: Response): void {
    this.authService.updateTokenFromResponse(res);
  }

  private async authorizedFetch(
    input: string,
    init?: RequestInit,
    includeJsonContentType = false
  ): Promise<Response> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(includeJsonContentType ? { 'Content-Type': 'application/json' } : {}),
      ...((init?.headers as Record<string, string>) ?? {})
    };

    const finalHeaders = this.authService.buildAuthHeaders(headers);

    const res = await fetch(input, {
      ...init,
      headers: finalHeaders
    });

    await this.handleAuthError(res);
    this.updateTokenFromResponse(res);

    return res;
  }

  async sendMessage(req: ChatReq, apiBaseOverride?: string): Promise<string> {
    const base = (apiBaseOverride || this.config.apiBase).replace(/\/+$/, '');

    const res = await fetch(`${base}/api/v1/chat-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(req)
    });

    await this.handleAuthError(res);
    this.updateTokenFromResponse(res);

    if (!res.ok) {
      throw await parseApiError(res, 'Falha ao enviar mensagem');
    }

    const data = await res.json();
    return data.answer ?? data.content ?? String(data);
  }

  async registerClient(req: RegisterModel): Promise<void> {
    const res = await fetch(`${this.config.apiBase}/api/v1/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(req)
    });

    await this.handleAuthError(res);
    this.updateTokenFromResponse(res);

    if (!res.ok) {
      throw await parseApiError(res, 'Falha no cadastro');
    }
  }

  async getClientDetail(clientUUID: string): Promise<ClientDetail> {
    const res = await this.authorizedFetch(
      `${this.config.apiBase}/api/v1/clients/${clientUUID}`,
      { method: 'GET' }
    );

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return await res.json();
  }

  async getWidgetConfig(clientId: string): Promise<any> {
    const res = await fetch(
      `${this.config.apiBase}/api/v1/widget-config?clientUuid=${encodeURIComponent(clientId)}`,
      { method: 'GET' }
    );

    if (!res.ok) {
      throw await parseApiError(res, 'Falha ao buscar configuração do widget');
    }

    return await res.json();
  }

  async updateClient(req: UpdateClientReq): Promise<void> {
    const res = await this.authorizedFetch(
      `${this.config.apiBase}/api/v1/clients`,
      {
        method: 'PUT',
        body: JSON.stringify(req)
      },
      true
    );

    if (!res.ok) {
      throw await parseApiError(res, 'Falha ao atualizar');
    }
  }

  async listWaMessagesByDay(query: WaMessagesDayQuery): Promise<WaMessageDayResponseDTO> {
    if (!query?.clientId) throw new Error('clientId é obrigatório');
    if (!query?.day) throw new Error('day é obrigatório (yyyy-MM-dd)');

    const base = this.config.apiBase.replace(/\/+$/, '');
    const url = new URL(`${base}/api/v1/wa/messages/day`);

    url.searchParams.set('clientId', query.clientId);
    url.searchParams.set('day', query.day);

    if (query.tz) url.searchParams.set('tz', query.tz);
    if (query.limit != null) url.searchParams.set('limit', String(query.limit));
    if (query.cursor) url.searchParams.set('cursor', query.cursor);

    const res = await this.authorizedFetch(url.toString(), { method: 'GET' });

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

    const base = this.config.apiBase.replace(/\/+$/, '');
    const url = new URL(`${base}/api/v1/chat-messages/day`);

    url.searchParams.set('clientId', query.clientUuid);
    url.searchParams.set('day', query.day);

    if (query.tz) url.searchParams.set('tz', query.tz);
    if (query.limit != null) url.searchParams.set('limit', String(query.limit));
    if (query.cursor) url.searchParams.set('cursor', query.cursor);

    const res = await this.authorizedFetch(url.toString(), { method: 'GET' });

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

  async listLeadsByDay(
    clientUuid: string,
    day: string,
    tz?: string,
    limit?: number,
    cursor?: string,
    status?: string
  ): Promise<LeadDayResponseDTO> {
    if (!clientUuid) throw new Error('clientUuid é obrigatório');
    if (!day) throw new Error('day é obrigatório (yyyy-MM-dd)');

    const base = this.config.apiBase.replace(/\/+$/, '');
    const url = new URL(`${base}/api/v1/leads/day`);

    url.searchParams.set('clientUuid', clientUuid);
    url.searchParams.set('day', day);

    if (tz) url.searchParams.set('tz', tz);
    if (limit != null) url.searchParams.set('limit', String(limit));
    if (cursor) url.searchParams.set('cursor', cursor);
    if (status) url.searchParams.set('status', status);

    const res = await this.authorizedFetch(url.toString(), { method: 'GET' });

    if (!res.ok) {
      throw await parseApiError(res, 'Falha ao buscar leads');
    }

    return await res.json();
  }

  async listLeadsFirstPage(
    clientUuid: string,
    day: string,
    tz?: string,
    limit?: number,
    status?: string
  ): Promise<LeadDayResponseDTO> {
    return this.listLeadsByDay(clientUuid, day, tz, limit, undefined, status);
  }

  async listLeadsNextPage(
    clientUuid: string,
    day: string,
    cursor: string,
    tz?: string,
    limit?: number,
    status?: string
  ): Promise<LeadDayResponseDTO> {
    return this.listLeadsByDay(clientUuid, day, tz, limit, cursor, status);
  }

  async markLeadContacted(
    clientUuid: string,
    leadId: number,
    body?: LeadStatusUpdateRequest
  ): Promise<LeadActionResponseDTO> {
    const base = this.config.apiBase.replace(/\/+$/, '');
    const url = new URL(`${base}/api/v1/leads/${leadId}/contacted`);
    url.searchParams.set('clientUuid', clientUuid);

    const res = await this.authorizedFetch(
      url.toString(),
      {
        method: 'PATCH',
        body: JSON.stringify(body ?? {})
      },
      true
    );

    if (!res.ok) {
      throw await parseApiError(res, 'Falha ao marcar lead como contactado');
    }

    return await res.json();
  }

  async markLeadScheduled(
    clientUuid: string,
    leadId: number,
    body?: LeadStatusUpdateRequest
  ): Promise<LeadActionResponseDTO> {
    const base = this.config.apiBase.replace(/\/+$/, '');
    const url = new URL(`${base}/api/v1/leads/${leadId}/scheduled`);
    url.searchParams.set('clientUuid', clientUuid);

    const res = await this.authorizedFetch(
      url.toString(),
      {
        method: 'PATCH',
        body: JSON.stringify(body ?? {})
      },
      true
    );

    if (!res.ok) {
      throw await parseApiError(res, 'Falha ao marcar lead como agendado');
    }

    return await res.json();
  }

  async markLeadLost(
    clientUuid: string,
    leadId: number,
    body?: LeadStatusUpdateRequest
  ): Promise<LeadActionResponseDTO> {
    const base = this.config.apiBase.replace(/\/+$/, '');
    const url = new URL(`${base}/api/v1/leads/${leadId}/lost`);
    url.searchParams.set('clientUuid', clientUuid);

    const res = await this.authorizedFetch(
      url.toString(),
      {
        method: 'PATCH',
        body: JSON.stringify(body ?? {})
      },
      true
    );

    if (!res.ok) {
      throw await parseApiError(res, 'Falha ao marcar lead como perdido');
    }

    return await res.json();
  }

  async appendLeadNote(
    clientUuid: string,
    leadId: number,
    body: LeadNoteRequest
  ): Promise<LeadActionResponseDTO> {
    const base = this.config.apiBase.replace(/\/+$/, '');
    const url = new URL(`${base}/api/v1/leads/${leadId}/notes`);
    url.searchParams.set('clientUuid', clientUuid);

    const res = await this.authorizedFetch(
      url.toString(),
      {
        method: 'PATCH',
        body: JSON.stringify(body)
      },
      true
    );

    if (!res.ok) {
      throw await parseApiError(res, 'Falha ao adicionar nota ao lead');
    }

    return await res.json();
  }
}