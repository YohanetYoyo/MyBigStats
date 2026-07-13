export interface Stat {
    name: string;
    value: number;
}

export interface Category {
    title: string;
    values: Stat[];
    unit?: string;
}

export function afficherStats(categories: Category[], max: number = 5): void {
    const container = document.getElementById('stats-content');
    if (!container) return;

    if (categories.length === 0) {
        container.innerHTML = "<p>Aucune statistique disponible.</p>";
        return;
    }

    let html = "";

    for (const category of categories) {
        const sorted = [...category.values].sort((a, b) => b.value - a.value);
        const top = sorted.slice(0, max);

        let rowsHtml = "";
        top.forEach((stat) => {
            rowsHtml += `<li>${stat.name} - ${stat.value}${category.unit ?? ""}</li>`;
        });

        html += `
        <div class="stat">
            <h3>${category.title}</h3>
            <ol>${rowsHtml || "<li>Aucune donnée.</li>"}</ol>
        </div>
        `;
    }

    container.innerHTML = html;
}