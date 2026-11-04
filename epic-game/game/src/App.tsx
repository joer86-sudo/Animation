import { Suspense, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { DirectionalLight } from 'three'
import { playerState } from './store'
import { Canvas } from '@react-three/fiber'
import { KeyboardControls, Sky } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { keyMap } from './controls'
import { useGame } from './store'
import { Level, Interactions } from './world/Level'
import { Player } from './world/Player'
import { Enemies } from './world/Enemies'
import { Projectiles } from './world/Projectiles'
import { SoundWaves } from './world/SoundWaves'
import { HUD } from './ui/HUD'
import { DialogueBox } from './ui/DialogueBox'
import { TitleScreen } from './ui/TitleScreen'
import { TouchControls } from './ui/TouchControls'

export default function App() {
  const runId = useGame((s) => s.runId)
  const started = useGame((s) => s.started)
  useGlobalInput()

  return (
    <KeyboardControls map={keyMap}>
      <Canvas
        shadows
        camera={{ position: [0, 6, 15], fov: 50 }}
        onPointerDown={(e) => {
          const g = useGame.getState()
          if (g.hero === 'kiai') return e.button === 2 ? g.harmony() : g.shred()
          return e.button === 2 ? g.throwBottle() : g.attack()
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <color attach="background" args={['#a9d8f5']} />
        <fog attach="fog" args={['#cfe6f5', 40, 140]} />
        <Sky sunPosition={[60, 40, 30]} turbidity={3} rayleigh={1.1} mieCoefficient={0.004} mieDirectionalG={0.8} />
        <hemisphereLight args={['#d6ecff', '#7a9a52', 1.15]} />
        <Sun />
        <Suspense fallback={null}>
          <Physics key={runId} gravity={[0, -20, 0]} paused={!started}>
            <Level />
            <Player />
            <Enemies />
            <Projectiles />
            <SoundWaves />
            <Interactions />
          </Physics>
        </Suspense>
        <EffectComposer>
          <Bloom mipmapBlur luminanceThreshold={1} intensity={0.9} />
          <Vignette eskil={false} offset={0.3} darkness={0.4} />
        </EffectComposer>
      </Canvas>
      <HUD />
      <DialogueBox />
      <TouchControls />
      <TitleScreen />
    </KeyboardControls>
  )
}

// One-shot actions (attack, interact, dialogue) are handled here; continuous
// movement is read each frame through KeyboardControls in <Player>.
function useGlobalInput() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const g = useGame.getState()
      if (!g.started) return
      if (g.dialogue) {
        if (['Space', 'Enter', 'KeyE'].includes(e.code)) g.advance()
        const n = Number(e.key)
        if (n >= 1 && n <= g.dialogue.choices.length) g.choose(n - 1)
        return
      }
      if (g.hero === 'kiai') {
        if (e.code === 'KeyF') g.shred()
        if (e.code === 'KeyQ') g.harmony()
      } else {
        if (e.code === 'KeyF') g.attack()
        if (e.code === 'KeyQ') g.throwBottle()
        if (e.code === 'KeyC') g.drink()
      }
      if (e.code === 'KeyE') g.interact()
      if (e.code === 'KeyR' && g.health <= 0) g.restart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

// Warm afternoon sun that follows the hero so shadows stay sharp wherever you go.
function Sun() {
  const light = useRef<DirectionalLight>(null)
  useFrame(() => {
    const l = light.current
    if (!l) return
    const p = playerState.position
    l.position.set(p.x + 24, 36, p.z + 18)
    l.target.position.set(p.x, 0, p.z)
    l.target.updateMatrixWorld()
  })
  return (
    <directionalLight
      ref={light}
      intensity={2.6}
      color="#fff0d8"
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-30}
      shadow-camera-right={30}
      shadow-camera-top={30}
      shadow-camera-bottom={-30}
      shadow-camera-far={120}
      shadow-bias={-0.0004}
    />
  )
}
