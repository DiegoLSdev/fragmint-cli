// Tiny HTTP client around fetch (Node 18+ has it natively).
// Adds the bearer token, parses JSON, and surfaces server errors usefully.

export async function apiRequest(cfg, method, pathname, body) {
  const url = `${cfg.api.replace(/\/$/, '')}${pathname}`;

  const headers = {
    Authorization: `Bearer ${cfg.token}`,
    Accept: 'application/json',
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error(`Network error contacting ${cfg.api}: ${err.message}`);
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // Non-JSON response — keep as text in `data` for the error path
      data = { raw: text };
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error(
        "Authentication failed (HTTP 401). Your token may be invalid or revoked — run `fm login` again."
      );
    }
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

export const api = {
  get:    (cfg, p)    => apiRequest(cfg, 'GET',    p),
  post:   (cfg, p, b) => apiRequest(cfg, 'POST',   p, b),
  put:    (cfg, p, b) => apiRequest(cfg, 'PUT',    p, b),
  delete: (cfg, p)    => apiRequest(cfg, 'DELETE', p),
};
