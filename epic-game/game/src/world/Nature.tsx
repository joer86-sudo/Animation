import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CylinderCollider, RigidBody } from '@react-three/rapier'
import { Color, DoubleSide, Group, InstancedMesh, Matrix4, Object3D, Quaternion, Vector3 } from 'three'
import { rng } from '../characters/parts'

// A lush valley: instanced trees, flowers, grass and bushes, a pond and
// butterflies. Everything is seeded so the layout is the same every visit.

export const POND = { x: 13, z: -8, r: 4.2 }
const HOUSES: [number, number][] = [
  [-6, 2],
  [7.5, -1],
  [-5, 10],
  [6, 9],
]

/** true where nothing tall should grow: the road, ridge, village and pond. */
function blocked(x: number, z: number, margin = 0) {
  if (Math.abs(x) < 4.5 + margin && z > -50 && z < 16) return true // road + ramp
  if (Math.abs(x) < 10 + margin && z < -35 && z > -49) return true // ridge
  if (Math.hypot(x - POND.x, z - POND.z) < POND.r + 1.5 + margin) return true
  if (HOUSES.some(([hx, hz]) => Math.hypot(x - hx, z - hz) < 3.6 + margin)) return true
  if (Math.hypot(x + 2.8, z + 3) < 2 + margin || Math.hypot(x - 4.6, z + 5.5) < 2.4 + margin || Math.hypot(x - 2.5, z) < 2 + margin) return true
  return false
}

type TreeKind = 'oak' | 'blossom' | 'pine' | 'birch'
type Tree = { kind: TreeKind; x: number; z: number; s: number; rot: number }

function useTrees() {
  return useMemo(() => {
    const rand = rng(77)
    const trees: Tree[] = []
    let tries = 0
    while (trees.length < 240 && tries++ < 8000) {
      const x = (rand() - 0.5) * 120
      const z = (rand() - 0.5) * 120
      if (blocked(x, z, 1)) continue
      if (trees.some((t) => Math.hypot(t.x - x, t.z - z) < 2.6)) continue
      const near = Math.hypot(x, z + 15) < 30
      const r = rand()
      const kind: TreeKind = r < 0.12 ? 'blossom' : r < 0.22 ? 'birch' : r < (near ? 0.4 : 0.55) ? 'pine' : 'oak'
      trees.push({ kind, x, z, s: 0.8 + rand() * 0.6, rot: rand() * Math.PI * 2 })
    }
    return trees
  }, [])
}

