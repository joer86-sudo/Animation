import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BallCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { Group, Vector3 } from 'three'
import { enemyPositions, playerState, useGame, type Enemy as EnemyData } from '../store'

const CHASE_RANGE = 16
const SPEED = 2.6
const CONTACT_RANGE = 1.3

export function Enemies() {
  const enemies = useGame((s) => s.enemies)
  return (
    <>
      {enemies.map((e) => (
        <Enemy key={e.id} enemy={e} />
      ))}
    </>
  )
}

function Enemy({ enemy }: { enemy: EnemyData }) {
  const body = useRef<RapierRigidBody>(null)
  const visual = useRef<Group>(null)
  const pos = useRef(new Vector3(...enemy.spawn))
  const toPlayer = useRef(new Vector3())

  useEffect(() => {
    enemyPositions.set(enemy.id, pos.current)
    return () => {
      enemyPositions.delete(enemy.id)
    }
  }, [enemy.id])

  // Knockback when struck.
  useEffect(() => {
    const b = body.current
    if (!b || !enemy.hitAt) return
    const away = pos.current.clone().sub(playerState.position).setY(0).normalize().multiplyScalar(6)
    b.setLinvel({ x: away.x, y: 3, z: away.z }, true)
  }, [enemy.hitAt])

  useFrame((state) => {
    const b = body.current
    if (!b) return
    const t = b.translation()
    pos.current.set(t.x, t.y, t.z)

    const s = useGame.getState()
    const v = b.linvel()
    const stunned = performance.now() - enemy.hitAt < 300
    const dir = toPlayer.current.copy(playerState.position).sub(pos.current).setY(0)
    const dist = dir.length()

    if (!stunned) {
      if (s.dialogue || s.health <= 0 || dist > CHASE_RANGE) {
        b.setLinvel({ x: 0, y: v.y, z: 0 }, true)
      } else if (dist > 0.9) {
        dir.normalize().multiplyScalar(SPEED)
        b.setLinvel({ x: dir.x, y: v.y, z: dir.z }, true)
      }
    }
    if (!s.dialogue && dist < CONTACT_RANGE) s.hurt()

    if (visual.current) {
      visual.current.position.y = Math.sin(state.clock.elapsedTime * 3 + enemy.id) * 0.12
      visual.current.lookAt(playerState.position.x, pos.current.y, playerState.position.z)
      const flash = stunned ? 1.25 : 1
      visual.current.scale.setScalar(flash)
    }
  })

  return (
    <RigidBody ref={body} position={enemy.spawn} colliders={false} lockRotations linearDamping={0.5}>
      <BallCollider args={[0.6]} />
      <group ref={visual}>
        <mesh castShadow>
          <icosahedronGeometry args={[0.6, 1]} />
          <meshStandardMaterial color="#120d18" roughness={1} flatShading />
        </mesh>
        {[-0.18, 0.18].map((x) => (
          <mesh key={x} position={[x, 0.12, 0.52]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color="#ff2a3a" emissive="#ff1030" emissiveIntensity={8} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </RigidBody>
  )
}
