import { WaMessageListItemDTO } from "./wa.message.list.item.model";

export type WaMessageDayResponseDTO = {
  clientId: string;
  day: string;
  timezone: string;
  limit: number;
  nextCursor?: string | null;
  hasMore: boolean;
  items: WaMessageListItemDTO[];
};