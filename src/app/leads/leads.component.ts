import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatapiService } from '../service/chatapi.service';
import { LeadListItemDTO } from '../model/lead-list-item.model';
import { LeadDayResponseDTO } from '../model/lead-day-response.model';

@Component({
    selector: 'app-leads',
    templateUrl: './leads.component.html',
    styleUrls: ['./leads.component.css']
})
export class LeadsComponent implements OnInit {

    clientUuid = '';
    loading = false;
    error?: string;

    day = this.todayYYYYMMDD();
    tz = 'America/Sao_Paulo';
    limit = 10;

    nextCursor?: string | null;
    hasMore = false;

    items: LeadListItemDTO[] = [];

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

    goBack(): void {
        if (!this.clientUuid) return;
        this.router.navigate([`/client/${this.clientUuid}`]);
    }

    async loadFirstPage(): Promise<void> {
        if (!this.clientUuid) return;

        this.loading = true;
        this.error = undefined;

        try {
            const resp: LeadDayResponseDTO = await this.api.listLeadsFirstPage(
                this.clientUuid,
                this.day,
                this.tz,
                this.limit
            );

            this.nextCursor = resp.nextCursor ?? null;
            this.hasMore = !!resp.hasMore;
            this.items = resp.items ?? [];
        } catch (e: any) {
            this.error = e.message ?? 'Falha ao carregar leads';
        } finally {
            this.loading = false;
        }
    }

    async loadMore(): Promise<void> {
        if (!this.clientUuid || !this.nextCursor) return;

        this.loading = true;
        this.error = undefined;

        try {
            const resp = await this.api.listLeadsNextPage(
                this.clientUuid,
                this.day,
                this.nextCursor,
                this.tz,
                this.limit
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

    onChangeDay(value: string): void {
        this.day = value;
        this.loadFirstPage();
    }

    getStatusDescription(status?: string): string {
        switch ((status || '').toLowerCase()) {
            case 'new':
                return 'Novo';
            case 'qualified':
                return 'Qualificado';
            case 'contacted':
                return 'Contactado';
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

    statusClass(status?: string): string {
        switch ((status || '').toLowerCase()) {
            case 'qualified':
                return 'lead-status-qualified';
            case 'contacted':
                return 'lead-status-contacted';
            case 'lost':
                return 'lead-status-lost';
            case 'new':
            default:
                return 'lead-status-new';
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