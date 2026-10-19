import { GameState } from "./game-state.js";
import { AudioManager } from "./audio.js";
import { GameLoop } from "./engine.js";
import { Confetti } from "./effects.js";
import { icon, chestSVG } from "./icons.js";
import { StarCatcher } from "./level1.js";
import { BirthdayObby } from "./level2.js";
import { MysteryChests } from "./level3.js";

const app = document.querySelector("#app");
let state;
try {
  state = new GameState();
} catch {
  state = new GameState({
    getItem: () => null,
    setItem: () => {
      throw Error("Unavailable");
    },
  });
  state.available = false;
}
const audio = new AudioManager(state.value.muted),
  confetti = new Confetti(document.querySelector("#confetti"));
let activeGame = null,
  scene = null,
  screenEvents = new AbortController(),
  currentLevel = 0,
  currentScreen = "home",
  modalOpen = false,
  toastTimer,
  userInteracted = false;
const levels = [
  {
    name: "STAR CATCHER",
    title: "Звёздный дождь",
    desc: "Лови звёзды и загадывай желания",
    icon: "star",
    tag: "ЛОВКОСТЬ",
    instruction: "Води пальцем по игровому полю и собирай звёзды в корзинку.",
    detail:
      "12 звёзд за 30 секунд. Розовые тоже считаются! Избегай фиолетовых камней: они забирают одну звезду.",
  },
  {
    name: "BIRTHDAY OBBY",
    title: "Прыжок в приключение",
    desc: "Прыгай навстречу волшебству",
    icon: "flag",
    tag: "ПРИКЛЮЧЕНИЕ",
    instruction:
      "Персонаж бежит сам. Нажимай на поле или кнопку, чтобы прыгать.",
    detail:
      "Перепрыгивай блоки и пропасти, собирай монетки. Флажки сохраняют путь: после падения ты вернёшься к последнему.",
  },
  {
    name: "MYSTERY CHESTS",
    title: "Тайна трёх сундуков",
    desc: "Раскрой секрет последнего ключа",
    icon: "chest",
    tag: "ЗАГАДКИ",
    instruction:
      "Открой три сундука, решив загадки на память, реакцию и логику.",
    detail:
      "Выбирай любой сундук. Ограничения по времени нет, а открытые замки сохраняются. Последний ключ уже близко!",
  },
];
const btn = (text, action, kind = "primary", ico = "arrow") =>
  `<button class="button ${kind}" data-action="${action}">${text}${ico ? icon(ico) : ""}</button>`;
