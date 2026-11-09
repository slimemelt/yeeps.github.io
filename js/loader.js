import { $ } from "./dom.js";

const loader = $("loader");

export function showLoader(ms) {
  loader.classList.remove("off");
  setTimeout(() => loader.classList.add("off"), ms);
}

export function hideLoaderWhenReady() {
  const hide = () => setTimeout(() => loader.classList.add("off"), 750);
  document.readyState === "complete" ? hide() : addEventListener("load", hide);
}
