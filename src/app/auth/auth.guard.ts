import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';


export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // 🔓 Por enquanto NÃO bloqueia nada
  return true;

  // 🔐 Futuro (quando quiser ativar):
  // if (auth.isLoggedIn()) {
  //   return true;
  // }
  //
  // router.navigate(['/login']);
  // return false;
};
