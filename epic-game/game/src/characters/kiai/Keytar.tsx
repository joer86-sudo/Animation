import { forwardRef, useMemo, useRef, useImperativeHandle } from 'react'
import { ExtrudeGeometry, Group, Mesh, MeshStandardMaterial, Shape, Vector3 } from 'three'
import { KIAI } from './textures'

// Kiai's keytar. Local frame: length along +X (tail at -X, pointed head at +X),
// keys face +Z, black keys toward +Y.

export const KEY_COUNT = 37 // three octaves + top C, starting on C
const WHITE_PATTERN = [0, 2, 4, 5, 7, 9, 11] // semitones of white keys in an octave
const KEYS_X0 = -0.255
const KEYS_X1 = 0.275
const WHITE_COUNT = 22
const WHITE_W = (KEYS_X1 - KEYS_X0) / WHITE_COUNT
const FACE_Z = 0.0255

export type KeyInfo = { index: number; black: boolean; x: number }
export const KEYS: KeyInfo[] = (() => {
  const out: KeyInfo[] = []
  let white = 0
  for (let i = 0; i < KEY_COUNT; i++) {
    const s = i % 12
    const isWhite = WHITE_PATTERN.includes(s)
    if (isWhite) {
      out.push({ index: i, black: false, x: KEYS_X0 + (white + 0.5) * WHITE_W })
      white++
    } else {
      out.push({ index: i, black: true, x: KEYS_X0 + white * WHITE_W })
    }
  }
  return out
})()

/** Where a fingertip should press key `i`, in keytar-local space. */
export function keyPoint(i: number, out = new Vector3()) {
  const k = KEYS[Math.max(0, Math.min(KEY_COUNT - 1, i))]
  return out.set(k.x, k.black ? 0.028 : -0.012, FACE_Z + 0.02)
}

// strap pins and the neck grip, keytar-local
export const TAIL_PIN = new Vector3(-0.42, -0.04, -0.02)
export const NECK_PIN = new Vector3(0.47, 0.06, -0.02)
export const NECK_GRIP = new Vector3(0.4, 0.05, 0.0)

export type KeytarHandle = { press: (indices: number[]) => void }

export const Keytar = forwardRef<KeytarHandle>(function Keytar(_, ref) {
  const keys = useRef<(Mesh | null)[]>([])
  const pressed = useRef<Set<number>>(new Set())
  useImperativeHandle(ref, () => ({
    press(indices) {
      const next = new Set(indices)
      KEYS.forEach((k, i) => {
        const m = keys.current[i]
        if (!m) return
        const down = next.has(i)
        m.position.z = (k.black ? FACE_Z + 0.012 : FACE_Z + 0.006) - (down ? 0.006 : 0)
        m.rotation.x = down ? (k.black ? 0.06 : 0.05) : 0
      })
      pressed.current = next
    },
  }))

  const { bodyGeo, headGeo, mats } = useMemo(() => {
    const body = new Shape()
    body.moveTo(-0.47, -0.08)
    body.lineTo(-0.3, 0.07)
    body.lineTo(0.3, 0.07)
    body.lineTo(0.5, 0.1)
    body.lineTo(0.6, 0.11)
    body.lineTo(0.5, 0.04)
    body.lineTo(0.32, -0.04)
    body.lineTo(-0.3, -0.07)
    body.closePath()
    const head = new Shape()
    head.moveTo(0.46, 0.09)
    head.lineTo(0.66, 0.12)
    head.lineTo(0.5, 0.17)
    head.closePath()
    const hole = new Shape()
    hole.moveTo(0.5, 0.11)
    hole.lineTo(0.6, 0.123)
    hole.lineTo(0.515, 0.148)
    hole.closePath()
    head.holes.push(hole)
    const ex = { depth: 0.04, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2 }
    const bodyGeo = new ExtrudeGeometry(body, ex)
    bodyGeo.translate(0, 0, -0.02)
    const headGeo = new ExtrudeGeometry(head, { ...ex, depth: 0.03 })
    headGeo.translate(0, 0, -0.015)
    return {
      bodyGeo,
      headGeo,
      mats: {
        body: new MeshStandardMaterial({ color: KIAI.keytar, roughness: 0.25, metalness: 0.15 }),
        white: new MeshStandardMaterial({ color: '#f1e8ff', roughness: 0.35 }),
        black: new MeshStandardMaterial({ color: '#5b2a9e', roughness: 0.3 }),
        neon: new MeshStandardMaterial({ color: '#e9d6ff', emissive: '#c79bff', emissiveIntensity: 2.2, toneMapped: false }),
        knob: new MeshStandardMaterial({ color: '#6a2fb5', roughness: 0.3, metalness: 0.4 }),
        pin: new MeshStandardMaterial({ color: '#c8ccd2', metalness: 0.9, roughness: 0.3 }),
      },
    }
  }, [])

  return (
    <group name="keytar">
      <mesh geometry={bodyGeo} material={mats.body} castShadow />
      <mesh geometry={headGeo} material={mats.body} castShadow />
      {/* key bed */}
      <mesh material={mats.black} position={[(KEYS_X0 + KEYS_X1) / 2, 0.0, FACE_Z - 0.002]}>
        <boxGeometry args={[KEYS_X1 - KEYS_X0 + 0.01, 0.112, 0.004]} />
      </mesh>
      {KEYS.map((k, i) => (
        <mesh
          key={i}
          ref={(m) => (keys.current[i] = m)}
          material={k.black ? mats.black : mats.white}
          position={[k.x, k.black ? 0.022 : -0.004, k.black ? FACE_Z + 0.012 : FACE_Z + 0.006]}
        >
          <boxGeometry args={k.black ? [WHITE_W * 0.55, 0.06, 0.012] : [WHITE_W * 0.92, 0.104, 0.01]} />
        </mesh>
      ))}
      {/* neon accent line on the tail, like a circuit trace */}
      <mesh material={mats.neon} position={[-0.38, 0.0, FACE_Z]} rotation-z={0.72}>
        <boxGeometry args={[0.1, 0.006, 0.004]} />
      </mesh>
      <mesh material={mats.neon} position={[-0.325, 0.034, FACE_Z]}>
        <boxGeometry args={[0.05, 0.006, 0.004]} />
      </mesh>
      {/* control buttons */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} material={mats.knob} position={[-0.4 + i * 0.022, -0.045 + i * 0.012, FACE_Z]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.006, 0.006, 0.006, 10]} />
        </mesh>
      ))}
      {/* pitch ribbon on the neck */}
      <mesh material={mats.neon} position={[0.42, 0.075, FACE_Z - 0.006]} rotation-z={0.19}>
        <boxGeometry args={[0.12, 0.012, 0.004]} />
      </mesh>
      {[TAIL_PIN, NECK_PIN].map((p, i) => (
        <mesh key={i} material={mats.pin} position={p} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.008, 0.008, 0.02, 8]} />
        </mesh>
      ))}
    </group>
  )
})

export type { Group }
