import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Sanitize legacy local storage data from previous incompatible builds
['roadies_orders', 'roadies_alerts', 'roadies_menu'].forEach((key) => {
  try {
    const val = localStorage.getItem(key);
    if (val) {
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed)) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    localStorage.removeItem(key);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
