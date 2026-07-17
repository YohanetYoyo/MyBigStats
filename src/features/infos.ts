import { Sport } from "../types/sport.js";
import { translate } from "../utils/translate.js";

const types: Record<string, string> = {
    "team": "Équipe",
    "individual": "Individuel"
};

export function afficherInfos(sport: Sport): void {
    const section = document.getElementById("infos");

    if (!section) return;

    let dates = "";

    if (sport.competition.start_date && sport.competition.end_date) {
        dates = `
        Du ${new Intl.DateTimeFormat("fr-FR").format(new Date(sport.competition.start_date))} au ${new Intl.DateTimeFormat("fr-FR").format(new Date(sport.competition.end_date))}
        `;
    } else if (sport.competition.date) {
        dates = `
        Date : ${new Intl.DateTimeFormat("fr-FR").format(new Date(sport.competition.date))}
        `;
    }

    section.innerHTML = `
    <h2>${sport.name}</h2>
    <p>
        Type : ${translate(sport.type, types)}<br/>
        Joueurs par équipe : ${sport.players_per_team}<br/>
        Durée : ${sport.match_duration_minutes}<br/>
        Organisme : ${sport.governing_body}<br/>
    </p>

    <h3>${sport.competition.name}</h3>
    <p>
        Pays : ${sport.competition.host_country}<br/>
        ${dates}<br/>
        ${sport.competition.number_of_teams ? `Nombre d'équipes : ${sport.competition.number_of_teams}<br/>` : ""}
        Format : ${sport.competition.format}
    </p>
    `;
}