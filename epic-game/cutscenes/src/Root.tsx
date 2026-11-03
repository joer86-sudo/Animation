import { Composition } from 'remotion'
import { Prologue } from './Prologue'

// Each cutscene is a Composition. Render one to ../game/public/cutscenes/
// and the game can play it (the title screen already plays prologue.mp4).
export const Root = () => (
  <>
    <Composition id="Prologue" component={Prologue} durationInFrames={300} fps={30} width={1920} height={1080} />
  </>
)
