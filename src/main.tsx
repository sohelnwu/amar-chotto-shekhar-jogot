import '@fontsource/hind-siliguri/bengali-400.css';
import '@fontsource/hind-siliguri/bengali-500.css';
import '@fontsource/hind-siliguri/bengali-600.css';
import '@fontsource/hind-siliguri/bengali-700.css';
import '@fontsource/hind-siliguri/latin-400.css';
import '@fontsource/hind-siliguri/latin-600.css';
import '@fontsource/hind-siliguri/latin-700.css';
import './styles/index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

if (import.meta.env.DEV) {
  void import('./content/validate').then(({ validateContent }) => {
    const issues = validateContent();
    if (issues.length) console.warn('Content issues:', issues);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
