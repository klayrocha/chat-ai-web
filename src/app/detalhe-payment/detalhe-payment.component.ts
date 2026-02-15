import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

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
  showPayPal = false;
  plans = [
    { label: 'Plano Essential - 3000 mensagens', value: 3000 },
    { label: 'Plano Premium - 10000 mensagens', value: 10000 }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  openRenew() {
    this.error = undefined;
    if (!this.selectedPlan) {
      this.error = 'Selecione um plano';
      return;
    }
    this.showPayPal = true;
  }


  ngOnInit(): void {
    this.clientUuid = this.route.snapshot.paramMap.get('uuid') ?? undefined;
  }

  submit() {
    console.log('this.selectedPlan --> ', this.selectedPlan);
    if (!this.selectedPlan) {
      this.error = 'Selecione um plano';
      return;
    }

    console.log('Plano escolhido:', this.selectedPlan);
    console.log('Cliente:', this.clientUuid);
  }

  back() {
    this.router.navigate([`/client/${this.clientUuid}`]);
  }
}