import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import VisualQaPage from './visual-qa/VisualQaPage'
import './style.css'

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    {window.location.pathname === '/visual-qa' ? <VisualQaPage /> : <App />}
  </StrictMode>,
)
