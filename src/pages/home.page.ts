import type { Competition, Equipe, Rencontre, Sport, CompetitionStatus } from "../types/index.js";
import { apiService } from "../services/api.service.js";
import { notifyError } from "../features/notifications.js";
import { getAppRoot } from "../utils/dom.js";

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

function equipeName(equipes: Equipe[], teamId: number | undefined): string | null {
    if (teamId === undefined) return null;
    return equipes.find((e) => e.id === teamId)?.name ?? null;
}

function getLatestRencontre(rencontres: Rencontre[], sportId: number): Rencontre | undefined {
    return [...rencontres]
        .filter((r) => r.sport_id === sportId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
}

function describeLatest(rencontre: Rencontre, equipes: Equipe[]): string {
    const date = new Date(rencontre.date).toLocaleDateString("fr-FR");
    if (rencontre.home_team_id !== undefined && rencontre.away_team_id !== undefined) {
        const home = equipeName(equipes, rencontre.home_team_id) ?? "Équipe inconnue";
        const away = equipeName(equipes, rencontre.away_team_id) ?? "Équipe inconnue";
        return `${date} — ${home} ${rencontre.home_score ?? "?"} - ${rencontre.away_score ?? "?"} ${away}`;
    }
    return `${date} — Dernière rencontre disponible`;
}

function ongoingCard(sport: Sport, rencontres: Rencontre[], equipes: Equipe[]): string {
    const latest = getLatestRencontre(rencontres, sport.id);
    return `
        <article class="event-card event-card--ongoing">
            <span class="badge badge--ongoing">En cours</span>
            <h3>${sport.competition.name}</h3>
            <p class="event-sport">${sport.name}${sport.competition.host_country ? ` — ${sport.competition.host_country}` : ""}</p>
            <p>${formatDateRange(sport.competition)}</p>
            ${latest ? `<p class="event-latest">Dernier résultat : ${describeLatest(latest, equipes)}</p>` : ""}
            <a class="btn" href="#/sport/${sport.slug}">Voir la page ${sport.name}</a>
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
            <a class="btn btn--secondary" href="#/sport/${sport.slug}">Consulter</a>
        </article>
    `;
}

function template(): string {
    return `
        <section id="tab-ongoing">
            <h2>Événements en cours</h2>
            <div id="ongoing-events" class="event-grid">Chargement...</div>
        </section>

        <section id="tab-all-sports">
            <h2>Nos sports</h2>
            <div id="all-sports" class="sport-grid">Chargement...</div>
        </section>
    `;
}

export async function renderHomePage(): Promise<void> {
    const root = getAppRoot();
    root.innerHTML = template();

    try {
        const [sports, rencontres, equipes] = await Promise.all([
            apiService.getSports(),
            apiService.getRencontres(),
            apiService.getEquipes(),
        ]);

        const ongoingContainer = document.getElementById("ongoing-events");
        const allSportsContainer = document.getElementById("all-sports");

        const ongoing = sports.filter((sport) => getCompetitionStatus(sport.competition) === "ongoing");

        if (ongoingContainer) {
            ongoingContainer.innerHTML = ongoing.length
                ? ongoing.map((sport) => ongoingCard(sport, rencontres, equipes)).join("")
                : "<p>Aucun événement en cours actuellement.</p>";
        }

        if (allSportsContainer) {
            allSportsContainer.innerHTML = sports.map(sportCard).join("");
        }
    } catch (error) {
        notifyError(error, "L'API est indisponible pour le moment. Réessayez plus tard.");
    }
}
