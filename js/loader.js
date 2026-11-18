import { $ } from "./dom.js";

const SLOW_MS = 400;

const loader = $("loader");
let pending = 0;
let timer;

export async function whileLoading(task) {
  if (pending++ === 0) timer = setTimeout(() => loader.classList.remove("off"), SLOW_MS);
  try {
    return await task;
  } finally {
    if (--pending === 0) {
      clearTimeout(timer);
      loader.classList.add("off");
    }
  }
}
