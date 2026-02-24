import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatapiService } from '../service/chatapi.service';
import { RegisterModel } from '../model/register-model';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  loading = false;
  error = '';
  success = false;

  editing = false;
  editUuid = '';

  model: RegisterModel = {
    uuid: undefined,
    fullName: '',
    email: '',
    passwordHash: '',
    phoneNumber: '',
    companyName: '',
    promptText: '',
    companyWebsiteUrl: '',
    languageCode: 'pt-BR',
    vertical: 'ecommerce',
    humanWhatsapp: 'yes',
  };

  constructor(
    private api: ChatapiService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  async ngOnInit() {
    const uuid = this.route.snapshot.paramMap.get('uuid');
    if (uuid) {
      this.editing = true;
      this.editUuid = uuid;
      await this.loadClientForEdit(uuid);
    }
  }

  private async loadClientForEdit(uuid: string) {
    this.loading = true;
    this.error = '';
    try {
      const client = await this.api.getClientDetail(uuid);


      this.model.uuid = client.uuid;
      this.model.fullName = client.fullName ?? '';
      this.model.email = client.email ?? '';
      this.model.passwordHash = '';
      this.model.phoneNumber = client.phoneNumber ?? '';
      this.model.companyName = client.companyName ?? '';
      this.model.companyWebsiteUrl = client.companyWebsiteUrl ?? '';
      this.model.promptText = client.promptText ?? '';
      this.model.languageCode = client.languageCode ?? 'pt-BR';
      this.model.vertical = (client as any).vertical ?? this.model.vertical;
      this.model.humanWhatsapp = (client as any).humanWhatsapp ?? this.model.humanWhatsapp;

    } catch (e: any) {
      this.error = e.message || 'Failed to load client';
    } finally {
      this.loading = false;
    }
  }

  async submit() {
    this.error = '';
    this.success = false;
    this.loading = true;

    try {
      if (this.editing) {
        await this.api.updateClient({
          uuid: this.editUuid,
          fullName: this.model.fullName,
          phoneNumber: this.model.phoneNumber,
          companyName: this.model.companyName,
          companyWebsiteUrl: this.model.companyWebsiteUrl,
          promptText: this.model.promptText,
          languageCode: this.model.languageCode,
          humanWhatsapp: this.model.humanWhatsapp
        });

        this.success = true;

        this.router.navigate([`/client/${this.editUuid}`]);
        return;
      }


      await this.api.registerClient(this.model);
      this.success = true;
      this.model.passwordHash = '';
      this.router.navigate(['/login'], {
        queryParams: { registered: '1' }
      });
    } catch (e: any) {
      this.error = e.message || (this.editing ? 'Update failed' : 'Registration failed');
    } finally {
      this.loading = false;
    }
  }

  goBack() {
    if (!this.editUuid) return;
    this.router.navigate([`/client/${this.editUuid}`]);
  }
}