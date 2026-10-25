import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState({ text: '', on: false });
  const timer = useRef();

  const notify = useCallback((text) => {
    setMsg({ text, on: true });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg((m) => ({ ...m, on: false })), 2600);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 bg-white px-6 py-3.5 caps text-ink shadow-[0_0_0_1px_var(--color-crimson)] transition-[transform,visibility] duration-500 ease-[var(--ease-brand)] ${
          msg.on ? 'visible translate-y-0' : 'invisible translate-y-[calc(100%+40px)]'
        }`}
      >
        {msg.text}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
