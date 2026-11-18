import { $, asset } from "./dom.js";
import { SITES } from "./config.js";
import { state, rememberSite } from "./state.js";
import { initMenu, setMenuOpen } from "./menu.js";

const stage = $("stage");
const toggle = $("site-toggle");
let dark = state.site === "ds";
const ink = () => (dark ? "#e3e3ff" : "#2b3439");
const shadowColor = () => (dark ? "rgba(227,227,255,.14)" : "rgba(43,52,57,.25)");

function renderSite() {
  dark = state.site === "ds";
  stage.dataset.site = state.site;
  document.documentElement.dataset.site = state.site;
  const other = dark ? SITES.ch.name : SITES.ds.name;
  toggle.setAttribute("aria-pressed", dark);
  toggle.setAttribute("aria-label", `Switch to ${other}`);
  document.title = `Pin Toss - ${SITES[state.site].name}`;
}

toggle.addEventListener("click", () => {
  state.site = dark ? "ch" : "ds";
  rememberSite();
  setMenuOpen(false);
  renderSite();
});

initMenu();
renderSite();

const canvas = $("game");
const ctx = canvas.getContext("2d");
const W = 1047, TOP = 540, H = 760;
const FLOOR = 1210;
const GRAVITY = 2500, MAX_SPEED = 3000;

const S = 0.1483;
const DX = 327 - 1193.5 * S, DY = 1237 - 3142 * S;
const at = (u, v) => ({ x: DX + u * S, y: DY + v * S });
const PIVOT = at(1193.5, 2700);
const P = {
  head: new Path2D("M1177.62 0.15C1474.71 -11.03 1632.36 603.65 1674.05 912.38C1602.58 978.87 1403.24 1113.12 1177.62 1118.2C951.99 1123.29 757.76 983.11 688.84 912.38C727.98 612.96 880.52 11.33 1177.62 0.15Z"),
  body: new Path2D("M1193.72 1198.22C1520.54 1198.22 1796.65 1968.58 1869.31 2398.62C1781.74 2456.75 1484.74 2662.71 1193.72 2662.71C902.69 2662.71 605.7 2486.65 493.58 2398.62C590.78 1998.49 866.89 1198.22 1193.72 1198.22Z"),
  fold: new Path2D("M1443.28 1464.11L1221.39 1198.22L1250.08 1588.75L1443.28 1464.11Z"),
  armR: new Path2D("M1454.13 1351.4C1269.74 1422.48 1719.13 2143.21 1768.87 2391.46C1881.03 2394.75 2109.73 2393.78 2127.19 2363.54C2144.65 2333.3 2034.79 2128.45 1977.67 2029.81C1936.82 1859.61 1554.18 1312.83 1454.13 1351.4Z"),
  handR: new Path2D("M1590.89 2653.56C1634.5 2631.73 1764.01 2501.16 1823.3 2438.61L2079.56 2439.06C2088.96 2497.03 2220.66 2656.11 2285.33 2728.4L2143.56 2926.56L1964.1 2593.64L2075 2972.24L1921.21 3019.42L1829.84 2612.92L1680.45 2770.95L1590.89 2653.56Z"),
  armL: new Path2D("M950.64 1326.92C1135.03 1398 685.64 2118.74 635.91 2366.99C523.74 2370.28 295.04 2369.3 277.58 2339.06C260.12 2308.82 369.99 2103.97 427.1 2005.33C467.95 1835.13 850.59 1288.35 950.64 1326.92Z"),
  handL: new Path2D("M813.89 2629.09C770.27 2607.26 640.77 2476.69 581.47 2414.13L325.21 2414.59C315.81 2472.56 184.12 2631.63 119.45 2703.92L261.21 2902.08L440.68 2569.16L329.77 2947.77L483.57 2994.95L574.94 2588.44L724.33 2746.48L813.89 2629.09Z"),
  neck: new Path2D("M1070.5 2582.83h266.27v150.89H1070.5z"),
  base: new Path2D("M839.73 2733.72h727.81v408.28H839.73z"),
};

