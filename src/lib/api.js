/** fetch wrapper for the M'DON API. Throws an Error with .status and .data on failure. */
export async function api(path, { method = 'GET', body, form } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : form,
  });
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    const err = new Error((data && data.error) || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  // Every API answer is JSON. Anything else (usually the site's own HTML page) means the API server
  // isn't running behind this address, e.g. the site was put on a static-only host.
  if (!isJson && res.status !== 204) {
    const err = new Error('API_UNAVAILABLE');
    err.status = 503;
    err.unavailable = true;
    throw err;
  }
  return data;
}
