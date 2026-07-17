import { notif } from "../utils/notif.js";

interface Competition {
    name: string;
    host_country?: string;
    start_date?: string;
    end_date?: string;
    date?: string;
}

interface Sport {
    id: number;
    name: string;
    slug: string;
    competition: Competition;
}

interface Equipe {
    id: number;
    sport_id: number;
    name: string;
}

interface Rencontre {
    id: number;
    sport_id: number;
    date: string;
    home_team_id?: number;
    away_team_id?: number;
    home_score?: number;
    away_score?: number;
}

type CompetitionStatus = "upcoming" | "ongoing" | "finished";

let sports: Sport[] = [];
let equipes: Equipe[] = [];
let rencontres: Rencontre[] = [];

async function getHomeData(): Promise<void> {
    try {
        const sportsResponse = await fetch('https://keligmartin.github.io/api/sports.json');
        if (!sportsResponse.ok) {
            notif('Impossible de récupérer les sports. Réessayez plus tard.');
        }
        sports = await sportsResponse.json();

        const equipesResponse = await fetch('https://keligmartin.github.io/api/equipes.json');
        if (!equipesResponse.ok) {
            notif('Impossible de récupérer les équipes !');
        }
        equipes = await equipesResponse.json();

        const rencontresResponse = await fetch('https://keligmartin.github.io/api/rencontres.json');
        if (!rencontresResponse.ok) {
            notif('Impossible de récupérer les rencontres !');
        }
        rencontres = await rencontresResponse.json();

        afficherOngoing();
        afficherAllSports();
    } catch (error) {
        console.error(error);
        notif("L'API est indisponible pour le moment. Réessayez plus tard.", "error");
    }
}

function getCompetitionStatus(competition: Competition): CompetitionStatus {
    const today = new Date();
    const start = competition.start_date ? new Date(competition.start_date) : competition.date ? new Date(competition.date) : null;
    const end = competition.end_date ? new Date(competition.end_date) : start;

    if (!start || !end) return "upcoming";
    if (today < start) return "upcoming";
    if (today > end) return "finished";
    return "ongoing";
}

function statusLabel(status: CompetitionStatus): string {
    switch (status) {
        case "ongoing": return "En cours";
        case "upcoming": return "À venir";
        case "finished": return "Terminé";
    }
}

function formatDateRange(competition: Competition): string {
    const fmt = (d: string) => new Date(d).toLocaleDateString("fr-FR");
    if (competition.start_date && competition.end_date) return `Du ${fmt(competition.start_date)} au ${fmt(competition.end_date)}`;
    if (competition.date) return fmt(competition.date);
    return "";
}

function equipeName(teamId: number | undefined): string | null {
    if (teamId === undefined) return null;
    return equipes.find((e) => e.id === teamId)?.name ?? null;
}

function getLatestRencontre(sportId: number): Rencontre | undefined {
    return [...rencontres]
        .filter((r) => r.sport_id === sportId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
}

function describeLatest(rencontre: Rencontre): string {
    const date = new Date(rencontre.date).toLocaleDateString("fr-FR");
    if (rencontre.home_team_id !== undefined && rencontre.away_team_id !== undefined) {
        const home = equipeName(rencontre.home_team_id) ?? "Équipe inconnue";
        const away = equipeName(rencontre.away_team_id) ?? "Équipe inconnue";
        return `${date} — ${home} ${rencontre.home_score ?? "?"} - ${rencontre.away_score ?? "?"} ${away}`;
    }
    return `${date} — Dernière rencontre disponible`;
}

function ongoingCard(sport: Sport): string {
    const latest = getLatestRencontre(sport.id);
    return `
        <article class="event-card event-card--ongoing">
            <span class="badge badge--ongoing">En cours</span>
            <h3>${sport.competition.name}</h3>
            <p class="event-sport">${sport.name}${sport.competition.host_country ? ` — ${sport.competition.host_country}` : ""}</p>
            <p>${formatDateRange(sport.competition)}</p>
            ${latest ? `<p class="event-latest">Dernier résultat : ${describeLatest(latest)}</p>` : ""}
            <a class="btn" href="${sport.slug}.html">Voir la page ${sport.name}</a>
        </article>
    `;
}

function sportCard(sport: Sport): string {
    const status = getCompetitionStatus(sport.competition);
    return `
        <article class="sport-card">
            <span class="badge badge--${status}">${statusLabel(status)}</span>
            <h3>${sport.name}</h3>
            <p>${sport.competition.name}</p>
            <p class="event-dates">${formatDateRange(sport.competition)}</p>
            <a class="btn btn--secondary" href="${sport.slug}.html">Consulter</a>
        </article>
    `;
}

function afficherOngoing(): void {
    const container = document.getElementById("ongoing-events");
    if (!container) return;

    const ongoing = sports.filter((sport) => getCompetitionStatus(sport.competition) === "ongoing");

    container.innerHTML = ongoing.length
        ? ongoing.map((sport) => ongoingCard(sport)).join("")
        : "<p>Aucun événement en cours actuellement.</p>";
}

function afficherAllSports(): void {
    const container = document.getElementById("all-sports");
    if (!container) return;

    container.innerHTML = sports.map(sportCard).join("");
}

getHomeData();