// API server: accounts, credits, orders and PayPal (incl. Apple Pay).
//
// Run with `npm run dev` (starts this and Vite together) or `npm run server`.
// Data is stored in server/data/db.json (see server/db.js).

import express from 'express'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { env, root } from './env.js'
import { db, newId, normEmail, round2 } from './db.js'
import {
  loadUser, requireUser, requireAdmin, rateLimit, createUser, verifyPassword,
  hashPassword, startSession, endSession, publicUser, httpError,
} from './auth.js'
import { paypal, paypalConfigured } from './paypal.js'
import { mailConfigured, sendEmail } from './mailer.js'
import { randomBytes } from 'node:crypto'

const app = express()
app.set('trust proxy', 1)
app.use(express.json({ limit: '100kb' }))

// Writes must be JSON. Together with SameSite cookies this blocks
// cross-site form posts (CSRF).
app.use('/api', (req, res, next) => {
  if (req.method !== 'GET' && !req.is('application/json')) {
    return res.status(415).json({ error: 'Expected JSON.' })
  }
  next()
})
app.use('/api', loadUser)

// Wraps a handler so thrown errors become JSON responses.
const handle = (fn) => async (req, res) => {
  try {
    res.json(await fn(req, res))
  } catch (err) {
    if (!err.status || err.status >= 500) console.error(err.message, err.details ?? '')
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Server error.' })
  }
}

app.get('/api/health', (_req, res) => res.json({ ok: true, paypalConfigured }))

// ---- Accounts ---------------------------------------------------------------

app.post('/api/auth/signup', rateLimit, handle((req, res) => {
  const user = createUser(req.body || {})
  if (req.body?.subscribe) subscribe(user.email, user.name)
  startSession(req, res, user.id)
  return { user: publicUser(user) }
}))

app.post('/api/auth/login', rateLimit, handle((req, res) => {
  const { email, password } = req.body || {}
  const user = db.get().users.find((u) => u.email === normEmail(email))
  if (!user || !verifyPassword(String(password || ''), user.passwordHash)) {
    throw httpError(401, 'Wrong email or password.')
  }
  startSession(req, res, user.id)
  return { user: publicUser(user) }
}))

app.post('/api/auth/logout', handle((req, res) => {
  endSession(req, res)
  return { ok: true }
}))

app.get('/api/auth/me', handle((req) => ({ user: publicUser(req.user) })))

app.get('/api/account', requireUser, handle((req) => {
  const { creditLog, orders } = db.get()
  return {
    user: publicUser(req.user),
    subscribed: isSubscribed(req.user.email),
    creditLog: creditLog.filter((e) => e.email === req.user.email),
    orders: orders.filter((o) => o.userId === req.user.id || o.email === req.user.email),
  }
}))

app.patch('/api/account', requireUser, handle((req) => {
  const name = String(req.body?.name ?? '').trim().slice(0, 80)
  db.update((d) => void (d.users.find((u) => u.id === req.user.id).name = name))
  return { user: publicUser({ ...req.user, name }) }
}))

app.post('/api/account/password', requireUser, rateLimit, handle((req) => {
  const { current, next } = req.body || {}
  if (!verifyPassword(String(current || ''), req.user.passwordHash)) throw httpError(400, 'Current password is wrong.')
  if (String(next || '').length < 8) throw httpError(400, 'New password must be at least 8 characters.')
  db.update((d) => {
    d.users.find((u) => u.id === req.user.id).passwordHash = hashPassword(next)
  })
  return { ok: true }
}))

app.post('/api/account/subscription', requireUser, handle((req) => {
  if (req.body?.subscribed) subscribe(req.user.email, req.user.name)
  else unsubscribeEmail(req.user.email)
  return { subscribed: isSubscribed(req.user.email) }
}))

// ---- Newsletter subscriptions -------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isSubscribed = (email) => db.get().subscribers.some((s) => s.email === email)

function subscribe(email, name = '') {
  const key = normEmail(email)
  if (!EMAIL_RE.test(key)) throw httpError(400, 'Please enter a valid email.')
  if (isSubscribed(key)) return false
  db.update((d) => {
    d.subscribers.push({
      email: key,
      name: String(name || '').trim().slice(0, 80),
      token: randomBytes(16).toString('hex'),
      subscribedAt: new Date().toISOString(),
    })
  })
  return true
}

function unsubscribeEmail(email) {
  db.update((d) => void (d.subscribers = d.subscribers.filter((s) => s.email !== email)))
}

app.post('/api/subscribe', rateLimit, handle((req) => {
  subscribe(req.body?.email, req.body?.name)
  return { ok: true }
}))

// Used by the link at the bottom of every email.
app.post('/api/unsubscribe', handle((req) => {
  const sub = db.get().subscribers.find((s) => s.token === String(req.body?.token || ''))
  if (!sub) return { ok: true, email: null }
  unsubscribeEmail(sub.email)
  return { ok: true, email: sub.email }
}))

