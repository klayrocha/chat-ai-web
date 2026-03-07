import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatapiService } from '../service/chatapi.service';
import { WaMessageListItemDTO } from '../model/wa.message.list.item.model';
import { WaMessageDayResponseDTO } from '../model/wa.message.day.response.model';

@Component({
    selector: 'app-whatsapp-messages',
    templateUrl: './whatsapp-messages.component.html',
    styleUrls: ['./whatsapp-messages.component.css']
})
export class WhatsAppMessagesComponent implements OnInit {

    clientId = '';
    clientUuid = '';

    loading = false;
    error?: string;

    day = this.todayYYYYMMDD();
    tz = 'America/Sao_Paulo';
    limit = 10;

    nextCursor?: string | null;
    hasMore = false;

    items: WaMessageListItemDTO[] = [];

    constructor(
        private api: ChatapiService,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    async ngOnInit() {
        const uuid = this.route.snapshot.paramMap.get('uuid');
        if (!uuid) {
            this.error = 'Client UUID not provided';
            return;
        }

        this.clientUuid = uuid;
        // ✅ aqui: você está usando uuid como clientId no backend
        this.clientId = uuid;

        await this.loadFirstPage();
    }

    goBack() {
        if (!this.clientUuid) return;
        this.router.navigate([`/client/${this.clientUuid}`]);
    }

    async loadFirstPage() {
        this.error = undefined;
        this.loading = true;

        try {
            const resp: WaMessageDayResponseDTO = await this.api.listWaMessagesFirstPage(
                this.clientId,
                this.day,
                this.tz,
                this.limit
            );

            this.nextCursor = resp.nextCursor ?? null;
            this.hasMore = !!resp.hasMore;

            this.items = this.sortAsc(resp.items ?? []);
        } catch (e: any) {
            this.error = e.message ?? 'Falha ao carregar mensagens';
        } finally {
            this.loading = false;
        }
    }

    async loadMore() {
        if (!this.nextCursor) return;

        this.error = undefined;
        this.loading = true;

        try {
            const resp = await this.api.listWaMessagesNextPage(
                this.clientId,
                this.day,
                this.nextCursor,
                this.tz,
                this.limit
            );

            this.nextCursor = resp.nextCursor ?? null;
            this.hasMore = !!resp.hasMore;

            const merged = [...this.items, ...(resp.items ?? [])];
            this.items = this.sortAsc(merged);
        } catch (e: any) {
            this.error = e.message ?? 'Falha ao carregar mais mensagens';
        } finally {
            this.loading = false;
        }
    }

    onChangeDay(newDay: string) {
        this.day = newDay;
        this.loadFirstPage();
    }

    private sortAsc(list: WaMessageListItemDTO[]): WaMessageListItemDTO[] {
        return (list ?? []).slice().sort((a, b) => {
            const ta = new Date(a.createdAt).getTime();
            const tb = new Date(b.createdAt).getTime();
            if (ta !== tb) return ta - tb;
            return (a.id ?? 0) - (b.id ?? 0);
        });
    }

    private static pad2(n: number): string {
        return n < 10 ? `0${n}` : String(n);
    }

    private todayYYYYMMDD(): string {
        const d = new Date();
        const y = d.getFullYear();
        const m = WhatsAppMessagesComponent.pad2(d.getMonth() + 1);
        const day = WhatsAppMessagesComponent.pad2(d.getDate());
        return `${y}-${m}-${day}`;
    }

    getDirectionDescription(direction: string | undefined): string {
        switch (direction) {
            case 'inbound': return 'Pergunta';
            case 'outbound': return 'Resposta';
            default: return direction ?? '-';
        }
    }

    getStatusDescription(status: string | undefined): string {
        switch (status) {
            case 'processed': return 'Enviada';
            case 'delivered': return 'Entregue';
            default: return status ?? '-';
        }
    }
}