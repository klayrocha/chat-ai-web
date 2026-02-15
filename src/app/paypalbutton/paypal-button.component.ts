import { AfterViewInit, Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { PaymentService } from '../service/payment.service';
import { AuthService } from '../service/auth.service';

declare const paypal: any;

@Component({
  selector: 'app-paypal-button',
  templateUrl: './paypal-button.component.html'
})
export class PaypalButtonComponent implements AfterViewInit {
  @Input({ required: true }) plan!: string;

  message = '';
  private rendered = false;

  constructor(
    private payments: PaymentService,
    private auth: AuthService,
    private router: Router
  ) {}

  async ngAfterViewInit(): Promise<void> {
    if (this.rendered) return;
    this.rendered = true;

    paypal.Buttons({
      createOrder: async () => {
        this.message = 'Criando pedido...';
        return await this.payments.createPayPalOrder(this.plan);
      },

      onApprove: async (data: any) => {
        this.message = 'Confirmando pagamento...';

        try {
          const res = await this.payments.capturePayPalOrder(data.orderID);

          if (res.ok) {
            const uuid = this.auth.getClientUuid();
            if (!uuid) return this.router.navigate(['/chat']);

            // ✅ Volta pro detalhe com mensagem de sucesso + força reload via refreshed
            return this.router.navigate(['/client', uuid], {
              queryParams: { payment: 'success', refreshed: Date.now() }
            });
          }

          return this.router.navigate(['/paypal/cancel'], {
            queryParams: {
              payment: 'error',
              msg: 'Pagamento não confirmado. Tente novamente.'
            }
          });

        } catch (e: any) {
          return this.router.navigate(['/paypal/cancel'], {
            queryParams: {
              payment: 'error',
              msg: e?.message ?? 'Erro ao confirmar pagamento.'
            }
          });
        }
      },

      onCancel: async () => {
        return this.router.navigate(['/paypal/cancel'], {
          queryParams: { payment: 'cancel' }
        });
      },

      onError: async () => {
        return this.router.navigate(['/paypal/cancel'], {
          queryParams: {
            payment: 'error',
            msg: 'Erro no PayPal. Tente novamente.'
          }
        });
      }
    }).render('#paypal-button-container');
  }
}