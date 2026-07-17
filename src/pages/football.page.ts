import { Sport } from "../types/sport.js";
import { notif } from "../utils/notif.js";
import { afficherInfos } from "../features/infos.js";
import { afficherStats, type Category } from "../features/tabs/stats.tab.js";
import { afficherRencontres, type Historique } from "../features/tabs/history.tab.js";
import { afficherJoueurs, type Player } from "../features/tabs/players.tab.js";
import { optionsFiltre, correspond } from "../features/search.js";
import { remplirComparator, comparator } from "../features/comparator.js";

interface Athlete {
    id: number;
    sport_id: number;
    team_id?: number;
    first_name: string;
    last_name: string;
    nationality: string;
    birth_date: string;
    height_cm: number;
    weight_kg: number;
    position: string;
    jersey_number: number;
    stats: {
        goals: number;
        assists: number;
        matches_played: number;
        yellow_cards: number;
        red_cards: number;
        minutes_played: number;
    }
}

interface Equipe {
    id: number;
    sport_id: number;
    name: string;
}

interface Scorer {
    athlete_id: number;
    minute: number;
}

interface Rencontre {
    id: number;
    sport_id: number;
    stage?: string;
    status: string;
    date: string;
    home_team_id?: number;
    away_team_id?: number;
    home_score: number;
    away_score: number;
    scorers?: Scorer[];
}

type AthleteFilter = Partial<Pick<Athlete, "position">>;

let athletes: Athlete[] = [];
let equipes: Equipe[] = [];
let rencontres: Rencontre[] = [];

async function getFootballData(): Promise<void> {
    try {
        const sportsResponse = await fetch('https://keligmartin.github.io/api/sports.json');
        if (!sportsResponse.ok) {
            notif('Impossible de récupérer les sports. Réessayez plus tard.');
        }

        const sports: Sport[] = await sportsResponse.json();
        const football = sports.find((a) => a.slug === 'football');

        if (!football) {
            notif("Le sport Football n'existe pas dans l'API.", "error");
            return;
        }

        const athletesResponse = await fetch('https://keligmartin.github.io/api/athletes.json');

        if (!athletesResponse.ok) {
            notif('Impossible de récupérer les athlètes !');
        }

        const allAthletes: Athlete[] = await athletesResponse.json();
        athletes = allAthletes.filter((athlete) => athlete.sport_id === football.id);

        const equipesResponse = await fetch('https://keligmartin.github.io/api/equipes.json');

        if (!equipesResponse.ok) {
            notif('Impossible de récupérer les équipes !');
        }

        const allEquipes: Equipe[] = await equipesResponse.json();
        equipes = allEquipes.filter((equipe) => equipe.sport_id === football.id);

        const rencontresResponse = await fetch('https://keligmartin.github.io/api/rencontres.json');

        if (!rencontresResponse.ok) {
            notif('Impossible de récupérer les rencontres !');
        }

        const allRencontres: Rencontre[] = await rencontresResponse.json();
        rencontres = allRencontres.filter((rencontre) => rencontre.sport_id === football.id);

        afficherInfos(football);
        afficherStats(getFootballStats());
        afficherRencontres(getFootballHistorique());
        afficherJoueurs(getFootballPlayers(athletes));
        positionFilter();
        comparatorSelects();
    } catch (error) {
        console.error(error);
        notif("L'API est indisponible pour le moment. Réessayez plus tard.", "error");
    }
}

function getFootballStats(): Category[] {
    return [
        {
            title: "Buts",
            values: athletes.map((athlete) => ({
                name: `${athlete.first_name} ${athlete.last_name}`,
                value: athlete.stats.goals
            })),
            unit: ""
        },
        {
            title: "Passes décisives",
            values: athletes.map((athlete) => ({
                name: `${athlete.first_name} ${athlete.last_name}`,
                value: athlete.stats.assists
            })),
            unit: ""
        },
        {
            title: "Matchs joués",
            values: athletes.map((athlete) => ({
                name: `${athlete.first_name} ${athlete.last_name}`,
                value: athlete.stats.matches_played
            })),
            unit: ""
        },
        {
            title: "Cartons jaunes",
            values: athletes.map((athlete) => ({
                name: `${athlete.first_name} ${athlete.last_name}`,
                value: athlete.stats.yellow_cards
            })),
            unit: ""
        },
        {
            title: "Cartons rouges",
            values: athletes.map((athlete) => ({
                name: `${athlete.first_name} ${athlete.last_name}`,
                value: athlete.stats.red_cards
            })),
            unit: ""
        },
        {
            title: "Minutes jouées",
            values: athletes.map((athlete) => ({
                name: `${athlete.first_name} ${athlete.last_name}`,
                value: athlete.stats.minutes_played
            })),
            unit: " min"
        }
    ]
}

function equipeName(teamId: number | undefined): string {
    if (teamId === undefined) return "Équipe inconnue";
    return equipes.find((equipe) => equipe.id === teamId)?.name ?? "Équipe inconnue";
}

function athleteName(id: number | undefined): string {
    if (id === undefined) return "Inconnu";
    const athlete = athletes.find((a) => a.id === id);
    return athlete ? `${athlete.first_name} ${athlete.last_name}` : "Inconnu";
}

