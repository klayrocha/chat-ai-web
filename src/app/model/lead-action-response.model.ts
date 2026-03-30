export interface LeadActionResponseDTO {
  id: number;
  status: string;
  intent?: string;
  handoffReason?: string;
  notes?: string;
  updatedAt?: string;
  procedureInterest?: string;
  preferredPeriod?: string;
}