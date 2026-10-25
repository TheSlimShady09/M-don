import { useEffect, useState } from 'react';
import { api } from './api.js';

// One request per page load, shared by every component that needs the catalogue
let request = null;

export function useProducts() {
  const [state, setState] = useState({ products: [], loading: true, error: null });

  useEffect(() => {
    let alive = true;
    request = request || api('/products').catch((err) => { request = null; throw err; });
    request
      .then((products) => alive && setState({ products, loading: false, error: null }))
      .catch((error) => alive && setState({ products: [], loading: false, error }));
    return () => { alive = false; };
  }, []);

  return state;
}
