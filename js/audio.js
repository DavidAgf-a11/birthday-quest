// Original synthesized melody: no downloads, recordings, or third-party music.
export class AudioManager {
  constructor(muted = false) {
    this.muted = muted;
    this.ctx = null;
    this.timer = null;
    this.step = 0;
    this.active = false;
  }
  async unlock() {
    try {
      if (!this.ctx) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        this.ctx = new Audio();
        this.bus = this.ctx.createGain();
        this.bus.gain.value = 0.65;
        this.bus.connect(this.ctx.destination);
      }
      if (!this.muted) {
        await this.ctx.resume();
        this.active = true;
        this.music();
      }
    } catch {
      /* Gameplay stays available if audio is blocked. */
    }
  }
  tone(freq, duration = 0.16, type = "sine", volume = 0.13, delay = 0) {
    if (!this.ctx || this.muted || this.ctx.state !== "running") return;
    const osc = this.ctx.createOscillator(),
      gain = this.ctx.createGain(),
      start = this.ctx.currentTime + delay;
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(this.bus);
    osc.start(start);
    osc.stop(start + duration + 0.02);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }
  music() {
    if (this.timer || this.muted || !this.active) return;
    const notes = [
      523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 698.46, 659.25,
      783.99, 987.77, 783.99, 587.33, 698.46, 783.99, 659.25,
    ];
    this.timer = setInterval(() => {
      if (!this.active || this.muted) return;
      const i = this.step++ % notes.length;
      this.tone(notes[i], 0.55, "sine", 0.045);
      if (i % 4 === 0) this.tone(notes[i] / 4, 1.1, "triangle", 0.025);
    }, 370);
  }
  sfx(kind) {
    if (kind === "win")
      [523.25, 659.25, 783.99, 1046.5].forEach((n, i) =>
        this.tone(n, 0.55, "triangle", 0.12, i * 0.12),
      );
    else if (kind === "final")
      [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5].forEach((n, i) =>
        this.tone(n, 1.3, "triangle", 0.1, i * 0.14),
      );
    else if (kind === "miss") {
      this.tone(220, 0.2, "triangle", 0.09);
      this.tone(164.81, 0.23, "triangle", 0.07, 0.1);
    } else if (kind === "jump") {
      this.tone(330, 0.1, "sine", 0.09);
      this.tone(520, 0.16, "sine", 0.07, 0.05);
    } else {
      this.tone(880, 0.14);
      this.tone(1174.66, 0.2, "sine", 0.08, 0.06);
    }
  }
  suspend() {
    this.active = false;
    clearInterval(this.timer);
    this.timer = null;
    this.ctx?.suspend().catch(() => {});
  }
  async toggle() {
    this.muted = !this.muted;
    if (this.muted) this.suspend();
    else await this.unlock();
  }
}
