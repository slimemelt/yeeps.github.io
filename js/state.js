import { SITES, SITE_STORAGE_KEY } from "./config.js";

export const state = { site: "ch", view: "home" };

try {
  if (localStorage.getItem(SITE_STORAGE_KEY) === "ds") state.site = "ds";
} catch {}

export function rememberSite() {
  try {
    localStorage.setItem(SITE_STORAGE_KEY, state.site);
  } catch {}
}

export const siteName = () => SITES[state.site].name;
