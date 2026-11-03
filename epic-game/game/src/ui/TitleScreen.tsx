import { useState } from 'react'
import { useGame } from '../store'

// Plays the Remotion-rendered prologue (public/cutscenes/prologue.mp4) if it
// exists, otherwise just shows the title card.
export function TitleScreen() {
  const started = useGame((s) => s.started)
  const start = useGame((s) => s.start)
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
      <div className={`title-card ${showVideo ? 'over-video' : ''}`}>
        {!showVideo && (
          <>
            <h1>The Last Lantern</h1>
            <p>A story of Emberfall</p>
          </>
        )}
        <button onClick={start}>{showVideo ? 'Skip' : 'Begin'}</button>
      </div>
    </div>
  )
}
