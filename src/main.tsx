import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { mobileNotificationService } from './services/mobileNotificationService';

// Initialize Service Worker for mobile notification handling
mobileNotificationService.initServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
