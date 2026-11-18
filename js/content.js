import { SITES } from "./config.js";
import { clone } from "./dom.js";
import { store } from "./store.js";

const defaults = {};
const current = {};
const listeners = new Set();

async function fetchDefaults(site) {
  const response = await fetch(`content/${SITES[site].file}`, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Could not load content for ${site}`);
  return response.json();
}

function withDefaults(site, data) {
  const merged = { banners: [], schedule: [], shows: [], posts: [], ...data };
  merged.settings = { ...defaults[site].settings, ...(data.settings || {}) };
  return merged;
}

export async function loadContent() {
  await Promise.all(
    Object.keys(SITES).map(async (site) => {
      defaults[site] = await fetchDefaults(site);
      let saved = null;
      try {
        saved = await store.load(site);
      } catch {}
      current[site] = withDefaults(site, saved || defaults[site]);
    })
  );
}

export const getContent = (site) => current[site];
export const getDefaults = (site) => clone(defaults[site]);

export function setContent(site, data) {
  current[site] = withDefaults(site, data);
  listeners.forEach((fn) => fn(site));
}

export function onContentChange(fn) {
  listeners.add(fn);
}
