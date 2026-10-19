import { CanvasGame, rounded, star } from "./engine.js";
export class StarCatcher extends CanvasGame {
  constructor(canvas, { audio, onWin, onLose, onHud, random = Math.random }) {
    super(canvas, 360, 440);
    Object.assign(this, { audio, onWin, onLose, onHud, random });
    this.x = 180;
    this.target = 180;
    this.items = [];
    this.particles = [];
    this.score = 0;
    this.remaining = 30;
    this.spawnIn = 0.2;
    this.invincible = 0;
    this.finished = false;
    this.dragging = false;
    this.on(canvas, "pointerdown", (e) => {
      e.preventDefault();
      this.dragging = true;
      canvas.setPointerCapture(e.pointerId);
      this.move(e);
    });
    this.on(canvas, "pointermove", (e) => {
      if (this.dragging) this.move(e);
    });
    this.on(canvas, "pointerup", () => (this.dragging = false));
    this.on(canvas, "pointercancel", () => (this.dragging = false));
    this.onHud(0, 30);
    this.start();
  }
  move(e) {
    if (!this.paused)
      this.target = Math.max(34, Math.min(326, this.point(e).x));
  }
  update(dt) {
    if (this.finished) return;
    this.remaining = Math.max(0, this.remaining - dt);
    this.invincible = Math.max(0, this.invincible - dt);
    this.x += (this.target - this.x) * (1 - Math.exp(-20 * dt));
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.spawnIn += 0.47;
      const bad = this.random() < 0.14;
      this.items.push({
        x: 24 + this.random() * 312,
        y: -20,
        vy: 115 + this.random() * 48,
        bad,
        pink: this.random() > 0.55,
        spin: this.random() * 6,
      });
    }
    for (const item of this.items) {
      item.y += item.vy * dt;
      item.spin += dt;
      if (
        !item.hit &&
        item.y > 362 &&
        item.y < 407 &&
        Math.abs(item.x - this.x) < 41
      ) {
        item.hit = true;
        if (item.bad) {
          if (!this.invincible) {
            this.score = Math.max(0, this.score - 1);
            this.invincible = 0.65;
            this.audio.sfx("miss");
          }
        } else {
          this.score++;
          this.audio.sfx("collect");
          for (let i = 0; i < 10; i++)
            this.particles.push({
              x: item.x,
              y: item.y,
              vx: (this.random() - 0.5) * 130,
              vy: -40 - this.random() * 90,
              life: 0.55,
              color: item.pink ? "#f78bbc" : "#efb947",
            });
        }
      }
    }
    this.items = this.items.filter((i) => !i.hit && i.y < 470);
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 200 * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    this.onHud(this.score, Math.ceil(this.remaining));
    if (this.score >= 12) {
      this.finished = true;
      this.onWin();
    } else if (!this.remaining) {
      this.finished = true;
      this.onLose(this.score);
    }
  }
  render() {
    const c = this.ctx;
    c.clearRect(0, 0, this.w, this.h);
    const bg = c.createLinearGradient(0, 0, 0, 440);
    bg.addColorStop(0, "#e5d8ff");
    bg.addColorStop(1, "#fff2f7");
    c.fillStyle = bg;
    c.fillRect(0, 0, 360, 440);
    for (let i = 0; i < 22; i++) {
      c.globalAlpha = 0.3 + Math.sin(this.time * 2 + i) * 0.15;
      star(
        c,
        (i * 97 + 30) % 360,
        (i * 63 + 20) % 340,
        i % 3 ? 2 : 4,
        "#956ec9",
      );
    }
    c.globalAlpha = 1;
    c.fillStyle = "#fff";
    c.globalAlpha = 0.38;
    for (const [x, y, r] of [
      [30, 80, 45],
      [70, 90, 30],
      [320, 150, 43],
      [290, 160, 28],
    ]) {
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
    c.fillStyle = "#e2d3f1";
    c.beginPath();
    c.ellipse(180, 445, 250, 42, 0, 0, Math.PI * 2);
    c.fill();
    for (const i of this.items) {
      if (i.bad) {
        c.save();
        c.translate(i.x, i.y);
        c.rotate(i.spin);
        rounded(c, -13, -13, 26, 26, 7, "#8e78b0");
        c.strokeStyle = "#c4b5db";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(-5, -5);
        c.lineTo(5, 5);
        c.moveTo(5, -5);
        c.lineTo(-5, 5);
        c.stroke();
        c.restore();
      } else {
        star(
          c,
          i.x,
          i.y + 2,
          17,
          i.pink ? "#d1669a" : "#d69a31",
          i.spin * 0.15,
        );
        star(c, i.x, i.y, 16, i.pink ? "#ff9eca" : "#ffcf68", i.spin * 0.15);
        star(c, i.x - 3, i.y - 4, 5, "#fff4cd", i.spin * 0.15);
      }
    }
    c.save();
    c.translate(this.x, 388);
    if (this.invincible) c.globalAlpha = 0.45 + Math.sin(this.time * 35) * 0.3;
    c.fillStyle = "rgba(112,73,154,.16)";
    c.beginPath();
    c.ellipse(0, 30, 38, 7, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#9876ca";
    c.lineWidth = 5;
    c.beginPath();
    c.arc(0, -2, 24, Math.PI, 0);
    c.stroke();
    rounded(c, -32, -9, 64, 37, 12, "#ab89dd");
    rounded(c, -35, -10, 70, 10, 5, "#d1b7f4");
    star(c, 0, 10, 11, "#fff0ab");
    c.restore();
    for (const p of this.particles) {
      c.globalAlpha = p.life / 0.55;
      star(c, p.x, p.y, 4, p.color);
    }
    c.globalAlpha = 1;
  }
}
