import { CanvasGame, rounded, star, character } from "./engine.js";
export const PLATFORMS = [
  [0, 600],
  [690, 1180],
  [1270, 1790],
  [1890, 2380],
  [2480, 3000],
  [3110, 3570],
  [3680, 4140],
];
export const OBSTACLES = [350, 950, 1540, 2140, 2760, 3350];
export const CHECKPOINTS = [80, 1300, 2510, 3710];
export class BirthdayObby extends CanvasGame {
  constructor(
    canvas,
    { audio, checkpoint = 0, onCheckpoint, onWin, onHud, jumpButton },
  ) {
    super(canvas, 400, 360);
    Object.assign(this, { audio, onCheckpoint, onWin, onHud });
    this.checkpoint = checkpoint;
    this.x = CHECKPOINTS[checkpoint];
    this.y = 284;
    this.vy = 0;
    this.ground = true;
    this.coyote = 0.1;
    this.buffer = 0;
    this.camera = Math.max(0, this.x - 95);
    this.coins = new Set();
    this.flash = 0;
    this.finished = false;
    this.on(canvas, "pointerdown", (e) => {
      e.preventDefault();
      this.jump();
    });
    this.on(jumpButton, "pointerdown", (e) => {
      e.preventDefault();
      this.jump();
    });
    this.on(jumpButton, "keydown", (e) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        this.jump();
      }
    });
    this.start();
  }
  jump() {
    if (!this.paused && !this.finished) this.buffer = 0.16;
  }
  resetPosition() {
    this.x = CHECKPOINTS[this.checkpoint];
    this.y = 284;
    this.vy = 0;
    this.ground = true;
    this.coyote = 0.1;
    this.buffer = 0;
    this.camera = Math.max(0, this.x - 95);
    this.flash = 0.7;
    this.audio.sfx("miss");
  }
  update(dt) {
    if (this.finished) return;
    if (this.flash > 0) {
      this.flash -= dt;
      return;
    }
    const speed = 150 + Math.min(this.x / 180, 22);
    this.buffer -= dt;
    this.coyote = this.ground ? 0.1 : this.coyote - dt;
    if (this.buffer > 0 && this.coyote > 0) {
      this.vy = -540;
      this.ground = false;
      this.coyote = 0;
      this.buffer = 0;
      this.audio.sfx("jump");
    }
    const oldY = this.y;
    this.x += speed * dt;
    this.vy += 1400 * dt;
    this.y += this.vy * dt;
    this.ground = false;
    for (const [start, end] of PLATFORMS)
      if (
        this.x + 12 > start &&
        this.x - 12 < end &&
        oldY <= 284 &&
        this.y >= 284 &&
        this.vy >= 0
      ) {
        this.y = 284;
        this.vy = 0;
        this.ground = true;
      }
    for (const x of OBSTACLES)
      if (
        this.x + 12 > x &&
        this.x - 12 < x + 30 &&
        this.y > 250 &&
        this.y - 66 < 284
      ) {
        this.resetPosition();
        return;
      }
    if (this.y > 420) {
      this.resetPosition();
      return;
    }
    CHECKPOINTS.forEach((x, i) => {
      if (this.x >= x && i > this.checkpoint && this.ground) {
        this.checkpoint = i;
        this.onCheckpoint(i);
        this.audio.sfx("collect");
      }
    });
    this.coinPositions().forEach((p, i) => {
      if (
        !this.coins.has(i) &&
        Math.abs(this.x - p.x) < 28 &&
        Math.abs(this.y - 38 - p.y) < 38
      ) {
        this.coins.add(i);
        this.audio.sfx("collect");
      }
    });
    this.camera +=
      (Math.max(0, this.x - 100) - this.camera) * (1 - Math.exp(-8 * dt));
    this.onHud(
      Math.min(100, Math.round((this.x / 3980) * 100)),
      this.coins.size,
      this.checkpoint,
    );
    if (this.x >= 3980) {
      this.finished = true;
      this.onWin();
    }
  }
  coinPositions() {
    return [
      ...OBSTACLES.map((x) => ({ x: x + 14, y: 185 })),
      ...PLATFORMS.slice(1).map(([x]) => ({ x: x + 55, y: 237 })),
    ];
  }
  render() {
    const c = this.ctx;
    c.clearRect(0, 0, 400, 360);
    const bg = c.createLinearGradient(0, 0, 0, 360);
    bg.addColorStop(0, "#dddbff");
    bg.addColorStop(1, "#fbeaf9");
    c.fillStyle = bg;
    c.fillRect(0, 0, 400, 360);
    for (let i = 0; i < 7; i++) {
      const x = ((((i * 119 - this.camera * 0.15) % 650) + 650) % 650) - 120;
      c.fillStyle = "#fff";
      c.globalAlpha = 0.45;
      c.beginPath();
      c.ellipse(x, 65 + (i % 3) * 30, 46, 12, 0, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.arc(x, 53 + (i % 3) * 30, 20, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
    for (let i = 0; i < 8; i++) {
      const x = ((((i * 100 - this.camera * 0.28) % 800) + 800) % 800) - 100;
      star(c, x, 110 + (i % 3) * 24, 4, "#b39cd3", this.time * 0.2);
    }
    c.save();
    c.translate(-this.camera, 0);
    for (const [start, end] of PLATFORMS) {
      if (end < this.camera - 100 || start > this.camera + 500) continue;
      rounded(c, start, 284, end - start, 100, 10, "#c5a1e5");
      rounded(c, start, 284, end - start, 15, 6, "#9c7bc7");
      rounded(c, start, 279, end - start, 12, 6, "#dec6f5");
      c.fillStyle = "#b693d5";
      for (let x = start + 20; x < end; x += 45) c.fillRect(x, 314, 20, 7);
    }
    for (const x of OBSTACLES) {
      rounded(c, x, 250, 30, 34, 5, "#ec9bbb");
      rounded(c, x, 250, 30, 7, 3, "#ffd5e5");
      c.strokeStyle = "#fff0f7";
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(x + 8, 263);
      c.lineTo(x + 22, 275);
      c.stroke();
    }
    CHECKPOINTS.slice(1).forEach((x, i) => {
      c.strokeStyle = "#a381c9";
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(x, 280);
      c.lineTo(x, 198);
      c.stroke();
      c.fillStyle = this.checkpoint > i ? "#83cdb3" : "#b3a0d4";
      c.beginPath();
      c.moveTo(x, 198);
      c.lineTo(x + 32, 208);
      c.lineTo(x, 222);
      c.fill();
    });
    this.coinPositions().forEach((p, i) => {
      if (this.coins.has(i)) return;
      c.fillStyle = "#f0b74e";
      c.beginPath();
      c.ellipse(
        p.x,
        p.y + Math.sin(this.time * 3 + i) * 4,
        8,
        11,
        0,
        0,
        Math.PI * 2,
      );
      c.fill();
      c.strokeStyle = "#ffe5a0";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(p.x, p.y - 5);
      c.lineTo(p.x, p.y + 5);
      c.stroke();
    });
    c.save();
    c.shadowColor = "#c587fc";
    c.shadowBlur = 22;
    rounded(c, 3960, 166, 68, 118, 34, "#9d75e2");
    c.shadowBlur = 0;
    rounded(c, 3970, 176, 48, 108, 24, "#f0dcff");
    rounded(c, 3978, 187, 32, 97, 17, "#fff5ff");
    c.restore();
    character(c, this.x, this.y, this.time, !this.ground);
    c.restore();
    if (this.flash > 0) {
      c.fillStyle = "rgba(248,238,255,.55)";
      c.fillRect(0, 0, 400, 360);
      rounded(c, 76, 124, 248, 50, 16, "#fff9ff");
      c.fillStyle = "#644484";
      c.font = "bold 15px system-ui";
      c.textAlign = "center";
      c.fillText("К контрольной точке. Ещё раз!", 200, 155);
    }
  }
}
