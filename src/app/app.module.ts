import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ChatWidgetComponent } from './chatwidget/chatwidget.component';
import { FormsModule } from '@angular/forms';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { DetailComponent } from './detail/detail.component';
import { DetalhePaymentComponent } from './detalhe-payment/detalhe-payment.component';
import { StripeSuccessComponent } from './stripe-success/stripe-success.component';
import { APP_CONFIG, appConfig } from './shared/app-config';
import { StripeCancelComponent } from './stripe-cancel/stripe-cancel.component';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

@NgModule({
  declarations: [
    AppComponent,
    ChatWidgetComponent,
    LoginComponent,
    RegisterComponent,
    DetailComponent,
    DetalhePaymentComponent,
    StripeCancelComponent,
    StripeSuccessComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    NgxMaskDirective
  ],
  providers: [
    { provide: APP_CONFIG, useValue: appConfig },
    provideNgxMask()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
