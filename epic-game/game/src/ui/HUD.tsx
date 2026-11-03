import { useEffect, useState } from 'react'
import { MAX_BOTTLES, isDrinking, isFrenzy, playerState, useGame } from '../store'

function objective(questAccepted: boolean, beaconLit: boolean, enemiesLeft: number) {
  if (beaconLit) return 'The valley is safe. Return to Mira.'
  if (!questAccepted) return 'Find out why the village is so quiet.'
  if (enemiesLeft > 0) return `Drive off the Hollow ones on the road north (${enemiesLeft} left).`
  return 'Climb the ridge and light the beacon.'
}

export function HUD() {
  const g = useGame()
  const { health, maxHealth, embers, questAccepted, beaconLit, enemies, prompt, dialogue, hurtAt, started, restart } = g
  const frenzy = isFrenzy(g)
  const drinking = isDrinking(g)
  const status = frenzy
    ? 'FRENZY'
    : drinking
      ? 'Drinking... wide open!'
      : playerState.hidden
        ? 'Hidden'
        : g.frenzyMeter > 0
          ? 'Stay still, hide, or drink'
          : ''
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
      <div className={`frenzy-vignette ${frenzy ? 'on' : ''}`} />
      <div className="hud">
        <div className="hearts" aria-label={`Health ${health} of ${maxHealth}`}>
          {Array.from({ length: maxHealth }, (_, i) => (
            <span key={i} className={i < health ? 'heart' : 'heart empty'} />
          ))}
        </div>
        <div className="kit">
          <div className="bottles" aria-label={`${g.bottles} bottles`}>
            {Array.from({ length: MAX_BOTTLES }, (_, i) => (
              <span key={i} className={`bottle ${frenzy || i < g.bottles ? 'full' : ''}`}>
                {!frenzy && i === g.bottles && <i style={{ height: `${g.bottleRegen * 100}%` }} />}
              </span>
            ))}
          </div>
          <div className={`frenzy ${frenzy ? 'on' : ''}`}>
            <div className="bar">
              <i style={{ width: `${g.frenzyMeter}%` }} />
            </div>
            <span>{status}</span>
          </div>
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
        <kbd>WASD</kbd> move · <kbd>Space</kbd> jump · <kbd>F</kbd>/click punch · <kbd>Q</kbd>/right-click throw · <kbd>C</kbd> drink · <kbd>E</kbd> interact
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
