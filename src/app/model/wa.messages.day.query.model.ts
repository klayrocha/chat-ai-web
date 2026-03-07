export type WaMessagesDayQuery = {
  clientId: string;
  day: string;
  tz?: string;
  limit?: number;
  cursor?: string;
};