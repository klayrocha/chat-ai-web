import { Component, OnInit } from '@angular/core';
import { ClientDetail } from '../model/detail.model';
import { ChatapiService } from '../service/chatapi.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.css']
})
export class DetailComponent implements OnInit {

  client?: ClientDetail;
  loading = true;
  error?: string;
  successMessage?: string;

  constructor(
    private api: ChatapiService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) { }

  async ngOnInit() {
    try {
      const uuid = this.route.snapshot.paramMap.get('uuid');
      if (!uuid) {
        this.error = 'Client UUID not provided';
        return;
      }

      // ✅ Se veio do pagamento com sucesso
      const payment = this.route.snapshot.queryParamMap.get('payment');
      if (payment === 'success') {
        this.successMessage = 'Pagamento confirmado ✅ Sua inscrição foi renovada.';
        // some sozinho após 5s (opcional)
        setTimeout(() => (this.successMessage = undefined), 5000);
      }

      this.client = await this.api.getClientDetail(uuid);

    } catch (e: any) {
      this.error = e.message ?? 'Failed to load client';
    } finally {
      this.loading = false;
    }
  }

  private async load(uuid: string) {
    this.loading = true;
    this.error = undefined;

    try {
      this.client = await this.api.getClientDetail(uuid);
    } catch (e: any) {
      this.error = e.message ?? 'Failed to load client';
    } finally {
      this.loading = false;
    }
  }


  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  editClient() {
    if (!this.client?.uuid) return;
    this.router.navigate([`/client/${this.client.uuid}/edit`]);
  }

  goToPayment() {
    if (!this.client?.uuid) return;
    this.router.navigate([`/client/${this.client.uuid}/payment`]);
  }


  languageLabel(code?: string): string {
    switch (code) {
      case 'pt-BR': return 'Português (Brasil)';
      case 'pt-PT': return 'Português (Portugal)';
      case 'en-US': return 'English';
      default: return code ?? '';
    }
  }

  getSubscriptionType(subscriptionType: string | undefined): string {
    switch (subscriptionType) {
      case 'FREE':
        return 'Grátis';
      case 'PAID':
        return 'Pago';
      default:
        return subscriptionType ?? '-';
    }
  }

  getSubscriptionStatus(status: string | undefined): string {
    switch (status) {
      case 'PENDING':
        return 'Pendente';
      case 'ACTIVE':
        return 'Ativo';
      case 'PAUSED':
        return 'Parado';
      case 'CANCELED':
        return 'Cancelado';
      default:
        return status ?? '-';
    }
  }


}
