import { Component } from '@angular/core';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  email = '';
  password = '';
  loading = false;
  error?: string;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  async submit() {
    this.error = undefined;
    this.loading = true;

    try {
      await this.authService.login({
        email: this.email,
        passwordHash: this.password
      });
      await this.router.navigate(['/client', this.authService.getClientUuid()]);
    } catch (e: any) {
      this.error = e.message ?? 'Falha no Login';
    } finally {
      this.loading = false;
    }
  }
}