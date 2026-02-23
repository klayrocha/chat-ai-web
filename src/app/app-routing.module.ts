import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ChatWidgetComponent } from './chatwidget/chatwidget.component';
import { authGuard } from './auth/auth.guard';
import { DetailComponent } from './detail/detail.component';
import { DetalhePaymentComponent } from './detalhe-payment/detalhe-payment.component';
import { StripeSuccessComponent } from './stripe-success/stripe-success.component';
import { StripeCancelComponent } from './stripe-cancel/stripe-cancel.component';

const routes: Routes = [
  { path: '', redirectTo: 'chat', pathMatch: 'full' },

  {
    path: 'client/:uuid',
    component: DetailComponent,
    canActivate: [authGuard]
  },

  {
    path: 'client/:uuid/edit',
    component: RegisterComponent,
    canActivate: [authGuard]
  },

  {
    path: 'client/:uuid/payment',
    component: DetalhePaymentComponent,
    canActivate: [authGuard] 
  },

  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'chat', component: ChatWidgetComponent },

  { 
    path: 'stripe/success', 
    component: StripeSuccessComponent,
    canActivate: [authGuard] 
  },
  { 
    path: 'stripe/cancel', 
    component: StripeCancelComponent,
    canActivate: [authGuard] 
  },

  { path: '**', redirectTo: 'chat' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }