// PayPal Orders v2 calls. Needs your client ID and secret (server only).
import { env } from './env.js'

export const paypalConfigured = Boolean(
  env.paypalClientId && env.paypalClientId !== 'test' && env.paypalSecret,
)

async function accessToken() {
  const res = await fetch(`${env.paypalBase}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.paypalClientId}:${env.paypalSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) throw new Error(`PayPal auth failed (${res.status})`)
  return (await res.json()).access_token
}

export async function paypal(method, urlPath, body) {
  const res = await fetch(`${env.paypalBase}${urlPath}`, {
    method,
    headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(json.message || `PayPal request failed (${res.status})`)
    err.status = 502
    err.details = json
    throw err
  }
  return json
}
