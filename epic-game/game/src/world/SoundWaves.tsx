import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, DoubleSide, Group, Mesh, MeshBasicMaterial, PointLight } from 'three'
import { HARMONY_RADIUS, SHRED_HALF_ANGLE, SHRED_RANGE, useGame, type Wave } from '../store'

// Visible sound: Harmony is a soft pink-gold ring with rising notes,
// Shred is a violet shockwave cone.
export function SoundWaves() {
  const waves = useGame((s) => s.waves)
  return (
    <>
      {waves.map((w) => (w.kind === 'harmony' ? <HarmonyRing key={w.id} w={w} /> : <ShredCone key={w.id} w={w} />))}
    </>
  )
}

function useExpire(id: number, ms: number) {
  const clear = useGame((s) => s.clearWave)
  useEffect(() => {
    const t = setTimeout(() => clear(id), ms)
    return () => clearTimeout(t)
  }, [id, ms, clear])
}

const HARMONY_MS = 1400

function HarmonyRing({ w }: { w: Wave }) {
  useExpire(w.id, HARMONY_MS)
  const ring = useRef<Mesh>(null)
  const notes = useRef<Group>(null)
  const light = useRef<PointLight>(null)
  const noteMat = useMemo(() => new MeshBasicMaterial({ color: '#ffd6f0', transparent: true, blending: AdditiveBlending, depthWrite: false }), [])
  useFrame(() => {
    const k = Math.min(1, (performance.now() - w.at) / HARMONY_MS)
    if (ring.current) {
      ring.current.scale.setScalar(0.5 + k * HARMONY_RADIUS)
      ;(ring.current.material as MeshBasicMaterial).opacity = (1 - k) * 0.5
    }
    notes.current?.children.forEach((c, i) => {
      const a = (i / 10) * Math.PI * 2 + k * 2
      const r = 0.6 + k * HARMONY_RADIUS * 0.8
      c.position.set(Math.cos(a) * r, 0.6 + k * 1.6 + Math.sin(k * 8 + i) * 0.15, Math.sin(a) * r)
    })
    noteMat.opacity = 1 - k
    if (light.current) light.current.intensity = (1 - k) * 12
  })
  return (
    <group position={[w.pos[0], w.pos[1] - 0.8, w.pos[2]]}>
      <mesh ref={ring} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.9, 1, 64]} />
        <meshBasicMaterial color="#ffb3dc" transparent opacity={0.5} side={DoubleSide} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
      <group ref={notes}>
        {Array.from({ length: 10 }, (_, i) => (
          <group key={i}>
            <mesh material={noteMat} position-x={0.05}>
              <boxGeometry args={[0.02, 0.22, 0.02]} />
            </mesh>
            <mesh material={noteMat} position-y={-0.11} scale={[1.3, 1, 1]}>
              <sphereGeometry args={[0.06, 10, 8]} />
            </mesh>
          </group>
        ))}
      </group>
      <pointLight ref={light} position-y={1} color="#ffb3dc" intensity={12} distance={10} decay={2} />
    </group>
  )
}

const SHRED_MS = 450

function ShredCone({ w }: { w: Wave }) {
  useExpire(w.id, SHRED_MS)
  const cone = useRef<Mesh>(null)
  const light = useRef<PointLight>(null)
  const yaw = Math.atan2(w.dir[0], w.dir[2])
  useFrame(() => {
    const k = Math.min(1, (performance.now() - w.at) / SHRED_MS)
    if (cone.current) {
      const len = 0.5 + k * SHRED_RANGE
      cone.current.scale.set(len, 1, len)
      ;(cone.current.material as MeshBasicMaterial).opacity = (1 - k) * 0.55
    }
    if (light.current) light.current.intensity = (1 - k) * 30
  })
  return (
    <group position={[w.pos[0], w.pos[1] - 0.2, w.pos[2]]} rotation-y={yaw}>
      {/* a flat wedge of shockwave: a ring sector facing forward */}
      <mesh ref={cone} rotation-x={-Math.PI / 2} rotation-z={Math.PI / 2}>
        <ringGeometry args={[0.6, 1, 32, 1, -SHRED_HALF_ANGLE, SHRED_HALF_ANGLE * 2]} />
        <meshBasicMaterial color="#b46bff" transparent opacity={0.55} side={DoubleSide} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
      <pointLight ref={light} position={[0, 0.5, 1.5]} color="#b46bff" intensity={30} distance={10} decay={2} />
    </group>
  )
}
