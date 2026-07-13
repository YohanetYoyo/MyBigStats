import { notif } from "../utils/notif.js";
import { afficherStats, type Category } from "../features/tabs/stats.tab.js";
import { afficherRencontres, type Historique } from "../features/tabs/history.tab.js";
import { afficherJoueurs as afficherCombattants, type Player } from "../features/tabs/players.tab.js";

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
    team_id?: number;
    first_name: string;
    last_name: string;
    nickname?: string;
    nationality: string;
    birth_date: string;
    height_cm: number;
    weight_kg: number;
    reach_cm: number;
    weight_class: string;
    stance: string;
    stats: {
        wins: number;
        losses: number;
        draws: number;
        no_contests: number;
        wins_by_ko: number;
        wins_by_submission: number;
        wins_by_decision: number;
        title_defenses: number;
    }
}

interface Rencontre {
    id: number;
    sport_id: number;
    type: string;
    card_position: string;
    date: string;
    fighter1_id: number;
    fighter2_id: number;
    winner_id: number;
    method: string;
    round: number;
    time: string;
    weight_class: string
    venue: string;
    title_fight: boolean;
    status: string;
}

type AthleteFilter = Partial<Pick<Athlete, "weight_class">>;

let athletes: Athlete[] = [];
let rencontres: Rencontre[] = [];

async function getMmaData(): Promise<void> {
    try {
        const sportsResponse = await fetch('https://keligmartin.github.io/api/sports.json');
        if (!sportsResponse.ok) {
            throw new Error('Impossible de récupérer les sports. Réessayez plus tard.');
        }

        const sports: Sport[] = await sportsResponse.json();
        const mma = sports.find((a) => a.slug === 'mma');

        if (!mma) {
            notif("Le sport MMA n'existe pas dans l'API.", "error");
            return;
        }

        const athletesResponse = await fetch('https://keligmartin.github.io/api/athletes.json');

        if (!athletesResponse.ok) {
            throw new Error('Impossible de récupérer les athlètes !');
        }

        const allAthletes: Athlete[] = await athletesResponse.json();
        athletes = allAthletes.filter((athlete) => athlete.sport_id === mma.id);

        const rencontresResponse = await fetch('https://keligmartin.github.io/api/rencontres.json');

        if (!rencontresResponse.ok) {
            throw new Error('Impossible de récupérer les rencontres !');
        }

        const allRencontres: Rencontre[] = await rencontresResponse.json();
        rencontres = allRencontres.filter((rencontre) => rencontre.sport_id === mma.id);

        afficherStats(getMmaStats());
        afficherRencontres(getMmaHistorique());
        afficherCombattants(getMmaFighters(athletes));
        weightClassFilter();
        comparatorSelects();
    } catch (error) {
        console.error(error);
        notif("L'API est indisponible pour le moment. Réessayez plus tard.", "error");
    }
}

function getMmaStats(): Category[] {
    return [
        {
            title: "Victoires",
            values: athletes.map((athlete) => ({
                name: `${athlete.first_name} ${athlete.nickname ? `"${athlete.nickname}"` : ""} ${athlete.last_name}`,
                value: athlete.stats.wins
            })),
            unit: ""
        },
        {
            title: "Défaites",
            values: athletes.map((athlete) => ({
                name: `${athlete.first_name} ${athlete.nickname ? `"${athlete.nickname}"` : ""} ${athlete.last_name}`,
                value: athlete.stats.losses
            })),
            unit: ""
        },
        {
            title: "Egalités",
            values: athletes.map((athlete) => ({
                name: `${athlete.first_name} ${athlete.nickname ? `"${athlete.nickname}"` : ""} ${athlete.last_name}`,
                value: athlete.stats.draws
            })),
            unit: ""
        },
        {
            title: "No contests",
            values: athletes.map((athlete) => ({
                name: `${athlete.first_name} ${athlete.nickname ? `"${athlete.nickname}"` : ""} ${athlete.last_name}`,
                value: athlete.stats.no_contests
            })),
            unit: ""
        },
        {
            title: "Victoire par K.O.",
            values: athletes.map((athlete) => ({
                name: `${athlete.first_name} ${athlete.nickname ? `"${athlete.nickname}"` : ""} ${athlete.last_name}`,
                value: athlete.stats.wins_by_ko
            })),
            unit: ""
        },
        {
            title: "Victoire par soumission",
            values: athletes.map((athlete) => ({
                name: `${athlete.first_name} ${athlete.nickname ? `"${athlete.nickname}"` : ""} ${athlete.last_name}`,
                value: athlete.stats.wins_by_submission
            })),
            unit: ""
        },
        {
            title: "Défenses de titre",
            values: athletes.map((athlete) => ({
                name: `${athlete.first_name} ${athlete.nickname ? `"${athlete.nickname}"` : ""} ${athlete.last_name}`,
                value: athlete.stats.title_defenses
            })),
            unit: ""
        }
    ]
}

