import { useEffect, useRef, useState, type RefObject } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import { Box3, Group, LoopOnce, Vector3 } from 'three'
import { useGame } from '../store'

export const HERO_URL = '/models/hero.glb'
const HERO_HEIGHT = 1.7 // world units; the model is auto-scaled to this

// Returns true once we've confirmed public/models/hero.glb exists.
// (Vite answers unknown paths with index.html, so check the content type.)
export function useHeroAvailable() {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    fetch(HERO_URL, { method: 'HEAD' })
      .then((r) => setOk(r.ok && !(r.headers.get('content-type') ?? '').includes('text/html')))
      .catch(() => setOk(false))
  }, [])
  return ok
}

const pick = (names: string[], ...keys: string[]) =>
  names.find((n) => keys.some((k) => n.toLowerCase().includes(k)))

// Loads any rigged glTF character and drives its clips by name:
// a clip containing "idle", one containing "run"/"walk", and optionally "attack"/"slash".
export function HeroModel({ moving }: { moving: RefObject<boolean> }) {
  const group = useRef<Group>(null)
  const { scene, animations } = useGLTF(HERO_URL)
  const { actions, names } = useAnimations(animations, group)
  const [state, setState] = useState<'idle' | 'run'>('idle')
  const attackAt = useGame((s) => s.attackAt)

  // Normalise size and stand the model on the capsule's feet.
  const [fit] = useState(() => {
    scene.traverse((o) => (o.castShadow = true))
    const box = new Box3().setFromObject(scene)
    const size = box.getSize(new Vector3())
    const scale = HERO_HEIGHT / (size.y || 1)
    return { scale, y: -0.85 - box.min.y * scale }
  })

  useEffect(() => {
    const id = setInterval(() => setState(moving.current ? 'run' : 'idle'), 100)
    return () => clearInterval(id)
  }, [moving])

  useEffect(() => {
    const name = state === 'run' ? pick(names, 'run', 'walk') : pick(names, 'idle')
    const action = name ? actions[name] : undefined
    action?.reset().fadeIn(0.15).play()
    return () => {
      action?.fadeOut(0.15)
    }
  }, [state, actions, names])

  useEffect(() => {
    const name = attackAt ? pick(names, 'attack', 'slash', 'punch') : undefined
    const action = name ? actions[name] : undefined
    if (!action) return
    action.setLoop(LoopOnce, 1)
    action.reset().fadeIn(0.05).play()
  }, [attackAt, actions, names])

  return (
    <group ref={group} scale={fit.scale} position-y={fit.y}>
      <primitive object={scene} />
    </group>
  )
}
