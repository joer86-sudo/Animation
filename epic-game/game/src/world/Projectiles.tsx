import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BallCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { AdditiveBlending, Group, Mesh, MeshBasicMaterial, PointLight } from 'three'
import { useGame, type Projectile, type Splash } from '../store'

// Gimlet's thrown bottles: real physics bodies that shatter on first contact.
export function Projectiles() {
  const projectiles = useGame((s) => s.projectiles)
  const splashes = useGame((s) => s.splashes)
  return (
    <>
      {projectiles.map((p) => (
        <ThrownBottle key={p.id} p={p} />
      ))}
      {splashes.map((s) => (
        <SplashFx key={s.id} s={s} />
      ))}
    </>
  )
}

function ThrownBottle({ p }: { p: Projectile }) {
  const body = useRef<RapierRigidBody>(null)
  const born = useRef(performance.now())

  const burst = () => {
    const t = body.current?.translation()
    useGame.getState().explode(p.id, t ? [t.x, t.y, t.z] : p.pos)
  }

  useFrame(() => {
    if (performance.now() - born.current > 3000) burst()
  })

  return (
    <RigidBody
      ref={body}
      position={p.pos}
      linearVelocity={p.vel}
      angularVelocity={[8, 0, 3]}
      colliders={false}
      ccd
      gravityScale={1}
      onCollisionEnter={({ other }) => {
        if (other.rigidBodyObject?.name === 'player') return
        burst()
      }}
    >
      <BallCollider args={[0.09]} />
      <mesh castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.15, 10]} />
        <meshStandardMaterial color="#2f5c3c" roughness={0.15} metalness={0.2} />
      </mesh>
      <mesh position-y={0.1}>
        <cylinderGeometry args={[0.02, 0.02, 0.06, 8]} />
        <meshStandardMaterial color="#2f5c3c" />
      </mesh>
    </RigidBody>
  )
}

const SPLASH_MS = 550

function SplashFx({ s }: { s: Splash }) {
  const group = useRef<Group>(null)
  const ring = useRef<Mesh>(null)
  const light = useRef<PointLight>(null)
  const clear = useGame((st) => st.clearSplash)

  useEffect(() => {
    const id = setTimeout(() => clear(s.id), SPLASH_MS)
    return () => clearTimeout(id)
  }, [s.id, clear])

  useFrame(() => {
    const k = Math.min(1, (performance.now() - s.at) / SPLASH_MS)
    if (ring.current) {
      ring.current.scale.setScalar(0.3 + k * 2.6)
      ;(ring.current.material as MeshBasicMaterial).opacity = (1 - k) * (1 - k) * 0.35
    }
    if (light.current) light.current.intensity = (1 - k) * 40
    group.current?.children.forEach((c, i) => {
      if (c.userData.shard) {
        const a = (i / 8) * Math.PI * 2
        c.position.set(Math.cos(a) * k * 1.4, Math.sin(k * Math.PI) * 0.7, Math.sin(a) * k * 1.4)
      }
    })
  })

  return (
    <group ref={group} position={s.pos}>
      <mesh ref={ring}>
        <sphereGeometry args={[1, 20, 14]} />
        <meshBasicMaterial color="#8dff4a" transparent opacity={0.35} depthWrite={false} blending={AdditiveBlending} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} userData={{ shard: true }} rotation={[i, i * 2, 0]}>
          <tetrahedronGeometry args={[0.05]} />
          <meshStandardMaterial color="#3f7a50" emissive="#8dff4a" emissiveIntensity={2} toneMapped={false} />
        </mesh>
      ))}
      <pointLight ref={light} color="#8dff4a" intensity={40} distance={8} decay={2} />
    </group>
  )
}
