import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChatapiService } from '../service/chatapi.service';
import { APP_CONFIG, AppConfig } from '../shared/app-config';
import { Inject } from '@angular/core';
type Msg = { role: 'user' | 'assistant'; text: string };

@Component({
  selector: 'app-chatwidget',
  templateUrl: './chatwidget.component.html',
  styleUrls: ['./chatwidget.component.css']
})
export class ChatWidgetComponent implements OnInit {
  clientId = 'default';
  locale = 'pt-PT';
  apiBase = '';
  sessionId = '';
  input = '';
  busy = false;
  whatsappNumber = '';
  whatsappPrefill = '';
  whatsAppLink = '';
  humanWhatsapp = '';
  messages: Msg[] = [];

  constructor(
    @Inject(APP_CONFIG) private config: AppConfig,
    private route: ActivatedRoute, private api: ChatapiService
  ) { }


  async ngOnInit(): Promise<void> {
    const params = new URLSearchParams(window.location.search);

    this.clientId = params.get('clientId') ?? 'default';

    this.locale = params.get('locale') ?? 'pt-BR';

    this.apiBase = params.get('apiBase') ?? this.config.apiBase;

    this.sessionId = params.get('sessionId') ?? this.getOrCreateSessionId(this.clientId);

    this.messages.push({ role: 'assistant', text: 'Olá! Como posso ajudar?' });

    try {
      const cfg = await this.api.getWidgetConfig(this.clientId);

      this.whatsappNumber = (cfg?.whatsappNumber ?? '').replace(/\D/g, '');
      this.whatsappPrefill = (cfg?.whatsappPrefill ?? '').toString();
      this.humanWhatsapp = (cfg?.humanWhatsapp ?? '').toString();

      this.buildWhatsAppLink();
    } catch (e) {
      console.log('Widget config error', e);
    }
  }

  private buildWhatsAppLink(): void {
    if (!this.whatsappNumber) {
      this.whatsAppLink = '';
      return;
    }

    const base = this.whatsappPrefill || 'Olá! Vim do site e quero falar com um atendente.';
    const text = `${base}\n\n`;

    this.whatsAppLink = `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(text)}`;
  }

  openWhatsApp(): void {
    if (!this.whatsAppLink) return;
    window.open(this.whatsAppLink, '_blank', 'noopener,noreferrer');
  }

  async send(): Promise<void> {
    const text = this.input.trim();
    if (!text || this.busy) return;

    this.messages.push({ role: 'user', text });
    this.input = '';
    this.busy = true;
    setTimeout(() => this.scrollToBottom(), 0);

    try {
      const answer = await this.api.sendMessage(
        {
          clientId: this.clientId,
          sessionId: this.sessionId,
          message: text,
        },
        this.apiBase
      );

      this.messages.push({ role: 'assistant', text: answer });
    } catch (e) {
      console.log('Erro --> ', e);
      this.messages.push({ role: 'assistant', text: 'Ocorreu um erro. Tente novamente.' });
    } finally {
      this.busy = false;
      setTimeout(() => this.scrollToBottom(), 0);
    }
  }


  close(): void {
    window.parent?.postMessage({ type: 'CW_CLOSE' }, '*');
  }

  private getOrCreateSessionId(clientId: string): string {
    const key = `chat_widget_session_${clientId}`;
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id = (crypto?.randomUUID?.() ?? this.uuidFallback());
    localStorage.setItem(key, id);
    return id;
  }

  private uuidFallback(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private scrollToBottom(): void {
    const el = document.getElementById('msgs');
    if (el) el.scrollTop = el.scrollHeight;
  }
}