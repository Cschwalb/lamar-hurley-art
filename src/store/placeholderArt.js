// Generates abstract SVG "paintings" so the gallery has something to show
// before real artwork photos are uploaded. Deterministic per seed.

function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export function placeholderArt(seed, palette) {
  const r = rng(seed)
  const w = 800
  const h = 1000
  const shapes = []
  for (let i = 0; i < 9; i++) {
    const c = palette[Math.floor(r() * palette.length)]
    const op = (0.45 + r() * 0.5).toFixed(2)
    const kind = r()
    if (kind < 0.4) {
      shapes.push(
        `<circle cx="${Math.round(r() * w)}" cy="${Math.round(r() * h)}" r="${Math.round(60 + r() * 260)}" fill="${c}" opacity="${op}"/>`,
      )
    } else if (kind < 0.75) {
      shapes.push(
        `<rect x="${Math.round(r() * w - 100)}" y="${Math.round(r() * h - 100)}" width="${Math.round(120 + r() * 420)}" height="${Math.round(80 + r() * 380)}" fill="${c}" opacity="${op}" transform="rotate(${Math.round(r() * 40 - 20)} ${w / 2} ${h / 2})"/>`,
      )
    } else {
      const y = Math.round(r() * h)
      shapes.push(
        `<path d="M-20 ${y} C ${w * 0.3} ${y - 300 * r()}, ${w * 0.6} ${y + 300 * r()}, ${w + 20} ${y - 80}" stroke="${c}" stroke-width="${Math.round(10 + r() * 40)}" fill="none" opacity="${op}" stroke-linecap="round"/>`,
      )
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${palette[0]}"/>${shapes.join('')}</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
