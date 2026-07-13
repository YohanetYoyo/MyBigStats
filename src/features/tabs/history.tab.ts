export interface Historique {
    date: string;
    description: string;
}

export function afficherRencontres(historiques: Historique[]): void {
    const list = document.getElementById("rencontres-list");
    if (!list) return;

    if (historiques.length === 0) {
        list.innerHTML = "<li>Aucune rencontre disponible.</li>";
        return;
    }

    const sortedHistoriques = [...historiques].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let html = "";
    for (const historique of sortedHistoriques) {
        const date = new Date(historique.date).toLocaleDateString("fr-FR");

        html += `
            <li>
                ${date} - ${historique.description}
            </li>
        `;
    }

    list.innerHTML = html;
}