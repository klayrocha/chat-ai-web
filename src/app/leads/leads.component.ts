import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatapiService } from '../service/chatapi.service';
import { LeadListItemDTO } from '../model/lead-list-item.model';
import { LeadDayResponseDTO } from '../model/lead-day-response.model';

type LeadStatusFilter =
  | ''
  | 'new'
  | 'qualified'
  | 'handoff_pending'
  | 'contacted'
  | 'scheduled'
  | 'lost';

type LeadNoteViewItem = {
  label: string;
  value: string;
  date?: string;
};

@Component({
  selector: 'app-leads',
  templateUrl: './leads.component.html',
  styleUrls: ['./leads.component.css']
})
export class LeadsComponent implements OnInit {

  clientUuid = '';
  loading = false;
  actionLoadingId?: number;
  expandedLeadId?: number;
  error?: string;
  success?: string;

  day = this.todayYYYYMMDD();
  tz = 'America/Sao_Paulo';
  limit = 10;

  nextCursor?: string | null;
  hasMore = false;

  items: LeadListItemDTO[] = [];
  statusFilter: LeadStatusFilter = '';

  constructor(
    private api: ChatapiService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  async ngOnInit(): Promise<void> {
    const uuid = this.route.snapshot.paramMap.get('uuid');
    if (!uuid) {
      this.error = 'Client UUID not provided';
      return;
    }

    this.clientUuid = uuid;

    try {
      const client = await this.api.getClientDetail(uuid);
      this.clientUuid = client.uuid;

      if (!this.clientUuid) {
        this.error = 'Client UUID not found';
        return;
      }

      await this.loadFirstPage();
    } catch (e: any) {
      this.error = e.message ?? 'Falha ao carregar leads';
    }
  }

  trackByLeadId(_index: number, lead: LeadListItemDTO): number {
    return lead.id;
  }

  trackByNoteIndex(index: number, _item: LeadNoteViewItem): number {
    return index;
  }

  goBack(): void {
    if (!this.clientUuid) return;
    this.router.navigate([`/client/${this.clientUuid}`]);
  }

  toggleExpand(leadId: number): void {
    this.expandedLeadId = this.expandedLeadId === leadId ? undefined : leadId;
  }

  isExpanded(leadId: number): boolean {
    return this.expandedLeadId === leadId;
  }

  async loadFirstPage(): Promise<void> {
    if (!this.clientUuid) return;

    this.loading = true;
    this.error = undefined;
    this.success = undefined;
    this.expandedLeadId = undefined;

    try {
      const resp: LeadDayResponseDTO = await this.api.listLeadsFirstPage(
        this.clientUuid,
        this.day,
        this.tz,
        this.limit,
        this.statusFilter || undefined
      );

      this.nextCursor = resp.nextCursor ?? null;
      this.hasMore = !!resp.hasMore;
      this.items = resp.items ?? [];
    } catch (e: any) {
      this.error = e.message ?? 'Falha ao carregar leads';
      this.items = [];
      this.nextCursor = null;
      this.hasMore = false;
    } finally {
      this.loading = false;
    }
  }

  async loadMore(): Promise<void> {
    if (!this.clientUuid || !this.nextCursor || this.loading) return;

    this.loading = true;
    this.error = undefined;
    this.success = undefined;

    try {
      const resp = await this.api.listLeadsNextPage(
        this.clientUuid,
        this.day,
        this.nextCursor,
        this.tz,
        this.limit,
        this.statusFilter || undefined
      );

      this.nextCursor = resp.nextCursor ?? null;
      this.hasMore = !!resp.hasMore;
      this.items = [...this.items, ...(resp.items ?? [])];
    } catch (e: any) {
      this.error = e.message ?? 'Falha ao carregar mais leads';
    } finally {
      this.loading = false;
    }
  }

  async onChangeDay(value: string): Promise<void> {
    this.day = value;
    await this.loadFirstPage();
  }

  async onChangeStatusFilter(value: string): Promise<void> {
    this.statusFilter = (value || '') as LeadStatusFilter;
    await this.loadFirstPage();
  }

  async markContacted(lead: LeadListItemDTO): Promise<void> {
    await this.runLeadAction(lead.id, async () => {
      const updated = await this.api.markLeadContacted(this.clientUuid, lead.id, {
        note: 'Lead marcado como contactado pelo painel.'
      });

      this.patchLead(
        lead.id,
        updated.status,
        updated.notes,
        updated.updatedAt,
        updated.handoffReason,
        updated.intent,
        updated.procedureInterest,
        updated.preferredPeriod
      );

      this.success = 'Lead marcado como contactado.';
    });
  }

  async markScheduled(lead: LeadListItemDTO): Promise<void> {
    await this.runLeadAction(lead.id, async () => {
      const updated = await this.api.markLeadScheduled(this.clientUuid, lead.id, {
        note: 'Lead marcado como agendado pelo painel.'
      });

      this.patchLead(
        lead.id,
        updated.status,
        updated.notes,
        updated.updatedAt,
        updated.handoffReason,
        updated.intent,
        updated.procedureInterest,
        updated.preferredPeriod
      );

      this.success = 'Lead marcado como agendado.';
    });
  }

  async markLost(lead: LeadListItemDTO): Promise<void> {
    const reason = window.prompt(
      'Motivo da perda (ex: no_response, no_budget, not_interested):',
      'no_response'
    );
    if (reason === null) return;

    const note = window.prompt('Observação opcional para este lead:', '') ?? '';

    await this.runLeadAction(lead.id, async () => {
      const updated = await this.api.markLeadLost(this.clientUuid, lead.id, {
        reason,
        note
      });

      this.patchLead(
        lead.id,
        updated.status,
        updated.notes,
        updated.updatedAt,
        updated.handoffReason,
        updated.intent,
        updated.procedureInterest,
        updated.preferredPeriod
      );

      this.success = 'Lead marcado como perdido.';
    });
  }

  async addNote(lead: LeadListItemDTO): Promise<void> {
    const note = window.prompt('Adicionar observação para este lead:', '');
    if (!note || !note.trim()) return;

    await this.runLeadAction(lead.id, async () => {
      const updated = await this.api.appendLeadNote(this.clientUuid, lead.id, { note });

      this.patchLead(
        lead.id,
        updated.status,
        updated.notes,
        updated.updatedAt,
        updated.handoffReason,
        updated.intent,
        updated.procedureInterest,
        updated.preferredPeriod
      );

      this.success = 'Observação adicionada com sucesso.';
    });
  }

  openWhatsApp(lead: LeadListItemDTO): void {
    const phone = (lead.leadWhatsapp || '').replace(/\D/g, '');
    if (!phone) return;

    const procedureText = lead.procedureInterest
      ? ` sobre ${this.formatProcedureInterest(lead.procedureInterest)}`
      : '';

    const text = encodeURIComponent(
      `Olá${lead.leadName ? ' ' + lead.leadName : ''}, recebemos o seu interesse${procedureText} e vamos continuar o atendimento por aqui.`
    );

    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  }

  canOpenWhatsApp(lead: LeadListItemDTO): boolean {
    return !!(lead.leadWhatsapp && lead.leadWhatsapp.trim());
  }

  canMarkContacted(lead: LeadListItemDTO): boolean {
    const status = (lead.status || '').toLowerCase();
    return status !== 'scheduled' && status !== 'lost';
  }

  canMarkScheduled(lead: LeadListItemDTO): boolean {
    const status = (lead.status || '').toLowerCase();
    return status !== 'scheduled' && status !== 'lost';
  }

  canMarkLost(lead: LeadListItemDTO): boolean {
    return (lead.status || '').toLowerCase() !== 'lost';
  }

  getStatusDescription(status?: string): string {
    switch ((status || '').toLowerCase()) {
      case 'new':
        return 'Novo';
      case 'qualified':
        return 'Qualificado';
      case 'handoff_pending':
        return 'Aguardando contacto';
      case 'contacted':
        return 'Contactado';
      case 'scheduled':
        return 'Agendado';
      case 'lost':
        return 'Perdido';
      default:
        return status || '-';
    }
  }

  getIntentDescription(intent?: string): string {
    switch ((intent || '').toLowerCase()) {
      case 'quote':
        return 'Orçamento';
      case 'appointment':
        return 'Agendamento';
      case 'buy':
        return 'Compra';
      case 'human':
        return 'Humano';
      case 'support':
        return 'Suporte';
      case 'unknown':
        return 'Indefinido';
      default:
        return intent || '-';
    }
  }

  getHandoffDescription(reason?: string): string {
    switch ((reason || '').toLowerCase()) {
      case 'low_confidence':
        return 'Encaminhado: baixa confiança';
      case 'explicit_human':
        return 'Encaminhado: pedido humano';
      case 'confirmed_handoff':
        return 'Encaminhado: confirmado';
      case 'commercial_intent':
        return 'Encaminhado: intenção comercial';
      default:
        return reason || '-';
    }
  }

  getSourceDescription(source?: string): string {
    switch ((source || '').toLowerCase()) {
      case 'web':
        return 'Web';
      case 'whatsapp':
        return 'WhatsApp';
      default:
        return source || '-';
    }
  }

  getPreferredPeriodDescription(period?: string): string {
    switch ((period || '').toLowerCase()) {
      case 'manha':
        return 'Manhã';
      case 'tarde':
        return 'Tarde';
      case 'noite':
        return 'Noite';
      case 'qualquer':
        return 'Qualquer horário';
      default:
        return period || '-';
    }
  }

  formatProcedureInterest(value?: string): string {
    if (!value) return '-';

    return value
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  formatFriendlyDate(value?: string): string {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    const formatted = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);

    return formatted.replace(',', ' às');
  }

  getVisibleNotes(notes?: string): LeadNoteViewItem[] {
    if (!notes || !notes.trim()) return [];

    const lines = notes
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);

    const items: LeadNoteViewItem[] = [];

    for (const line of lines) {
      if (line.startsWith('meta:procedure_interest=')) {
        const value = line.substring('meta:procedure_interest='.length).trim();
        if (value) {
          items.push({
            label: 'Procedimento de interesse',
            value: this.formatProcedureInterest(value)
          });
        }
        continue;
      }

      if (line.startsWith('meta:preferred_period=')) {
        const value = line.substring('meta:preferred_period='.length).trim();
        if (value) {
          items.push({
            label: 'Período preferido',
            value: this.getPreferredPeriodDescription(value)
          });
        }
        continue;
      }

      const timestampMatch = line.match(/^\[(.*?)\]\s+([a-zA-Z_]+):\s*(.*)$/);
      if (timestampMatch) {
        const [, rawDate, rawTag, rawText] = timestampMatch;
        items.push({
          label: this.translateNoteTag(rawTag),
          value: this.translateNoteText(rawText),
          date: this.formatFriendlyDate(rawDate)
        });
        continue;
      }

      items.push({
        label: 'Observação',
        value: this.translateNoteText(line)
      });
    }

    return items;
  }