function getFootballHistorique(): Historique[] {
    return rencontres.map((rencontre) => {
        const scorers = (rencontre.scorers ?? []).map((s) => `${athleteName(s.athlete_id)} ${s.minute}'`).join(", ");

        return {
            date: rencontre.date,
            description: `<strong>${(rencontre.stage ?? "").replace(/_/g, " ")}</strong> (${rencontre.status})<br/><br/>
            ${equipeName(rencontre.home_team_id)} ${rencontre.home_score} - ${rencontre.away_score} ${equipeName(rencontre.away_team_id)}
            ${scorers ? `<br/>Buteurs : ${scorers}` : ""}`
        }
    });
}

function getFootballPlayers(athletes: Athlete[]): Player[] {
    return athletes.map((athlete) => ({
        name: `${athlete.first_name} ${athlete.last_name}`,
        subtitle: `${athlete.height_cm}cm ${athlete.weight_kg}kg`,
        description: `${athlete.position} - #${athlete.jersey_number} - ${equipeName(athlete.team_id)}`,
        statLines: [`${athlete.stats.matches_played} matchs<br/>${athlete.stats.goals} buts<br/>${athlete.stats.assists} passes décisives<br/>${athlete.stats.yellow_cards} cartons jaunes<br/>${athlete.stats.red_cards} cartons rouges<br/>${athlete.stats.minutes_played} minutes jouées`]
    }));
}

function positionFilter(): void {
    const allPositions = athletes.map((athlete) => athlete.position);
    optionsFiltre("position-filter", allPositions);
}

function comparatorSelects(): void {
    const options = athletes.map((athlete) => ({
        id: athlete.id,
        name: `${athlete.first_name} ${athlete.last_name}`
    }));
    remplirComparator(options);
}

function setupTabs(): void {
    const buttons = document.querySelectorAll<HTMLButtonElement>(".tab-btn");
    const toolbar = document.querySelector<HTMLButtonElement>(".toolbar");

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const targetTab = button.dataset.tab;
            if (!targetTab) return;

            buttons.forEach((b) => b.classList.remove("active"));
            button.classList.add("active");

            document.querySelectorAll<HTMLElement>(".tab-panel").forEach((panel) => {
                if (panel.dataset.tabPanel === targetTab) {
                    panel.classList.remove("hidden");
                } else {
                    panel.classList.add("hidden");
                }
            });

            if (toolbar) {
                if (targetTab === "joueurs") {
                    toolbar.classList.remove("hidden");
                } else {
                    toolbar.classList.add("hidden");
                }
            }
        });
    });
}

function applyFilters(): void {
    const searchInput = document.getElementById("search-input") as HTMLInputElement | null;
    const positionFilterSelect = document.getElementById("position-filter") as HTMLSelectElement | null;

    const texte = searchInput?.value ?? "";

    const filter: AthleteFilter = {
        position: positionFilterSelect?.value || undefined,
    };

    const filtered = athletes.filter((athlete) => {
        const matchesName = correspond(texte, athlete.first_name, athlete.last_name);
        const matchesPosition = !filter.position || athlete.position === filter.position;
        return matchesName && matchesPosition;
    });

    afficherJoueurs(getFootballPlayers(filtered));
}

function setupSearchAndFilter(): void {
    document.getElementById("search-input")?.addEventListener("input", applyFilters);
    document.getElementById("position-filter")?.addEventListener("change", applyFilters);
}

function setupComparator(): void {
    comparator((id1, id2) => {
        const result = document.getElementById("compare-result");

        if (!result) return;

        const athlete1 = athletes.find((athlete) => athlete.id === id1);
        const athlete2 = athletes.find((athlete) => athlete.id === id2);

        if (!athlete1 || !athlete2) {
            notif("Sélectionnez deux joueurs valides.", "error");
            return;
        }

        if (id1 === id2) {
            notif("Sélectionnez deux joueurs différents.", "error");
            return;
        }

        if (athlete1.sport_id !== athlete2.sport_id) {
            notif("Vous ne pouvez pas comparer deux athlètes de différents sports.", "error");
            return;
        }

        result.innerHTML = `
        <table class="compare-table">
            <thead>
                <tr>
                    <th>${athlete1.first_name} ${athlete1.last_name}</th>
                    <th>Stat</th>
                    <th>${athlete2.first_name} ${athlete2.last_name}</th>
                </tr>
            </thead>
        <tbody>
            <tr>
                <td>${athlete1.stats.goals ?? 0}</td>
                <td>Buts</td>
                <td>${athlete2.stats.goals ?? 0}</td>
            </tr>
            <tr>
                <td>${athlete1.stats.assists ?? 0}</td>
                <td>Passes décisives</td>
                <td>${athlete2.stats.assists ?? 0}</td>
            </tr>
            <tr>
                <td>${athlete1.stats.matches_played ?? 0}</td>
                <td>Matchs joués</td>
                <td>${athlete2.stats.matches_played ?? 0}</td>
            </tr>
            <tr>
                <td>${athlete1.stats.yellow_cards ?? 0}</td>
                <td>Cartons jaunes</td>
                <td>${athlete2.stats.yellow_cards ?? 0}</td>
            </tr>
            <tr>
                <td>${athlete1.stats.red_cards ?? 0}</td>
                <td>Cartons rouges</td>
                <td>${athlete2.stats.red_cards ?? 0}</td>
            </tr>
            <tr>
                <td>${athlete1.stats.minutes_played ?? 0}</td>
                <td>Minutes jouées</td>
                <td>${athlete2.stats.minutes_played ?? 0}</td>
            </tr>
        </tbody>
        </table>
        `;
    });
}

setupTabs();
setupSearchAndFilter();
setupComparator();
getFootballData();