function getBaseUrl() { return document.getElementById('baseUrl').value.trim(); }

async function apiRequest(method, endpoint, body = null) {
  const url = `${getBaseUrl()}${endpoint}`;
  const start = Date.now();
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body && method !== 'GET') opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    const data = await res.json();
    logRequest(method, endpoint, body, data, res.status, Date.now() - start);
    return { success: res.ok, data, status: res.status };
  } catch (err) {
    logRequest(method, endpoint, body, { error: err.message }, 0, Date.now() - start);
    return { success: false, data: { error: err.message }, status: 0 };
  }
}