const PINK = "#e50081", YELLOW = "#f9b10f", BLUE = "#00a1f5", GREEN = "#45f46e", NAVY = "#131095";
const OUTFITS = [
  [BLUE, YELLOW], [BLUE, PINK], [PINK, YELLOW], [PINK, NAVY], [YELLOW, PINK], [YELLOW, BLUE],
  [GREEN, NAVY], [GREEN, PINK], [NAVY, GREEN], [NAVY, YELLOW], ["#e3e3ff", PINK], ["#e3e3ff", YELLOW],
];
let outfit = OUTFITS[0];

const arms = [{ ...at(950, 1400), a: 0, v: 0, k: 95 }, { ...at(1450, 1400), a: 0, v: 0, k: 78 }];
const PUFFS = [
  [[168.6, 360.9, 168.6], [394.2, 180.5, 180.5], [465.4, 408.4, 168.6]],
  [[263.4, 391.1, 168.6], [552, 377.8, 180.5], [475.6, 604, 168.6]],
];
const PUFF_LIFE = .55;
const PUFF_ARCS = [[-2.5, .19], [-3.3, .14], [-.5, .16]];
let puffs = [];

const SOUND_FILES = ["yeep-1", "yeep-2", "yeep-3", "yeep-4", "yeep-5", "yeep-6"];
let audio = null, lastSound = -1, whistle = null, stab = null;
const sounds = [];

async function load(name) {
  const response = await fetch(asset(`assets/pintoss/${name}.wav`));
  return audio.decodeAudioData(await response.arrayBuffer());
}

function prepareAudio() {
  if (audio) return;
  audio = new (window.AudioContext || window.webkitAudioContext)();
  SOUND_FILES.forEach((name) => load(name).then((buffer) => sounds.push(buffer)));
  load("whistle").then((buffer) => { whistle = buffer; });
  load("stab").then((buffer) => { stab = buffer; });
}

function play(buffer, fadeIn = 0) {
  const source = audio.createBufferSource();
  const gain = audio.createGain();
  source.buffer = buffer;
  source.connect(gain);
  gain.connect(audio.destination);
  if (fadeIn) {
    gain.gain.setValueAtTime(0, audio.currentTime);
    gain.gain.linearRampToValueAtTime(1, audio.currentTime + fadeIn);
  }
  source.start();
  return source;
}

function playHit() {
  if (!audio || !sounds.length) return;
  let i;
  do i = Math.floor(Math.random() * sounds.length); while (i === lastSound && sounds.length > 1);
  lastSound = i;
  play(sounds[i]);
  playStab();
}

function playStab() {
  if (audio && stab) play(stab);
}

function startWhistle(pin) {
  if (audio && whistle) pin.whistle = play(whistle, .08);
}

function stopWhistle(pin) {
  if (!pin.whistle) return;
  try { pin.whistle.stop(); } catch {}
  pin.whistle = null;
}

const dummy = { ang: 0, vel: 0, stuck: [], dy: 0, vy: 0, mode: "idle" };

const PS = 0.134;
const HEAD_R = 146;
const cone = new Path2D("M-60 183L60 183L14 459Q0 466 -12 459Z");
const BUNCH = { x: 664.2, y: 1089.1 };
const art = (x, y) => ({ x: BUNCH.x + x * PS, y: BUNCH.y + y * PS });
const shadow = new Path2D("M678.04 801.82L265.36 775.52C240.95 773.97 218.85 760.58 206.15 739.68C170.96 681.7 224.87 610.56 290.2 628.76L439 670.22C461.12 676.39 484.43 676.85 506.78 671.56L605.37 648.25C640.5 639.94 677.45 649.68 703.91 674.23L724.6 693.43C742 709.57 748.78 734.17 742.11 756.94C733.87 785.04 707.26 803.68 678.04 801.82Z");
const smile = new Path2D("M238 583L362.78 645.8C427.11 678.19 501.89 682.88 569.77 658.78L672 622.5");

