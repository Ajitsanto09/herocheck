import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { grade, hexToRgb, luminance, suggestOpacity, TARGET, worstContrast, type Region } from './contrast.ts'
import { EXAMPLES, renderExample } from './examples.ts'
import {
  drawCover, drawOverlay, exportCss, exportHtml, headlineDecls, HERO_HEIGHT, heroDecls, overlayOf, toReactStyle, VIEWPORTS,
  type Settings,
} from './hero.ts'
import { loadImage } from './upload.ts'

type Img = { url: string; el: HTMLImageElement }
type Viewport = (typeof VIEWPORTS)[number]

export default function App() {
  const [s, setS] = useState<Settings>(EXAMPLES[0].settings)
  const [img, setImg] = useState<Img | null>(null)
  const [message, setMessage] = useState('')
  const [regions, setRegions] = useState<Record<string, Region[]>>({})
  const [dragging, setDragging] = useState(false)
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }))

  async function open(file: Blob) {
    setMessage('')
    try {
      const next = await loadImage(file)
      setImg((prev) => {
        if (prev) URL.revokeObjectURL(prev.url)
        return next
      })
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e))
    }
  }

  async function openExample(i: number) {
    setS(EXAMPLES[i].settings)
    await open(await renderExample(EXAMPLES[i].draw))
  }

  useEffect(() => {
    void renderExample(EXAMPLES[0].draw).then(open)
  }, [])

  const text = hexToRgb(s.textColor)
  const overlay = overlayOf(s)
  const ratios = Object.fromEntries(Object.entries(regions).map(([k, r]) => [k, worstContrast(r, HERO_HEIGHT, text, overlay)]))

  function fix() {
    const opposite = luminance(...text) > 0.18 ? '#000000' : '#ffffff'
    for (const overlayColor of [s.overlayColor, opposite]) {
      const o = suggestOpacity(Object.values(regions), HERO_HEIGHT, text, overlayOf({ ...s, overlayColor }))
      if (o !== null) {
        setS((p) => ({ ...p, overlayColor, opacity: o }))
        setMessage(`Set overlay to ${overlayColor} at ${Math.round(o * 100)}%: every viewport now reaches ${TARGET}:1.`)
        return
      }
    }
    setMessage(`No overlay reaches ${TARGET}:1 here. Try a solid overlay, a different text position, or another focus point.`)
  }

  const css = exportCss(s)
  const html = exportHtml(s)

  return (
    <main>
      <header>
        <h1 className="brand">HeroCheck</h1>
        <p>Check your hero image. Fix unreadable text. Copy the CSS. Images never leave your browser.</p>
      </header>

      <div className="layout">
        <aside className="controls">
          <label
            className={`drop${dragging ? ' over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              const f = e.dataTransfer.files[0]
              if (f) void open(f)
            }}
          >
            <strong>Drop an image</strong> or click to choose
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void open(f)
                e.target.value = ''
              }}
            />
          </label>

          <fieldset>
            <legend>Examples</legend>
            <div className="row">
              {EXAMPLES.map((ex, i) => (
                <button key={ex.name} type="button" onClick={() => void openExample(i)}>{ex.name}</button>
              ))}
            </div>
          </fieldset>

          <label>
            Headline
            <textarea rows={2} maxLength={200} value={s.headline} onChange={(e) => set('headline', e.target.value)} />
          </label>

          <div className="row">
            <label>Text colour <input type="color" value={s.textColor} onChange={(e) => set('textColor', e.target.value)} /></label>
            <label>Overlay colour <input type="color" value={s.overlayColor} onChange={(e) => set('overlayColor', e.target.value)} /></label>
          </div>

          <div className="row">
            <label>
              Vertical
              <select value={s.v} onChange={(e) => set('v', e.target.value as Settings['v'])}>
                <option value="top">Top</option><option value="middle">Middle</option><option value="bottom">Bottom</option>
              </select>
            </label>
            <label>
              Horizontal
              <select value={s.h} onChange={(e) => set('h', e.target.value as Settings['h'])}>
                <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
              </select>
            </label>
          </div>

          <label>
            Overlay opacity: {Math.round(s.opacity * 100)}%
            <input type="range" min={0} max={1} step={0.01} value={s.opacity} onChange={(e) => set('opacity', +e.target.value)} />
          </label>
          <label className="check">
            <input type="checkbox" checked={s.gradient} onChange={(e) => set('gradient', e.target.checked)} />
            Gradient from the text edge {s.v === 'middle' && '(solid when text is in the middle)'}
          </label>
          <label>
            Image focus X: {s.focusX}%
            <input type="range" min={0} max={100} value={s.focusX} onChange={(e) => set('focusX', +e.target.value)} />
          </label>
          <label>
            Image focus Y: {s.focusY}%
            <input type="range" min={0} max={100} value={s.focusY} onChange={(e) => set('focusY', +e.target.value)} />
          </label>

          <button type="button" className="primary" onClick={fix} disabled={!img}>Fix contrast</button>
          <p role="status" className="message">{message}</p>
        </aside>

        <section className="previews" aria-label="Viewport previews">
          {VIEWPORTS.map((vp) => (
            <Preview key={vp.name} vp={vp} s={s} img={img} ratio={ratios[vp.name] ?? null} setRegions={setRegions} />
          ))}
        </section>
      </div>

      <section className="export">
        <CodeBlock title="CSS" code={css} />
        <CodeBlock title="HTML" code={html} />
      </section>

      <footer>
        Contrast is the 5th-percentile ratio of the headline against the image and overlay, per{' '}
        <a href="https://www.w3.org/TR/WCAG22/#contrast-minimum" rel="noreferrer noopener" target="_blank">WCAG 2.2 1.4.3</a>.
        Check the final page with real users and tools too.
      </footer>
    </main>
  )
}

function Preview(props: {
  vp: Viewport
  s: Settings
  img: Img | null
  ratio: number | null
  setRegions: Dispatch<SetStateAction<Record<string, Region[]>>>
}) {
  const { vp, s, img, ratio, setRegions } = props
  const outer = useRef<HTMLDivElement>(null)
  const hero = useRef<HTMLDivElement>(null)
  const span = useRef<HTMLSpanElement>(null)
  const [scale, setScale] = useState(0.25)

  useEffect(() => {
    const el = outer.current!
    const ro = new ResizeObserver(() => setScale(el.clientWidth / vp.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [vp.width])

  // Sample the image pixels under each rendered line of the headline.
  useEffect(() => {
    if (!img) return
    const canvas = document.createElement('canvas')
    canvas.width = vp.width
    canvas.height = HERO_HEIGHT
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    drawCover(ctx, img.el, vp.width, s)
    const out: Region[] = []
    for (const r of lineRects(hero.current!, span.current!)) {
      const x = Math.max(0, Math.floor(r.x))
      const y = Math.max(0, Math.floor(r.y))
      const width = Math.min(vp.width, Math.ceil(r.x + r.w)) - x
      const height = Math.min(HERO_HEIGHT, Math.ceil(r.y + r.h)) - y
      if (width > 0 && height > 0) out.push({ data: ctx.getImageData(x, y, width, height).data, width, height, top: y })
    }
    setRegions((p) => ({ ...p, [vp.name]: out }))
  }, [img, vp, s, setRegions])

  function download() {
    if (!img) return
    const canvas = document.createElement('canvas')
    canvas.width = vp.width
    canvas.height = HERO_HEIGHT
    const ctx = canvas.getContext('2d')!
    drawCover(ctx, img.el, vp.width, s)
    drawOverlay(ctx, vp.width, s)
    drawWords(ctx, hero.current!, span.current!)
    canvas.toBlob((blob) => {
      if (!blob) return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `herocheck-${vp.name.toLowerCase()}.png`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    }, 'image/png')
  }

  const pass = ratio === null ? 'none' : ratio >= TARGET ? 'pass' : ratio >= 3 ? 'warn' : 'fail'
  return (
    <figure className="preview">
      <figcaption>
        <span>{vp.name} · {vp.width}px</span>
        <span className={`badge ${pass}`}>{ratio === null ? 'No text' : `${ratio.toFixed(1)}:1 · ${grade(ratio)}`}</span>
        <button type="button" onClick={download} disabled={!img}>Download PNG</button>
      </figcaption>
      <div ref={outer} className="frame" style={{ height: HERO_HEIGHT * scale }}>
        <div
          ref={hero}
          style={{ ...toReactStyle(heroDecls(s, img?.url ?? '')), width: vp.width, transform: `scale(${scale})`, transformOrigin: '0 0' }}
        >
          <h1 style={toReactStyle(headlineDecls(s))}><span ref={span}>{s.headline}</span></h1>
        </div>
      </div>
    </figure>
  )
}

/** Line boxes of the headline in unscaled hero pixels. */
function lineRects(hero: HTMLElement, span: HTMLElement) {
  const h = hero.getBoundingClientRect()
  const k = h.width / hero.offsetWidth || 1
  return [...span.getClientRects()].map((r) => ({ x: (r.left - h.left) / k, y: (r.top - h.top) / k, w: r.width / k, h: r.height / k }))
}

/** Draws each word where the browser laid it out, so the PNG wraps exactly like the preview. */
function drawWords(ctx: CanvasRenderingContext2D, hero: HTMLElement, span: HTMLElement) {
  const node = span.firstChild
  if (!node) return
  const h = hero.getBoundingClientRect()
  const k = h.width / hero.offsetWidth || 1
  const cs = getComputedStyle(span)
  ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
  ctx.fillStyle = cs.color
  ctx.textBaseline = 'middle'
  const range = document.createRange()
  for (const m of (node.textContent ?? '').matchAll(/\S+/g)) {
    range.setStart(node, m.index)
    range.setEnd(node, m.index + m[0].length)
    const r = range.getBoundingClientRect()
    ctx.fillText(m[0], (r.left - h.left) / k, (r.top + r.height / 2 - h.top) / k)
  }
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="code">
      <div className="code-head">
        <h2>{title}</h2>
        <button
          type="button"
          onClick={() => void navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })}
        >
          {copied ? 'Copied' : `Copy ${title}`}
        </button>
      </div>
      <pre><code>{code}</code></pre>
    </div>
  )
}
