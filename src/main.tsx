import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register offline PWA service worker with auto-update
registerSW({
  immediate: true,
  onOfflineReady() {
    window.sessionStorage.setItem('studyflo_sw_ready', 'true');
    window.dispatchEvent(new Event('studyflo-offline-ready'));
  },
});

createRoot(document.getElementById('root')!).render(<App />);
