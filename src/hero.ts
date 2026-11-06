import { hexToRgb, type Overlay } from './contrast.ts'

export const HERO_HEIGHT = 560
export const HERO_BG = '#111111'
export const VIEWPORTS = [
  { name: 'Desktop', width: 1440 },
  { name: 'Tablet', width: 768 },
  { name: 'Mobile', width: 390 },
] as const

export type Settings = {
  headline: string
  textColor: string
  overlayColor: string
  opacity: number
  gradient: boolean
  v: 'top' | 'middle' | 'bottom'
  h: 'left' | 'center' | 'right'
  focusX: number
  focusY: number
}

export const overlayOf = (s: Settings): Overlay => ({
  color: hexToRgb(s.overlayColor),
  opacity: s.opacity,
  from: s.gradient && s.v !== 'middle' ? s.v : null,
})

function overlayCss(s: Settings): string {
  const { color, opacity, from } = overlayOf(s)
  const rgba = (a: number) => `rgba(${color.join(', ')}, ${+a.toFixed(2)})`
  return from
    ? `linear-gradient(to ${from === 'top' ? 'bottom' : 'top'}, ${rgba(opacity)}, ${rgba(0)})`
    : `linear-gradient(${rgba(opacity)}, ${rgba(opacity)})`
}

// One source of truth: the live preview and the copied CSS are both built from these declarations.
export function heroDecls(s: Settings, imageUrl: string): Record<string, string> {
  return {
    'container-type': 'inline-size',
    position: 'relative',
    display: 'flex',
    'flex-direction': 'column',
    'justify-content': { top: 'flex-start', middle: 'center', bottom: 'flex-end' }[s.v],
    'align-items': { left: 'flex-start', center: 'center', right: 'flex-end' }[s.h],
    'text-align': s.h,
    'box-sizing': 'border-box',
    'min-height': `${HERO_HEIGHT}px`,
    padding: '2rem',
    'background-color': HERO_BG,
    'background-image': imageUrl ? `${overlayCss(s)}, url("${imageUrl}")` : overlayCss(s),
    'background-size': 'cover',
    'background-position': `${s.focusX}% ${s.focusY}%`,
    'background-repeat': 'no-repeat',
  }
}

export const headlineDecls = (s: Settings): Record<string, string> => ({
  margin: '0',
  'max-width': '18ch',
  color: s.textColor,
  'font-family': 'system-ui, sans-serif',
  'font-weight': '800',
  'font-size': 'clamp(2rem, 7cqi, 4.5rem)',
  'line-height': '1.05',
})

export const toReactStyle = (decls: Record<string, string>) =>
  Object.fromEntries(Object.entries(decls).map(([k, v]) => [k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()), v]))

const block = (selector: string, decls: Record<string, string>) =>
  `${selector} {\n${Object.entries(decls).map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}`

// The image name is a fixed placeholder, never the uploaded filename, so nothing user-supplied lands in the CSS.
export const exportCss = (s: Settings) =>
  `${block('.hero', heroDecls(s, 'hero.jpg'))}\n\n${block('.hero h1', headlineDecls(s))}\n`

export const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export const exportHtml = (s: Settings) => `<section class="hero">\n  <h1>${escapeHtml(s.headline)}</h1>\n</section>\n`

/** Draws the image like CSS `background-size: cover` at `background-position: focusX% focusY%`. */
export function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, width: number, s: Settings) {
  const k = Math.max(width / img.naturalWidth, HERO_HEIGHT / img.naturalHeight)
  const w = img.naturalWidth * k
  const h = img.naturalHeight * k
  ctx.fillStyle = HERO_BG
  ctx.fillRect(0, 0, width, HERO_HEIGHT)
  ctx.drawImage(img, ((width - w) * s.focusX) / 100, ((HERO_HEIGHT - h) * s.focusY) / 100, w, h)
}

export function drawOverlay(ctx: CanvasRenderingContext2D, width: number, s: Settings) {
  const { color, opacity, from } = overlayOf(s)
  const g = ctx.createLinearGradient(0, from === 'bottom' ? HERO_HEIGHT : 0, 0, from === 'bottom' ? 0 : HERO_HEIGHT)
  g.addColorStop(0, `rgba(${color.join(',')},${opacity})`)
  g.addColorStop(1, `rgba(${color.join(',')},${from ? 0 : opacity})`)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, width, HERO_HEIGHT)
}