const PINS = [
  { head: [225, 233], tip: [386, 665], colors: [GREEN, PINK] },
  { head: [461, 193], tip: [466, 655], colors: [PINK, YELLOW] },
  { head: [717, 241], tip: [555, 665], colors: [BLUE, NAVY] },
].map((d, i) => {
  const head = art(...d.head), tip = art(...d.tip);
  const len = Math.hypot(tip.x - head.x, tip.y - head.y);
  const lean = Math.atan2(tip.y - head.y, tip.x - head.x);
  return { tip, len, lean, colors: d.colors, x: tip.x, y: TOP - 100, vx: 0, vy: 0, a: Math.PI / 2, wv: 0, state: "queued", delay: .3 + i * .5 };
});
const plant = (pin, a) => {
  pin.a = a;
  pin.x = pin.tip.x - Math.cos(a) * pin.len;
  pin.y = pin.tip.y - Math.sin(a) * pin.len;
};

let score = 0, best = 0, held = null, trail = [], pointer = { x: 0, y: 0 };
try { best = +localStorage.getItem("pintoss-best") || 0; } catch {}
const scoreEl = $("score"), bestEl = $("best");
const showScore = () => { scoreEl.textContent = score; bestEl.textContent = best; };
showScore();

const toGame = (e) => {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * W / r.width, y: TOP + (e.clientY - r.top) * H / r.height };
};
const middle = (pin) => ({ x: pin.x + Math.cos(pin.a) * pin.len * .45, y: pin.y + Math.sin(pin.a) * pin.len * .45 });

canvas.addEventListener("pointerdown", (e) => {
  prepareAudio();
  const p = toGame(e);
  let hit = null, nearest = 62;
  for (const pin of PINS) {
    if (pin.state !== "rest") continue;
    const m = middle(pin), d = Math.hypot(m.x - p.x, m.y - p.y);
    if (d < nearest) { hit = pin; nearest = d; }
  }
  if (!hit) return;
  canvas.setPointerCapture(e.pointerId);
  canvas.classList.add("holding");
  held = hit;
  hit.state = "held";
  pointer = p;
  trail = [{ ...p, t: performance.now() }];
});

canvas.addEventListener("pointermove", (e) => {
  if (!held) return;
  pointer = toGame(e);
  const t = performance.now();
  trail.push({ ...pointer, t });
  while (trail.length > 2 && t - trail[0].t > 90) trail.shift();
});

function release() {
  if (!held) return;
  canvas.classList.remove("holding");
  const a = trail[0], b = trail[trail.length - 1];
  const dt = Math.max((b.t - a.t) / 1000, .016);
  let vx = (b.x - a.x) / dt, vy = (b.y - a.y) / dt;
  const speed = Math.hypot(vx, vy);
  if (speed > MAX_SPEED) { vx *= MAX_SPEED / speed; vy *= MAX_SPEED / speed; }
  if (speed < 200) {
    held.state = "rest";
    plant(held, held.lean);
  } else {
    held.state = "fly";
    startWhistle(held);
    held.vx = vx;
    held.vy = vy;
  }
  held = null;
  trail = [];
}
canvas.addEventListener("pointerup", release);
canvas.addEventListener("pointercancel", release);

$("reset").addEventListener("click", () => {
  if (dummy.mode !== "idle") return;
  dummy.mode = "falling";
  dummy.vy = 0;
});

function toLocal(x, y) {
  const c = Math.cos(-dummy.ang), s = Math.sin(-dummy.ang);
  const dx = x - PIVOT.x, dy = y - dummy.dy - PIVOT.y;
  return { x: PIVOT.x + dx * c - dy * s, y: PIVOT.y + dx * s + dy * c };
}
function overPart(path, l) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const inside = ctx.isPointInPath(path, (l.x - DX) / S, (l.y - DY) / S);
  ctx.restore();
  return inside;
}

