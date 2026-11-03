import { Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { KeyboardControls, Sky, Stars } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { keyMap } from './controls'
import { useGame } from './store'
import { Level, Interactions } from './world/Level'
import { Player } from './world/Player'
import { Enemies } from './world/Enemies'
import { Projectiles } from './world/Projectiles'
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
        onPointerDown={(e) => (e.button === 2 ? useGame.getState().throwBottle() : useGame.getState().attack())}
        onContextMenu={(e) => e.preventDefault()}
      >
        <color attach="background" args={['#14121c']} />
        <fog attach="fog" args={['#1d1a26', 18, 70]} />
        <Sky sunPosition={[-60, 2, -100]} turbidity={8} rayleigh={3} mieCoefficient={0.01} />
        <Stars radius={120} depth={40} count={2500} factor={4} fade />
        <hemisphereLight args={['#7d84b8', '#2a2018', 0.5]} />
        <directionalLight
          position={[-20, 25, -10]}
          intensity={1.2}
          color="#ffb385"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-40}
          shadow-camera-right={40}
          shadow-camera-top={40}
          shadow-camera-bottom={-40}
        />
        <Suspense fallback={null}>
          <Physics key={runId} gravity={[0, -20, 0]} paused={!started}>
            <Level />
            <Player />
            <Enemies />
            <Projectiles />
            <Interactions />
          </Physics>
        </Suspense>
        <EffectComposer>
          <Bloom mipmapBlur luminanceThreshold={1} intensity={0.9} />
          <Vignette eskil={false} offset={0.2} darkness={0.75} />
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
      if (e.code === 'KeyF') g.attack()
      if (e.code === 'KeyQ') g.throwBottle()
      if (e.code === 'KeyC') g.drink()
      if (e.code === 'KeyE') g.interact()
      if (e.code === 'KeyR' && g.health <= 0) g.restart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
