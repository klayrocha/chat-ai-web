export interface WebMessagesDayQuery {
    clientUuid: string;
    day: string;   // yyyy-MM-dd
    tz?: string;
    limit?: number;
    cursor?: string;
}