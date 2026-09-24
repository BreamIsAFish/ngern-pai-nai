import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import VisualQaPage from './visual-qa/VisualQaPage'
import './style.css'

if (import.meta.env.DEV) {
  void import('vconsole').then(({ default: VConsole }) => {
    new VConsole()
  })
}

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    {window.location.pathname === '/visual-qa' ? <VisualQaPage /> : <App />}
  </StrictMode>,
)
