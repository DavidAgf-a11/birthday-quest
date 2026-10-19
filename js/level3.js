import { GameLoop } from "./engine.js";
import { icon, chestSVG } from "./icons.js";
const symbols = ["star", "moon", "gem", "heart"];
const names = {
  star: "Звезда",
  moon: "Луна",
  gem: "Кристалл",
  heart: "Сердце",
  sun: "Солнце",
};
export function shuffle(values) {
  const array = [...values];
  for (let i = array.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
export class MysteryChests extends GameLoop {
  constructor(root, { audio, state, onWin, onChest }) {
    super();
    Object.assign(this, { root, audio, state, onWin, onChest });
    this.mode = "room";
    this.selected = [];
    this.matched = new Set();
    this.opened = state.value.chests.slice();
    this.finished = false;
    this.on(root, "click", (e) => {
      if (this.paused) return;
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.chest !== undefined) this.openTask(Number(b.dataset.chest));
      if (b.dataset.card !== undefined) this.flip(Number(b.dataset.card));
      if (b.dataset.cell !== undefined) this.hit(Number(b.dataset.cell));
      if (b.dataset.symbol !== undefined) this.cycle(Number(b.dataset.symbol));
      if (b.dataset.action === "check-order") this.checkOrder();
      if (b.dataset.action === "room") this.room();
      if (b.dataset.action === "finish") this.finish();
    });
    this.room();
    this.start();
  }
  room() {
    this.mode = "room";
    const count = this.opened.filter(Boolean).length;
    this.root.innerHTML = `<div class="room-heading"><span class="eyebrow">КОМНАТА СЕКРЕТОВ</span><h2>За каждым замком — маленькое чудо</h2><p>Три сундука. Три загадки. Один последний ключ.</p></div><div class="chest-grid">${["Память", "Реакция", "Логика"].map((name, i) => `<button class="chest-card ${this.opened[i] ? "opened" : ""}" data-chest="${i}" ${this.opened[i] ? "disabled" : ""}><span class="chest-number">0${i + 1}</span>${chestSVG(["purple", "pink", "blue"][i])}<strong>${name}</strong><span class="chest-status">${this.opened[i] ? `${icon("check")} Открыт` : `${icon("lock")} Открыть загадку`}</span></button>`).join("")}</div><div class="room-progress"><span>${count} / 3 сундуков открыто</span><div class="progress-track"><i style="width:${(count / 3) * 100}%"></i></div></div>${count === 3 ? `<button class="button primary" data-action="finish">ЗАБРАТЬ ТРЕТИЙ КЛЮЧ ${icon("key")}</button>` : '<p class="hint">Выбирай сундуки в любом порядке</p>'}`;
  }
  taskShell(title, desc, content) {
    this.root.innerHTML = `<div class="task-heading"><button class="text-button" data-action="room">← К сундукам</button><h2>${title}</h2><p>${desc}</p></div>${content}<p class="task-feedback" role="status"></p>`;
  }
  feedback(text) {
    const el = this.root.querySelector(".task-feedback");
    if (el) el.textContent = text;
  }
  openTask(i) {
    if (this.opened[i]) return;
    this.task = i;
    this.selected = [];
    this.resolveAt = 0;
    this.doneAt = 0;
    if (i === 0) {
      this.mode = "memory";
      this.cards = shuffle([...symbols, ...symbols]);
      this.matched = new Set();
      this.previewUntil = this.time + 2.3;
      this.taskShell(
        "Запомни созвездия",
        "Найди 4 пары одинаковых символов. Времени хватит на всё.",
        `<div class="memory-grid">${this.cards.map((s, n) => `<button class="memory-card revealed" data-card="${n}" aria-label="${names[s]}"><span class="card-back">✦</span><span class="card-face">${icon(s)}</span></button>`).join("")}</div>`,
      );
      this.feedback("Запоминай! Карточки скоро перевернутся.");
    } else if (i === 1) {
      this.mode = "reaction";
      this.hits = 0;
      this.target = -1;
      this.targetUntil = 0;
      this.nextTarget = this.time + 0.7;
      this.taskShell(
        "Поймай огоньки",
        "Нажимай на сияющий огонёк. Собери 8 — и замок откроется.",
        `<div class="reaction-hud"><span>Огоньки <b id="reaction-score">0 / 8</b></span><span>Без спешки, пробуй ещё</span></div><div class="reaction-grid">${Array.from({ length: 9 }, (_, n) => `<button class="reaction-cell" data-cell="${n}" aria-label="Ячейка ${n + 1}">${icon("star")}</button>`).join("")}</div>`,
      );
    } else {
      this.mode = "puzzle";
      this.order = ["moon", "sun", "star"];
      this.taskShell(
        "Небесный шифр",
        "Нажимай на символы, чтобы менять их. Составь верный порядок.",
        `<div class="visual-clues"><span>${icon("sun")}<b>Первым приходит день</b></span><span>${icon("moon")}<b>После дня — луна</b></span><span>${icon("star")}<b>За луной загорается звезда</b></span></div><div class="puzzle-order">${this.order.map((s, i) => `<button class="symbol-button" data-symbol="${i}" aria-label="Позиция ${i + 1}: ${names[s]}, изменить">${icon(s)}<small>${i + 1}</small></button>`).join("")}</div><button class="button primary" data-action="check-order">ПРОВЕРИТЬ ШИФР ${icon("arrow")}</button>`,
      );
    }
  }
  flip(i) {
    if (
      this.mode !== "memory" ||
      this.time < this.previewUntil ||
      this.resolveAt ||
      this.matched.has(i) ||
      this.selected.includes(i) ||
      this.doneAt
    )
      return;
    this.selected.push(i);
    this.audio.sfx("collect");
    this.syncCards();
    if (this.selected.length === 2) this.resolveAt = this.time + 0.65;
  }
  syncCards() {
    this.root.querySelectorAll("[data-card]").forEach((b, i) => {
      const show =
        this.time < this.previewUntil ||
        this.selected.includes(i) ||
        this.matched.has(i);
      b.classList.toggle("revealed", show);
      b.classList.toggle("matched", this.matched.has(i));
      b.disabled = this.matched.has(i);
      b.setAttribute(
        "aria-label",
        show
          ? `${names[this.cards[i]]}${this.matched.has(i) ? ", пара найдена" : ""}`
          : `Закрытая карточка ${i + 1}`,
      );
    });
  }
  setTarget(n) {
    this.target = n;
    this.root.querySelectorAll("[data-cell]").forEach((b, i) => {
      b.classList.toggle("lit", i === n);
      b.setAttribute(
        "aria-label",
        i === n ? "Сияющий огонёк, нажми" : `Ячейка ${i + 1}`,
      );
    });
  }
  hit(i) {
    if (this.mode !== "reaction" || this.doneAt) return;
    if (i !== this.target) {
      this.feedback("Лови именно сияющий огонёк!");
      return;
    }
    this.hits++;
    this.audio.sfx("collect");
    this.root.querySelector("#reaction-score").textContent = `${this.hits} / 8`;
    this.setTarget(-1);
    this.nextTarget = this.time + 0.28;
    this.feedback("Есть! Отличная реакция.");
    if (this.hits === 8) this.solve();
  }
  cycle(i) {
    if (this.mode !== "puzzle" || this.doneAt) return;
    const sequence = ["sun", "moon", "star"];
    this.order[i] = sequence[(sequence.indexOf(this.order[i]) + 1) % 3];
    const b = this.root.querySelector(`[data-symbol="${i}"]`);
    b.innerHTML = `${icon(this.order[i])}<small>${i + 1}</small>`;
    b.setAttribute(
      "aria-label",
      `Позиция ${i + 1}: ${names[this.order[i]]}, изменить`,
    );
    this.feedback("");
  }
  checkOrder() {
    if (this.mode !== "puzzle" || this.doneAt) return;
    if (this.order.join(",") === "sun,moon,star") this.solve();
    else {
      this.feedback("Почти! Начни с дня, затем вспомни, что появляется ночью.");
      this.audio.sfx("miss");
    }
  }
  solve() {
    if (this.doneAt) return;
    this.opened[this.task] = true;
    this.state.openChest(this.task);
    this.onChest();
    this.audio.sfx("win");
    this.feedback("Замок открыт! Возвращаемся к сундукам…");
    this.doneAt = this.time + 1.1;
  }
  finish() {
    if (this.opened.every(Boolean) && !this.finished) {
      this.finished = true;
      this.onWin();
    }
  }
  update() {
    if (this.doneAt && this.time >= this.doneAt) {
      this.doneAt = 0;
      this.room();
      return;
    }
    if (this.mode === "memory") {
      if (this.previewUntil && this.time >= this.previewUntil) {
        this.previewUntil = 0;
        this.syncCards();
        this.feedback("Теперь найди все пары.");
      }
      if (this.resolveAt && this.time >= this.resolveAt) {
        const [a, b] = this.selected;
        if (this.cards[a] === this.cards[b]) {
          this.matched.add(a);
          this.matched.add(b);
          this.feedback(`${this.matched.size / 2} / 4 пары найдено`);
        } else this.feedback("Попробуй другую пару — ты справишься.");
        this.selected = [];
        this.resolveAt = 0;
        this.syncCards();
        if (this.matched.size === 8) this.solve();
      }
    }
    if (this.mode === "reaction" && !this.doneAt) {
      if (this.target === -1 && this.time >= this.nextTarget) {
        this.setTarget((Math.random() * 9) | 0);
        this.targetUntil = this.time + 1.65;
      } else if (this.target !== -1 && this.time >= this.targetUntil) {
        this.setTarget(-1);
        this.nextTarget = this.time + 0.3;
        this.feedback("Этот убежал. Следующий уже рядом!");
      }
    }
  }
}
