export const $ = (id) => document.getElementById(id);
export const stage = $("stage");

export const clone = (value) => JSON.parse(JSON.stringify(value));

const ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
export const escapeHtml = (text) => String(text ?? "").replace(/[&<>"]/g, (c) => ENTITIES[c]);

export const prefersReducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// Image paths in content are relative to the page the app first loaded from, not the current pushState URL.
const ROOT = document.baseURI;
export const asset = (path) => new URL(path, ROOT).href;
