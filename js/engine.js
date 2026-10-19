export class GameLoop {
  constructor() {
    this.paused = false;
    this.dead = false;
    this.last = 0;
    this.frame = 0;
    this.time = 0;
    this.events = new AbortController();
  }
  on(node, name, fn, options = {}) {
    node.addEventListener(name, fn, { ...options, signal: this.events.signal });
  }
  start() {
    const tick = (now) => {
      if (this.dead) return;
      const dt = this.last ? Math.min((now - this.last) / 1000, 0.04) : 0;
      this.last = now;
      if (!this.paused) {
        this.time += dt;
        this.update(dt);
      }
      if (!this.dead) {
        this.render?.();
        this.frame = requestAnimationFrame(tick);
      }
    };
    this.frame = requestAnimationFrame(tick);
  }
  pause(value) {
    this.paused = value;
    this.last = 0;
  }
  destroy() {
    this.dead = true;
    cancelAnimationFrame(this.frame);
    this.events.abort();
    this.observer?.disconnect();
  }
}
export class CanvasGame extends GameLoop {
  constructor(canvas, width, height) {
    super();
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.w = width;
    this.h = height;
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const scale = Math.max(1, canvas.clientWidth / width) * dpr;
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      this.ctx.setTransform(
        canvas.width / width,
        0,
        0,
        canvas.height / height,
        0,
        0,
      );
    };
    this.observer = new ResizeObserver(resize);
    this.observer.observe(canvas);
    resize();
  }
  point(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * this.w,
      y: ((e.clientY - rect.top) / rect.height) * this.h,
    };
  }
}
export function rounded(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}
export function star(ctx, x, y, radius, color, angle = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? radius * 0.46 : radius;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}
export function character(ctx, x, y, t = 0, jumping = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(69,44,108,.12)";
  ctx.beginPath();
  ctx.ellipse(0, 2, 19, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  rounded(
    ctx,
    -12,
    -18,
    9,
    18 + (jumping ? 0 : Math.sin(t * 16) * 3),
    3,
    "#fff8ff",
  );
  rounded(
    ctx,
    3,
    -18,
    9,
    18 - (jumping ? 0 : Math.sin(t * 16) * 3),
    3,
    "#fff8ff",
  );
  rounded(ctx, -16, -43, 32, 29, 9, "#af8cf5");
  rounded(ctx, -22, -40, 8, 22, 4, "#f5c8bc");
  rounded(ctx, 14, -40, 8, 22, 4, "#f5c8bc");
  rounded(ctx, -18, -72, 36, 34, 12, "#735075");
  rounded(ctx, -14, -64, 28, 25, 9, "#ffddc8");
  rounded(ctx, -17, -72, 34, 14, 7, "#735075");
  ctx.fillStyle = "#533d64";
  ctx.fillRect(-8, -54, 3, 4);
  ctx.fillRect(5, -54, 3, 4);
  ctx.strokeStyle = "#cb7c8b";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, -49, 4, 0, Math.PI);
  ctx.stroke();
  star(ctx, 15, -69, 7, "#ffdd7c");
  star(ctx, 0, -29, 7, "#fff1b2");
  ctx.restore();
}
