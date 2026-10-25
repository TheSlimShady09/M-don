import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { LangProvider } from './lib/i18n.jsx';
import { ToastProvider } from './lib/toast.jsx';
import { CartProvider } from './lib/cart.jsx';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LangProvider>
        <ToastProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </ToastProvider>
      </LangProvider>
    </BrowserRouter>
  </StrictMode>,
);
