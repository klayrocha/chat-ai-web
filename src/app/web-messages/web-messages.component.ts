import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatapiService } from '../service/chatapi.service';
import { WebMessageDayResponseDTO, WebMessageListItemDTO } from '../model/web.message.day.response.model';

@Component({
    selector: 'app-web-messages',
    templateUrl: './web-messages.component.html',
    styleUrls: ['./web-messages.component.css']
})
export class WebMessagesComponent implements OnInit {

    clientUuid = '';
    loading = false;
    error?: string;

    day = this.todayYYYYMMDD();
    tz = 'America/Sao_Paulo';
    limit = 10;

    nextCursor?: string | null;
    hasMore = false;

    items: WebMessageListItemDTO[] = [];

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
                this.error = 'Client ID not found';
                return;
            }

            await this.loadFirstPage();
        } catch (e: any) {
            this.error = e.message ?? 'Falha ao carregar cliente';
        }
    }

    goBack(): void {
        if (!this.clientUuid) return;
        this.router.navigate([`/client/${this.clientUuid}`]);
    }

    async loadFirstPage(): Promise<void> {
        if (!this.clientUuid) return;

        this.error = undefined;
        this.loading = true;

        try {
            const resp: WebMessageDayResponseDTO = await this.api.listWebMessagesFirstPage(
                this.clientUuid,
                this.day,
                this.tz,
                this.limit
            );

            this.nextCursor = resp.nextCursor ?? null;
            this.hasMore = !!resp.hasMore;
            this.items = resp.items ?? [];
        } catch (e: any) {
            this.error = e.message ?? 'Falha ao carregar mensagens da Web';
        } finally {
            this.loading = false;
        }
    }

    async loadMore(): Promise<void> {
        if (!this.clientUuid || !this.nextCursor) return;

        this.error = undefined;
        this.loading = true;

        try {
            const resp = await this.api.listWebMessagesNextPage(
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
            this.error = e.message ?? 'Falha ao carregar mais mensagens da Web';
        } finally {
            this.loading = false;
        }
    }

    onChangeDay(newDay: string): void {
        this.day = newDay;
        this.loadFirstPage();
    }

    private static pad2(n: number): string {
        return n < 10 ? `0${n}` : String(n);
    }

    private todayYYYYMMDD(): string {
        const d = new Date();
        const y = d.getFullYear();
        const m = WebMessagesComponent.pad2(d.getMonth() + 1);
        const day = WebMessagesComponent.pad2(d.getDate());
        return `${y}-${m}-${day}`;
    }
}