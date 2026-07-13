import { notif } from "../utils/notif.js";
import { afficherStats, type Category } from "../features/tabs/stats.tab.js";

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

type AthleteFilter = Partial<Pick<Athlete, "position">>;

let athletes: Athlete[] = [];
let equipes: Equipe[] = [];
let rencontres: Rencontre[] = [];

async function getBasketballData(): Promise<void> {
    try {
        const sportsResponse = await fetch('https://keligmartin.github.io/api/sports.json');
        if (!sportsResponse.ok) {
            throw new Error('Impossible de récupérer les sports. Réessayez plus tard.');
        }

        const sports: Sport[] = await sportsResponse.json();
        const basketball = sports.find((a) => a.slug === 'basketball');

        if (!basketball) {
            notif("Le sport Basketball n'existe pas dans l'API.", "error");
            return;
        }

        const athletesResponse = await fetch('https://keligmartin.github.io/api/athletes.json');

        if (!athletesResponse.ok) {
            throw new Error('Impossible de récupérer les athlètes !');
        }

        const allAthletes: Athlete[] = await athletesResponse.json();
        athletes = allAthletes.filter((athlete) => athlete.sport_id === basketball.id);

        const rencontresResponse = await fetch('https://keligmartin.github.io/api/rencontres.json');

        if (!rencontresResponse.ok) {
            throw new Error('Impossible de récupérer les rencontres !');
        }

        const equipesResponse = await fetch('https://keligmartin.github.io/api/equipes.json');
        if (!equipesResponse.ok) {
            throw new Error('Impossible de récupérer les équipes !');
        }

        const allEquipes: Equipe[] = await equipesResponse.json();
        equipes = allEquipes.filter((equipe) => equipe.sport_id === basketball.id);

        const allRencontres: Rencontre[] = await rencontresResponse.json();
        rencontres = allRencontres.filter((rencontre) => rencontre.sport_id === basketball.id);

        afficherStats(getBasketballStats());
        afficherRencontres();
        afficherAthletes(athletes);
        positionFilter();
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
            unit: " %"
        }
    ];
}

function getEquipeName(teamId: number): string {
    const equipe = equipes.find((equipe) => equipe.id === teamId);
    return equipe ? equipe.name : "Equipe inconnue";
}

function afficherRencontres(): void {
    const list = document.getElementById("rencontres-list");
    if (!list) return;

    if (rencontres.length === 0) {
        list.innerHTML = "<li>Aucune rencontre disponible.</li>";
        return;
    }

    let html = "";
    for (const rencontre of rencontres) {
        const date = new Date(rencontre.date).toLocaleDateString("fr-FR");

        const homeName = getEquipeName(rencontre.home_team_id);
        const awayName = getEquipeName(rencontre.away_team_id);

        html += `
            <li>
                ${date} — ${homeName} (${rencontre.home_score}) vs ${awayName} (${rencontre.away_score})
                (${rencontre.status})
                ${rencontre.playoff_round ? ` - ${rencontre.playoff_round}` : ""}
            </li>
        `;
    }

    list.innerHTML = html;
}

function afficherAthletes(athletes: Athlete[]): void {
    const container = document.getElementById("athletes-list");
    if (!container) return;

    if (athletes.length === 0) {
        container.innerHTML = "<p>Aucun joueur ne correspond.</p>";
        return;
    }

    let html = "";
    for (const athlete of athletes) {
        html += `
      <article class="athlete-card">
        <h3>${athlete.first_name} ${athlete.last_name}</h3>
        <p>${athlete.position} - #${athlete.jersey_number}</p>
        <p>${getEquipeName(athlete.team_id)}</p>
        <p>${athlete.stats.points_per_game} pts / ${athlete.stats.rebounds_per_game} rbds / ${athlete.stats.assists_per_game} pds</p>
      </article>
    `;
    }
    container.innerHTML = html;
}

