import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { CharacterViewer } from './gimlet/CharacterViewer'
import './styles.css'

const view = new URLSearchParams(location.search).get('view')

createRoot(document.getElementById('root')!).render(
  <StrictMode>{view === 'gimlet' || view === 'saz' ? <CharacterViewer /> : <App />}</StrictMode>,
)