function strike(pin) {
  if (dummy.mode !== "idle") return false;
  const dir = Math.atan2(pin.vy, pin.vx);
  const tip = { x: pin.x + Math.cos(dir) * pin.len, y: pin.y + Math.sin(dir) * pin.len };
  const l = toLocal(tip.x, tip.y);
  const head = overPart(P.head, l);
  if (!head && !overPart(P.body, l)) return false;

  const speed = Math.hypot(pin.vx, pin.vy);
  dummy.vel += Math.sign(pin.vx || 1) * Math.min(speed / 900, 3.2) * (head ? 1.25 : .8);
  const kick = Math.sign(pin.vx || 1) * Math.min(speed / 700, 4);
  arms.forEach((arm, i) => { arm.v += kick * (1.2 + i * .4); });
  dummy.stuck.push({ x: l.x, y: l.y, a: dir - dummy.ang, len: pin.len, colors: pin.colors });
  if (dummy.stuck.length > 36) dummy.stuck.shift();

  score += head ? 3 : 1;
  if (score > best) {
    best = score;
    try { localStorage.setItem("pintoss-best", best); } catch {}
  }
  showScore();
  stopWhistle(pin);
  playHit();
  for (const [angle, size] of PUFF_ARCS) {
    const heading = angle + (Math.random() - .5) * .5, speed = 280 + Math.random() * 140;
    puffs.push({ x: tip.x, y: tip.y, vx: Math.cos(heading) * speed, vy: Math.sin(heading) * speed, size: size * (.85 + Math.random() * .3), shape: PUFFS[Math.floor(Math.random() * PUFFS.length)], t: 0 });
  }
  return true;
}

function sendHome(pin) {
  stopWhistle(pin);
  const waiting = PINS.filter((p) => p.state === "queued").length;
  Object.assign(pin, { x: pin.tip.x, y: TOP - 100, a: Math.PI / 2, vx: 0, vy: 0, wv: 0, state: "queued", delay: .3 + waiting * .5 });
}

function updateDummy(dt) {
  if (dummy.mode === "falling" || dummy.mode === "entering") {
    dummy.vy += GRAVITY * .7 * dt;
    dummy.dy += dummy.vy * dt;
  }
  if (dummy.mode === "falling" && dummy.dy > 760) {
    Object.assign(dummy, { mode: "entering", ang: 0, vel: 0, dy: -800, vy: 0 });
    arms.forEach((arm) => { arm.a = 0; arm.v = 0; });
    dummy.stuck.length = 0;
    outfit = OUTFITS.filter((o) => o !== outfit)[Math.floor(Math.random() * (OUTFITS.length - 1))];
  } else if (dummy.mode === "entering" && dummy.dy >= 0) {
    dummy.dy = 0;
    if (dummy.vy > 300) { dummy.vy *= -.25; dummy.vel = 2; }
    else { dummy.vy = 0; dummy.mode = "idle"; }
  }
  if (dummy.mode !== "falling") {
    dummy.vel += (-dummy.ang * 70 - dummy.vel * 3) * dt;
    dummy.ang = Math.max(-.5, Math.min(.5, dummy.ang + dummy.vel * dt));
  }
}

function updateArms(dt) {
  for (const arm of arms) {
    arm.v += (-arm.a * arm.k - arm.v * 3.2 - dummy.vel * .9) * dt;
    arm.a = Math.max(-1.1, Math.min(1.1, arm.a + arm.v * dt));
  }
}

function updatePin(pin, dt) {
  switch (pin.state) {
    case "queued":
      if ((pin.delay -= dt) <= 0) pin.state = "spawn";
      break;
    case "spawn":
      pin.a = Math.PI / 2;
      pin.x = pin.tip.x;
      pin.vy += GRAVITY * .7 * dt;
      pin.y += pin.vy * dt;
      if (pin.y + pin.len >= pin.tip.y) {
        plant(pin, Math.PI / 2);
        pin.wv = (pin.lean - pin.a) * 14;
        pin.state = "wobble";
      }
      break;
    case "wobble":
      pin.wv += ((pin.lean - pin.a) * 260 - pin.wv * 6) * dt;
      plant(pin, pin.a + pin.wv * dt);
      if (Math.abs(pin.lean - pin.a) < .01 && Math.abs(pin.wv) < .15) {
        plant(pin, pin.lean);
        pin.state = "rest";
      }
      break;
    case "held": {
      pin.x += (pointer.x - pin.x) * Math.min(1, dt * 30);
      pin.y += (pointer.y - pin.y) * Math.min(1, dt * 30);
      const a = trail[0], b = trail[trail.length - 1];
      if (a && b && Math.hypot(b.x - a.x, b.y - a.y) > 6) pin.a = Math.atan2(b.y - a.y, b.x - a.x);
      break;
    }
    case "fly":
      pin.vy += GRAVITY * dt;
      pin.x += pin.vx * dt;
      pin.y += pin.vy * dt;
      pin.a = Math.atan2(pin.vy, pin.vx);
      if (strike(pin)) return sendHome(pin);
      if (pin.y + Math.sin(pin.a) * pin.len >= FLOOR) {
        pin.y = FLOOR - Math.sin(pin.a) * pin.len;
        pin.state = "down";
        stopWhistle(pin);
        playStab();
        pin.wait = 1.2;
      }
      if (pin.x < -80 || pin.x > W + 80) sendHome(pin);
      break;
    case "down":
      if ((pin.wait -= dt) <= 0) sendHome(pin);
      break;
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, .033);
  last = now;
  updateDummy(dt);
  updateArms(dt);
  puffs.forEach((p) => { p.t += dt; p.vy += 700 * dt; p.x += p.vx * dt; p.y += p.vy * dt; });
  puffs = puffs.filter((p) => p.t < PUFF_LIFE);
  PINS.forEach((pin) => updatePin(pin, dt));
  draw();
  requestAnimationFrame(frame);
}

