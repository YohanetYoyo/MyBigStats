export interface Comparator {
    id: number;
    name: string;
}

export function remplirComparator(options: Comparator[]): void {
    const select1 = document.getElementById("compare-athlete-1") as HTMLSelectElement | null;
    const select2 = document.getElementById("compare-athlete-2") as HTMLSelectElement | null;

    if (!select1 || !select2) return;

    let optionsHtml = "";
    for (const option of options) {
        optionsHtml += `<option value="${option.id}">${option.name}</option>`;
    }
    select1.innerHTML = optionsHtml;
    select2.innerHTML = optionsHtml;
}

export function comparator(comparer: (id1: number, id2: number) => void): void {
    const button = document.getElementById("compare-btn");

    button?.addEventListener("click", () => {
        const select1 = document.getElementById("compare-athlete-1") as HTMLSelectElement | null;
        const select2 = document.getElementById("compare-athlete-2") as HTMLSelectElement | null;

        if (!select1 || !select2) return;

        const id1 = Number(select1.value);
        const id2 = Number(select2.value);

        comparer(id1, id2);
    })
}