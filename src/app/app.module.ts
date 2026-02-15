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
import { PaypalButtonComponent } from './paypalbutton/paypal-button.component';
import { PaypalCancelComponent } from './paypal-cancel/paypal-cancel.component';
import { PaypalSuccessComponent } from './paypal-success/paypal-success.component';


@NgModule({
  declarations: [
    AppComponent,
    ChatWidgetComponent,
    LoginComponent,
    RegisterComponent,
    DetailComponent,
    PaypalButtonComponent,
    DetalhePaymentComponent,
    PaypalCancelComponent,
    PaypalSuccessComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