function drawPin(x, y, a, colors) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a - Math.PI / 2);
  ctx.scale(PS, PS);
  ctx.fillStyle = colors[0];
  ctx.beginPath(); ctx.arc(0, 0, HEAD_R, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = colors[1];
  ctx.fill(cone);
  ctx.restore();
}

function part(path, color, joint) {
  ctx.save();
  if (joint) {
    ctx.translate(joint.x, joint.y); ctx.rotate(joint.a); ctx.translate(-joint.x, -joint.y);
  }
  ctx.translate(DX, DY); ctx.scale(S, S);
  ctx.fillStyle = color;
  ctx.fill(path);
  ctx.restore();
}

function drawDummy() {
  ctx.fillStyle = shadowColor();
  ctx.beginPath(); ctx.ellipse(DX + 1193.5 * S, DY + 3105 * S, 904.5 * S, 236 * S, 0, 0, Math.PI * 2); ctx.fill();

  const settled = dummy.mode === "idle";
  if (!settled) part(P.base, YELLOW);
  ctx.save();
  ctx.translate(0, dummy.dy);
  ctx.translate(PIVOT.x, PIVOT.y); ctx.rotate(dummy.ang); ctx.translate(-PIVOT.x, -PIVOT.y);
  part(P.neck, ink());
  part(P.armL, outfit[0], arms[0]);
  part(P.handL, outfit[0], arms[0]);
  part(P.armR, outfit[0], arms[1]);
  part(P.handR, outfit[0], arms[1]);
  part(P.body, outfit[0]);
  part(P.head, outfit[0]);
  part(P.fold, outfit[1]);
  for (const s of dummy.stuck) {
    const back = s.len - 14;
    drawPin(s.x - Math.cos(s.a) * back, s.y - Math.sin(s.a) * back, s.a, s.colors);
  }
  ctx.restore();
  if (settled) part(P.base, YELLOW);
}

function draw() {
  const k = canvas.width / W;
  ctx.setTransform(k, 0, 0, k, 0, -TOP * k);
  ctx.clearRect(0, TOP, W, H);

  for (const p of puffs) {
    const size = p.size * (1 - p.t / PUFF_LIFE);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(size, size);
    ctx.translate(-317, -289);
    ctx.fillStyle = ink();
    for (const [cx, cy, r] of p.shape) {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  drawDummy();

  ctx.save();
  ctx.translate(BUNCH.x, BUNCH.y); ctx.scale(PS, PS);
  ctx.fillStyle = shadowColor();
  ctx.fill(shadow);
  ctx.restore();

  for (const pin of PINS) if (pin.state !== "queued") drawPin(pin.x, pin.y, pin.a, pin.colors);

  ctx.save();
  ctx.translate(BUNCH.x, BUNCH.y); ctx.scale(PS, PS);
  ctx.strokeStyle = dark ? "#e3e3ff" : "#000"; ctx.lineWidth = 41; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.stroke(smile);
  ctx.restore();

}

requestAnimationFrame(frame);
