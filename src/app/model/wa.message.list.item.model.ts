export type WaMessageListItemDTO = {
  id: number;
  direction: 'inbound' | 'outbound' | string;
  fromUser?: string | null;
  textBody?: string | null;
  status: string;
  createdAt: string;
};