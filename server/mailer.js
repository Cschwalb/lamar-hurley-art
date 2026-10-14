// Sends newsletter emails.
//
// With SMTP settings in .env.local (any provider: Gmail/Google Workspace,
// Outlook, SendGrid, Mailgun, Amazon SES, Postmark...) emails are really sent.
// Without them, the server runs in PREVIEW MODE: nothing is sent, and each
// email is saved as an .eml file in server/data/outbox/ so you can open it.

import nodemailer from 'nodemailer'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { env } from './env.js'

export const mailConfigured = Boolean(env.smtp.host && env.mailFrom)

const transport = mailConfigured
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    })
  : nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'unix' })

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

// Turns the admin's plain-text message into a simple branded HTML email.
// Blank lines start new paragraphs; links (https://...) become clickable.
export function renderEmail({ subject, body, unsubscribeUrl }) {
  const paragraphs = String(body)
    .trim()
    .split(/\n\s*\n/)
    .map((p) =>
      escapeHtml(p)
        .replace(/https?:\/\/[^\s<]+/g, (url) => `<a href="${url}" style="color:#a6772f">${url}</a>`)
        .replace(/\n/g, '<br>'),
    )
    .map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#1c1a17">${p}</p>`)
    .join('')

  const html = `<!doctype html><html><body style="margin:0;background:#f7f4ee;font-family:Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ee"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e4ddd0">
<tr><td style="padding:28px 32px 8px;border-bottom:1px solid #e4ddd0">
<div style="font-family:Georgia,serif;font-size:26px;color:#1c1a17">LaMar Huley</div>
<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#a6772f;padding:4px 0 16px">Distinctive Artist</div>
</td></tr>
<tr><td style="padding:28px 32px 12px">
<h1 style="font-family:Georgia,serif;font-weight:normal;font-size:24px;margin:0 0 20px;color:#1c1a17">${escapeHtml(subject)}</h1>
${paragraphs}
<p style="margin:24px 0 8px"><a href="${env.siteUrl}/gallery" style="display:inline-block;background:#1c1a17;color:#f7f4ee;text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px">View the gallery</a></p>
</td></tr>
<tr><td style="padding:20px 32px 28px;font-size:12px;color:#6d665c;border-top:1px solid #e4ddd0">
You're receiving this because you subscribed at <a href="${env.siteUrl}" style="color:#6d665c">${escapeHtml(env.siteUrl.replace(/^https?:\/\//, ''))}</a>.
<a href="${unsubscribeUrl}" style="color:#6d665c">Unsubscribe</a>.
</td></tr></table></td></tr></table></body></html>`

  const text = `${subject}\n\n${String(body).trim()}\n\nView the gallery: ${env.siteUrl}/gallery\n\n---\nYou're receiving this because you subscribed at ${env.siteUrl}.\nUnsubscribe: ${unsubscribeUrl}\n`
  return { html, text }
}

export const unsubscribeUrl = (token) => `${env.siteUrl}/unsubscribe?token=${token}`

export async function sendEmail({ to, subject, body, token }) {
  const url = unsubscribeUrl(token)
  const { html, text } = renderEmail({ subject, body, unsubscribeUrl: url })
  const info = await transport.sendMail({
    from: env.mailFrom || `"${env.siteName}" <no-reply@localhost>`,
    to,
    subject,
    text,
    html,
    headers: {
      // Lets Gmail/Apple Mail show a one-click "Unsubscribe" button.
      'List-Unsubscribe': `<${url}>`,
    },
  })
  if (!mailConfigured) {
    mkdirSync(env.outboxDir, { recursive: true })
    const safe = to.replace(/[^a-z0-9@._-]/gi, '_')
    writeFileSync(path.join(env.outboxDir, `${Date.now()}-${safe}.eml`), info.message)
  }
  return info
}
