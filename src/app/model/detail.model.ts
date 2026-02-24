export interface Subscription {
  monthlyMessageLimit: number;
  status: 'ACTIVE' | 'INACTIVE';
  type: 'FREE' | 'PAID';
  startDate: string;
  endDate: string;
}

export interface ClientDetail {
  uuid: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  promptText: string;
  companyWebsiteUrl: string;
  languageCode: string;
  subscription?: Subscription;
  humanWhatsapp?: string;
}