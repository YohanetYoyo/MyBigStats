export interface Player {
    name: string;
    subtitle: string;
    description: string;
    statLines: string[];
}

export function afficherJoueurs(players: Player[]): void {
    const container = document.getElementById("athletes-list");
    if (!container) return;

    if (players.length === 0) {
        container.innerHTML = "<p>Aucun joueur.</p>";
        return;
    }

    let html = "";
    for (const player of players) {
        html += `
            <article class="athlete-card">
                <h3>${player.name}
                <small>${player.subtitle}</small>
                </h3>
                ${player.description}
                ${player.statLines.map((line) => `<p>${line}</p>`).join("")}
            </article>
        `;
    }

    container.innerHTML = html;
}