
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Global error handler for mobile debugging
window.onerror = function (message, source, lineno, colno, error) {
  console.error("Global Error Caught:", message, "at", source, ":", lineno);
  const errorDisplay = document.createElement('div');
  errorDisplay.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:rgba(255,0,0,0.9);color:white;padding:10px;font-size:10px;z-index:10000;word-break:break-all;max-height:100px;overflow:auto;';
  errorDisplay.innerHTML = `⚠️ Error: ${message}<br>Line: ${lineno}`;
  document.body.appendChild(errorDisplay);
  return false;
};

const root = ReactDOM.createRoot(rootElement);

// Remove loading fallback with a safer check
const removeLoader = () => {
  const loader = document.getElementById('loading-fallback');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => {
      if (loader.parentNode) loader.remove();
    }, 500);
  }
  (window as any).reactLoaded = true;
};

try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // Wait a bit more on mobile or just a bit after mount
  const delay = /Mobi|Android/i.test(navigator.userAgent) ? 1000 : 200;
  setTimeout(removeLoader, delay);
} catch (error) {
  console.error("Mount error:", error);
  const loaderText = document.querySelector('#loading-fallback p');
  if (loaderText) {
    loaderText.textContent = "Erro ao carregar sistema. Tente atualizar.";
    (loaderText as HTMLElement).style.color = "#ef4444";
  }
}
