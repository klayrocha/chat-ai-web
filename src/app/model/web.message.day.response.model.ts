export interface WebMessageListItemDTO {
    id: number;
    question: string;
    answer: string;
    createdAt: string;
}

export interface WebMessageDayResponseDTO {
    clientUuid: string;
    day: string;
    timezone: string;
    limit: number;
    nextCursor?: string | null;
    hasMore: boolean;
    items: WebMessageListItemDTO[];
}