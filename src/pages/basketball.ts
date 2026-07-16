import { notif } from "../utils/notif.js";
import { afficherStats, type Category } from "../features/tabs/stats.tab.js";
import { afficherRencontres, type Historique } from "../features/tabs/history.tab.js";
import { afficherJoueurs, type Player } from "../features/tabs/players.tab.js";
import { optionsFiltre, correspond } from "../features/search.js";
import { remplirComparator, comparator } from "../features/comparator.js";
import { translate } from "../utils/translate.js";

const positions: Record<string, string> = {
    "Point Guard": "Meneur de jeu",
    "Shooting Guard": "Arrière",
    "Small Forward": "Ailier",
    "Power Forward": "Ailier fort",
    "Center": "Pivot"
};

const matchs: Record<string, string> = {
    "NBA Finals": "Finales NBA",
    "Conference Finals": "Finales de conférence",
    "Conference Semifinals": "Demi-finales de conférence",
    "First Round": "Premier tour"
};

const statuts: Record<string, string> = {
    "finished": "terminé"
};

interface Sport {
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
        date: string;
        format: string;
    }
}

interface Athlete {
    id: number;
    sport_id: number
    team_id: number;
    first_name: string;
    last_name: string;
    nickname?: string;
    nationality: string;
    birth_date: string;
    height_cm: number;
    weight_kg: number;
    position: string;
    jersey_number: number;
    stats: {
        games_played: number;
        points_per_game: number;
        rebounds_per_game: number;
        assists_per_game: number;
        steals_per_game: number;
        blocks_per_game: number;
        field_goal_percentage: number;
        three_point_percentage: number;
        free_throw_percentage: number;
        minutes_per_game: number;
    }
}

interface Equipe {
    id: number;
    sport_id: number;
    name: string;
    short_name: string;
    city: string;
    conference: string;
    seed: number;
    regular_season_wins: number;
    regular_season_losses: number;
    coach: string;
    championships: number;
    arena: string;
}

interface Rencontre {
    id: number;
    sport_id: number;
    type: string;
    playoff_round?: string;
    game_number?: number;
    series?: string;
    date: string;
    home_team_id: number;
    away_team_id: number;
    home_score: number;
    away_score: number;
    venue: string;
    attendance: number;
    status: string;
    quarter_scores?: {
        home: Record<number, number>;
        away: Record<number, number>;
    };
}

type AthleteFilter = Partial<Pick<Athlete, "position" | "team_id">>;

let athletes: Athlete[] = [];
let equipes: Equipe[] = [];
let rencontres: Rencontre[] = [];

async function getBasketballData(): Promise<void> {
    try {
        const sportsResponse = await fetch('https://keligmartin.github.io/api/sports.json');
        if (!sportsResponse.ok) {
            notif('Impossible de récupérer les sports. Réessayez plus tard.');
        }

        const sports: Sport[] = await sportsResponse.json();
        const basketball = sports.find((a) => a.slug === 'basketball');

        if (!basketball) {
            notif("Le sport Basketball n'existe pas dans l'API.", "error");
            return;
        }

        const athletesResponse = await fetch('https://keligmartin.github.io/api/athletes.json');

        if (!athletesResponse.ok) {
            notif('Impossible de récupérer les athlètes !');
        }

        const allAthletes: Athlete[] = await athletesResponse.json();
        athletes = allAthletes.filter((athlete) => athlete.sport_id === basketball.id);

        const rencontresResponse = await fetch('https://keligmartin.github.io/api/rencontres.json');

        if (!rencontresResponse.ok) {
            notif('Impossible de récupérer les rencontres !');
        }

        const equipesResponse = await fetch('https://keligmartin.github.io/api/equipes.json');
        if (!equipesResponse.ok) {
            notif('Impossible de récupérer les équipes !');
        }

        const allEquipes: Equipe[] = await equipesResponse.json();
        equipes = allEquipes.filter((equipe) => equipe.sport_id === basketball.id);

        const allRencontres: Rencontre[] = await rencontresResponse.json();
        rencontres = allRencontres.filter((rencontre) => rencontre.sport_id === basketball.id);

        afficherStats(getBasketballStats());
        afficherRencontres(getBasketballHistorique());
        afficherJoueurs(getBasketballPlayers(athletes));
        positionFilter();
        teamFilter();
        comparatorSelects();
    } catch (error) {
        console.error(error);
        notif("L'API est indisponible pour le moment. Réessayez plus tard.", "error");
    }
}

