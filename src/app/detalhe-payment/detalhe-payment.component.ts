import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../service/payment.service';

@Component({
  selector: 'app-detalhe-payment',
  templateUrl: './detalhe-payment.component.html',
  styleUrls: ['./detalhe-payment.component.css']
})
export class DetalhePaymentComponent implements OnInit {
  clientUuid?: string;

  selectedPlan: string = '3000';
  loading = false;
  error?: string;

  plans = [
    { label: 'Plano Essential - 3000 mensagens', value: 3000 },
    { label: 'Plano Premium - 10000 mensagens', value: 10000 }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private payments: PaymentService
  ) {}

  ngOnInit(): void {
    this.clientUuid = this.route.snapshot.paramMap.get('uuid') ?? undefined;
  }

  async openRenew(): Promise<void> {
    this.error = undefined;

    if (!this.selectedPlan) {
      this.error = 'Selecione um plano';
      return;
    }

    this.loading = true;
    try {
      // ✅ Stripe Checkout: redireciona para a Stripe
      await this.payments.createStripeCheckout(this.selectedPlan);
      // não precisa setar loading=false aqui porque vai sair da página (redirect)
    } catch (e: any) {
      this.error = e?.message ?? 'Falha ao iniciar pagamento.';
      this.loading = false;
    }
  }

  back(): void {
    this.router.navigate([`/client/${this.clientUuid}`]);
  }

  // (opcional) se não usa mais, pode remover o submit e o ngSubmit do HTML
  submit(): void {
    // mantido só pra não quebrar caso você ainda tenha (ngSubmit)
  }
}