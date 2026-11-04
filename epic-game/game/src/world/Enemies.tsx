import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BallCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { Group, Mesh, MeshStandardMaterial, Vector3, Color } from 'three'
import { CUDDLE_MS, enemyPositions, isFrenzy, playerState, useGame, type Enemy as EnemyData } from '../store'

const CHASE_RANGE = 16
const SPEED = 2.6
const FRIEND_SPEED = 3.4
const CONTACT_RANGE = 1.3
const CUDDLE_RANGE = 1.15

// Who is cuddling whom, so a hostile one is only hugged by one friend at a time.
const cuddles = new Map<number, { target: number; since: number }>()
export const isBeingCuddled = (id: number) => [...cuddles.values()].some((c) => c.target === id)

export function Enemies() {
  const enemies = useGame((s) => s.enemies)
  useEffect(() => () => cuddles.clear(), [])
  return (
    <>
      {enemies.map((e) => (
        <Enemy key={e.id} enemy={e} />
      ))}
    </>
  )
}

const HOSTILE = { body: new Color('#120d18'), eye: new Color('#ff1030') }
const FRIEND = { body: new Color('#b98bd6'), eye: new Color('#ffd27a') }

function Enemy({ enemy }: { enemy: EnemyData }) {
  const body = useRef<RapierRigidBody>(null)
  const visual = useRef<Group>(null)
  const heart = useRef<Mesh>(null)
  const pos = useRef(new Vector3(...enemy.spawn))
  const toTarget = useRef(new Vector3())
  const warm = useRef(enemy.friendly ? 1 : 0)
  const mats = useMemo(
    () => ({
      body: new MeshStandardMaterial({ color: HOSTILE.body.clone(), roughness: 1, flatShading: true, emissive: '#000000' }),
      eye: new MeshStandardMaterial({ color: HOSTILE.eye.clone(), emissive: HOSTILE.eye.clone(), emissiveIntensity: 8, toneMapped: false }),
    }),
    [],
  )

  useEffect(() => {
    enemyPositions.set(enemy.id, pos.current)
    return () => {
      enemyPositions.delete(enemy.id)
      cuddles.delete(enemy.id)
    }
  }, [enemy.id])

  // knockback when struck
  useEffect(() => {
    const b = body.current
    if (!b || !enemy.hitAt) return
    const away = pos.current.clone().sub(playerState.position).setY(0).normalize().multiplyScalar(6)
    b.setLinvel({ x: away.x, y: 3, z: away.z }, true)
  }, [enemy.hitAt])

  useFrame((state, dt) => {
    const b = body.current
    if (!b) return
    const t = b.translation()
    pos.current.set(t.x, t.y, t.z)
    const s = useGame.getState()
    const now = performance.now()
    const v = b.linvel()
    const stunned = now - enemy.hitAt < 300
    const frozen = s.dialogue || s.health <= 0
    const dir = toTarget.current

    if (enemy.friendly) {
      // ---- friend: go hug a hostile one, otherwise trail after the hero ----
      let hug = cuddles.get(enemy.id)
      if (hug && !s.enemies.some((e) => e.id === hug!.target && !e.friendly)) {
        cuddles.delete(enemy.id)
        hug = undefined
      }
      if (!hug) {
        let best = -1
        let bestD = 12
        for (const e of s.enemies) {
          if (e.friendly || isBeingCuddled(e.id)) continue
          const p = enemyPositions.get(e.id)
          const d = p ? p.distanceTo(pos.current) : Infinity
          if (d < bestD) {
            best = e.id
            bestD = d
          }
        }
        if (best >= 0) cuddles.set(enemy.id, (hug = { target: best, since: 0 }))
      }
      const goal = hug ? enemyPositions.get(hug.target) : playerState.position
      if (goal && !frozen) {
        dir.copy(goal).sub(pos.current).setY(0)
        const d = dir.length()
        const keep = hug ? CUDDLE_RANGE * 0.8 : 2.2
        if (d > keep) {
          dir.normalize().multiplyScalar(FRIEND_SPEED)
          b.setLinvel({ x: dir.x, y: v.y, z: dir.z }, true)
        } else b.setLinvel({ x: v.x * 0.8, y: v.y, z: v.z * 0.8 }, true)
        if (hug) {
          if (d < CUDDLE_RANGE) {
            if (!hug.since) hug.since = now
            if (now - hug.since > CUDDLE_MS) {
              s.befriend(hug.target)
              cuddles.delete(enemy.id)
            }
          } else hug.since = 0
        }
      } else b.setLinvel({ x: 0, y: v.y, z: 0 }, true)
    } else if (!stunned) {
      // ---- hostile: chase the hero, unless being hugged ----
      const hugged = [...cuddles.values()].some((c) => c.target === enemy.id && c.since)
      dir.copy(playerState.position).sub(pos.current).setY(0)
      const dist = dir.length()
      const lostHim = playerState.hidden && !isFrenzy(s) && dist > 2.5
      if (frozen || hugged || dist > CHASE_RANGE || lostHim) {
        b.setLinvel({ x: 0, y: v.y, z: 0 }, true)
      } else if (dist > 0.9) {
        dir.normalize().multiplyScalar(SPEED)
        b.setLinvel({ x: dir.x, y: v.y, z: dir.z }, true)
      }
      if (!frozen && !hugged && dist < CONTACT_RANGE) s.hurt()
    }

    // ---- look: warm up when befriended, charmed ones flicker ----
    const target = enemy.friendly ? 1 : Math.min(0.45, enemy.charm * 0.3)
    warm.current += (target - warm.current) * Math.min(1, dt * 3)
    const w = warm.current
    mats.body.color.copy(HOSTILE.body).lerp(FRIEND.body, w)
    mats.body.emissive.copy(FRIEND.body).multiplyScalar(w * 0.25)
    mats.eye.color.copy(HOSTILE.eye).lerp(FRIEND.eye, w)
    mats.eye.emissive.copy(mats.eye.color)

    if (visual.current) {
      const bob = enemy.friendly ? Math.abs(Math.sin(state.clock.elapsedTime * 6 + enemy.id)) * 0.18 : Math.sin(state.clock.elapsedTime * 3 + enemy.id) * 0.12
      visual.current.position.y = bob
      const look = enemy.friendly && cuddles.get(enemy.id) ? enemyPositions.get(cuddles.get(enemy.id)!.target) ?? playerState.position : playerState.position
      visual.current.lookAt(look.x, pos.current.y, look.z)
      const squish = cuddles.get(enemy.id)?.since ? 1 + Math.sin(now / 90) * 0.08 : 1
      visual.current.scale.set(squish, 1 / squish, squish).multiplyScalar(stunned ? 1.2 : 1)
    }
    if (heart.current) {
      const hugging = !!cuddles.get(enemy.id)?.since
      heart.current.visible = (enemy.friendly && now - enemy.friendAt < 1500) || hugging
      heart.current.position.y = 1.0 + ((now / 1000) % 1) * 0.3
    }
  })

  return (
    <RigidBody ref={body} position={enemy.spawn} colliders={false} lockRotations linearDamping={0.5}>
      <BallCollider args={[0.6]} />
      <group ref={visual}>
        <mesh castShadow material={mats.body}>
          <icosahedronGeometry args={[0.6, 1]} />
        </mesh>
        {[-0.18, 0.18].map((x) => (
          <mesh key={x} position={[x, 0.12, 0.52]} material={mats.eye}>
            <sphereGeometry args={[0.07, 8, 8]} />
          </mesh>
        ))}
      </group>
      <Heart ref={heart} />
    </RigidBody>
  )
}

import { forwardRef } from 'react'
import { Shape } from 'three'
const heartShape = (() => {
  const h = new Shape()
  h.moveTo(0, -0.12)
  h.bezierCurveTo(-0.18, 0.02, -0.12, 0.16, 0, 0.07)
  h.bezierCurveTo(0.12, 0.16, 0.18, 0.02, 0, -0.12)
  return h
})()
const Heart = forwardRef<Mesh>(function Heart(_, ref) {
  return (
    <mesh ref={ref} visible={false}>
      <shapeGeometry args={[heartShape]} />
      <meshStandardMaterial color="#ff6fa8" emissive="#ff3d8b" emissiveIntensity={2.5} toneMapped={false} side={2} />
    </mesh>
  )
})
