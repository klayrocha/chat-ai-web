export interface LeadListItemDTO {
  id: number;
  sessionId: string;
  source: string;
  status: string;

  leadName?: string;
  leadWhatsapp?: string;
  leadEmail?: string;

  intent?: string;
  procedureInterest?: string;
  preferredPeriod?: string;

  firstMessage?: string;
  lastMessage?: string;

  handoffReason?: string;
  notes?: string;

  createdAt: string;
  updatedAt?: string;
}