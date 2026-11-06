import assert from 'node:assert/strict'
import { test } from 'node:test'
import { contrastRatio, grade, hexToRgb, luminance, overlayAlpha, suggestOpacity, worstContrast, type Region } from '../src/contrast.ts'
import { checkFile } from '../src/upload.ts'
import { escapeHtml } from '../src/hero.ts'

const near = (a: number, b: number, eps = 0.01) => assert.ok(Math.abs(a - b) < eps, `${a} !≈ ${b}`)
const solid = (rgb: [number, number, number], w = 4, h = 4, top = 0): Region & { data: number[] } => ({
  data: Array.from({ length: w * h }, () => [...rgb, 255]).flat(),
  width: w,
  height: h,
  top,
})
const WHITE = [255, 255, 255] as const
const BLACK = [0, 0, 0] as const

test('luminance and ratio match WCAG reference values', () => {
  near(luminance(...WHITE), 1)
  near(luminance(...BLACK), 0)
  near(contrastRatio(1, 0), 21)
  near(contrastRatio(luminance(...hexToRgb('#777777')), 1), 4.48) // WebAIM: #777 on white = 4.48
  near(contrastRatio(luminance(...hexToRgb('#767676')), 1), 4.54)
})

test('grade thresholds', () => {
  assert.equal(grade(4.5), 'Passes AA')
  assert.equal(grade(3), 'Large text only')
  assert.equal(grade(2.99), 'Fails')
})

test('hexToRgb rejects anything but #rrggbb', () => {
  assert.deepEqual(hexToRgb('#ff8000'), [255, 128, 0])
  for (const bad of ['red', '#fff', '#ff8000;}', 'url(x)']) assert.throws(() => hexToRgb(bad))
})

test('overlay alpha mirrors the CSS gradient', () => {
  const ov = { color: BLACK, opacity: 0.8, from: 'bottom' as const }
  near(overlayAlpha(ov, 1), 0.8)
  near(overlayAlpha(ov, 0), 0)
  near(overlayAlpha({ ...ov, from: 'top' }, 0), 0.8)
  near(overlayAlpha({ ...ov, from: null }, 0.3), 0.8)
})

test('worstContrast composites the overlay', () => {
  const sky = [solid([255, 255, 255])]
  near(worstContrast(sky, 4, WHITE, { color: BLACK, opacity: 0, from: null })!, 1)
  near(worstContrast(sky, 4, WHITE, { color: BLACK, opacity: 1, from: null })!, 21)
  assert.equal(worstContrast([], 4, WHITE, { color: BLACK, opacity: 1, from: null }), null)
})

test('worstContrast reports the bad part, ignoring a few stray pixels', () => {
  // Top 5 rows white, bottom 5 black: white text must be judged on the white half.
  const half = { ...solid([0, 0, 0], 10, 10), data: [...solid([255, 255, 255], 10, 5).data, ...solid([0, 0, 0], 10, 5).data] }
  near(worstContrast([half], 10, WHITE, { color: BLACK, opacity: 0, from: null })!, 1)
})

test('suggestOpacity finds the smallest passing overlay, or null', () => {
  const sky = [[solid([255, 255, 255])]]
  const o = suggestOpacity(sky, 4, WHITE, { color: BLACK, opacity: 0, from: null })!
  assert.ok(o > 0 && o < 1)
  assert.ok(worstContrast(sky[0], 4, WHITE, { color: BLACK, opacity: o, from: null })! >= 4.5)
  assert.ok(worstContrast(sky[0], 4, WHITE, { color: BLACK, opacity: o - 0.05, from: null })! < 4.5)
  assert.equal(suggestOpacity(sky, 4, WHITE, { color: WHITE, opacity: 0, from: null }), null)
})

test('checkFile only allows raster images under the size cap', () => {
  assert.equal(checkFile({ type: 'image/jpeg', size: 1000 }), '')
  assert.notEqual(checkFile({ type: 'image/svg+xml', size: 1000 }), '')
  assert.notEqual(checkFile({ type: 'text/html', size: 1000 }), '')
  assert.notEqual(checkFile({ type: 'image/png', size: 26 * 1024 * 1024 }), '')
})

test('escapeHtml neutralises markup in the exported snippet', () => {
  assert.equal(escapeHtml(`<img src=x onerror="a()">&'`), '&lt;img src=x onerror=&quot;a()&quot;&gt;&amp;&#39;')
})
