import { LeadListItemDTO } from './lead-list-item.model';

export interface LeadDayResponseDTO {
  clientUuid: string;
  day: string;
  tz: string;
  limit: number;
  nextCursor?: string | null;
  hasMore: boolean;
  items: LeadListItemDTO[];
}