function useInstances(ref: React.RefObject<InstancedMesh | null>, items: { m: Matrix4; c?: Color }[]) {
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    items.forEach((it, i) => {
      mesh.setMatrixAt(i, it.m)
      if (it.c) mesh.setColorAt(i, it.c)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [ref, items])
}

const m4 = (x: number, y: number, z: number, sx: number, sy: number, sz: number, ry = 0, rx = 0, rz = 0) => {
  const o = new Object3D()
  o.position.set(x, y, z)
  o.scale.set(sx, sy, sz)
  o.rotation.set(rx, ry, rz)
  o.updateMatrix()
  return o.matrix.clone()
}

export function Nature() {
  const trees = useTrees()
  const rand = useMemo(() => rng(5), [])

  const parts = useMemo(() => {
    const trunks: { m: Matrix4; c: Color }[] = []
    const blobs: { m: Matrix4; c: Color }[] = []
    const cones: { m: Matrix4; c: Color }[] = []
    const greens = ['#4f9a3c', '#62ad45', '#3f8a35', '#78b84a'].map((c) => new Color(c))
    const pinks = ['#f4a6c8', '#f7bcd5', '#ec8db6'].map((c) => new Color(c))
    const birchLeaf = ['#a9cf55', '#c4dc6a'].map((c) => new Color(c))
    for (const t of trees) {
      const s = t.s
      const pick = (arr: Color[]) => arr[Math.floor(rand() * arr.length)]
      if (t.kind === 'pine') {
        trunks.push({ m: m4(t.x, 0.7 * s, t.z, 0.22 * s, 1.4 * s, 0.22 * s), c: new Color('#5a3b24') })
        for (let k = 0; k < 3; k++) {
          cones.push({ m: m4(t.x, (1.6 + k * 1.1) * s, t.z, (1.7 - k * 0.42) * s, 1.8 * s, (1.7 - k * 0.42) * s, t.rot + k), c: new Color('#2f7a45').offsetHSL(0, 0, (rand() - 0.5) * 0.06) })
        }
      } else {
        const birch = t.kind === 'birch'
        trunks.push({ m: m4(t.x, 1.1 * s, t.z, (birch ? 0.16 : 0.26) * s, 2.2 * s, (birch ? 0.16 : 0.26) * s), c: new Color(birch ? '#e9e4d6' : '#6b4a2f') })
        const n = birch ? 3 : 4
        for (let k = 0; k < n; k++) {
          const a = t.rot + (k / n) * Math.PI * 2
          const r = k === 0 ? 0 : 0.7 * s
          const c = t.kind === 'blossom' ? pick(pinks) : birch ? pick(birchLeaf) : pick(greens)
          const size = (k === 0 ? 1.5 : 1.15) * s * (birch ? 0.8 : 1)
          blobs.push({ m: m4(t.x + Math.cos(a) * r, (2.7 + (k === 0 ? 0.5 : 0)) * s, t.z + Math.sin(a) * r, size, size * 0.9, size, a), c })
        }
      }
    }
    return { trunks, blobs, cones }
  }, [trees, rand])

  const flowers = useMemo(() => {
    const r = rng(11)
    const out: { m: Matrix4; c: Color }[] = []
    const stems: { m: Matrix4 }[] = []
    const colors = ['#ff5c8a', '#ffd23f', '#ffffff', '#b38cff', '#ff8a3d', '#ff4f6d', '#7fd3ff'].map((c) => new Color(c))
    const patches = Array.from({ length: 34 }, () => [(r() - 0.5) * 90, (r() - 0.5) * 90 - 10] as const)
    patches.push([8, 4], [-9, -6], [5, -14], [-7, -18], [9, -26], [-10, -30])
    for (const [px, pz] of patches) {
      const c = colors[Math.floor(r() * colors.length)]
      const c2 = colors[Math.floor(r() * colors.length)]
      for (let i = 0; i < 45; i++) {
        const x = px + (r() + r() + r() - 1.5) * 3
        const z = pz + (r() + r() + r() - 1.5) * 3
        if (Math.abs(x) < 2.2 && z > -36 && z < 14) continue
        if (Math.hypot(x - POND.x, z - POND.z) < POND.r + 0.3) continue
        const h = 0.18 + r() * 0.18
        out.push({ m: m4(x, h, z, 1, 0.55, 1, r() * 6), c: r() > 0.3 ? c : c2 })
        stems.push({ m: m4(x, h / 2, z, 1, h, 1) })
      }
    }
    return { heads: out, stems }
  }, [])

  const grass = useMemo(() => {
    const r = rng(23)
    const out: { m: Matrix4; c: Color }[] = []
    const base = new Color('#5f9e3a')
    for (let i = 0; i < 3200; i++) {
      const x = (r() - 0.5) * 110
      const z = (r() - 0.5) * 110 - 8
      if (Math.abs(x) < 1.8 && z > -36 && z < 14) continue
      if (Math.hypot(x - POND.x, z - POND.z) < POND.r) continue
      const s = 0.6 + r() * 0.8
      out.push({ m: m4(x, 0.15 * s, z, s, s, s, r() * 6, (r() - 0.5) * 0.3, (r() - 0.5) * 0.3), c: base.clone().offsetHSL((r() - 0.5) * 0.04, 0, (r() - 0.5) * 0.12) })
    }
    return out
  }, [])

  const bushes = useMemo(() => {
    const r = rng(31)
    const out: { m: Matrix4; c: Color }[] = []
    let tries = 0
    while (out.length < 90 && tries++ < 3000) {
      const x = (r() - 0.5) * 100
      const z = (r() - 0.5) * 100 - 10
      if (blocked(x, z, -1.5)) continue
      const s = 0.5 + r() * 0.6
      out.push({ m: m4(x, 0.35 * s, z, s * 1.3, s, s * 1.2, r() * 6), c: new Color(r() > 0.85 ? '#d86a8f' : '#3f8a3a').offsetHSL(0, 0, (r() - 0.5) * 0.1) })
    }
    return out
  }, [])

  const refs = {
    trunks: useRef<InstancedMesh>(null),
    blobs: useRef<InstancedMesh>(null),
    cones: useRef<InstancedMesh>(null),
    heads: useRef<InstancedMesh>(null),
    stems: useRef<InstancedMesh>(null),
    grass: useRef<InstancedMesh>(null),
    bushes: useRef<InstancedMesh>(null),
  }
  useInstances(refs.trunks, parts.trunks)
  useInstances(refs.blobs, parts.blobs)
  useInstances(refs.cones, parts.cones)
  useInstances(refs.heads, flowers.heads)
  useInstances(refs.stems, flowers.stems)
  useInstances(refs.grass, grass)
  useInstances(refs.bushes, bushes)

  // trunk colliders for trees near where you can walk
  const colliders = trees.filter((t) => Math.hypot(t.x, t.z + 15) < 45)

  return (
    <>
      <instancedMesh ref={refs.trunks} args={[undefined, undefined, parts.trunks.length]} castShadow>
        <cylinderGeometry args={[0.7, 1, 1, 7]} />
        <meshStandardMaterial roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={refs.blobs} args={[undefined, undefined, parts.blobs.length]} castShadow receiveShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial roughness={0.85} flatShading />
      </instancedMesh>
      <instancedMesh ref={refs.cones} args={[undefined, undefined, parts.cones.length]} castShadow>
        <coneGeometry args={[1, 1, 8]} />
        <meshStandardMaterial roughness={0.85} flatShading />
      </instancedMesh>
      <instancedMesh ref={refs.stems} args={[undefined, undefined, flowers.stems.length]}>
        <cylinderGeometry args={[0.012, 0.012, 1, 4]} />
        <meshStandardMaterial color="#4c8a35" />
      </instancedMesh>
      <instancedMesh ref={refs.heads} args={[undefined, undefined, flowers.heads.length]}>
        <icosahedronGeometry args={[0.07, 0]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={refs.grass} args={[undefined, undefined, grass.length]} receiveShadow>
        <coneGeometry args={[0.07, 0.4, 3]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
      <instancedMesh ref={refs.bushes} args={[undefined, undefined, bushes.length]} castShadow>
        <icosahedronGeometry args={[0.8, 1]} />
        <meshStandardMaterial roughness={0.9} flatShading />
      </instancedMesh>

      <RigidBody type="fixed" colliders={false}>
        {colliders.map((t, i) => (
          <CylinderCollider key={i} args={[1.5, (t.kind === 'birch' ? 0.18 : 0.3) * t.s]} position={[t.x, 1.5, t.z]} />
        ))}
      </RigidBody>

      <Pond />
      <Butterflies />
    </>
  )
}

function Pond() {
  const pads = useMemo(() => {
    const r = rng(9)
    return Array.from({ length: 9 }, () => {
      const a = r() * Math.PI * 2
      const d = Math.sqrt(r()) * (POND.r - 0.8)
      return { x: Math.cos(a) * d, z: Math.sin(a) * d, s: 0.25 + r() * 0.2, rot: r() * 6, bloom: r() > 0.5 }
    })
  }, [])
  return (
    <group position={[POND.x, 0, POND.z]}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.03} receiveShadow>
        <circleGeometry args={[POND.r, 48]} />
        <meshStandardMaterial color="#4aa3c9" roughness={0.08} metalness={0.15} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.02}>
        <ringGeometry args={[POND.r - 0.05, POND.r + 0.5, 48]} />
        <meshStandardMaterial color="#b9a77a" roughness={1} />
      </mesh>
      {pads.map((p, i) => (
        <group key={i} position={[p.x, 0.045, p.z]} rotation-y={p.rot}>
          <mesh rotation-x={-Math.PI / 2}>
            <circleGeometry args={[p.s, 16, 0.3, Math.PI * 2 - 0.4]} />
            <meshStandardMaterial color="#4c9a3d" side={DoubleSide} />
          </mesh>
          {p.bloom && (
            <mesh position-y={0.05}>
              <icosahedronGeometry args={[0.08, 0]} />
              <meshStandardMaterial color="#ffd0e4" emissive="#ff9ccc" emissiveIntensity={0.3} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

function Butterflies() {
  const group = useRef<Group>(null)
  const flies = useMemo(() => {
    const r = rng(41)
    const colors = ['#ffb347', '#ff6fa8', '#8fd3ff', '#fff176', '#c79bff']
    return Array.from({ length: 16 }, (_, i) => ({
      cx: (r() - 0.5) * 40,
      cz: (r() - 0.5) * 40 - 8,
      rad: 1.5 + r() * 3,
      speed: 0.3 + r() * 0.4,
      phase: r() * 10,
      color: colors[i % colors.length],
    }))
  }, [])
  const q = useMemo(() => new Quaternion(), [])
  const v = useMemo(() => new Vector3(), [])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    group.current?.children.forEach((b, i) => {
      const f = flies[i]
      const a = t * f.speed + f.phase
      b.position.set(f.cx + Math.cos(a) * f.rad, 0.8 + Math.sin(t * 2 + f.phase) * 0.35, f.cz + Math.sin(a * 1.3) * f.rad)
      v.set(-Math.sin(a), 0, Math.cos(a * 1.3) * 1.3)
      b.rotation.y = Math.atan2(v.x, v.z)
      const flap = Math.sin(t * 22 + f.phase) * 0.9
      b.children[0].rotation.z = flap
      b.children[1].rotation.z = -flap
    })
    void q
  })
  return (
    <group ref={group}>
      {flies.map((f, i) => (
        <group key={i}>
          {[1, -1].map((s) => (
            <group key={s}>
              <mesh position-x={s * 0.06} rotation-x={-Math.PI / 2}>
                <circleGeometry args={[0.07, 8]} />
                <meshStandardMaterial color={f.color} side={DoubleSide} emissive={f.color} emissiveIntensity={0.25} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  )
}
