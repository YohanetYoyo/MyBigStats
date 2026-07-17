import { Router } from "./router.js";
import { renderHomePage } from "./pages/home.page.js";
import { renderFootballPage } from "./pages/football.page.js";
import { renderMmaPage } from "./pages/mma.page.js";
import { renderBasketPage } from "./pages/basket.page.js";
import { getAppRoot } from "./utils/dom.js";

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