function getMmaHistorique(): Historique[] {
    return rencontres.map((rencontre) => {
        const fighter1 = athletes.find((athlete) => athlete.id === rencontre.fighter1_id);
        const fighter2 = athletes.find((athlete) => athlete.id === rencontre.fighter2_id);
        const winner = athletes.find((athlete) => athlete.id === rencontre.winner_id);

        const name1 = fighter1 ? `${fighter1.first_name} ${fighter1.nickname ? `"${fighter1.nickname}"`: ""} ${fighter1.last_name}` : "Inconnu";
        const name2 = fighter2 ? `${fighter2.first_name} ${fighter2.nickname ? `"${fighter2.nickname}"`: ""} ${fighter2.last_name}` : "Inconnu";

        return {
            date: rencontre.date,
            description: `<strong>${rencontre.weight_class}</strong> - ${rencontre.card_position} (${rencontre.status})<br/><br/>
            ${name1} vs ${name2}
            ${winner ? `<br/><br/>Vainqueur : ${winner.first_name} ${winner.nickname ? `"${winner.nickname}"` : ""} ${winner.last_name}<br/>${rencontre.method} R ${rencontre.round} ${rencontre.time}` : ""}
            `
        }
    });
}

function getMmaFighters(athletes: Athlete[]): Player[] {
    return athletes.map((athlete) => ({
        name: `${athlete.first_name} ${athlete.nickname ? `"${athlete.nickname}"` : ""} ${athlete.last_name}`,
        subtitle: `${athlete.height_cm}cm ${athlete.weight_kg}kg`,
        description: `${athlete.weight_class} | ${athlete.stance}`,
        statLines: [`${athlete.stats.wins}V - ${athlete.stats.losses}L - ${athlete.stats.draws}D<br/>${athlete.stats.wins_by_ko} Victoires par K.O.<br/>${athlete.stats.wins_by_submission} Victoires par soumission<br/>${athlete.stats.wins_by_decision} Victoires par décision<br/>${athlete.stats.no_contests} Sans décision`]
    }));
}

function weightClassFilter(): void {
    const select = document.getElementById("weightclass-filter") as HTMLSelectElement | null;
    if (!select) return;

    const weightClasses: string[] = [];
    for (const athlete of athletes) {
        if (athlete.weight_class && !weightClasses.includes(athlete.weight_class)) {
            weightClasses.push(athlete.weight_class);
        }
    }

    for (const weightClass of weightClasses) {
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
        optionsHtml += `<option value="${athlete.id}">${athlete.first_name} ${athlete.nickname ? `"${athlete.nickname}"` : ""} ${athlete.last_name}</option>`;
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
    const weightClassFilter = document.getElementById("weightclass-filter") as HTMLSelectElement | null;

    const query = (searchInput?.value ?? "").toLowerCase();

    const filter: AthleteFilter = {
        weight_class: weightClassFilter?.value || undefined,
    };

    const filtered = athletes.filter((athlete) => {
        const matchesName = athlete.last_name.toLowerCase().includes(query);
        const matchesPosition = !filter.weight_class || athlete.weight_class === filter.weight_class;
        return matchesName && matchesPosition;
    });

    afficherCombattants(getMmaFighters(filtered));
}

function setupSearchAndFilter(): void {
    document.getElementById("search-input")?.addEventListener("input", applyFilters);
    document.getElementById("weightclass-filter")?.addEventListener("change", applyFilters);
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
            notif("Sélectionne deux combattants valides.", "error");
            return;
        }

        if (id1 === id2) {
            notif("Choisis deux combattants différents.", "error");
            return;
        }

        if (athlete1.sport_id !== athlete2.sport_id) {
            notif("Impossible de comparer des athlètes de sports différents.", "error");
            return;
        }

        resultBox.innerHTML = `
      <table class="compare-table">
        <thead>
          <tr><th>${athlete1.first_name} ${athlete1.nickname ? `"${athlete1.nickname}"` : ""} ${athlete1.last_name}</th><th>Stat</th><th>${athlete2.first_name + (athlete2.nickname ? ` "${athlete2.nickname}" ` : " ") + athlete2.last_name}</th></tr>
        </thead>
        <tbody>
          <tr><td>${athlete1.stats.wins ?? 0}</td><td>Victoires</td><td>${athlete2.stats.wins ?? 0}</td></tr>
          <tr><td>${athlete1.stats.losses ?? 0}</td><td>Défaites</td><td>${athlete2.stats.losses ?? 0}</td></tr>
        </tbody>
      </table>
    `;
    });
}

setupTabs();
setupSearchAndFilter();
setupComparator();
getMmaData();