// WCAG 2.x contrast maths. Pure functions (no DOM) so they run under `node --test`.
export type RGB = readonly [number, number, number]

export const TARGET = 4.5

export function hexToRgb(hex: string): RGB {
  const m = /^#([0-9a-f]{6})$/i.exec(hex)
  if (!m) throw new Error(`Expected a #rrggbb colour, got "${hex}"`)
  const n = parseInt(m[1], 16)
  return [n >> 16, (n >> 8) & 255, n & 255]
}

const LINEAR = Array.from({ length: 256 }, (_, i) => {
  const c = i / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
})

export const luminance = (r: number, g: number, b: number) =>
  0.2126 * LINEAR[Math.round(r)] + 0.7152 * LINEAR[Math.round(g)] + 0.0722 * LINEAR[Math.round(b)]

export const contrastRatio = (l1: number, l2: number) =>
  (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)

export const grade = (ratio: number) => (ratio >= 4.5 ? 'Passes AA' : ratio >= 3 ? 'Large text only' : 'Fails')

/** from: which edge the gradient starts at (full opacity), or null for a solid overlay. */
export type Overlay = { color: RGB; opacity: number; from: 'top' | 'bottom' | null }

/** Overlay alpha at y (0 = top of hero, 1 = bottom). Mirrors the exported CSS linear-gradient. */
export function overlayAlpha(ov: Overlay, y: number): number {
  if (!ov.from) return ov.opacity
  return ov.opacity * (ov.from === 'top' ? 1 - y : y)
}

/** RGBA pixels of the hero (image only, no overlay) under one line of text. */
export type Region = { data: ArrayLike<number>; width: number; height: number; top: number }

/** Near-worst contrast between text and overlay+image across all regions, or null if there are no pixels. */
export function worstContrast(regions: Region[], heroHeight: number, text: RGB, ov: Overlay): number | null {
  const lt = luminance(...text)
  const ratios: number[] = []
  // shortcut: samples every 2nd pixel each way for speed; use step 1 if thin fonts show false passes.
  for (const r of regions) {
    for (let row = 0; row < r.height; row += 2) {
      const a = overlayAlpha(ov, (r.top + row + 0.5) / heroHeight)
      for (let col = 0; col < r.width; col += 2) {
        const i = (row * r.width + col) * 4
        const lb = luminance(
          r.data[i] * (1 - a) + ov.color[0] * a,
          r.data[i + 1] * (1 - a) + ov.color[1] * a,
          r.data[i + 2] * (1 - a) + ov.color[2] * a,
        )
        ratios.push(contrastRatio(lt, lb))
      }
    }
  }
  if (!ratios.length) return null
  ratios.sort((x, y) => x - y)
  // 5th percentile, not the minimum: a few stray bright pixels shouldn't fail a whole headline.
  return ratios[Math.floor(ratios.length * 0.05)]
}

/** Lowest overlay opacity (5% steps) where every viewport reaches TARGET, or null if none does. */
export function suggestOpacity(viewports: Region[][], heroHeight: number, text: RGB, ov: Overlay): number | null {
  for (let pct = 0; pct <= 100; pct += 5) {
    const o = { ...ov, opacity: pct / 100 }
    if (viewports.every((regions) => (worstContrast(regions, heroHeight, text, o) ?? Infinity) >= TARGET)) return pct / 100
  }
  return null
}
