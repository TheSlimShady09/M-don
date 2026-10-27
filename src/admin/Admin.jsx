import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { api } from '../lib/api.js';
import { AdminContext } from './ui.jsx';
import AdminLayout from './AdminLayout.jsx';
import { SignIn, NoOwner } from './Login.jsx';
import Overview from './Overview.jsx';
import Orders from './Orders.jsx';
import OrderDetail from './OrderDetail.jsx';
import Products from './Products.jsx';
import Subscribers from './Subscribers.jsx';
import Users from './Users.jsx';
import AuditLog from './AuditLog.jsx';
import Settings from './Settings.jsx';

/** Signs out after the same idle time the server enforces, and keeps the session alive while you work */
function useIdleGuard(active, idleMinutes, onIdle) {
  const last = useRef(Date.now());
  const pinged = useRef(Date.now());
  useEffect(() => {
    if (!active) return undefined;
    last.current = Date.now();
    const bump = () => { last.current = Date.now(); };
    const events = ['pointerdown', 'keydown', 'scroll', 'pointermove'];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const timer = setInterval(() => {
      const now = Date.now();
      if (now - last.current > idleMinutes * 60000) onIdle();
      else if (now - last.current < 5 * 60000 && now - pinged.current > 5 * 60000) {
        pinged.current = now;
        api('/admin/session').catch(() => {}); // activity: refresh the server-side session
      }
    }, 20000);
    return () => { events.forEach((e) => window.removeEventListener(e, bump)); clearInterval(timer); };
  }, [active, idleMinutes, onIdle]);
}

export default function Admin() {
  const [session, setSession] = useState(null);
  const [notice, setNotice] = useState('');

  const refresh = useCallback(() => api('/admin/session')
    .then(setSession)
    .catch(() => { setSession({ loggedIn: false, setupNeeded: false }); setNotice('Serveri nuk po përgjigjet. Sigurohu që është ndezur (npm run dev).'); }), []);

  useEffect(() => {
    refresh();
    document.title = 'Paneli — M’DON';
    document.documentElement.lang = 'sq';
    const robots = Object.assign(document.createElement('meta'), { name: 'robots', content: 'noindex, nofollow' });
    document.head.appendChild(robots);
    // The dashboard's browser tab shows the MD monogram instead of the shop's icon
    const icon = document.querySelector('link[rel="icon"]');
    const shopIcon = icon && { href: icon.getAttribute('href'), type: icon.type };
    if (icon) Object.assign(icon, { type: 'image/png', href: '/brand/md-icon.png' });
    return () => {
      robots.remove();
      if (icon) Object.assign(icon, shopIcon);
    };
  }, [refresh]);

  const signedOut = useCallback((reason = '') => {
    setNotice(reason);
    setSession((s) => ({ ...s, loggedIn: false, user: null, stage: null }));
  }, []);

  const onIdle = useCallback(() => {
    api('/admin/logout', { method: 'POST' }).catch(() => {});
    signedOut('Dole automatikisht pas 30 minutash pa aktivitet.');
  }, [signedOut]);
  useIdleGuard(Boolean(session?.loggedIn && !session?.preview), session?.idleMinutes || 30, onIdle);

  const ctx = useMemo(() => ({
    user: session?.user,
    email: session?.user?.email,
    isOwner: session?.user?.role === 'pronar',
    preview: Boolean(session?.preview),
    refresh,
    signedOut,
    logout: async () => {
      await api('/admin/logout', { method: 'POST' }).catch(() => {});
      signedOut('Dole nga paneli.');
    },
  }), [session?.user, session?.preview, refresh, signedOut]);

  if (!session) return <div className="min-h-screen bg-ink" />;
  if (!session.loggedIn) {
    if (session.setupNeeded && !session.stage) {
      return session.setupAllowed ? <SignIn setup onDone={refresh} /> : <NoOwner />;
    }
    return <SignIn key={notice} initialStage={session.stage} notice={notice} onDone={() => { setNotice(''); refresh(); }} />;
  }

  return (
    <AdminContext.Provider value={ctx}>
      <AdminLayout>
        <Routes>
          <Route index element={<Overview />} />
          <Route path="porosite" element={<Orders />} />
          <Route path="porosite/:id" element={<OrderDetail />} />
          <Route path="produktet" element={<Products />} />
          <Route path="abonentet" element={<Subscribers />} />
          <Route path="perdoruesit" element={<Users />} />
          <Route path="regjistri" element={<AuditLog />} />
          <Route path="cilesimet" element={<Settings />} />
          <Route path="*" element={<Overview />} />
        </Routes>
      </AdminLayout>
    </AdminContext.Provider>
  );
}
