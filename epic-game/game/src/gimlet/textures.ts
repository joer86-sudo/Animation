import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

// All of Gimlet's surface detail is painted procedurally onto canvases, so the
// character needs no external image files. Tweak colours here to restyle him.

export const SKIN = '#c98a5e'

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

function toTexture(c: HTMLCanvasElement) {
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 4
  return t
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// Tie-dye spiral tank top. The front of the torso maps to u = 0.5.
export function tieDyeTexture() {
  const W = 512
  const H = 256
  const [c, ctx] = canvas(W, H)
  const img = ctx.createImageData(W, H)
  const purple = hexToRgb('#9b6cb5')
  const lime = hexToRgb('#d8d877')
  const olive = hexToRgb('#a7ad5e')
  const lilac = hexToRgb('#c39ad0')
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // spiral centred on the front, a little below the chest
      const dx = (x - W * 0.5) / (W * 0.25)
      const dy = (y - H * 0.55) / (H * 0.5)
      const r = Math.hypot(dx, dy)
      const a = Math.atan2(dy, dx)
      const noise = Math.sin(x * 0.11 + y * 0.07) * 0.25 + Math.sin(x * 0.031 - y * 0.05) * 0.35
      const v = Math.sin(a * 2 + r * 7 + noise)
      const w = Math.sin(a * 2 + r * 7 + noise + 1.7)
      const mixAB = (v + 1) / 2
      const col = [0, 1, 2].map((i) => {
        const base = purple[i] * mixAB + lime[i] * (1 - mixAB)
        const accent = w > 0.7 ? olive[i] : w < -0.8 ? lilac[i] : base
        return base * 0.6 + accent * 0.4
      })
      const k = (y * W + x) * 4
      img.data[k] = col[0]
      img.data[k + 1] = col[1]
      img.data[k + 2] = col[2]
      img.data[k + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)

  // skin showing: scoop neck (front + back) and deep armholes on the sides
  ctx.fillStyle = SKIN
  const ellipse = (cx: number, cy: number, rx: number, ry: number) => {
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ellipse(W * 0.5, 0, 46, 58) // front scoop
  ellipse(0, 0, 40, 30) // back (wraps)
  ellipse(W, 0, 40, 30)
  ellipse(W * 0.25, 0, 62, 120) // armholes
  ellipse(W * 0.75, 0, 62, 120)

  // a few worn holes near the hem
  ctx.fillStyle = 'rgba(60,40,50,0.8)'
  ellipse(W * 0.38, H * 0.88, 6, 4)
  ellipse(W * 0.6, H * 0.8, 4, 3)
  return toTexture(c)
}

export function plaidTexture() {
  const [c, ctx] = canvas(64, 16)
  ctx.fillStyle = '#e9edf5'
  ctx.fillRect(0, 0, 64, 16)
  ctx.fillStyle = 'rgba(48,78,170,0.75)'
  for (let i = 0; i < 64; i += 8) ctx.fillRect(i, 0, 4, 16)
  for (let j = 0; j < 16; j += 8) ctx.fillRect(0, j, 64, 4)
  const t = toTexture(c)
  t.wrapS = RepeatWrapping
  t.repeat.set(4, 1)
  return t
}

// Brand label for Gimlet's bottles.
export function labelTexture() {
  const [c, ctx] = canvas(128, 160)
  ctx.fillStyle = '#efe2bf'
  ctx.fillRect(0, 0, 128, 160)
  ctx.strokeStyle = '#5a3a1e'
  ctx.lineWidth = 6
  ctx.strokeRect(6, 6, 116, 148)
  ctx.fillStyle = '#3a2412'
  ctx.textAlign = 'center'
  ctx.font = 'bold italic 26px Georgia, serif'
  ctx.fillText('Danger &', 64, 44)
  ctx.font = 'bold italic 30px Georgia, serif'
  ctx.fillText('Sons', 64, 74)
  // little mascot medallion
  ctx.fillStyle = '#8a5a32'
  ctx.beginPath()
  ctx.arc(64, 112, 24, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#efe2bf'
  ctx.beginPath()
  ctx.arc(64, 108, 10, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#222'
  ctx.fillRect(54, 104, 20, 4) // sunglasses
  return toTexture(c)
}

// Skin with a generic ink sleeve: swirls, a wing, stars and a ball.
export function tattooTexture() {
  const W = 256
  const H = 256
  const [c, ctx] = canvas(W, H)
  ctx.fillStyle = SKIN
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = 'rgba(40,28,24,0.85)'
  ctx.fillStyle = 'rgba(40,28,24,0.85)'
  ctx.lineCap = 'round'

  // flowing swirls around the arm
  ctx.lineWidth = 5
  for (let i = 0; i < 7; i++) {
    ctx.beginPath()
    const y0 = 20 + i * 34
    ctx.moveTo(0, y0)
    ctx.bezierCurveTo(W * 0.3, y0 - 30, W * 0.6, y0 + 40, W, y0)
    ctx.stroke()
  }
  // wing feathers
  ctx.lineWidth = 3
  for (let f = 0; f < 6; f++) {
    ctx.beginPath()
    ctx.ellipse(W * 0.5 + f * 9, 50 + f * 6, 26 - f * 2, 7, -0.6, 0, Math.PI * 2)
    ctx.stroke()
  }
  // ball on the forearm
  const bx = W * 0.5
  const by = H * 0.8
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(bx, by, 18, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5
    ctx.lineTo(bx + Math.cos(a) * 7, by + Math.sin(a) * 7)
  }
  ctx.closePath()
  ctx.fill()
  // stars
  for (const [sx, sy] of [
    [40, 150],
    [200, 120],
    [90, 220],
  ]) {
    ctx.beginPath()
    for (let k = 0; k < 10; k++) {
      const r = k % 2 ? 4 : 10
      const a = -Math.PI / 2 + (k * Math.PI) / 5
      ctx.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r)
    }
    ctx.closePath()
    ctx.fill()
  }
  return toTexture(c)
}

// Small script-and-feather tattoo on the side of his neck (transparent background).
export function neckTattooTexture() {
  const [c, ctx] = canvas(128, 128)
  ctx.strokeStyle = 'rgba(40,28,24,0.85)'
  ctx.fillStyle = 'rgba(40,28,24,0.85)'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(30, 100)
  ctx.bezierCurveTo(50, 70, 70, 50, 100, 24)
  ctx.stroke()
  for (let i = 0; i < 6; i++) {
    const t = i / 6
    const x = 30 + t * 70
    const y = 100 - t * 76
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x - 14 + i, y - 4)
    ctx.moveTo(x, y)
    ctx.lineTo(x + 4, y + 12 - i)
    ctx.stroke()
  }
  ctx.font = 'italic 18px Georgia, serif'
  ctx.fillText('d&s', 14, 122)
  return toTexture(c)
}
