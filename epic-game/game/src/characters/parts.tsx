import { useMemo } from 'react'
import { CanvasTexture, LatheGeometry, Material, RepeatWrapping, SRGBColorSpace, Vector2 } from 'three'

// Shared building blocks for the hand-built characters.

/** Round body section from (radius, height) pairs, bottom to top. Front (+Z) is u = 0. */
export function useLathe(profile: [number, number][], segments = 24) {
  return useMemo(() => new LatheGeometry(profile.map(([r, y]) => new Vector2(r, y)), segments), [profile, segments])
}

/**
 * A hand hanging down from the wrist: palm faces the body, back of the hand faces out.
 * `side` is +1 for the character's left hand (+X), -1 for the right.
 */
export function Hand({
  side,
  skin,
  curl = 0.35,
  backDecal,
  ring,
}: {
  side: 1 | -1
  skin: Material
  curl?: number
  backDecal?: Material
  ring?: Material
}) {
  const fingers = [
    { z: 0.026, len: 0.04 }, // index (front)
    { z: 0.009, len: 0.046 },
    { z: -0.008, len: 0.043 },
    { z: -0.024, len: 0.034 }, // pinky
  ]
  return (
    <group>
      {/* palm */}
      <mesh material={skin} position-y={-0.035} scale={[1, 1, 1]}>
        <boxGeometry args={[0.028, 0.072, 0.07]} />
      </mesh>
      <mesh material={skin} position={[0, -0.003, 0]} scale={[0.6, 0.45, 1]}>
        <sphereGeometry args={[0.035, 12, 8]} />
      </mesh>
      {backDecal && (
        <mesh material={backDecal} position={[side * 0.0145, -0.036, 0]} rotation-y={side * (Math.PI / 2)}>
          <planeGeometry args={[0.062, 0.062]} />
        </mesh>
      )}
      {fingers.map((f, i) => (
        <group key={i} position={[0, -0.07, f.z]} rotation-z={-side * curl * 0.6}>
          <mesh material={skin} position-y={-f.len * 0.25}>
            <capsuleGeometry args={[0.0085, f.len * 0.5, 4, 8]} />
          </mesh>
          <group position-y={-f.len * 0.55} rotation-z={-side * curl}>
            <mesh material={skin} position-y={-f.len * 0.22}>
              <capsuleGeometry args={[0.0078, f.len * 0.42, 4, 8]} />
            </mesh>
          </group>
          {ring && i === 2 && (
            <mesh material={ring} position-y={-f.len * 0.3} rotation-z={Math.PI / 2}>
              <torusGeometry args={[0.011, 0.0028, 6, 12]} />
            </mesh>
          )}
        </group>
      ))}
      {/* thumb, angled forward and in */}
      <group position={[-side * 0.008, -0.025, 0.033]} rotation={[0.5, 0, -side * 0.45]}>
        <mesh material={skin} position-y={-0.018}>
          <capsuleGeometry args={[0.01, 0.03, 4, 8]} />
        </mesh>
      </group>
    </group>
  )
}

// ---- canvas helpers ------------------------------------------------------

export function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

export function canvasTexture(c: HTMLCanvasElement, repeat?: [number, number]) {
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 4
  if (repeat) {
    t.wrapS = t.wrapT = RepeatWrapping
    t.repeat.set(...repeat)
  }
  return t
}

/** Seeded RNG so procedural details are identical on every load. */
export function rng(seed: number) {
  let s = seed % 2147483647 || 1
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

/** Base colour with woven grain and optional dusty smudges. */
export function fabricTexture(base: string, opts: { grain?: number; dust?: string; dustAmount?: number; seed?: number; size?: number } = {}) {
  const size = opts.size ?? 256
  const [c, ctx] = makeCanvas(size, size)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)
  const rand = rng(opts.seed ?? 5)
  const grain = opts.grain ?? 0.06
  // twill lines
  for (let i = -size; i < size * 2; i += 3) {
    ctx.strokeStyle = `rgba(0,0,0,${grain * (0.5 + rand())})`
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + size * 0.5, size)
    ctx.stroke()
  }
  // speckle
  for (let i = 0; i < size * 6; i++) {
    ctx.fillStyle = rand() > 0.5 ? `rgba(255,255,255,${grain})` : `rgba(0,0,0,${grain})`
    ctx.fillRect(rand() * size, rand() * size, 1, 1)
  }
  if (opts.dust) {
    for (let i = 0; i < (opts.dustAmount ?? 14); i++) {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
      g.addColorStop(0, opts.dust)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.save()
      ctx.translate(rand() * size, rand() * size)
      ctx.scale(8 + rand() * 26, 6 + rand() * 18)
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(0, 0, 1, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }
  return c
}

/** Skin with fine body hair, for forearms. */
export function hairySkin(ctx: CanvasRenderingContext2D, w: number, h: number, skin: string, hair: string, density = 900, seed = 9) {
  ctx.fillStyle = skin
  ctx.fillRect(0, 0, w, h)
  const rand = rng(seed)
  ctx.strokeStyle = hair
  ctx.lineWidth = 1
  for (let i = 0; i < density; i++) {
    const x = rand() * w
    const y = rand() * h
    ctx.globalAlpha = 0.15 + rand() * 0.3
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + (rand() - 0.5) * 3, y + 3 + rand() * 4)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}
