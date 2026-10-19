const paths = {
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2L5.8 21 7 14.2 2 9.3l6.9-1Z"/>',
  key: '<circle cx="8" cy="8" r="5"/><path d="m11.5 11.5 9 9m-4-4 3-3m-6 0 3-3"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  sound:
    '<path d="m11 4-6 5H2v6h3l6 5Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  mute: '<path d="m11 4-6 5H2v6h3l6 5Zm5 5 6 6m0-6-6 6"/>',
  pause: '<path d="M8 5v14m8-14v14"/>',
  restart: '<path d="M4 10a8 8 0 1 1 1 8M4 3v7h7"/>',
  play: '<path d="m8 4 12 8-12 8Z"/>',
  map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16"/>',
  jump: '<path d="M12 21V3m-7 7 7-7 7 7"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10"/>',
  moon: '<path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
  heart:
    '<path d="M20 5c-3-3-6-1-8 1-2-2-5-4-8-1-5 5 4 12 8 15 4-3 13-10 8-15Z"/>',
  gem: '<path d="m3 9 4-6h10l4 6-9 12Zm0 0h18M7 3l5 18 5-18"/>',
  flag: '<path d="M5 22V3c4-5 10 5 15 0v10c-5 5-11-5-15 0"/>',
  chest:
    '<path d="M3 12V8a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v4M3 12h18v9H3Zm5-8v8m8-8v8"/><rect x="10" y="10" width="4" height="5" rx="1"/>',
};
export function icon(name, cls = "") {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.star}</svg>`;
}
export function chestSVG(color = "purple") {
  const c =
    color === "gold"
      ? ["#ffeb99", "#efac42", "#b77a24"]
      : color === "pink"
        ? ["#ffbbda", "#e87fae", "#af5286"]
        : color === "blue"
          ? ["#b2eaff", "#79b9ef", "#5686bf"]
          : ["#d9c5ff", "#a78ae1", "#7557ac"];
  return `<svg class="chest-art" viewBox="0 0 180 150" aria-hidden="true"><ellipse cx="90" cy="132" rx="69" ry="12" fill="#291b4d" opacity=".13"/><path d="m25 77 65 15 65-15v46l-65 19-65-19Z" fill="${c[1]}"/><path d="m90 92 65-15v46l-65 19Z" fill="${c[2]}"/><path d="M40 86v40m100-40v40" stroke="#ffdd87" stroke-width="10"/><g class="chest-lid"><path d="M25 77V58q0-28 32-28h66q32 0 32 28v19L90 96Z" fill="${c[0]}"/><path d="m25 77 65 19 65-19" fill="none" stroke="#ffdd87" stroke-width="8"/><path d="M48 33v48m84-48v48" stroke="#fff0b3" stroke-width="10"/><path d="M30 57q4-20 28-20h63" fill="none" stroke="white" opacity=".5" stroke-width="5" stroke-linecap="round"/></g><rect x="78" y="82" width="24" height="29" rx="6" fill="#ffe1a0"/><circle cx="90" cy="93" r="4" fill="#926038"/><path d="m88 95-1 7h6l-1-7" fill="#926038"/></svg>`;
}
