import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './reset.css'
import './index.css'
import './DefaultStyles.css'
import App from './App.jsx'
import { AudioProvider } from './audio/AudioProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AudioProvider>
      <App />
    </AudioProvider>
  </StrictMode>,
)
