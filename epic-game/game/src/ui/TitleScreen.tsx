import { useState } from 'react'
import { useGame, type Hero } from '../store'

const HEROES: { id: Hero; name: string; tag: string; kit: string }[] = [
  { id: 'gimlet', name: 'Gimlet', tag: 'Bottle-slinging brawler', kit: 'Punch, throw refilling bottles, build up a Frenzy by hiding, standing still or drinking.' },
  { id: 'kiai', name: 'Kiai', tag: 'Keytar hero', kit: 'Harmony wins Hollow ones over, and they hug others to your side. Shred blasts the rest.' },
]

// Plays the Remotion-rendered prologue (cutscenes/prologue.mp4) if it exists,
// then lets you pick a hero.
export function TitleScreen() {
  const started = useGame((s) => s.started)
  const chooseHero = useGame((s) => s.chooseHero)
  const [hasVideo, setHasVideo] = useState(true)
  const [videoDone, setVideoDone] = useState(false)
  if (started) return null

  const showVideo = hasVideo && !videoDone
  return (
    <div className="title-screen">
      {showVideo && (
        <video
          src="cutscenes/prologue.mp4"
          autoPlay
          muted
          playsInline
          onEnded={() => setVideoDone(true)}
          onError={() => setHasVideo(false)}
        />
      )}
      {showVideo ? (
        <div className="title-card over-video">
          <button onClick={() => setVideoDone(true)}>Skip</button>
        </div>
      ) : (
        <div className="title-card">
          <h1>The Last Lantern</h1>
          <p>Choose your hero</p>
          <div className="hero-pick">
            {HEROES.map((h) => (
              <button key={h.id} className={`hero-card ${h.id}`} onClick={() => chooseHero(h.id)}>
                <strong>{h.name}</strong>
                <em>{h.tag}</em>
                <span>{h.kit}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
