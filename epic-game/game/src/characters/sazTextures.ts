import { canvasTexture, fabricTexture, hairySkin, makeCanvas, rng } from './parts'

export const SAZ_SKIN = '#a8704a'
const ARM_HAIR = '#2a1a10'
const INK = 'rgba(28,22,30,0.88)'

// The words in his tattoo sleeve. All four letters, all 70s mood.
export const SAZ_TATTOO_WORDS = [
  'FUNK', 'SOUL', 'JAZZ', 'VIBE', 'GLOW', 'FREE', 'ROAM', 'RIFF',
  'BASS', 'HOPE', 'KIND', 'WILD', 'LOVE', 'ECHO', 'DUSK', 'COOL',
  'SWAY', 'DIGS', 'GOLD', 'HUSH',
]
export const SAZ_HAND_WORD = 'KIND'

const FONTS = [
  'bold {s}px Georgia, serif',
  'italic {s}px Georgia, serif',
  'bold {s}px "Courier New", monospace',
  '900 {s}px Impact, "Arial Black", sans-serif',
  'italic bold {s}px "Brush Script MT", cursive',
  '{s}px "Trebuchet MS", sans-serif',
]

/**
 * Forearm sleeve: four-letter words packed as a word cloud, wrapped around
 * the arm (u = around, v = along). Big words on the outside of the forearm.
 */
export function wordCloudTexture() {
  const W = 512
  const H = 512
  const [c, ctx] = makeCanvas(W, H)
  hairySkin(ctx, W, H, SAZ_SKIN, ARM_HAIR, 2200, 21)
  const rand = rng(77)
  const placed: { x: number; y: number; w: number; h: number }[] = []
  const overlaps = (b: { x: number; y: number; w: number; h: number }) =>
    placed.some((p) => b.x < p.x + p.w && b.x + b.w > p.x && b.y < p.y + p.h && b.y + b.h > p.y)

  ctx.fillStyle = INK
  ctx.textBaseline = 'top'
  // biggest first so they claim the visible outer side of the arm
  const words = [...SAZ_TATTOO_WORDS, ...SAZ_TATTOO_WORDS.slice(0, 10)]
  words.forEach((word, i) => {
    const size = Math.round(i < 6 ? 84 - i * 6 : 32 + rand() * 18)
    const vertical = i > 3 && rand() > 0.7
    ctx.font = FONTS[Math.floor(rand() * FONTS.length)].replace('{s}', String(size))
    const tw = ctx.measureText(word).width
    const bw = vertical ? size : tw
    const bh = vertical ? tw : size
    for (let attempt = 0; attempt < 120; attempt++) {
      // favour the outer face of the arm (u around 0.25..0.75 of the strip)
      const x = (i < 6 ? W * 0.18 + rand() * W * 0.5 : rand() * (W - bw))
      const y = H * 0.12 + rand() * (H * 0.76 - bh)
      const box = { x: x - 3, y: y - 3, w: bw + 6, h: bh + 6 }
      if (overlaps(box)) continue
      placed.push(box)
      ctx.save()
      if (vertical) {
        ctx.translate(x + size, y)
        ctx.rotate(Math.PI / 2)
        ctx.fillText(word, 0, 0)
      } else ctx.fillText(word, x, y)
      ctx.restore()
      break
    }
  })
  // a few small stars and dots to fill gaps
  for (let i = 0; i < 26; i++) {
    const x = rand() * W
    const y = H * 0.1 + rand() * H * 0.8
    const box = { x: x - 4, y: y - 4, w: 8, h: 8 }
    if (overlaps(box)) continue
    ctx.beginPath()
    ctx.arc(x, y, 2 + rand() * 2, 0, Math.PI * 2)
    ctx.fill()
  }
  return canvasTexture(c)
}

/** Back-of-hand tattoo: one word, square tile with transparency. */
export function handWordTexture() {
  const [c, ctx] = makeCanvas(128, 128)
  hairySkin(ctx, 128, 128, SAZ_SKIN, ARM_HAIR, 120, 4)
  ctx.fillStyle = INK
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = 'bold italic 40px Georgia, serif'
  ctx.fillText(SAZ_HAND_WORD, 64, 64)
  ctx.font = '14px Georgia, serif'
  ctx.fillText('* * *', 64, 96)
  return canvasTexture(c)
}

export function forearmTexture() {
  const [c, ctx] = makeCanvas(256, 256)
  hairySkin(ctx, 256, 256, SAZ_SKIN, ARM_HAIR, 900, 13)
  return canvasTexture(c)
}

/** Cream shirt: fine weave + soft fold shading. */
export function shirtTexture() {
  const c = fabricTexture('#efe7d8', { grain: 0.035, seed: 3 })
  const ctx = c.getContext('2d')!
  for (let i = 0; i < 9; i++) {
    const x = 20 + i * 28
    const g = ctx.createLinearGradient(x - 10, 0, x + 10, 0)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(0.5, 'rgba(120,100,80,0.07)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(x - 10, 0, 20, 256)
  }
  return canvasTexture(c)
}

export function flaresTexture() {
  return canvasTexture(fabricTexture('#7c2230', { grain: 0.07, seed: 8 }), [2, 2])
}

/** Patch of skin with chest hair for the open collar. */
export function chestTexture() {
  const [c, ctx] = makeCanvas(128, 128)
  hairySkin(ctx, 128, 128, SAZ_SKIN, '#1c120c', 500, 31)
  return canvasTexture(c)
}