// ---- Admin ------------------------------------------------------------------

app.get('/api/admin/customers', requireAdmin, handle(() => {
  const { users, credits, creditLog } = db.get()
  const emails = new Set([...users.map((u) => u.email), ...Object.keys(credits)])
  const customers = [...emails].map((email) => {
    const user = users.find((u) => u.email === email)
    return { email, name: user?.name || '', hasAccount: Boolean(user), joined: user?.createdAt || null, credits: credits[email] ?? 0 }
  })
  return { customers, creditLog }
}))

app.post('/api/admin/credits', requireAdmin, handle((req) => {
  const email = normEmail(req.body?.email)
  const amount = round2(req.body?.amount)
  if (!email || !amount) throw httpError(400, 'Email and a non-zero amount are required.')
  return db.update((d) => {
    const balance = round2((d.credits[email] ?? 0) + amount)
    if (balance < 0) throw httpError(400, 'That would make the balance negative.')
    d.credits[email] = balance
    d.creditLog.unshift({
      id: newId('cr'),
      email,
      amount,
      note: String(req.body?.note || '').trim().slice(0, 200) || (amount > 0 ? 'Granted by the artist' : 'Removed by the artist'),
      at: new Date().toISOString(),
    })
    return { email, balance }
  })
}))

// ---- Admin: mass email --------------------------------------------------------

app.get('/api/admin/subscribers', requireAdmin, handle(() => {
  const { subscribers, campaigns } = db.get()
  return {
    mailConfigured,
    subscribers: subscribers.map(({ email, name, subscribedAt }) => ({ email, name, subscribedAt })),
    campaigns,
  }
}))

app.post('/api/admin/subscribers/add', requireAdmin, handle((req) => {
  subscribe(req.body?.email, req.body?.name)
  return { ok: true }
}))

app.post('/api/admin/subscribers/remove', requireAdmin, handle((req) => {
  unsubscribeEmail(normEmail(req.body?.email))
  return { ok: true }
}))

function readMessage(body) {
  const subject = String(body?.subject || '').trim().slice(0, 200)
  const message = String(body?.body || '').trim().slice(0, 20000)
  if (!subject || !message) throw httpError(400, 'Subject and message are required.')
  return { subject, message }
}

// Sends one copy to the signed-in admin so they can check it first.
app.post('/api/admin/emails/test', requireAdmin, handle(async (req) => {
  const { subject, message } = readMessage(req.body)
  try {
    await sendEmail({ to: req.user.email, subject: `[Test] ${subject}`, body: message, token: 'test' })
  } catch (err) {
    throw httpError(502, `Couldn’t send: ${err.message}`)
  }
  return { ok: true, to: req.user.email, previewOnly: !mailConfigured }
}))

let sending = false

app.post('/api/admin/emails/send', requireAdmin, handle((req) => {
  const { subject, message } = readMessage(req.body)
  if (sending) throw httpError(409, 'Another email is still sending. Try again when it finishes.')
  const recipients = db.get().subscribers.map(({ email, token }) => ({ email, token }))
  if (recipients.length === 0) throw httpError(400, 'There are no subscribers yet.')
  const campaign = {
    id: newId('cmp'),
    subject,
    body: message,
    status: 'sending',
    previewOnly: !mailConfigured,
    total: recipients.length,
    sent: 0,
    failed: 0,
    failures: [],
    createdAt: new Date().toISOString(),
    finishedAt: null,
  }
  db.update((d) => void d.campaigns.unshift(campaign))
  sendCampaign(campaign.id, recipients, subject, message) // runs in the background
  return { campaign }
}))

// Sends one email at a time (gentle on SMTP rate limits) and records progress.
async function sendCampaign(id, recipients, subject, message) {
  sending = true
  const updateCampaign = (fields) =>
    db.update((d) => {
      const c = d.campaigns.find((x) => x.id === id)
      if (c) Object.assign(c, typeof fields === 'function' ? fields(c) : fields)
    })
  try {
    for (const r of recipients) {
      // Skip anyone who unsubscribed after the send started.
      if (!isSubscribed(r.email)) {
        updateCampaign((c) => ({ total: c.total - 1 }))
        continue
      }
      try {
        await sendEmail({ to: r.email, subject, body: message, token: r.token })
        updateCampaign((c) => ({ sent: c.sent + 1 }))
      } catch (err) {
        console.error(`email to ${r.email} failed:`, err.message)
        updateCampaign((c) => ({ failed: c.failed + 1, failures: [...c.failures, { email: r.email, error: err.message }].slice(-50) }))
      }
      if (mailConfigured) await new Promise((res) => setTimeout(res, 250))
    }
    updateCampaign({ status: 'done', finishedAt: new Date().toISOString() })
  } catch (err) {
    console.error('campaign failed:', err)
    updateCampaign({ status: 'stopped', finishedAt: new Date().toISOString() })
  } finally {
    sending = false
  }
}

