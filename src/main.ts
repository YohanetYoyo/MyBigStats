import { Router } from "./router.ts";
import { renderHomePage } from "./pages/home.page.ts";
import { renderFootballPage } from "./pages/football.page.ts";
import { renderMmaPage } from "./pages/mma.page.ts";
import { renderBasketPage } from "./pages/basket.page.ts";
import { getAppRoot } from "./utils/dom.ts";

function updateActiveNavLink(hash: string): void {
    document.querySelectorAll<HTMLAnchorElement>(".sport-nav a").forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${hash}`);
    });
}

const router = new Router();

router
    .add("/", () => {
        updateActiveNavLink("/");
        void renderHomePage();
    })
    .add("/sport/football", () => {
        updateActiveNavLink("/sport/football");
        void renderFootballPage();
    })
    .add("/sport/mma", () => {
        updateActiveNavLink("/sport/mma");
        void renderMmaPage();
    })
    .add("/sport/basketball", () => {
        updateActiveNavLink("/sport/basketball");
        void renderBasketPage();
    })
    .notFound(() => {
        getAppRoot().innerHTML = `<p>Page introuvable. <a href="#/">Retour à l'accueil</a></p>`;
    });

router.start();
