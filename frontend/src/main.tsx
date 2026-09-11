import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './lib/LanguageContext';
import { VoiceProvider } from './lib/voice/VoiceContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <VoiceProvider>
        <App />
      </VoiceProvider>
    </LanguageProvider>
  </StrictMode>,
);