// A send interrupted by a server restart can't resume; mark it stopped.
db.update((d) => {
  for (const c of d.campaigns) if (c.status === 'sending') Object.assign(c, { status: 'stopped', finishedAt: new Date().toISOString() })
})

app.get('/api/admin/orders', requireAdmin, handle(() => ({ orders: db.get().orders })))

// ---- PayPal orders (Apple Pay creates/captures here) -------------------------

function requirePaypal(_req, res, next) {
  if (paypalConfigured) return next()
  res.status(503).json({
    error: 'PayPal is not configured on the server. Set VITE_PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env.local.',
  })
}

// NOTE: the price comes from the browser because artwork currently lives in
// browser storage. Once artworks are in this database, look the price up here.
app.post('/api/paypal/orders', requirePaypal, handle(async (req) => {
  const { artworkId, title, amount } = req.body || {}
  const value = Number(amount)
  if (!artworkId || !(value > 0)) throw httpError(400, 'artworkId and a positive amount are required.')
  return paypal('POST', '/v2/checkout/orders', {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: String(artworkId).slice(0, 256),
        description: `${title || 'Original artwork'} (original artwork)`.slice(0, 127),
        amount: { currency_code: env.currency, value: value.toFixed(2) },
      },
    ],
  })
}))

app.post('/api/paypal/orders/:id/capture', requirePaypal, handle((req) =>
  paypal('POST', `/v2/checkout/orders/${encodeURIComponent(req.params.id)}/capture`),
))

// ---- Completing a sale --------------------------------------------------------
// Called after payment. Deducts credits (signed-in buyers only) and records the
// order. When PayPal is configured, the payment is verified with PayPal.

app.post('/api/orders/complete', handle(async (req) => {
  const b = req.body || {}
  const price = round2(b.price)
  const creditsUsed = round2(b.creditsUsed || 0)
  const amountPaid = round2(b.amountPaid || 0)
  if (!b.artworkId || !(price > 0)) throw httpError(400, 'Missing artwork or price.')
  if (creditsUsed < 0 || amountPaid < 0 || round2(creditsUsed + amountPaid) !== price) {
    throw httpError(400, 'Payment does not add up to the price.')
  }
  if (creditsUsed > 0 && !req.user) throw httpError(401, 'Sign in to use credits.')
  if (amountPaid > 0) {
    if (!b.paypalOrderId) throw httpError(400, 'Missing PayPal order.')
    if (db.get().orders.some((o) => o.paypalOrderId === b.paypalOrderId)) throw httpError(409, 'Order already recorded.')
    if (paypalConfigured) {
      const order = await paypal('GET', `/v2/checkout/orders/${encodeURIComponent(b.paypalOrderId)}`)
      const paid = Number(order.purchase_units?.[0]?.amount?.value)
      if (order.status !== 'COMPLETED' || round2(paid) !== amountPaid) throw httpError(400, 'PayPal payment could not be verified.')
    }
  }
  if (db.get().orders.some((o) => o.artworkId === b.artworkId)) throw httpError(409, 'This piece has already been sold.')

  const order = db.update((d) => {
    const email = req.user?.email || normEmail(b.payerEmail)
    if (creditsUsed > 0) {
      const balance = d.credits[email] ?? 0
      if (balance < creditsUsed) throw httpError(400, 'Not enough credits.')
      d.credits[email] = round2(balance - creditsUsed)
      d.creditLog.unshift({ id: newId('cr'), email, amount: -creditsUsed, note: `Used on “${String(b.title).slice(0, 100)}”`, at: new Date().toISOString() })
    }
    const order = {
      id: newId('ord'),
      artworkId: String(b.artworkId),
      artworkTitle: String(b.title || '').slice(0, 200),
      price,
      creditsUsed,
      amountPaid,
      userId: req.user?.id || null,
      email,
      paypalOrderId: b.paypalOrderId || null,
      payerName: String(b.payer || req.user?.name || '').slice(0, 120),
      at: new Date().toISOString(),
    }
    d.orders.unshift(order)
    return order
  })
  return { order, user: publicUser(req.user) }
}))

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }))

// `npm start` also serves the built site (after `npm run build`).
const dist = path.join(root, 'dist')
if (process.argv.includes('--serve-site') && existsSync(dist)) {
  app.use(express.static(dist, { dotfiles: 'allow' }))
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.listen(env.port, () => {
  console.log(`API server on http://localhost:${env.port}`)
  console.log(`  PayPal: ${paypalConfigured ? `configured (${env.paypalBase})` : 'not configured (Apple Pay off, PayPal payments not verified)'}`)
  console.log(`  Email: ${mailConfigured ? `sending via ${env.smtp.host}` : 'PREVIEW MODE (emails saved to server/data/outbox/, not sent)'}`)
  console.log(`  Admins: ${env.adminEmails.length ? env.adminEmails.join(', ') : 'none (set ADMIN_EMAILS in .env.local)'}`)
})