function positionFilter(): void {
    const select = document.getElementById("position-filter") as HTMLSelectElement | null;
    if (!select) return;

    const positions: string[] = [];
    for (const athlete of athletes) {
        if (athlete.position && !positions.includes(athlete.position)) {
            positions.push(athlete.position);
        }
    }

    for (const weightClass of positions) {
        const option = document.createElement("option");
        option.value = weightClass;
        option.textContent = weightClass;
        select.appendChild(option);
    }
}

function comparatorSelects(): void {
    const select1 = document.getElementById("compare-athlete-1") as HTMLSelectElement | null;
    const select2 = document.getElementById("compare-athlete-2") as HTMLSelectElement | null;
    if (!select1 || !select2) return;

    let optionsHtml = "";
    for (const athlete of athletes) {
        optionsHtml += `<option value="${athlete.id}">${athlete.first_name} ${athlete.last_name}</option>`;
    }
    select1.innerHTML = optionsHtml;
    select2.innerHTML = optionsHtml;
}

function setupTabs(): void {
    const buttons = document.querySelectorAll<HTMLButtonElement>(".tab-btn");

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
        });
    });
}

function applyFilters(): void {
    const searchInput = document.getElementById("search-input") as HTMLInputElement | null;
    const positionFilter = document.getElementById("position-filter") as HTMLSelectElement | null;

    const query = (searchInput?.value ?? "").toLowerCase();

    const filter: AthleteFilter = {
        position: positionFilter?.value || undefined,
    };

    const filtered = athletes.filter((athlete) => {
        const matchesName = athlete.last_name.toLowerCase().includes(query);
        const matchesPosition = !filter.position || athlete.position === filter.position;
        return matchesName && matchesPosition;
    });

    afficherAthletes(filtered);
}

function setupSearchAndFilter(): void {
    document.getElementById("search-input")?.addEventListener("input", applyFilters);
    document.getElementById("position-filter")?.addEventListener("change", applyFilters);
}


function setupComparator(): void {
    const button = document.getElementById("compare-btn");

    button?.addEventListener("click", () => {
        const select1: HTMLSelectElement = document.getElementById("compare-athlete-1") as HTMLSelectElement;
        const select2: HTMLSelectElement = document.getElementById("compare-athlete-2") as HTMLSelectElement;
        const resultBox = document.getElementById("compare-result");
        if (!resultBox) return;

        const id1 = Number(select1.value);
        const id2 = Number(select2.value);

        const athlete1 = athletes.find((athlete) => athlete.id === id1);
        const athlete2 = athletes.find((athlete) => athlete.id === id2);

        if (!athlete1 || !athlete2) {
            notif("Sélectionnez deux joueurs valides.", "error");
            return;
        }

        if (id1 === id2) {
            notif("Choisissez deux joueurs différents.", "error");
            return;
        }

        if (athlete1.sport_id !== athlete2.sport_id) {
            notif("Impossible de comparer des athlètes de sports différents.", "error");
            return;
        }

        resultBox.innerHTML = `
      <table class="compare-table">
        <thead>
          <tr><th>${athlete1.first_name} ${athlete1.last_name}</th><th>Stat</th><th>${athlete2.first_name} ${athlete2.last_name}</th></tr>
        </thead>
        <tbody>
          <tr><td>${athlete1.stats.points_per_game}</td><td>Points par match</td><td>${athlete2.stats.points_per_game}</td></tr>
          <tr><td>${athlete1.stats.rebounds_per_game}</td><td>Rebonds par match</td><td>${athlete2.stats.rebounds_per_game}</td></tr>
          <tr><td>${athlete1.stats.assists_per_game}</td><td>Passes par match</td><td>${athlete2.stats.assists_per_game}</td></tr>
          <tr><td>${(athlete1.stats.field_goal_percentage * 100).toFixed(1)}%</td><td>Réussite tirs</td><td>${(athlete2.stats.field_goal_percentage * 100).toFixed(1)}%</td></tr>

        </tbody>
      </table>
    `;
    });
}

setupTabs();
setupSearchAndFilter();
setupComparator();
getBasketballData();