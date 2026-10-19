export const SAVE_KEY = "birthday-quest-level12-v1";
const fresh = () => ({
  version: 1,
  completed: [false, false, false],
  chests: [false, false, false],
  checkpoint: 0,
  revealed: false,
  muted: false,
});
export class GameState {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
    this.available = true;
    this.value = fresh();
    try {
      const raw = JSON.parse(storage.getItem(SAVE_KEY) || "null");
      if (raw?.version === 1) {
        this.value.muted = raw.muted === true;
        for (let i = 0; i < 3; i++)
          this.value.completed[i] =
            raw.completed?.[i] === true &&
            (i === 0 || this.value.completed[i - 1]);
        if (this.value.completed[1])
          this.value.chests = [0, 1, 2].map((i) => raw.chests?.[i] === true);
        if (this.value.completed[2]) this.value.chests = [true, true, true];
        this.value.checkpoint =
          this.value.completed[0] && Number.isInteger(raw.checkpoint)
            ? Math.max(0, Math.min(3, raw.checkpoint))
            : 0;
        this.value.revealed = this.value.completed[2] && raw.revealed === true;
      }
    } catch {
      this.available = false;
    }
  }
  save() {
    try {
      this.storage.setItem(SAVE_KEY, JSON.stringify(this.value));
    } catch {
      this.available = false;
    }
  }
  get keys() {
    return this.value.completed.filter(Boolean).length;
  }
  complete(i) {
    if (i > 0 && !this.value.completed[i - 1]) return false;
    this.value.completed[i] = true;
    this.save();
    return true;
  }
  openChest(i) {
    if (!this.value.completed[1]) return;
    this.value.chests[i] = true;
    this.save();
  }
  checkpoint(i) {
    this.value.checkpoint = Math.max(this.value.checkpoint, i);
    this.save();
  }
  reset() {
    const muted = this.value.muted;
    this.value = fresh();
    this.value.muted = muted;
    this.save();
  }
}
