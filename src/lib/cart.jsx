import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { MAX_QTY } from '../../shared/shop.js';
import { useLang } from './i18n.jsx';
import { useToast } from './toast.jsx';

// The bag only stores product ids and quantities; prices always come from the server.
const KEY = 'mdon:shporta';
const CartContext = createContext(null);

function load() {
  try {
    const items = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(items) ? items.filter((i) => typeof i.id === 'string' && i.qty > 0) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(load);
  const [bump, setBump] = useState(0);
  const notify = useToast();
  const { t } = useLang();

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage blocked */ }
  }, [items]);

  const add = useCallback((id) => {
    setItems((list) => {
      const found = list.find((i) => i.id === id);
      return found
        ? list.map((i) => (i.id === id ? { ...i, qty: Math.min(MAX_QTY, i.qty + 1) } : i))
        : [...list, { id, qty: 1 }];
    });
    setBump((n) => n + 1);
    notify(t('U shtua në shportë'));
  }, [notify, t]);

  const setQty = useCallback((id, qty) => {
    setItems((list) => (qty < 1
      ? list.filter((i) => i.id !== id)
      : list.map((i) => (i.id === id ? { ...i, qty: Math.min(MAX_QTY, qty) } : i))));
  }, []);

  const removeMany = useCallback((ids) => setItems((list) => list.filter((i) => !ids.includes(i.id))), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => ({
    items,
    count: items.reduce((s, i) => s + i.qty, 0),
    bump,
    add,
    setQty,
    remove: (id) => removeMany([id]),
    removeMany,
    clear,
  }), [items, bump, add, setQty, removeMany, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
