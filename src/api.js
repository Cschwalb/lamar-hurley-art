// Small fetch wrapper for the API server (server/index.js).
export async function api(url, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined || method !== 'GET' ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : method !== 'GET' ? '{}' : undefined,
    })
  } catch {
    throw new Error('Can’t reach the server. Is it running? (npm run dev starts it)')
  }
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw Object.assign(new Error(json.error || `Request failed (${res.status})`), { status: res.status })
  }
  return json
}
