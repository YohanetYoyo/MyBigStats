export function notif(message: string, type: "error" | "info" | "success" = "info"): void {
    const container = document.getElementById("notifications");
    if (!container) return;

    const popup = document.createElement("div");
    popup.className = `popup popup--${type}`;
    popup.textContent = message;
    container.appendChild(popup);

    setTimeout(() => popup.remove(), 4000);
}