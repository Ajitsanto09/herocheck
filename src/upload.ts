// SVG is deliberately excluded: it can carry scripts and external references.
const TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']
const MAX_BYTES = 25 * 1024 * 1024
const MAX_SIDE = 12000

/** Returns an error message, or '' if the file may be decoded. */
export function checkFile(file: { type: string; size: number }): string {
  if (!TYPES.includes(file.type)) return 'Use a PNG, JPEG, WebP, GIF or AVIF image.'
  if (file.size > MAX_BYTES) return 'Image is over 25 MB.'
  return ''
}

/** Decodes the file locally. Nothing is uploaded anywhere. Caller owns (and must revoke) the URL. */
export async function loadImage(file: Blob): Promise<{ url: string; el: HTMLImageElement }> {
  const problem = checkFile(file)
  if (problem) throw new Error(problem)
  const url = URL.createObjectURL(file)
  const el = new Image()
  el.src = url
  try {
    await el.decode()
  } catch {
    URL.revokeObjectURL(url)
    throw new Error("That file isn't a readable image.")
  }
  if (el.naturalWidth > MAX_SIDE || el.naturalHeight > MAX_SIDE) {
    URL.revokeObjectURL(url)
    throw new Error(`Image is larger than ${MAX_SIDE}px on a side.`)
  }
  return { url, el }
}
