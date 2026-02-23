import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-stripe-success',
  templateUrl: './stripe-success.component.html'
})
export class StripeSuccessComponent {

  constructor(private auth: AuthService, private router: Router) {}

  goBack() {
    const uuid = this.auth.getClientUuid();
    if (uuid) this.router.navigate(['/client', uuid], { queryParams: { refreshed: Date.now() } });
    else this.router.navigate(['/chat']);
  }
}