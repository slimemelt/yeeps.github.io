import { $, stage } from "./dom.js";
import { ROUTES, SITES } from "./config.js";
import { state, rememberSite } from "./state.js";
import { loadContent, onContentChange } from "./content.js";
import { initMenu, setMenuOpen } from "./menu.js";
import { navigate, route, updateTitle, upgradeLegacyHash } from "./router.js";
import { whileLoading } from "./loader.js";
import { renderHome, resetFeatured, fitAboutText } from "./views/home.js";
import { renderSchedulePage } from "./views/schedule.js";
import { renderBlog, renderHomeNews, fitHomeHeight } from "./views/blog.js";
import { fitFundingsText } from "./views/fundings.js";

const toggle = $("site-toggle");

function renderSite() {
  stage.dataset.site = state.site;
  document.documentElement.dataset.site = state.site;
  const other = state.site === "ch" ? SITES.ds.name : SITES.ch.name;
  toggle.setAttribute("aria-pressed", state.site === "ds");
  toggle.setAttribute("aria-label", `Switch to ${other}`);
  renderHome();
  renderSchedulePage();
  updateTitle();
  renderBlog();
  renderHomeNews();
}

toggle.addEventListener("click", () => {
  state.site = state.site === "ch" ? "ds" : "ch";
  rememberSite();
  resetFeatured();
  setMenuOpen(false);
  renderSite();
});

onContentChange((site) => site === state.site && renderSite());

addEventListener("popstate", () => route());
document.addEventListener("click", (event) => {
  const link = event.target.closest("a[href]");
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || link.target) return;
  const href = link.getAttribute("href");
  const path = href === "#home" ? "/" : href.startsWith("#") && ROUTES["/" + href.slice(1)] ? "/" + href.slice(1) : href;
  if (!path.startsWith("/") || path.startsWith("//")) return;
  event.preventDefault();
  navigate(path);
});
addEventListener("resize", () => {
  fitAboutText();
  fitFundingsText();
  fitHomeHeight();
});

async function boot() {
  initMenu();
  whileLoading(new Promise((done) => (document.readyState === "complete" ? done() : addEventListener("load", done))));
  await whileLoading(loadContent());
  renderSite();
  upgradeLegacyHash();
  await route({ first: true });
  document.fonts?.ready.then(() => {
    fitHomeHeight();
    fitAboutText();
    fitFundingsText();
  });
  addEventListener("load", fitAboutText);
}

boot();
