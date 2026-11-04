import { canvasTexture, makeCanvas, rng } from '../parts'

export const KIAI_SKIN = '#cf9a6c'
export const KIAI = {
  skin: KIAI_SKIN,
  hairDeep: '#1f37b8',
  hair: '#2f52e6',
  hairLight: '#5a86ff',
  lime: '#c9df7c',
  teal: '#2a8c7e',
  rose: '#e2487f',
  roseDark: '#b02a5e',
  leaf: '#3f8f4a',
  gold: '#e3b04b',
  sandal: '#e2489a',
  keytar: '#8b45d8',
  keytarLight: '#c9a2f5',
  lips: '#c75a6a',
}

// Midriff tattoo text and the circular collarbone seal.
export const KIAI_MIDRIFF_TEXT = 'louder, please'
export const KIAI_SEAL_TEXT = 'CERTIFIED TROUBLE ✦ NO REFUNDS ✦ '

function rose(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  // leaves
  ctx.fillStyle = KIAI.leaf
  for (const a of [-0.9, 2.3]) {
    ctx.save()
    ctx.translate(x + Math.cos(a) * r * 1.2, y + Math.sin(a) * r * 1.2)
    ctx.rotate(a)
    ctx.beginPath()
    ctx.ellipse(0, 0, r * 0.9, r * 0.42, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  // petals: concentric swirls
  ctx.fillStyle = KIAI.rose
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = KIAI.roseDark
  ctx.lineWidth = Math.max(1.5, r * 0.12)
  ctx.beginPath()
  for (let t = 0; t < Math.PI * 5; t += 0.15) {
    const rr = (r * 0.9 * t) / (Math.PI * 5)
    ctx.lineTo(x + Math.cos(t) * rr, y + Math.sin(t) * rr)
  }
  ctx.stroke()
}

function vine(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, rand: () => number) {
  ctx.strokeStyle = '#2f7d55'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.bezierCurveTo(x + len * 0.3, y - len * 0.4, x + len * 0.7, y + len * 0.3, x + len, y - len * 0.1)
  ctx.stroke()
  // curl at the end
  ctx.beginPath()
  ctx.arc(x + len + 6, y - len * 0.1 - 2, 6, Math.PI, Math.PI * 2.6)
  ctx.stroke()
  ctx.fillStyle = KIAI.leaf
  for (let i = 0; i < 3; i++) {
    const t = 0.25 + i * 0.25
    ctx.save()
    ctx.translate(x + len * t, y - len * 0.05 + (rand() - 0.5) * 8)
    ctx.rotate(rand() * 3)
    ctx.beginPath()
    ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

/** Lime fabric with pink roses and curling vines; optional teal trim bands top and bottom. */
export function roseFabric(opts: { trimTop?: number; trimBottom?: number; seed?: number; roses?: number; w?: number; h?: number } = {}) {
  const W = opts.w ?? 512
  const H = opts.h ?? 256
  const [c, ctx] = makeCanvas(W, H)
  const rand = rng(opts.seed ?? 3)
  ctx.fillStyle = KIAI.lime
  ctx.fillRect(0, 0, W, H)
  // soft fabric shading
  for (let i = 0; i < 2000; i++) {
    ctx.fillStyle = `rgba(0,0,0,${rand() * 0.04})`
    ctx.fillRect(rand() * W, rand() * H, 2, 2)
  }
  const top = opts.trimTop ?? 0
  const bottom = opts.trimBottom ?? 0
  const count = opts.roses ?? 6
  for (let i = 0; i < count; i++) {
    const x = ((i + 0.5) / count) * W + (rand() - 0.5) * 30
    const y = top + 20 + rand() * (H - top - bottom - 40)
    vine(ctx, x - 40, y + 18, 70 + rand() * 30, rand)
    rose(ctx, x, y, 16 + rand() * 10)
  }
  ctx.fillStyle = KIAI.teal
  if (top) ctx.fillRect(0, 0, W, top)
  if (bottom) ctx.fillRect(0, H - bottom, W, bottom)
  return canvasTexture(c)
}

/**
 * Face paint on the head sphere: SphereGeometry maps the front (+Z) to u = 0.25,
 * and theta (from the top) to canvas y. Blush, the bindi and soft shading.
 */
export function faceTexture() {
  const W = 1024
  const H = 512
  const [c, ctx] = makeCanvas(W, H)
  ctx.fillStyle = KIAI_SKIN
  ctx.fillRect(0, 0, W, H)
  const fx = W * 0.25 // front of face
  const at = (dPhi: number, theta: number): [number, number] => [fx + (dPhi / (Math.PI * 2)) * W, (theta / Math.PI) * H]
  const blob = (x: number, y: number, rx: number, ry: number, color: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, rx)
    g.addColorStop(0, color)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.save()
    ctx.scale(1, ry / rx)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, (y * rx) / ry, rx, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  // cheek blush
  for (const s of [-1, 1]) {
    const [x, y] = at(s * 0.42, Math.PI * 0.6)
    blob(x, y, 46, 30, 'rgba(232,110,120,0.45)')
  }
  // eye sockets: a touch of warm shadow / liner
  for (const s of [-1, 1]) {
    const [x, y] = at(s * 0.36, Math.PI * 0.47)
    blob(x, y, 36, 20, 'rgba(120,60,50,0.18)')
  }
  // bindi
  const [bx, by] = at(0, Math.PI * 0.335)
  ctx.fillStyle = '#c2185b'
  ctx.beginPath()
  ctx.arc(bx, by, 7, 0, Math.PI * 2)
  ctx.fill()
  return canvasTexture(c)
}

export function irisTexture() {
  const [c, ctx] = makeCanvas(128, 128)
  const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 64)
  g.addColorStop(0, '#120a06')
  g.addColorStop(0.32, '#120a06')
  g.addColorStop(0.36, '#6b3d1f')
  g.addColorStop(0.8, '#9c6233')
  g.addColorStop(1, '#3a200f')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  // fibres
  ctx.strokeStyle = 'rgba(210,150,90,0.35)'
  for (let a = 0; a < Math.PI * 2; a += 0.12) {
    ctx.beginPath()
    ctx.moveTo(64 + Math.cos(a) * 22, 64 + Math.sin(a) * 22)
    ctx.lineTo(64 + Math.cos(a) * 58, 64 + Math.sin(a) * 58)
    ctx.stroke()
  }
  return canvasTexture(c)
}

/** "louder, please" in a flowing script, transparent background. */
export function midriffTattoo() {
  const [c, ctx] = makeCanvas(1024, 160)
  ctx.fillStyle = 'rgba(32,22,30,0.85)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = 'italic 74px "Brush Script MT", "Segoe Script", "Snell Roundhand", cursive'
  ctx.fillText(KIAI_MIDRIFF_TEXT, 512, 80)
  // tiny flourish stars
  ctx.font = '28px serif'
  ctx.fillText('✦', 512 - 300, 60)
  ctx.fillText('✦', 512 + 300, 100)
  return canvasTexture(c)
}

/** Circular seal for the right collarbone: ring text and a winking face. */
export function sealTattoo() {
  const S = 256
  const [c, ctx] = makeCanvas(S, S)
  const ink = 'rgba(32,22,30,0.88)'
  ctx.strokeStyle = ink
  ctx.fillStyle = ink
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(S / 2, S / 2, 118, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(S / 2, S / 2, 78, 0, Math.PI * 2)
  ctx.stroke()
  // ring text
  ctx.font = 'bold 26px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const text = KIAI_SEAL_TEXT
  const step = (Math.PI * 2) / text.length
  for (let i = 0; i < text.length; i++) {
    const a = -Math.PI / 2 + i * step
    ctx.save()
    ctx.translate(S / 2 + Math.cos(a) * 98, S / 2 + Math.sin(a) * 98)
    ctx.rotate(a + Math.PI / 2)
    ctx.fillText(text[i], 0, 0)
    ctx.restore()
  }
  // winking face
  const cx = S / 2
  const cy = S / 2
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.arc(cx - 22, cy - 14, 7, 0, Math.PI * 2) // open eye
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx + 12, cy - 14)
  ctx.lineTo(cx + 34, cy - 14) // wink
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx, cy + 6, 30, 0.15 * Math.PI, 0.85 * Math.PI) // grin
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx + 18, cy + 30)
  ctx.quadraticCurveTo(cx + 24, cy + 46, cx + 12, cy + 44) // tongue out
  ctx.stroke()
  return canvasTexture(c)
}
