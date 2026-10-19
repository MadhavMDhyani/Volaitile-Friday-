import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/anton/400.css'
import 'remixicon/fonts/remixicon.css'
import './index.css'
import App from './App.jsx'

// Detect Chromium support for SVG displacement map backdrop filter
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const isChromium =
    Boolean(window.navigator?.userAgentData?.brands?.some((b) => /Chromium|Chrome/i.test(b.brand))) ||
    (/Chrome|Chromium|Edg/i.test(window.navigator?.userAgent) && !/Firefox|Safari/i.test(window.navigator?.userAgent));
  if (isChromium) {
    document.documentElement.classList.add('liquid-supported');
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
