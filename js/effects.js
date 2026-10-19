import { star } from "./engine.js";
export class Confetti {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.frame = 0;
  }
  burst(gold = false) {
    this.stop();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const w = innerWidth,
      h = innerHeight,
      dpr = Math.min(devicePixelRatio, 2);
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const colors = gold
      ? ["#ffcc61", "#ffe9a9", "#fff7d4", "#ce9aef"]
      : ["#ad87f5", "#ffa9cb", "#ffd16c", "#91d8ed"];
    const bits = Array.from({ length: 110 }, () => ({
      x: w / 2,
      y: h * 0.4,
      vx: (Math.random() - 0.5) * 650,
      vy: -150 - Math.random() * 500,
      r: 3 + Math.random() * 4,
      a: Math.random() * 6,
      color: colors[(Math.random() * colors.length) | 0],
    }));
    let last = performance.now(),
      elapsed = 0;
    const draw = (now) => {
      const dt = Math.min((now - last) / 1000, 0.04);
      last = now;
      elapsed += dt;
      this.ctx.clearRect(0, 0, w, h);
      this.ctx.globalAlpha = Math.min(1, 5 - elapsed);
      for (const p of bits) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 200 * dt;
        p.a += dt * 3;
        star(this.ctx, p.x, p.y, p.r, p.color, p.a);
      }
      if (elapsed < 5) this.frame = requestAnimationFrame(draw);
      else this.stop();
    };
    this.frame = requestAnimationFrame(draw);
  }
  stop() {
    cancelAnimationFrame(this.frame);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