  hasVisibleNotes(notes?: string): boolean {
    return this.getVisibleNotes(notes).length > 0;
  }

  private translateNoteTag(tag: string): string {
    switch ((tag || '').toLowerCase()) {
      case 'captured_from_message':
        return 'Capturado da conversa';
      case 'contacted':
        return 'Contacto realizado';
      case 'scheduled':
        return 'Agendado';
      case 'lost_reason':
        return 'Motivo da perda';
      case 'lost_note':
        return 'Observação da perda';
      case 'note':
        return 'Observação';
      default:
        return tag || 'Observação';
    }
  }

  private translateNoteText(text: string): string {
    if (!text) return '';

    return text
      .replace(/^procedimento capturado a partir da mensagem:\s*/i, 'Procedimento capturado da mensagem: ')
      .replace(/^procedimento atualizado a partir da mensagem:\s*/i, 'Procedimento atualizado da mensagem: ')
      .replace(/^periodo preferido capturado a partir da mensagem:\s*/i, 'Período preferido capturado da mensagem: ')
      .replace(/^periodo preferido atualizado a partir da mensagem:\s*/i, 'Período preferido atualizado da mensagem: ');
  }

  statusClass(status?: string): string {
    switch ((status || '').toLowerCase()) {
      case 'qualified':
        return 'lead-status-qualified';
      case 'handoff_pending':
        return 'lead-status-handoff';
      case 'contacted':
        return 'lead-status-contacted';
      case 'scheduled':
        return 'lead-status-scheduled';
      case 'lost':
        return 'lead-status-lost';
      case 'new':
      default:
        return 'lead-status-new';
    }
  }

