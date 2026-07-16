import { Sport } from "../types/sport.js";
import { notif } from "../utils/notif.js";
import { afficherInfos } from "../features/infos.js";
import { afficherStats, type Category } from "../features/tabs/stats.tab.js";
import { afficherRencontres, type Historique } from "../features/tabs/history.tab.js";
import { afficherJoueurs as afficherCombattants, type Player } from "../features/tabs/players.tab.js";
import { optionsFiltre, correspond } from "../features/search.js";
import { remplirComparator, comparator } from "../features/comparator.js";
import { translate } from "../utils/translate.js";

const poids: Record<string, string> = {
    "Heavyweight": "Poids lourd",
    "Lightweight": "Poids léger",
    "Middleweight": "Poids moyen",
    "Featherweight": "Poids plume",
    "Welterweight": "Poids welter",
    "Bantamweight": "Poids coq"
};

const gardes: Record<string, string> = {
    "Orthodox": "Orthodoxe",
    "Southpaw": "Fausse patte",
    "Switch": "Changement de garde"
};

const combats: Record<string, string> = {
    "Main Event": "Combat principal",
    "Co-Main Event": "Combat co-principal",
    "Main Card": "Carte principale",
    "Preliminary Card": "Carte préliminaire"
}

const statuts: Record<string, string> = {
    "finished": "terminé"
};

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
            notif('Impossible de récupérer les sports. Réessayez plus tard.');
        }

        const sports: Sport[] = await sportsResponse.json();
        const mma = sports.find((a) => a.slug === 'mma');

        if (!mma) {
            notif("Le sport MMA n'existe pas dans l'API.", "error");
            return;
        }

        const athletesResponse = await fetch('https://keligmartin.github.io/api/athletes.json');

        if (!athletesResponse.ok) {
            notif('Impossible de récupérer les athlètes !');
        }

        const allAthletes: Athlete[] = await athletesResponse.json();
        athletes = allAthletes.filter((athlete) => athlete.sport_id === mma.id);

        const rencontresResponse = await fetch('https://keligmartin.github.io/api/rencontres.json');

        if (!rencontresResponse.ok) {
            notif('Impossible de récupérer les rencontres !');
        }

        const allRencontres: Rencontre[] = await rencontresResponse.json();
        rencontres = allRencontres.filter((rencontre) => rencontre.sport_id === mma.id);

        afficherInfos(mma);
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
            title: "Égalités",
            values: athletes.map((athlete) => ({
                name: `${athlete.first_name} ${athlete.nickname ? `"${athlete.nickname}"` : ""} ${athlete.last_name}`,
                value: athlete.stats.draws
            })),
            unit: ""
        },
        {
            title: "Sans décision",
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
            description: `<strong>${translate(rencontre.weight_class, poids)}</strong> - ${translate(rencontre.card_position, combats)} (${translate(rencontre.status, statuts)})<br/><br/>
            ${name1} vs ${name2}
            ${winner ? `<br/><br/>Vainqueur : ${winner.first_name} ${winner.nickname ? `"${winner.nickname}"` : ""} ${winner.last_name}<br/>${rencontre.method} R ${rencontre.round} ${rencontre.time}` : ""}<br/><br/>
            ${rencontre.venue}`
        }
    });
}

function getMmaFighters(athletes: Athlete[]): Player[] {
    return athletes.map((athlete) => ({
        name: `${athlete.first_name} ${athlete.nickname ? `"${athlete.nickname}"` : ""} ${athlete.last_name}`,
        subtitle: `${athlete.height_cm}cm ${athlete.weight_kg}kg`,
        description: `${translate(athlete.weight_class, poids)} | ${translate(athlete.stance, gardes)}`,
        statLines: [`${athlete.stats.wins}V - ${athlete.stats.losses}L - ${athlete.stats.draws}D<br/>${athlete.stats.wins_by_ko} Victoires par K.O.<br/>${athlete.stats.wins_by_submission} Victoires par soumission<br/>${athlete.stats.wins_by_decision} Victoires par décision<br/>${athlete.stats.no_contests} Sans décision`]
    }));
}

function weightClassFilter(): void {
    const allWeightClasses = athletes.map((athlete) => athlete.weight_class);
    optionsFiltre("weightclass-filter", allWeightClasses, (value) => translate(value, poids));
}

function comparatorSelects(): void {
    const options = athletes.map((athlete) => ({
        id: athlete.id,
        name: `${athlete.first_name} ${athlete.nickname ? `"${athlete.nickname}"` : ""} ${athlete.last_name}`
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
                if (targetTab === "combattants") {
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
    const weightClassFilter = document.getElementById("weightclass-filter") as HTMLSelectElement | null;

    const texte = searchInput?.value ?? "";

    const filter: AthleteFilter = {
        weight_class: weightClassFilter?.value || undefined,
    };

    const filtered = athletes.filter((athlete) => {
        const matchesName = correspond(texte, athlete.first_name, athlete.nickname, athlete.last_name);
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
    comparator((id1, id2) => {
        const result = document.getElementById("compare-result");

        if (!result) return;

        const athlete1 = athletes.find((athlete) => athlete.id === id1);
        const athlete2 = athletes.find((athlete) => athlete.id === id2);

        if (!athlete1 || !athlete2) {
            notif("Sélectionnez deux combattants valides.", "error");
            return;
        }

        if (id1 === id2) {
            notif("Sélectionnez deux comnbattants différents.", "error");
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
                    <th>${athlete1.first_name} ${athlete1.nickname ? `"${athlete1.nickname}"` : ""} ${athlete1.last_name}</th>
                    <th>Stat</th>
                    <th>${athlete2.first_name + (athlete2.nickname ? ` "${athlete2.nickname}" ` : " ") + athlete2.last_name}</th>
                </tr>
            </thead>
        <tbody>
            <tr>
                <td>${athlete1.stats.wins ?? 0}</td>
                <td>Victoires</td>
                <td>${athlete2.stats.wins ?? 0}</td>
            </tr>
            <tr>
                <td>${athlete1.stats.wins_by_ko ?? 0}</td>
                <td>Victoires par K.O.</td>
                <td>${athlete2.stats.wins_by_ko ?? 0}</td>
            </tr>
            <tr>
                <td>${athlete1.stats.wins_by_submission ?? 0}</td>
                <td>Victoires par soumission</td>
                <td>${athlete2.stats.wins_by_submission ?? 0}</td>
            </tr>
            <tr>
                <td>${athlete1.stats.wins_by_decision ?? 0}</td>
                <td>Victoires par décision</td>
                <td>${athlete2.stats.wins_by_decision ?? 0}</td>
            </tr>
            <tr>
                <td>${athlete1.stats.losses ?? 0}</td>
                <td>Défaites</td>
                <td>${athlete2.stats.losses ?? 0}</td>
            </tr>
            <tr>
                <td>${athlete1.stats.draws ?? 0}</td>
                <td>Égalités</td>
                <td>${athlete2.stats.draws ?? 0}</td>
            </tr>
            <tr>
                <td>${athlete1.stats.no_contests ?? 0}</td>
                <td>Sans décision</td>
                <td>${athlete2.stats.no_contests ?? 0}</td>
            </tr>
        </tbody>
        </table>
        `;
    });
}

setupTabs();
setupSearchAndFilter();
setupComparator();
getMmaData();