export interface Team {
    name: string;
    subtitle: string;
    description: string;
}

export function afficherEquipes(teams: Team[]): void {
    const container = document.getElementById("equipes-list");
    if (!container) return;

    if (teams.length === 0) {
        container.innerHTML = "<p>Aucun équipe.</p>";
        return;
    }

    let html = "";
    for (const team of teams) {
        html += `
            <article class="team-card">
                <h3>${team.name}
                <small>${team.subtitle}</small>
                </h3>
                ${team.description}
            </article>
        `;
    }

    container.innerHTML = html;
}