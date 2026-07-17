export function qs<T extends HTMLElement = HTMLElement>(selector: string, root: ParentNode = document): T | null {
    return root.querySelector<T>(selector);
}

export function qsa<T extends HTMLElement = HTMLElement>(selector: string, root: ParentNode = document): T[] {
    return Array.from(root.querySelectorAll<T>(selector));
}

export function clearElement(element: HTMLElement): void {
    element.innerHTML = "";
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    options?: {
        className?: string;
        text?: string;
        html?: string;
        attrs?: Record<string, string>;
    }
): HTMLElementTagNameMap[K] {
    const element = document.createElement(tag);

    if (options?.className) element.className = options.className;
    if (options?.text !== undefined) element.textContent = options.text;
    if (options?.html !== undefined) element.innerHTML = options.html;
    if (options?.attrs) {
        for (const [key, value] of Object.entries(options.attrs)) {
            element.setAttribute(key, value);
        }
    }

    return element;
}

/** Racine de l'application, montée une seule fois par index.html. */
export function getAppRoot(): HTMLElement {
    const root = document.getElementById("app");
    if (!root) {
        throw new Error("Élément #app introuvable dans le DOM.");
    }
    return root;
}
