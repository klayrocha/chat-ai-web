import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-stripe-cancel',
  templateUrl: './stripe-cancel.component.html',
  styleUrls: ['./stripe-cancel.component.css']
})
export class StripeCancelComponent implements OnInit {
  title = 'Pagamento cancelado';
  message = 'Você cancelou o pagamento.';

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const payment = this.route.snapshot.queryParamMap.get('payment');
    const msg = this.route.snapshot.queryParamMap.get('msg');

    if (payment === 'error') {
      this.title = 'Erro no pagamento';
      this.message = msg ?? 'Ocorreu um erro ao processar o pagamento.';
    } else if (payment === 'cancel') {
      this.title = 'Pagamento cancelado';
      this.message = 'Você cancelou o pagamento.';
    }
  }

  backToDetail() {
    const uuid = this.auth.getClientUuid();
    if (uuid) this.router.navigate(['/client', uuid]);
    else this.router.navigate(['/chat']);
  }
}