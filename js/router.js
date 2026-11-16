import { $, stage } from "./dom.js";
import { ADMIN_ENABLED, ROUTES, VIEW_TITLES } from "./config.js";
import { state, siteName } from "./state.js";
import { placeUnderline } from "./menu.js";
import { ensurePlayer, pausePlayer } from "./views/player.js";
import { fitFundingsText } from "./views/fundings.js";
import { renderBlog } from "./views/blog.js";
import { renderLegal } from "./views/legal.js";

export function updateTitle() {
  const label = VIEW_TITLES[state.view];
  document.title = (label ? `${label} – ` : "") + siteName();
  $("page-title").textContent = document.title;
}

export function applyView(view) {
  state.view = view;
  stage.dataset.view = view;
  document.documentElement.dataset.view = view;
  placeUnderline(view);
  const tab = view === "post" ? "blog" : view;
  document.querySelectorAll(".home-tabs a").forEach((a) => (a.dataset.tab === tab ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
  updateTitle();
}

export async function route({ first = false } = {}) {
  const path = location.pathname.replace(/\/+$/, "");
  let view = ROUTES[path] ?? (path.startsWith("/news/") ? "post" : "home");
  if (view === "admin" && !ADMIN_ENABLED) view = "home";
  const changed = view !== state.view;
  applyView(view);
  renderBlog();
  if (view === "legal") renderLegal();

  if (view === "watch") ensurePlayer();
  else pausePlayer();

  if (view === "admin") (await import("./admin/index.js")).openAdmin();
  requestAnimationFrame(fitFundingsText);

  if (changed && !first) {
    scrollTo(0, 0);
    // in-page anchors such as /#home-schedule
    const { hash } = location;
    const anchor = view === "home" && hash.length > 1 ? document.getElementById(hash.slice(1)) : null;
    if (anchor) setTimeout(() => anchor.scrollIntoView(), 50);
  }
}

/** Moves to a clean path (/fundings) without reloading the page. */
export function navigate(path) {
  if (path === location.pathname + location.search) return;
  history.pushState(null, "", path);
  route();
}

/** Old links like /#fundings still work: swap them for the clean path. */
export function upgradeLegacyHash() {
  const view = ROUTES["/" + location.hash.slice(1)];
  if (view && location.pathname === "/") history.replaceState(null, "", "/" + location.hash.slice(1));
  else if (location.hash.startsWith("#blog/")) history.replaceState(null, "", "/news/" + location.hash.slice("#blog/".length));
  else if (location.pathname === "/blog" || location.pathname.startsWith("/blog/")) history.replaceState(null, "", location.pathname.replace(/^\/blog/, "/news"));
}
