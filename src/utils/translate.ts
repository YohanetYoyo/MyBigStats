export function translate(valeur: string, dictionnaire: Record<string, string>): string {
    return dictionnaire[valeur] ?? valeur;
}