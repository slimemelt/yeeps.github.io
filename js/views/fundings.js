import { stage } from "../dom.js";
import { DESIGN_WIDTH } from "../config.js";
import { state } from "../state.js";

const MIN_FONT = 18;
const STEP = 0.4;

export function fitFundingsText() {
  if (state.view !== "fund") return;
  const scale = stage.clientWidth / DESIGN_WIDTH;
  document.querySelectorAll(".fund-text").forEach((block) => {
    const limit = Number(block.dataset.h) * scale;
    let size = Number(block.dataset.fs);
    block.style.setProperty("--fs", size);
    while (block.scrollHeight > limit + 2 && size > MIN_FONT) {
      size -= STEP;
      block.style.setProperty("--fs", size);
    }
  });
}
