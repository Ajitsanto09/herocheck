import type { Settings } from './hero.ts'

// Built-in examples are drawn in code: no binary assets to license, and nothing fetched from the network.
const W = 2400
const H = 1400

function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function vertical(ctx: CanvasRenderingContext2D, stops: [number, string][], y0 = 0, y1 = H) {
  const g = ctx.createLinearGradient(0, y0, 0, y1)
  for (const [at, c] of stops) g.addColorStop(at, c)
  ctx.fillStyle = g
  ctx.fillRect(0, y0, W, y1 - y0)
}

function forest(ctx: CanvasRenderingContext2D) {
  const rand = seeded(1)
  vertical(ctx, [[0, '#9fd0ff'], [0.7, '#f4fbff']])
  ctx.fillStyle = '#fff6c9'
  ctx.beginPath()
  ctx.arc(1500, 380, 140, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1f3a24'
  ctx.fillRect(0, 1080, W, H)
  // Dense trees on the left third only: fine on wide crops, gone on narrow ones.
  for (let i = 0; i < 160; i++) {
    const x = rand() * 1000
    const top = 120 + rand() * 500
    ctx.fillStyle = ['#12301a', '#173d22', '#0d2613'][i % 3]
    ctx.beginPath()
    ctx.moveTo(x, top)
    ctx.lineTo(x - 160, 1120)
    ctx.lineTo(x + 160, 1120)
    ctx.fill()
  }
}

function snow(ctx: CanvasRenderingContext2D) {
  const rand = seeded(2)
  vertical(ctx, [[0, '#e9f1f8'], [1, '#ffffff']])
  for (const [peak, base, shade] of [[300, 1000, '#d5dde6'], [520, 1150, '#c4ced9'], [700, 1400, '#f3f6f9']] as const) {
    ctx.fillStyle = shade
    ctx.beginPath()
    ctx.moveTo(0, base)
    for (let x = 0; x <= W; x += 120) ctx.lineTo(x, peak + rand() * (base - peak) * 0.6)
    ctx.lineTo(W, H)
    ctx.lineTo(0, H)
    ctx.fill()
  }
}

function city(ctx: CanvasRenderingContext2D) {
  const rand = seeded(3)
  vertical(ctx, [[0, '#0b1230'], [1, '#1b1f3a']])
  for (let x = 0; x < W; x += 140 + rand() * 80) {
    const top = 300 + rand() * 700
    ctx.fillStyle = '#0a0d1c'
    ctx.fillRect(x, top, 130, H - top)
    for (let y = top + 20; y < H - 20; y += 36) {
      for (let wx = x + 12; wx < x + 120; wx += 26) {
        if (rand() < 0.45) {
          ctx.fillStyle = rand() < 0.5 ? '#ffe9a8' : '#fffdf2'
          ctx.fillRect(wx, y, 16, 22)
        }
      }
    }
  }
}

const base = { textColor: '#ffffff', overlayColor: '#000000', opacity: 0, gradient: true, focusX: 50, focusY: 50 }

export const EXAMPLES: { name: string; draw: (ctx: CanvasRenderingContext2D) => void; settings: Settings }[] = [
  { name: 'Forest edge', draw: forest, settings: { ...base, headline: 'Find your trail', v: 'middle', h: 'left' } },
  { name: 'Snowfield', draw: snow, settings: { ...base, headline: 'Winter retreats for small teams', v: 'top', h: 'center' } },
  { name: 'City lights', draw: city, settings: { ...base, headline: 'Late shows, every night of the week', v: 'bottom', h: 'left' } },
]

export function renderExample(draw: (ctx: CanvasRenderingContext2D) => void): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  draw(canvas.getContext('2d')!)
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not render example'))), 'image/jpeg', 0.9),
  )
}
