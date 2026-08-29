import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './ui-v2.css'
import './components/Library/library-custom.css'
import './components/Chronicles/chronicles.css'
import './components/Chronicles/chronicles-reference.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
