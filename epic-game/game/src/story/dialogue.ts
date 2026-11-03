import { Compiler, Story } from 'inkjs/full'
import source from './story.ink?raw'

// Compiles the .ink source at startup. For a shipped game you'd precompile to
// JSON (inklecate or `npx inkjs-compiler`) and load it with `new Story(json)`.
export function createStory(): Story {
  return new Compiler(source).Compile()
}

export type DialogueLine = { speaker: string | null; text: string }

export function parseLine(raw: string): DialogueLine {
  const m = raw.match(/^([A-Z][\w ]{0,20}):\s*(.*)$/)
  return m ? { speaker: m[1], text: m[2] } : { speaker: null, text: raw }
}
