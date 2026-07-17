import type { Athlete, Equipe, Rencontre } from "../types/index.js";
import { apiService } from "../services/api.service.js";
import { notify, notifyError } from "../features/notifications.js";
import { afficherStats, type Category } from "../features/tabs/stats.tab.js";
import { afficherRencontres, type Historique } from "../features/tabs/history.tab.js";
import { afficherJoueurs, type Player } from "../features/tabs/players.tab.js";
import { optionsFiltre, correspond } from "../features/search.js";
import { remplirComparator, comparator } from "../features/comparator.js";
import { getAppRoot } from "../utils/dom.js";

type ComparatorStatConfig = {
    key: string;
    label: string;
    unit?: string;
};

const STAT_CONFIGS: ComparatorStatConfig[] = [
    { key: "goals", label: "Buts" },
    { key: "assists", label: "Passes décisives" },
    { key: "matches_played", label: "Matchs joués" },
    { key: "yellow_cards", label: "Cartons jaunes" },
    { key: "red_cards", label: "Cartons rouges" },
    { key: "minutes_played", label: "Minutes jouées", unit: " min" },
];

let athletes: Athlete[] = [];
let equipes: Equipe[] = [];
let rencontres: Rencontre[] = [];

function template(): string {
    return `
        <section class="toolbar">
            <input id="search-input" type="text" placeholder="Rechercher un joueur..." aria-label="Recherche d'athlète"/>
            <select id="entity-filter" aria-label="Filtrer par poste">
                <option value="">Tous les postes</option>
            </select>
        </section>

        <nav class="tabs" role="tablist">
            <button class="tab-btn active" data-tab="stats" role="tab">Stats</button>
            <button class="tab-btn" data-tab="historique" role="tab">Historique</button>
            <button class="tab-btn" data-tab="joueurs" role="tab">Joueurs</button>
            <button class="tab-btn" data-tab="comparateur" role="tab">Comparateur</button>
        </nav>

        <section id="tab-stats" class="tab-panel" data-tab-panel="stats">
            <h2>Statistiques Football</h2>
            <div id="stats-content">Chargement...</div>
        </section>

        <section id="tab-historique" class="tab-panel hidden" data-tab-panel="historique">
            <h2>Historique des matchs</h2>
            <ul id="rencontres-list">Chargement...</ul>
        </section>

        <section id="tab-joueurs" class="tab-panel hidden" data-tab-panel="joueurs">
            <h2>Joueurs</h2>
            <div id="athletes-list" class="athlete-grid">Chargement...</div>
        </section>

        <section id="tab-comparateur" class="tab-panel hidden" data-tab-panel="comparateur">
            <h2>Comparer deux joueurs</h2>
            <div class="comparator">
                <select id="compare-athlete-1" aria-label="Premier joueur"></select>
                <span>VS</span>
                <select id="compare-athlete-2" aria-label="Deuxième joueur"></select>
                <button id="compare-btn">Comparer</button>
            </div>
            <div id="compare-result"></div>
        </section>
    `;
}

// Gestion des onglets propre à cette page (chaque page.ts gère les siens,
// selon la répartition retenue par l'équipe).
function setupTabs(root: ParentNode): void {
    const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>(".tab-btn"));

    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const targetTab = button.dataset.tab;
            if (!targetTab) return;

            buttons.forEach((b) => b.classList.remove("active"));
            button.classList.add("active");

            root.querySelectorAll<HTMLElement>(".tab-panel").forEach((panel) => {
                panel.classList.toggle("hidden", panel.dataset.tabPanel !== targetTab);
            });
        });
    });
}

function equipeName(teamId: number | null): string {
    if (teamId === null) return "Équipe inconnue";
    return equipes.find((e) => e.id === teamId)?.name ?? "Équipe inconnue";
}

function athleteName(id: number | undefined): string {
    if (id === undefined) return "Inconnu";
    const athlete = athletes.find((a) => a.id === id);
    return athlete ? `${athlete.first_name} ${athlete.last_name}` : "Inconnu";
}

function getStatCategories(list: Athlete[]): Category[] {
    return [
        { title: "Buts", unit: "", values: list.map((a) => ({ name: `${a.first_name} ${a.last_name}`, value: a.stats.goals })) },
        { title: "Passes décisives", unit: "", values: list.map((a) => ({ name: `${a.first_name} ${a.last_name}`, value: a.stats.assists })) },
        { title: "Matchs joués", unit: "", values: list.map((a) => ({ name: `${a.first_name} ${a.last_name}`, value: a.stats.matches_played })) },
        { title: "Cartons jaunes", unit: "", values: list.map((a) => ({ name: `${a.first_name} ${a.last_name}`, value: a.stats.yellow_cards })) },
        { title: "Cartons rouges", unit: "", values: list.map((a) => ({ name: `${a.first_name} ${a.last_name}`, value: a.stats.red_cards })) },
        { title: "Minutes jouées", unit: " min", values: list.map((a) => ({ name: `${a.first_name} ${a.last_name}`, value: a.stats.minutes_played })) },
    ];
}

