export type RouteHandler = (params: Record<string, string>) => void | Promise<void>;

interface Route {
    pattern: RegExp;
    paramNames: string[];
    handler: RouteHandler;
}

/**
 * Router minimaliste : pas de dépendance externe, juste `hashchange`.
 * Supporte des segments dynamiques du type "#/sport/:slug".
 */
export class Router {
    private routes: Route[] = [];
    private notFoundHandler: RouteHandler = () => {
        console.warn("Aucune route ne correspond, redirection vers l'accueil.");
        window.location.hash = "#/";
    };

    add(path: string, handler: RouteHandler): this {
        const paramNames: string[] = [];

        const patternString = path
            .split("/")
            .map((segment) => {
                if (segment.startsWith(":")) {
                    paramNames.push(segment.slice(1));
                    return "([^/]+)";
                }
                return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            })
            .join("/");

        this.routes.push({
            pattern: new RegExp(`^${patternString}$`),
            paramNames,
            handler,
        });

        return this;
    }

    notFound(handler: RouteHandler): this {
        this.notFoundHandler = handler;
        return this;
    }

    start(): void {
        window.addEventListener("hashchange", () => this.resolve());
        this.resolve();
    }

    private resolve(): void {
        const hash = window.location.hash.replace(/^#/, "") || "/";
        const path = hash.split("?")[0];

        for (const route of this.routes) {
            const match = path.match(route.pattern);
            if (!match) continue;

            const params: Record<string, string> = {};
            route.paramNames.forEach((name, index) => {
                params[name] = decodeURIComponent(match[index + 1] ?? "");
            });

            void route.handler(params);
            return;
        }

        void this.notFoundHandler({});
    }
}
