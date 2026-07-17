import type { Sport, Athlete, Equipe, Rencontre } from "../types/index.js";

const BASE_URL = "https://keligmartin.github.io/api";

export class ApiError extends Error {
    constructor(message: string, public readonly cause?: unknown) {
        super(message);
        this.name = "ApiError";
    }
}

async function fetchJson<T>(path: string, errorMessage: string): Promise<T> {
    let response: Response;

    try {
        response = await fetch(`${BASE_URL}/${path}`);
    } catch (error) {
        throw new ApiError(errorMessage, error);
    }

    if (!response.ok) {
        throw new ApiError(errorMessage);
    }

    try {
        return (await response.json()) as T;
    } catch (error) {
        throw new ApiError(errorMessage, error);
    }
}

// Un seul appel réseau par ressource, mis en cache pour la durée de la session
// (évite de re-fetcher les 4 endpoints à chaque changement de route).
let sportsCache: Promise<Sport[]> | null = null;
let athletesCache: Promise<Athlete[]> | null = null;
let equipesCache: Promise<Equipe[]> | null = null;
let rencontresCache: Promise<Rencontre[]> | null = null;

export const apiService = {
    getSports(): Promise<Sport[]> {
        sportsCache ??= fetchJson<Sport[]>("sports.json", "Impossible de récupérer les sports.");
        return sportsCache;
    },

    getAthletes(): Promise<Athlete[]> {
        athletesCache ??= fetchJson<Athlete[]>("athletes.json", "Impossible de récupérer les athlètes.");
        return athletesCache;
    },

    getEquipes(): Promise<Equipe[]> {
        equipesCache ??= fetchJson<Equipe[]>("equipes.json", "Impossible de récupérer les équipes.");
        return equipesCache;
    },

    getRencontres(): Promise<Rencontre[]> {
        rencontresCache ??= fetchJson<Rencontre[]>("rencontres.json", "Impossible de récupérer les rencontres.");
        return rencontresCache;
    },

    async getSportBySlug(slug: string): Promise<Sport | undefined> {
        const sports = await this.getSports();
        return sports.find((sport) => sport.slug === slug);
    },
};