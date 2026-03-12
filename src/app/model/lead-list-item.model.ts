export interface LeadListItemDTO {
    id: number;
    sessionId: string;
    source: string;
    status: string;
    leadName?: string | null;
    leadWhatsapp?: string | null;
    leadEmail?: string | null;
    intent?: string | null;
    firstMessage?: string | null;
    lastMessage?: string | null;
    handoffReason?: string | null;
    createdAt: string;
}