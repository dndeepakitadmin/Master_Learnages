import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

// 🛡️ SECURITY ENGINE: PROTECTION AGAINST COPY & CAPTURE
const enableSecurity = () => {
  if (typeof window === 'undefined') return;

  // 1. Block Context Menu (Right Click)
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // 2. Block Copy, Cut, Paste (Relaxed for Inputs/Textareas)
  const blockEvents = ['copy', 'cut', 'paste'];
  blockEvents.forEach((eventName) => {
    document.addEventListener(eventName, (e) => {
      const target = e.target as HTMLElement;
      // Allow copy/paste for user input fields specifically
      const isInput = target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT');
      if (isInput) {
        return;
      }
      e.preventDefault();
    });
  });

  // 3. Block Keyboard Shortcuts (Ctrl+S, Ctrl+P, Ctrl+U, Ctrl+Shift+I, F12)
  document.addEventListener('keydown', (e) => {
    const isCmdOrCtrl = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();
    
    // Check if target is an input before deciding whether to block certain keys like 'c' (copy)
    const target = e.target as HTMLElement;
    const isInputField = target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT');

    if (
      (isCmdOrCtrl && ['s', 'p', 'u'].includes(key)) ||
      (isCmdOrCtrl && key === 'c' && !isInputField) || // Only block Ctrl+C if not in an input field
      (isCmdOrCtrl && e.shiftKey && key === 'i') ||
      (key === 'f12') ||
      (key === 'printscreen')
    ) {
      e.preventDefault();
      return false;
    }
    return true;
  });

  // 4. Focus Blurring (Deters screenshots when window is not active)
  window.addEventListener('blur', () => {
    const root = document.getElementById('root');
    if (root) root.classList.add('security-blur');
  });
  window.addEventListener('focus', () => {
    const root = document.getElementById('root');
    if (root) root.classList.remove('security-blur');
  });
};

enableSecurity();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);