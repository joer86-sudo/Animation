import { useEffect, useRef, useState } from 'react'
import { touchInput } from '../controls'
import { useGame } from '../store'

// On-screen stick + action buttons, shown on touch devices only.
export function TouchControls() {
  const [touch, setTouch] = useState(() => typeof window !== 'undefined' && matchMedia('(pointer: coarse)').matches)
  const started = useGame((s) => s.started)
  const dialogue = useGame((s) => s.dialogue)
  const prompt = useGame((s) => s.prompt)
  const base = useRef<HTMLDivElement>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const pointerId = useRef<number | null>(null)

  useEffect(() => {
    const on = () => setTouch(true)
    window.addEventListener('touchstart', on, { once: true })
    return () => window.removeEventListener('touchstart', on)
  }, [])

  if (!touch || !started) return null

  const moveTo = (e: React.PointerEvent) => {
    const r = base.current!.getBoundingClientRect()
    const R = r.width / 2
    let dx = e.clientX - (r.left + R)
    let dy = e.clientY - (r.top + R)
    const d = Math.hypot(dx, dy)
    if (d > R) {
      dx = (dx / d) * R
      dy = (dy / d) * R
    }
    setKnob({ x: dx, y: dy })
    touchInput.x = dx / R
    touchInput.z = dy / R
  }
  const release = () => {
    pointerId.current = null
    setKnob({ x: 0, y: 0 })
    touchInput.x = 0
    touchInput.z = 0
  }

  const g = () => useGame.getState()
  const tap = (fn: () => void) => (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    fn()
  }

  return (
    <div className="touch" style={{ visibility: dialogue ? 'hidden' : 'visible' }}>
      <div
        ref={base}
        className="stick"
        onPointerDown={(e) => {
          pointerId.current = e.pointerId
          e.currentTarget.setPointerCapture(e.pointerId)
          moveTo(e)
        }}
        onPointerMove={(e) => pointerId.current === e.pointerId && moveTo(e)}
        onPointerUp={release}
        onPointerCancel={release}
      >
        <div className="knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
      </div>
      <div className="actions">
        {prompt && (
          <button className="act wide" onPointerDown={tap(() => g().interact())}>
            {prompt.label}
          </button>
        )}
        <button className="act" onPointerDown={tap(() => g().drink())}>Drink</button>
        <button className="act" onPointerDown={tap(() => g().throwBottle())}>Throw</button>
        <button
          className="act"
          onPointerDown={tap(() => (touchInput.jump = true))}
          onPointerUp={() => (touchInput.jump = false)}
          onPointerCancel={() => (touchInput.jump = false)}
        >
          Jump
        </button>
        <button className="act big" onPointerDown={tap(() => g().attack())}>Punch</button>
      </div>
    </div>
  )
}
