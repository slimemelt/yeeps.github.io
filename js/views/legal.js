import { $ } from "../dom.js";
import { siteName } from "../state.js";

const ROOT = document.baseURI;

export async function renderLegal() {
  const name = location.pathname.replace(/^\/+|\/+$/g, "");
  const body = $("legal-body");
  try {
    const response = await fetch(new URL(`${name}/index.html`, ROOT));
    if (!response.ok) throw new Error(response.status);
    const doc = new DOMParser().parseFromString(await response.text(), "text/html");
    const parts = [...doc.querySelectorAll(".legal > :not(header):not(footer)")];
    body.replaceChildren(...parts.map((node) => document.importNode(node, true)));
    document.title = `${doc.querySelector("h1").textContent} - ${siteName()}`;
    $("page-title").textContent = document.title;
  } catch {
    body.textContent = "We couldn’t load this page.";
  }
}
