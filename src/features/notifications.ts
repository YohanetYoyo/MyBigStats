import { createElement } from "../utils/dom.js";
import { ApiError } from "../services/api.service.js";

export type NotifType = "error" | "info" | "success";

export function notify(message: string, type: NotifType = "info"): void {
    const container = document.getElementById("notifications");
    if (!container) return;

    const popup = createElement("div", {
        className: `popup popup--${type}`,
        text: message,
    });

    container.appendChild(popup);
    setTimeout(() => popup.remove(), 4000);
}

/** Traduit une erreur attrapée dans un try/catch en notification utilisateur. */
export function notifyError(error: unknown, fallbackMessage = "Une erreur est survenue."): void {
    console.error(error);

    if (error instanceof ApiError) {
        notify(error.message, "error");
        return;
    }

    notify(fallbackMessage, "error");
}