  private async runLeadAction(leadId: number, fn: () => Promise<void>): Promise<void> {
    this.actionLoadingId = leadId;
    this.error = undefined;
    this.success = undefined;

    try {
      await fn();
    } catch (e: any) {
      this.error = e.message ?? 'Falha ao atualizar lead';
    } finally {
      this.actionLoadingId = undefined;
    }
  }

  private patchLead(
    leadId: number,
    status?: string,
    notes?: string,
    updatedAt?: string,
    handoffReason?: string,
    intent?: string,
    procedureInterest?: string,
    preferredPeriod?: string
  ): void {
    this.items = this.items.map(item => {
      if (item.id !== leadId) return item;

      return {
        ...item,
        status: status ?? item.status,
        notes: notes ?? item.notes,
        updatedAt: updatedAt ?? item.updatedAt,
        handoffReason: handoffReason ?? item.handoffReason,
        intent: intent ?? item.intent,
        procedureInterest: procedureInterest ?? item.procedureInterest,
        preferredPeriod: preferredPeriod ?? item.preferredPeriod
      };
    });

    if (this.statusFilter) {
      this.items = this.items.filter(i => (i.status || '').toLowerCase() === this.statusFilter);
    }

    if (this.expandedLeadId === leadId && !this.items.some(i => i.id === leadId)) {
      this.expandedLeadId = undefined;
    }
  }

  private static pad2(n: number): string {
    return n < 10 ? `0${n}` : String(n);
  }

  private todayYYYYMMDD(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = LeadsComponent.pad2(d.getMonth() + 1);
    const day = LeadsComponent.pad2(d.getDate());
    return `${y}-${m}-${day}`;
  }
}