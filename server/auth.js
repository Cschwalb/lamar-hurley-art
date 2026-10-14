// Accounts: password hashing, sessions (httpOnly cookie) and route guards.
import { scryptSync, randomBytes, timingSafeEqual, createHash } from 'node:crypto'
import { db, newId, normEmail } from './db.js'
import { env } from './env.js'

const COOKIE = 'lh_sid'
const SESSION_DAYS = 30

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${hash}`
}

export function verifyPassword(password, stored) {
  const [, salt, hash] = String(stored).split('$')
  if (!salt || !hash) return false
  const candidate = scryptSync(password, salt, 64)
  const expected = Buffer.from(hash, 'hex')
  return candidate.length === expected.length && timingSafeEqual(candidate, expected)
}

const sha256 = (s) => createHash('sha256').update(s).digest('hex')

export const isAdmin = (user) => Boolean(user && env.adminEmails.includes(user.email))

export function publicUser(user) {
  if (!user) return null
  const credits = db.get().credits[user.email] ?? 0
  return { id: user.id, email: user.email, name: user.name, isAdmin: isAdmin(user), credits }
}

function readCookie(req, name) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return null
}

function setCookie(req, res, value, maxAgeSeconds) {
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https'
  res.setHeader(
    'Set-Cookie',
    `${COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure ? '; Secure' : ''}`,
  )
}

export function startSession(req, res, userId) {
  const token = randomBytes(32).toString('hex')
  const expiresAt = Date.now() + SESSION_DAYS * 864e5
  db.update((d) => {
    d.sessions = d.sessions.filter((s) => s.expiresAt > Date.now())
    d.sessions.push({ tokenHash: sha256(token), userId, expiresAt })
  })
  setCookie(req, res, token, SESSION_DAYS * 86400)
}

export function endSession(req, res) {
  const token = readCookie(req, COOKIE)
  if (token) db.update((d) => void (d.sessions = d.sessions.filter((s) => s.tokenHash !== sha256(token))))
  setCookie(req, res, '', 0)
}

// Attaches req.user (or null) from the session cookie.
export function loadUser(req, _res, next) {
  req.user = null
  const token = readCookie(req, COOKIE)
  if (token) {
    const { sessions, users } = db.get()
    const session = sessions.find((s) => s.tokenHash === sha256(token) && s.expiresAt > Date.now())
    if (session) req.user = users.find((u) => u.id === session.userId) || null
  }
  next()
}

export function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please sign in.' })
  next()
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please sign in.' })
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'Admin access only.' })
  next()
}

// Simple in-memory limiter for sign-in / sign-up attempts per IP.
const attempts = new Map()
export function rateLimit(req, res, next) {
  const key = req.ip
  const now = Date.now()
  const recent = (attempts.get(key) || []).filter((t) => now - t < 15 * 60e3)
  if (recent.length >= 20) return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' })
  recent.push(now)
  attempts.set(key, recent)
  next()
}

export function createUser({ name, email, password }) {
  const key = normEmail(email)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) throw httpError(400, 'Please enter a valid email.')
  if (String(password || '').length < 8) throw httpError(400, 'Password must be at least 8 characters.')
  if (db.get().users.some((u) => u.email === key)) throw httpError(409, 'An account with that email already exists.')
  const user = {
    id: newId('usr'),
    email: key,
    name: String(name || '').trim().slice(0, 80),
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  }
  db.update((d) => void d.users.push(user))
  return user
}

export function httpError(status, message) {
  return Object.assign(new Error(message), { status })
}
