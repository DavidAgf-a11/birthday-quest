const CACHE_PREFIX =
  "birthday-quest-" + new URL("./", self.location).pathname + "-";
const CACHE = CACHE_PREFIX + "v4";
const ROOT = new URL("./", self.location).href;
const ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./assets/icon.svg",
  "./assets/world.svg",
  "./js/main.js",
  "./js/icons.js",
  "./js/game-state.js",
  "./js/audio.js",
  "./js/engine.js",
  "./js/effects.js",
  "./js/level1.js",
  "./js/level2.js",
  "./js/level3.js",
  "./js/reward.js",
];
self.addEventListener("install", (event) =>
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS.map((p) => new URL(p, ROOT).href)))
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || !event.request.url.startsWith(ROOT))
    return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      try {
        const response = await fetch(event.request);
        if (response.ok) await cache.put(event.request, response.clone());
        return response;
      } catch {
        return (
          (await cache.match(event.request)) ||
          (event.request.mode === "navigate"
            ? await cache.match(new URL("./index.html", ROOT).href)
            : Response.error())
        );
      }
    }),
  );
});
