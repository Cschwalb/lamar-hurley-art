// Tiny JSON-file database. Fine for a single small server; swap for a real
// database (Postgres, SQLite, Supabase) before you have many customers.
import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { env } from './env.js'

function empty() {
  return {
    users: [], // { id, email, name, passwordHash, createdAt }
    sessions: [], // { tokenHash, userId, expiresAt }
    credits: { 'collector@example.com': 50 }, // email -> balance (works before sign-up)
    creditLog: [], // { id, email, amount, note, at }
    subscribers: [], // { email, name, token, subscribedAt }
    campaigns: [], // { id, subject, body, status, total, sent, failed, createdAt, finishedAt }
    orders: [], // { id, artworkId, artworkTitle, price, creditsUsed, amountPaid, userId, email, paypalOrderId, payerName, at }
  }
}

let data = existsSync(env.dbFile) ? { ...empty(), ...JSON.parse(readFileSync(env.dbFile, 'utf8')) } : empty()

function save() {
  mkdirSync(path.dirname(env.dbFile), { recursive: true })
  const tmp = `${env.dbFile}.tmp`
  writeFileSync(tmp, JSON.stringify(data, null, 2))
  renameSync(tmp, env.dbFile)
}

export const db = {
  get: () => data,
  // Runs fn against a copy; only saves (and commits) if fn doesn't throw.
  update(fn) {
    const draft = structuredClone(data)
    const result = fn(draft)
    data = draft
    save()
    return result
  },
}

export const newId = (prefix) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
export const normEmail = (email) => String(email || '').trim().toLowerCase()
export const round2 = (n) => Math.round(Number(n) * 100) / 100
