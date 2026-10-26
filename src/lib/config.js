import { useEffect, useState } from 'react';
import { api } from './api.js';

// What the server tells the shop about itself (card payments on/off). Fetched once per page load.
let request;
const DEFAULTS = { stripe: false };

export function useShopConfig() {
  const [config, setConfig] = useState(DEFAULTS);
  useEffect(() => {
    let live = true;
    request ||= api('/config').catch(() => DEFAULTS);
    request.then((c) => { if (live) setConfig({ ...DEFAULTS, ...c }); });
    return () => { live = false; };
  }, []);
  return config;
}
