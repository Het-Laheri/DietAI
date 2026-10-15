import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { mobileNotificationService } from './services/mobileNotificationService';
import { installApiAuth } from './services/apiAuth';

// Send the user's Firebase ID token with every /api request (server verifies it).
installApiAuth();

// Initialize Service Worker for mobile notification handling
mobileNotificationService.initServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