function getBasketballStats(): Category[] {
    return [
        {
            title: "Points par match",
            values: athletes.map((athlete) => ({
                name: `${athlete.first_name} ${athlete.last_name}`,
                value: athlete.stats.points_per_game
            })),
            unit: ""
        },
        {
            title: "Passes décisives par match",
            values: athletes.map((athlete) => ({
                name: `${athlete.first_name} ${athlete.last_name}`,
                value: athlete.stats.assists_per_game,
            })),
            unit: ""
        },
        {
            title: "Rebonds par match",
            values: athletes.map((athlete) => ({
                name: `${athlete.first_name} ${athlete.last_name}`,
                value: athlete.stats.rebounds_per_game,
            })),
            unit: ""
        },
        {
            title: "Contres par match",
            values: athletes.map((athlete) => ({
                name: `${athlete.first_name} ${athlete.last_name}`,
                value: athlete.stats.blocks_per_game,
            })),
            unit: ""
        },
        {
            title: "Pourcentage de paniers",
            values: athletes.map((athlete) => ({
                name: `${athlete.first_name} ${athlete.last_name}`,
                value: Math.round(athlete.stats.field_goal_percentage * 1000) / 10,
            })),
            unit: " %"
        },
        {
            title: "Pourcentage de paniers à trois points",
            values: athletes.map((athlete) => ({
                name: `${athlete.first_name} ${athlete.last_name}`,
                value: Math.round(athlete.stats.three_point_percentage * 1000) / 10,
            })),
            unit: " %"
        },
        {
            title: "Pourcentage des lancers-francs",
            values: athletes.map((athlete) => ({
                name: `${athlete.first_name} ${athlete.last_name}`,
                value: Math.round(athlete.stats.free_throw_percentage * 1000) / 10,
            })),
            unit: " %"
        },
        {
            title: "Minutes par jeu",
            values: athletes.map((athlete) => ({
                name: `${athlete.first_name} ${athlete.last_name}`,
                value: athlete.stats.minutes_per_game,
            })),
            unit: " min"
        }
    ];
}

function getEquipeName(teamId: number): string {
    const equipe = equipes.find((equipe) => equipe.id === teamId);
    return equipe ? equipe.name : "Equipe inconnue";
}

function getBasketballHistorique(): Historique[] {
    return rencontres.map((rencontre) => {
        const home = getEquipeName(rencontre.home_team_id);
        const away = getEquipeName(rencontre.away_team_id);

        return {
            date: rencontre.date,
            description: `${translate(rencontre.playoff_round ?? "", matchs)} : ${rencontre.type.charAt(0).toUpperCase()}${rencontre.type.slice(1)} ${rencontre.game_number} (${translate(rencontre.status, statuts)})<br/><br/>
            ${home} (${rencontre.home_score}) vs ${away} (${rencontre.away_score})<br/><br/>
            ${rencontre.venue}`
        };
    });
}

function getBasketballPlayers(athletes: Athlete[]): Player[] {
    return athletes.map((athlete) => ({
        name: `${athlete.first_name} ${athlete.last_name}`,
        subtitle: `${athlete.height_cm}cm ${athlete.weight_kg}kg`,
        description: `${translate(athlete.position, positions)} - #${athlete.jersey_number} - ${getEquipeName(athlete.team_id)}`,
        statLines: [`${athlete.stats.minutes_per_game} MIN<br/>${athlete.stats.points_per_game} PTS<br/>${athlete.stats.field_goal_percentage} %Tirs<br/>${athlete.stats.three_point_percentage} %3PT<br/>${athlete.stats.free_throw_percentage} %LF<br/>${athlete.stats.rebounds_per_game} REB`]
    }));
}

