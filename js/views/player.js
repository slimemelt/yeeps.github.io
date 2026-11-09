import { $ } from "../dom.js";
import { STREAM_URL, VIDEOJS_URL } from "../config.js";

const ICONS = { play: "assets/icons/play.svg", pause: "assets/icons/pause.svg" };

const box = $("player");
const bigPlay = $("player-big-play");
const toggle = $("player-toggle");
const mute = $("player-mute");
const volume = $("player-volume");
const fullscreen = $("player-fullscreen");

let player = null;
let starting = false;

function loadVideoJs() {
  return new Promise((resolve) => {
    if (window.videojs) return resolve(true);
    const script = document.createElement("script");
    script.src = VIDEOJS_URL;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.append(script);
  });
}

function setToggleIcon(playing) {
  toggle.firstElementChild.src = playing ? ICONS.pause : ICONS.play;
  toggle.setAttribute("aria-label", playing ? "Pause" : "Play");
}

export async function ensurePlayer() {
  if (player || starting) return;
  starting = true;
  const loaded = await loadVideoJs();
  starting = false;
  if (!loaded || !window.videojs) {
    box.classList.add("has-error");
    return;
  }
  player = window.videojs("stream-video", {
    controls: false,
    preload: "auto",
    playsinline: true,
    loadingSpinner: false,
    bigPlayButton: false,
    html5: { vhs: { overrideNative: true } },
  });
  player.src({ src: STREAM_URL, type: "application/x-mpegURL" });
  player.on("playing", () => {
    box.classList.add("is-playing");
    box.classList.remove("has-error");
    setToggleIcon(true);
  });
  player.on("pause", () => setToggleIcon(false));
  player.on("error", () => {
    box.classList.add("has-error");
    box.classList.remove("is-playing");
  });
}

async function start() {
  await ensurePlayer();
  if (!player) return;
  const attempt = player.play();
  if (attempt?.catch) attempt.catch(() => box.classList.add("has-error"));
}

export function pausePlayer() {
  player?.pause();
}

bigPlay.addEventListener("click", start);
toggle.addEventListener("click", () => player && (player.paused() ? player.play() : player.pause()));

mute.addEventListener("click", () => {
  if (!player) return;
  player.muted(!player.muted());
  mute.classList.toggle("is-muted", player.muted());
});

volume.addEventListener("input", () => {
  if (!player) return;
  player.volume(Number(volume.value));
  player.muted(Number(volume.value) === 0);
  mute.classList.toggle("is-muted", player.muted());
});

fullscreen.addEventListener("click", () => {
  if (!player) return;
  player.isFullscreen() ? player.exitFullscreen() : player.requestFullscreen();
});

// On touch screens the controls show for a few seconds after a tap.
let touchTimer = 0;
box.addEventListener(
  "touchstart",
  () => {
    box.classList.add("is-touched");
    clearTimeout(touchTimer);
    touchTimer = setTimeout(() => box.classList.remove("is-touched"), 3500);
  },
  { passive: true }
);