function listen(node, event, fn, options = {}) {
  node.addEventListener(event, fn, { ...options, signal: screenEvents.signal });
}
function navigate(html, name) {
  activeGame?.destroy();
  activeGame = null;
  scene?.destroy();
  scene = null;
  confetti.stop();
  screenEvents.abort();
  screenEvents = new AbortController();
  closeModal(false);
  currentScreen = name;
  document.body.classList.toggle(
    "final-theme",
    name === "reveal" || name === "reward",
  );
  app.innerHTML = html;
  app.className = `screen screen-${name}`;
  window.scrollTo({ top: 0, behavior: "instant" });
  app.focus({ preventScroll: true });
}
function toast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visible"), 3500);
}
function soundUI() {
  const el = document.querySelector("#sound-toggle");
  const enabled = !audio.muted && audio.active;
  el.innerHTML = icon(enabled ? "sound" : "mute");
  el.setAttribute(
    "aria-label",
    enabled ? "Выключить музыку и звуки" : "Включить музыку и звуки",
  );
  el.setAttribute("aria-pressed", String(enabled));
}
async function wakeAudio() {
  userInteracted = true;
  await audio.unlock();
  soundUI();
}
function inventory() {
  return `<div class="inventory" aria-label="Собрано ключей: ${state.keys} из 3">${[0, 1, 2].map((i) => `<span class="key-slot ${state.value.completed[i] ? "earned" : ""}">${icon("key")}</span>`).join("")}<small>${state.keys}/3</small></div>`;
}
function routeCards(interactive = false) {
  return `<div class="route-cards">${levels
    .map((l, i) => {
      const complete = state.value.completed[i],
        locked = i > state.keys;
      return `<${interactive ? "button" : "div"} class="route-card ${locked ? "locked" : ""} ${complete ? "complete" : ""}" ${interactive ? `data-level="${i}" ${locked ? "disabled" : ""}` : ""}><span class="route-icon route-icon-${i}">${icon(l.icon)}</span><div class="route-copy"><span class="route-label">LEVEL 0${i + 1} <span>${complete ? "ПРОЙДЕН" : l.tag}</span></span><strong>${l.name}</strong><p>${l.desc}</p></div><span class="route-lock">${icon(complete ? "check" : locked ? "lock" : "arrow")}</span></${interactive ? "button" : "div"}>`;
    })
    .join("")}</div>`;
}
function bindLevels() {
  listen(app, "click", (e) => {
    const b = e.target.closest("[data-level]");
    if (b && !b.disabled) showIntro(Number(b.dataset.level));
  });
}
function home() {
  const started = state.keys > 0 || state.value.checkpoint > 0;
  navigate(
    `<section class="hero"><div class="hero-copy"><div class="eyebrow hero-eyebrow"><span></span> ТВОЙ ДЕНЬ. ТВОЁ ПРИКЛЮЧЕНИЕ.</div><h1>BIRTHDAY<br><span>QUEST</span><span class="title-spark">✦</span></h1><div class="unlock-badge">${icon("lock")} LEVEL 12 UNLOCKED</div><h2>С днём рождения! <span class="birthday-cake" aria-label="Торт">🎂</span></h2><p class="hero-description">Сегодня тебе исполнилось 12 лет.<br>Но твой подарок находится за тремя<br class="desktop-break"> секретными испытаниями.</p><p class="hero-question">Готова отправиться в приключение?</p>${btn(started ? "ПРОДОЛЖИТЬ ПРИКЛЮЧЕНИЕ" : "НАЧАТЬ ПРИКЛЮЧЕНИЕ", "start")}<div class="hero-fineprint">${icon("key")} 3 испытания <span>·</span> 3 ключа <span>·</span> 1 большой секрет</div></div><div class="hero-art"><div class="art-orbit"></div><img src="./assets/world.svg" width="640" height="550" alt="Парящий лавандовый остров с волшебным порталом, звёздами и подарками"><div class="floating-label label-top">${icon("star")} Сегодня всё для тебя</div><div class="floating-label label-bottom"><span class="mini-heart">${icon("heart")}</span><span>Особенный день.<br><b>Особенное приключение.</b></span></div><span class="art-spark spark-one">✧</span><span class="art-spark spark-two">✦</span></div></section><section class="route-section"><div class="section-label"><span>ТВОЯ КАРТА ПРИКЛЮЧЕНИЙ</span><span>Собери все три ключа ${icon("key")}</span></div>${routeCards()}</section>`,
    "home",
  );
  listen(app.querySelector('[data-action="start"]'), "click", () => {
    wakeAudio();
    started ? showMap() : showIntro(0);
  });
}
function showMap() {
  navigate(
    `<section class="map-screen"><div class="page-top"><span class="eyebrow">ТВОЁ ПРИКЛЮЧЕНИЕ</span>${inventory()}</div><div class="center-heading"><h1>Каждый ключ — ближе к чуду</h1><p>Три маленькие победы. Один большой секрет.</p></div><div class="map-path" aria-hidden="true">${[0, 1, 2].map((i) => `<span class="map-node ${state.value.completed[i] ? "earned" : i === state.keys ? "current" : ""}">${state.value.completed[i] ? icon("key") : `0${i + 1}`}</span>`).join("")}</div>${routeCards(true)}<div class="map-bottom"><span class="save-note">${icon("check")} ${state.available ? "Твоё приключение сохраняется автоматически" : "Прогресс сохраняется только до закрытия вкладки"}</span>${state.keys === 3 ? btn("К СЕКРЕТНОЙ ДВЕРИ", "door") : ""}</div></section>`,
    "map",
  );
  bindLevels();
  const door = app.querySelector('[data-action="door"]');
  if (door) listen(door, "click", showDoor);
}
function showIntro(i) {
  if (i > state.keys) return;
  currentLevel = i;
  const l = levels[i];
  navigate(
    `<section class="intro-panel"><button class="text-button back-map" data-action="map">← Карта приключений</button><div class="intro-emblem emblem-${i}">${icon(l.icon)}<span>0${i + 1}</span></div><span class="eyebrow">LEVEL ${i + 1}: ${l.name}</span><h1>${l.title}</h1><p class="intro-instruction">${l.instruction}</p><p class="intro-detail">${l.detail}</p><div class="intro-reward">${icon("key")} В конце испытания тебя ждёт ключ</div>${btn("ПОЕХАЛИ!", "play", "primary", "play")}${i === 1 && state.value.checkpoint > 0 ? '<p class="hint">Продолжим с сохранённого флажка</p>' : ""}</section>`,
    "intro",
  );
  listen(app.querySelector('[data-action="map"]'), "click", showMap);
  listen(app.querySelector('[data-action="play"]'), "click", () => {
    wakeAudio();
    startLevel(i);
  });
}
function gameHeader(i) {
  return `<div class="game-header"><div><span class="eyebrow">LEVEL ${i + 1}: ${levels[i].name}</span><h1>${levels[i].title}</h1></div><div class="game-tools">${inventory()}<button class="icon-button" data-action="pause" aria-label="Пауза">${icon("pause")}</button></div></div>`;
}
function startLevel(i) {
  if (i > state.keys) return;
  currentLevel = i;
  const content =
    i === 0
      ? `<div class="game-hud"><span>${icon("star")} <b id="star-score">0</b><small>/ 12</small></span><span id="star-timer">${icon("moon")} <b id="time-left">30</b><small>сек</small></span></div><div class="canvas-wrap star-field"><canvas id="game-canvas" width="360" height="440" role="img" aria-label="Звёздный дождь: води пальцем по полю, чтобы двигать корзинку"></canvas></div><div class="game-help"><span class="touch-gesture">↔</span> Води пальцем по полю и лови звёзды</div>`
      : i === 1
        ? `<div class="game-hud obby-hud"><span>${icon("flag")} <small id="checkpoint-label">СТАРТ</small></span><span>${icon("coin")} <b id="coin-score">0</b></span></div><div class="progress-track obby-progress"><i id="obby-progress"></i></div><div class="canvas-wrap obby-field"><canvas id="game-canvas" width="400" height="360" role="img" aria-label="Платформер: нажимай на поле или кнопку Прыжок"></canvas></div><div class="obby-controls"><p>Одно нажатие — один прыжок.<br><span>Флажки сохраняют твой путь.</span></p><button id="jump-button" class="button primary">ПРЫЖОК ${icon("jump")}</button></div>`
        : '<div id="chest-room"></div>';
  navigate(
    `<section class="play-screen ${i === 2 ? "wide-game" : ""}">${gameHeader(i)}<div class="game-panel">${content}</div><div class="play-footer"><button class="text-button" data-action="restart">${icon("restart")} Начать уровень заново</button><span>${i === 0 ? "Золотые и розовые звёзды = +1" : i === 1 ? "До портала — 12 препятствий" : "Твой прогресс в сундуках сохраняется"}</span></div></section>`,
    "game",
  );
  listen(app.querySelector('[data-action="pause"]'), "click", () =>
    pauseGame(),
  );
  listen(app.querySelector('[data-action="restart"]'), "click", () =>
    pauseGame("restart"),
  );
  const common = { audio, onWin: () => win(i) };
  if (i === 0) {
    const score = app.querySelector("#star-score"),
      time = app.querySelector("#time-left"),
      timer = app.querySelector("#star-timer");
    activeGame = new StarCatcher(app.querySelector("canvas"), {
      ...common,
      onLose: lose,
      onHud: (s, t) => {
        score.textContent = s;
        time.textContent = t;
        timer.classList.toggle("urgent", t <= 8);
      },
    });
  }
  if (i === 1) {
    const progress = app.querySelector("#obby-progress"),
      coins = app.querySelector("#coin-score"),
      cp = app.querySelector("#checkpoint-label");
    activeGame = new BirthdayObby(app.querySelector("canvas"), {
      ...common,
      checkpoint: state.value.checkpoint,
      jumpButton: app.querySelector("#jump-button"),
      onCheckpoint: (n) => {
        state.checkpoint(n);
        toast("Контрольная точка сохранена!");
      },
      onHud: (p, c, n) => {
        progress.style.width = `${p}%`;
        coins.textContent = c;
        cp.textContent = n ? `ФЛАЖОК ${n} / 3` : "СТАРТ";
      },
    });
  }
  if (i === 2)
    activeGame = new MysteryChests(app.querySelector("#chest-room"), {
      ...common,
      state,
      onChest: () => confetti.burst(),
    });
}
function win(i) {
  state.complete(i);
  audio.sfx("win");
  navigate(
    `<section class="victory-panel"><span class="eyebrow">ИСПЫТАНИЕ ПРОЙДЕНО</span><div class="victory-key">${icon("key")}<i></i><i></i><i></i></div><h1>${["Отлично!<br>Первый ключ получен!", "Уровень пройден!<br>Второй ключ твой!", "Все тайны раскрыты!<br>Третий ключ у тебя!"][i]}</h1><p>${["Звёзды сегодня точно на твоей стороне.", "Ни одной пропасти не остановить твоё приключение.", "Память, реакция и смекалка — вот это команда!"][i]}</p><div class="victory-inventory">${inventory()}</div>${btn(i === 2 ? "К СЕКРЕТНОМУ ПОДАРКУ" : "СЛЕДУЮЩИЙ УРОВЕНЬ", "next")}<button class="text-button" data-action="map">К карте приключений</button></section>`,
    "victory",
  );
  flyKey();
  confetti.burst();
  listen(app.querySelector('[data-action="next"]'), "click", () =>
    i === 2 ? showDoor() : showIntro(i + 1),
  );
  listen(app.querySelector('[data-action="map"]'), "click", showMap);
}
function flyKey() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const source = app.querySelector(".victory-key > .icon");
  const target = app.querySelectorAll(".victory-inventory .key-slot")[
    currentLevel
  ];
  if (!source || !target) return;
  const from = source.getBoundingClientRect(),
    to = target.getBoundingClientRect();
  source.animate(
    [
      { transform: "rotate(-10deg) scale(1)", opacity: 1 },
      { transform: "rotate(8deg) scale(1.08)", opacity: 1, offset: 0.3 },
      {
        transform:
          "translate(" +
          (to.x + to.width / 2 - from.x - from.width / 2) +
          "px," +
          (to.y + to.height / 2 - from.y - from.height / 2) +
          "px) scale(.25)",
        opacity: 0,
      },
    ],
    {
      delay: 650,
      duration: 950,
      easing: "cubic-bezier(.4,0,.2,1)",
      fill: "forwards",
    },
  );
  target.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(1.3)", background: "#ffdfa0" },
      { transform: "scale(1)" },
    ],
    { delay: 1500, duration: 450 },
  );
}
function lose(score) {
  audio.sfx("miss");
  navigate(
    `<section class="intro-panel"><div class="intro-emblem">${icon("star")}</div><span class="eyebrow">ЕЩЁ ОДНА ПОПЫТКА?</span><h1>Звёзды ждут тебя</h1><p class="intro-instruction">Ты поймала ${score} из 12 звёзд.<br>Попробуй держаться ближе к середине и двигаться за звёздами.</p>${btn("ПОПРОБОВАТЬ ЕЩЁ", "retry", "primary", "restart")}<button class="text-button" data-action="map">К карте приключений</button></section>`,
    "lose",
  );
  listen(app.querySelector('[data-action="retry"]'), "click", () =>
    startLevel(0),
  );
  listen(app.querySelector('[data-action="map"]'), "click", showMap);
}
function pauseGame(type = "pause") {
  if (!activeGame || modalOpen) return;
  activeGame.pause(true);
  audio.suspend();
  soundUI();
  modalOpen = true;
  const root = document.querySelector("#modal-root");
  root.innerHTML = `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="pause-title"><div class="modal-icon">${icon(type === "restart" ? "restart" : "pause")}</div><span class="eyebrow">ВОЛШЕБСТВО ПОДОЖДЁТ</span><h2 id="pause-title">${type === "restart" ? "Начать заново?" : "Маленькая передышка"}</h2><p>${type === "restart" ? "Текущая попытка начнётся с самого начала. Полученные ключи сохранятся." : "Таймер и игра остановлены. Продолжим, когда будешь готова."}</p>${btn("ПРОДОЛЖИТЬ", "resume", "primary", "play")}${btn("ЗАНОВО ЭТОТ УРОВЕНЬ", "restart", "secondary", "restart")}<button class="text-button" data-action="map">Вернуться к карте</button></section></div>`;
  app.inert = true;
  document.querySelector(".topbar").inert = true;
  const buttons = [...root.querySelectorAll("button")];
  buttons[0].focus();
  root.onclick = (e) => {
    const a = e.target.closest("[data-action]")?.dataset.action;
    if (a === "resume") closeModal(true);
    if (a === "restart") {
      if (currentLevel === 1) {
        state.value.checkpoint = 0;
        state.save();
      }
      if (currentLevel === 2) {
        state.value.chests = [false, false, false];
        state.save();
      }
      closeModal(false);
      wakeAudio();
      startLevel(currentLevel);
    }
    if (a === "map") {
      closeModal(false);
      wakeAudio();
      showMap();
    }
  };
  root.onkeydown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeModal(true);
    }
    if (e.key === "Tab") {
      if (e.shiftKey && document.activeElement === buttons[0]) {
        e.preventDefault();
        buttons.at(-1).focus();
      } else if (!e.shiftKey && document.activeElement === buttons.at(-1)) {
        e.preventDefault();
        buttons[0].focus();
      }
    }
  };
}
function closeModal(resume) {
  if (!modalOpen) return;
  modalOpen = false;
  const root = document.querySelector("#modal-root");
  root.innerHTML = "";
  root.onclick = null;
  root.onkeydown = null;
  app.inert = false;
  document.querySelector(".topbar").inert = false;
  if (resume) {
    activeGame?.pause(false);
    wakeAudio();
    app.querySelector('[data-action="pause"]')?.focus();
  }
}
function showDoor() {
  if (state.keys !== 3) return;
  navigate(
    `<section class="door-screen"><div class="key-fusion" aria-hidden="true">${icon("key")}${icon("key")}${icon("key")}<span>${icon("key")}</span></div><span class="eyebrow">ТРИ КЛЮЧА. ОДИН ПОСЛЕДНИЙ ШАГ.</span><h1>THE FINAL GIFT</h1><p>Ты прошла все испытания.<br>За этой дверью тебя ждёт что-то особенное.</p><div class="magic-door" aria-hidden="true"><div class="door-inner"><span>${icon("key")}</span></div><i></i><i></i><i></i></div>${btn("ОТКРЫТЬ СЕКРЕТНЫЙ ПОДАРОК", "reveal", "gold", "key")}</section>`,
    "door",
  );
  listen(app.querySelector('[data-action="reveal"]'), "click", reveal);
}
async function reveal() {
  if (state.keys !== 3) return;
  wakeAudio();
  navigate(
    `<section class="reveal-screen"><div class="reward-glow"></div><div class="legendary-chest">${chestSVG("gold")}</div><div class="reveal-copy"><span class="eyebrow">СЕКРЕТ СТАНОВИТСЯ БЛИЖЕ</span><h1>Приготовься к волшебству…</h1></div></section>`,
    "reveal",
  );
  const events = screenEvents;
  let gift;
  try {
    gift = (await import("./reward.js")).reward;
  } catch {
    if (events === screenEvents) {
      toast("Не получилось загрузить финал. Попробуй открыть дверь ещё раз.");
      showDoor();
    }
    return;
  }
  if (events !== screenEvents) return;
  scene = new GameLoop();
  let opened = false,
    legendary = false;
  scene.update = () => {
    if (scene.time > 1 && !opened) {
      opened = true;
      app.querySelector(".legendary-chest").classList.add("opening");
      audio.sfx("final");
    }
    if (scene.time > 2.5 && !legendary) {
      legendary = true;
      app.querySelector(".reveal-copy").innerHTML =
        '<span class="eyebrow">ТЫ ЭТО ЗАСЛУЖИЛА</span><h1>LEGENDARY<br>REWARD UNLOCKED</h1>';
      app.querySelector(".reward-glow").classList.add("lit");
      confetti.burst(true);
    }
    if (scene.time > 3.7) {
      state.value.revealed = true;
      state.save();
      showReward(gift);
    }
  };
  scene.start();
}
function escapeHTML(value) {
  const el = document.createElement("span");
  el.textContent = value;
  return el.innerHTML;
}
function showReward(gift) {
  navigate(
    `<section class="reward-screen"><span class="legendary-label">${icon("star")} LEGENDARY REWARD UNLOCKED ${icon("star")}</span><div class="reward-mini-chest">${chestSVG("gold")}</div><h1 class="reward-amount">${escapeHTML(gift.amount)}</h1><p class="reward-caption">${escapeHTML(gift.caption)}</p><div class="letter"><span class="letter-tag">ОТ СТАРШЕГО БРАТА — С ЛЮБОВЬЮ</span><h2>${escapeHTML(gift.greeting)}</h2>${gift.paragraphs.map((p) => `<p>${escapeHTML(p)}</p>`).join("")}<div class="letter-signature">Твой старший брат ${icon("heart")}</div></div>${btn("ЗАБРАТЬ МОЙ ПРИЗ 🎁", "claim", "gold", "")}<div id="claim-message" role="status"></div><button class="text-button replay-button" data-action="replay">${icon("restart")} Сыграть ещё раз</button></section>`,
    "reward",
  );
  confetti.burst(true);
  audio.sfx("final");
  listen(app.querySelector('[data-action="claim"]'), "click", () => {
    app.querySelector("#claim-message").innerHTML =
      `<div class="claim-card">${icon("check")}<p>${escapeHTML(gift.claim)}</p></div>`;
    app.querySelector('[data-action="claim"]').disabled = true;
    app.querySelector('[data-action="claim"]').textContent = "ПРИЗ ЖДЁТ ТЕБЯ";
    confetti.burst(true);
  });
  listen(app.querySelector('[data-action="replay"]'), "click", () => {
    state.reset();
    home();
    toast("Новое приключение начинается!");
  });
}
document.querySelector("#sound-toggle").addEventListener("click", async () => {
  userInteracted = true;
  if (!audio.active && !audio.muted) await audio.unlock();
  else await audio.toggle();
  state.value.muted = audio.muted;
  state.save();
  soundUI();
});
document.querySelector(".brand").addEventListener("click", (e) => {
  e.preventDefault();
  if (activeGame) pauseGame();
  else home();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (activeGame) pauseGame();
    scene?.pause(true);
    audio.suspend();
    soundUI();
  } else {
    scene?.pause(false);
    if (!modalOpen && userInteracted) wakeAudio();
  }
});
window.addEventListener("pagehide", () => {
  state.save();
  audio.suspend();
});
home();
soundUI();
setTimeout(() => {
  document.querySelector("#loader").remove();
  if (!state.available)
    toast("Браузер не разрешил сохранение. Не закрывай вкладку до финала.");
}, 500);
if ("serviceWorker" in navigator && location.protocol !== "file:")
  window.addEventListener("load", () =>
    navigator.serviceWorker.register("./sw.js").catch(() => {}),
  );
