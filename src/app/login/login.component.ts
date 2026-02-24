import { Component } from '@angular/core';
import { AuthService } from '../service/auth.service';
import { ActivatedRoute, Router } from '@angular/router';


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

  successMsg = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    const registered = this.route.snapshot.queryParamMap.get('registered');
    if (registered === '1') {
      this.successMsg = 'Conta criada com sucesso! Agora faça login 😊';
    }
  }



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