// Loads .env and .env.local into process.env without extra dependencies
// (.env.local wins; real environment variables win over both).
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const loaded = {}
for (const file of ['.env', '.env.local']) {
  const full = path.join(root, file)
  if (!existsSync(full)) continue
  for (const line of readFileSync(full, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (m) loaded[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2')
  }
}
for (const [k, v] of Object.entries(loaded)) {
  if (process.env[k] === undefined) process.env[k] = v
}

export const env = {
  port: Number(process.env.API_PORT || 3001),
  paypalClientId: process.env.VITE_PAYPAL_CLIENT_ID,
  paypalSecret: process.env.PAYPAL_CLIENT_SECRET,
  paypalBase:
    process.env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com',
  currency: process.env.VITE_CURRENCY || 'USD',
  adminEmails: (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
  dbFile: process.env.DB_FILE || path.join(root, 'server', 'data', 'db.json'),
  // Public address of the site, used for unsubscribe links in emails.
  siteUrl: (process.env.SITE_URL || 'http://localhost:5173').replace(/\/+$/, ''),
  siteName: process.env.SITE_NAME || 'LaMar Huley · Distinctive Artist',
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  mailFrom: process.env.MAIL_FROM,
  outboxDir: path.join(root, 'server', 'data', 'outbox'),
}
