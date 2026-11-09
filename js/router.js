import { $, stage } from "./dom.js";
import { ADMIN_ENABLED, ROUTES, VIEW_TITLES } from "./config.js";
import { state, siteName } from "./state.js";
import { placeUnderline } from "./menu.js";
import { showLoader } from "./loader.js";
import { ensurePlayer, pausePlayer } from "./views/player.js";
import { fitFundingsText } from "./views/fundings.js";

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
  updateTitle();
}

export async function route({ first = false } = {}) {
  const { hash } = location;
  let view = ROUTES[hash] ?? "home";
  if (view === "admin" && !ADMIN_ENABLED) view = "home";
  const changed = view !== state.view;
  applyView(view);

  if (view === "watch") ensurePlayer();
  else pausePlayer();

  if (view === "admin") (await import("./admin/index.js")).openAdmin();
  requestAnimationFrame(fitFundingsText);

  if (changed && !first) {
    showLoader(450);
    scrollTo(0, 0);
    // in-page anchors such as #home-schedule
    const anchor = view === "home" && hash.length > 1 ? document.getElementById(hash.slice(1)) : null;
    if (anchor) setTimeout(() => anchor.scrollIntoView(), 50);
  }
}
