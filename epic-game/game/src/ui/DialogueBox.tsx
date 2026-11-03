import { useGame } from '../store'

export function DialogueBox() {
  const dialogue = useGame((s) => s.dialogue)
  const advance = useGame((s) => s.advance)
  const choose = useGame((s) => s.choose)
  if (!dialogue) return null

  return (
    <div className="dialogue" onClick={advance}>
      {dialogue.speaker && <div className="speaker">{dialogue.speaker}</div>}
      {dialogue.text && <p className={dialogue.speaker ? '' : 'narration'}>{dialogue.text}</p>}
      {dialogue.choices.length > 0 ? (
        <ol className="choices">
          {dialogue.choices.map((c, i) => (
            <li key={i}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  choose(i)
                }}
              >
                <kbd>{i + 1}</kbd> {c}
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <div className="continue">Space ▸</div>
      )}
    </div>
  )
}