function getHistoryEntries(): Historique[] {
    return rencontres.map((r) => {
        const scorers = (r.scorers ?? []).map((s) => `${athleteName(s.athlete_id)} ${s.minute}'`).join(", ");

        return {
            date: r.date,
            description: `<strong>${(r.stage ?? "").replace(/_/g, " ")}</strong> (${r.status})<br/><br/>
                ${equipeName(r.home_team_id ?? null)} ${r.home_score} - ${r.away_score} ${equipeName(r.away_team_id ?? null)}
                ${scorers ? `<br/>Buteurs : ${scorers}` : ""}`,
        };
    });
}

function getPlayerCards(list: Athlete[]): Player[] {
    return list.map((a) => ({
        name: `${a.first_name} ${a.last_name}`,
        subtitle: `${a.height_cm}cm ${a.weight_kg}kg`,
        description: `${a.position} - #${a.jersey_number} - ${equipeName(a.team_id)}`,
        statLines: [
            `${a.stats.matches_played} matchs<br/>${a.stats.goals} buts<br/>${a.stats.assists} passes décisives<br/>${a.stats.yellow_cards} cartons jaunes<br/>${a.stats.red_cards} cartons rouges<br/>${a.stats.minutes_played} minutes jouées`,
        ],
    }));
}

function applyFilters(): void {
    const searchInput = document.getElementById("search-input") as HTMLInputElement | null;
    const filterSelect = document.getElementById("entity-filter") as HTMLSelectElement | null;

    const texte = searchInput?.value ?? "";
    const filterValue = filterSelect?.value || undefined;

    const filtered = athletes.filter((a) => {
        const matchesName = correspond(texte, a.first_name, a.last_name);
        const matchesPosition = !filterValue || a.position === filterValue;
        return matchesName && matchesPosition;
    });

    afficherJoueurs(getPlayerCards(filtered));
}

function setupPositionFilter(): void {
    const positions = athletes.map((a) => a.position ?? "").filter(Boolean);
    optionsFiltre("entity-filter", positions);
}

function setupSearchAndFilter(): void {
    document.getElementById("search-input")?.addEventListener("input", applyFilters);
    document.getElementById("entity-filter")?.addEventListener("change", applyFilters);
}

function setupComparatorPanel(): void {
    const options = athletes.map((a) => ({ id: a.id, name: `${a.first_name} ${a.last_name}` }));
    remplirComparator(options);

    comparator((id1, id2) => {
        const result = document.getElementById("compare-result");
        if (!result) return;

        const athlete1 = athletes.find((a) => a.id === id1);
        const athlete2 = athletes.find((a) => a.id === id2);

        if (!athlete1 || !athlete2) {
            notify("Sélectionnez deux joueurs valides.", "error");
            return;
        }

        if (id1 === id2) {
            notify("Sélectionnez deux joueurs différents.", "error");
            return;
        }

        const rows = STAT_CONFIGS.map(
            (config) => `
                <tr>
                    <td>${athlete1.stats[config.key] ?? 0}${config.unit ?? ""}</td>
                    <td>${config.label}</td>
                    <td>${athlete2.stats[config.key] ?? 0}${config.unit ?? ""}</td>
                </tr>
            `
        ).join("");

        result.innerHTML = `
            <table class="compare-table">
                <thead>
                    <tr>
                        <th>${athlete1.first_name} ${athlete1.last_name}</th>
                        <th>Stat</th>
                        <th>${athlete2.first_name} ${athlete2.last_name}</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    });
}

export async function renderFootballPage(): Promise<void> {
    const root = getAppRoot();
    root.innerHTML = template();

    try {
        const sport = await apiService.getSportBySlug("football");
        if (!sport) {
            notify('Le sport "football" n\'existe pas dans l\'API.', "error");
            return;
        }

        const [allAthletes, allEquipes, allRencontres] = await Promise.all([
            apiService.getAthletes(),
            apiService.getEquipes(),
            apiService.getRencontres(),
        ]);

        athletes = allAthletes.filter((a) => a.sport_id === sport.id);
        equipes = allEquipes.filter((e) => e.sport_id === sport.id);
        rencontres = allRencontres.filter((r) => r.sport_id === sport.id);

        afficherStats(getStatCategories(athletes));
        afficherRencontres(getHistoryEntries());
        afficherJoueurs(getPlayerCards(athletes));

        setupPositionFilter();
        setupSearchAndFilter();
        setupTabs(root);
        setupComparatorPanel();
    } catch (error) {
        notifyError(error, "L'API est indisponible pour le moment. Réessayez plus tard.");
    }
}
