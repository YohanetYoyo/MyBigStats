export function optionsFiltre(selectId: string, values: string[]): void {
    const select = document.getElementById(selectId) as HTMLSelectElement | null;
    if (!select) return;

    const uniqueValues = [...new Set(values)];

    for (const value of uniqueValues) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    }
}

export function correspond(texte: string, ...champs: (string | undefined) []): boolean {
    const lower = texte.toLowerCase();
    return champs.some((champ) => (champ ?? "").toLowerCase().includes(lower));
}