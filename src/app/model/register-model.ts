export type Vertical = 'ecommerce' | 'clinic' | 'salon' | 'general';

export class RegisterModel {
  uuid?: string;
  fullName!: string;
  email!: string;
  passwordHash!: string;
  phoneNumber!: string;
  companyName!: string;
  promptText!: string;
  companyWebsiteUrl!: string;
  languageCode: string = 'pt-BR';
  vertical: Vertical = 'ecommerce';

  constructor(init?: Partial<RegisterModel>) {
    Object.assign(this, init);
  }
}