function positionFilter(): void {
    const allPositions = athletes.map((athlete) => athlete.position);
    optionsFiltre("position-filter", allPositions, (value) => translate(value, positions));
}

function teamFilter(): void {
    const select = document.getElementById("team-filter");
    if (!select) return;

    for (const equipe of equipes) {
        const option = document.createElement("option");
        option.value = String(equipe.id);
        option.textContent = equipe.name;
        select.appendChild(option);
    }
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
    const toolbar = document.querySelector(".toolbar");

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
    const positionFilter = document.getElementById("position-filter") as HTMLSelectElement | null;
    const teamFilter = document.getElementById("team-filter") as HTMLSelectElement | null;

    const texte = searchInput?.value ?? "";

    const filter: AthleteFilter = {
        position: positionFilter?.value || undefined,
        team_id: teamFilter?.value ? Number(teamFilter.value) : undefined
    };

    const filtered = athletes.filter((athlete) => {
        const matchesName = correspond(texte, athlete.first_name, athlete.last_name);
        const matchesPosition = !filter.position || athlete.position === filter.position;
        const matchesTeam = !filter.team_id || athlete.team_id === filter.team_id;
        return matchesName && matchesPosition && matchesTeam;
    });

    afficherJoueurs(getBasketballPlayers(filtered));
}

function setupSearchAndFilter(): void {
    document.getElementById("search-input")?.addEventListener("input", applyFilters);
    document.getElementById("position-filter")?.addEventListener("change", applyFilters);
    document.getElementById("team-filter")?.addEventListener("change", applyFilters);
}


function setupComparator(): void {
    comparator((id1, id2) => {
        const result = document.getElementById("compare-result");

        if (!result) return;

        const athlete1 = athletes.find((athlete) => athlete.id === id1);
        const athlete2 = athletes.find((athlete) => athlete.id === id2);

        if (!athlete1 || !athlete2) {
            notif("Sélectionez deux joueurs valides.", "error");
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
                    <td>${athlete1.stats.games_played}</td>
                    <td>Matchs joués</td>
                    <td>${athlete2.stats.games_played}</td>
                </tr>
                <tr>
                    <td>${athlete1.stats.points_per_game}</td>
                    <td>Points par match</td>
                    <td>${athlete2.stats.points_per_game}</td>
                </tr>
                <tr>
                    <td>${athlete1.stats.rebounds_per_game}</td>
                    <td>Rebonds par match</td>
                    <td>${athlete2.stats.rebounds_per_game}</td>
                </tr>
                <tr>
                    <td>${athlete1.stats.assists_per_game}</td>
                    <td>Passes par match</td>
                    <td>${athlete2.stats.assists_per_game}</td>
                </tr>
                <tr>
                    <td>${athlete1.stats.steals_per_game}</td>
                    <td>Interceptions par match</td>
                    <td>${athlete2.stats.steals_per_game}</td>
                </tr>
                <tr>
                    <td>${athlete1.stats.blocks_per_game}</td>
                    <td>Contres par match</td>
                    <td>${athlete2.stats.blocks_per_game}</td>
                </tr>
                <tr>
                    <td>${(athlete1.stats.field_goal_percentage * 100).toFixed(1)}%</td>
                    <td>Pourcentage de paniers</td>
                    <td>${(athlete2.stats.field_goal_percentage * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                    <td>${(athlete1.stats.three_point_percentage * 100).toFixed(1)}%</td>
                    <td>Pourcentage de paniers à trois points</td>
                    <td>${(athlete2.stats.three_point_percentage * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                    <td>${(athlete1.stats.free_throw_percentage * 100).toFixed(1)}%</td>
                    <td>Pourcentage des lancers-francs</td>
                    <td>${(athlete2.stats.free_throw_percentage * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                    <td>${athlete1.stats.minutes_per_game}</td>
                    <td>Minutes par match</td>
                    <td>${athlete2.stats.minutes_per_game}</td>
                </tr>
        </tbody>
      </table>
    `;
    });
}

setupTabs();
setupSearchAndFilter();
setupComparator();
getBasketballData();