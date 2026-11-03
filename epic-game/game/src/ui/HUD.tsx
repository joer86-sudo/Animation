import { useEffect, useState } from 'react'
import { useGame } from '../store'

function objective(questAccepted: boolean, beaconLit: boolean, enemiesLeft: number) {
  if (beaconLit) return 'The valley is safe. Return to Mira.'
  if (!questAccepted) return 'Find out why the village is so quiet.'
  if (enemiesLeft > 0) return `Drive off the Hollow ones on the road north (${enemiesLeft} left).`
  return 'Climb the ridge and light the beacon.'
}

export function HUD() {
  const { health, maxHealth, embers, questAccepted, beaconLit, enemies, prompt, dialogue, hurtAt, started, restart } =
    useGame()
  const [hurtFlash, setHurtFlash] = useState(false)

  useEffect(() => {
    if (!hurtAt) return
    setHurtFlash(true)
    const id = setTimeout(() => setHurtFlash(false), 180)
    return () => clearTimeout(id)
  }, [hurtAt])

  if (!started) return null

  return (
    <>
      <div className={`hurt ${hurtFlash ? 'on' : ''}`} />
      <div className="hud">
        <div className="hearts" aria-label={`Health ${health} of ${maxHealth}`}>
          {Array.from({ length: maxHealth }, (_, i) => (
            <span key={i} className={i < health ? 'heart' : 'heart empty'} />
          ))}
        </div>
        <div className="embers">Hollow ones banished: {embers}</div>
        <div className="objective">{objective(questAccepted, beaconLit, enemies.length)}</div>
      </div>
      {prompt && !dialogue && health > 0 && (
        <div className="prompt">
          <kbd>E</kbd> {prompt.label}
        </div>
      )}
      <div className="help">
        <kbd>WASD</kbd> move · <kbd>Space</kbd> jump · <kbd>F</kbd>/click attack · <kbd>E</kbd> interact
      </div>
      {health <= 0 && (
        <div className="overlay">
          <h2>The dark takes you.</h2>
          <button onClick={restart}>Rise again (R)</button>
        </div>
      )}
    </>
  )
}
