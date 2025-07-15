import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { enUS, ruRU } from '@clerk/localizations';
import { useState, useEffect } from 'react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

function ClerkWithLocalization({ children }: { children: React.ReactNode }) {
  const getClerkLocalization = () => {
    const lang = localStorage.getItem('appLang') || 'en';
    return lang === 'ru' ? ruRU : enUS;
  };
  const [clerkLocalization, setClerkLocalization] = useState(getClerkLocalization());

  useEffect(() => {
    const onLangChange = () => setClerkLocalization(getClerkLocalization());
    window.addEventListener('storage', onLangChange);
    return () => window.removeEventListener('storage', onLangChange);
  }, []);

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} localization={clerkLocalization}>
      {children}
    </ClerkProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ClerkWithLocalization>
        <App />
      </ClerkWithLocalization>
    </BrowserRouter>
  </StrictMode>
);
