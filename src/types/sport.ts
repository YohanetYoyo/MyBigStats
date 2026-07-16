export interface Sport {
    id: number;
    name: string;
    slug: string;
    type: string;
    players_per_team: number;
    match_duration_minutes: number;
    governing_body: string;
    competition: {
        name: string;
        host_country: string;
        venue: string;
        start_date?: string;
        end_date?: string;
        date?: string;
        number_of_teams?: number;
        format: string;
    }
}