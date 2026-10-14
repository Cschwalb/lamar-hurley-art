import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api.js'

const DRAFT_KEY = 'lh-email-draft'

function readDraft() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY)) || { subject: '', body: '' }
  } catch {
    return { subject: '', body: '' }
  }
}

function downloadCsv(subscribers) {
  const rows = [['email', 'name', 'subscribed_at'], ...subscribers.map((s) => [s.email, s.name, s.subscribedAt])]
  const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: 'subscribers.csv' })
  a.click()
  URL.revokeObjectURL(url)
}

export default function ManageEmails() {
  const [data, setData] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [draft, setDraft] = useState(readDraft)
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const [newSub, setNewSub] = useState('')

  const load = useCallback(() => {
    api('/api/admin/subscribers').then(setData).catch((err) => setLoadError(err.message))
  }, [])
  useEffect(load, [load])

  // Keep progress fresh while an email is sending.
  const isSending = data?.campaigns.some((c) => c.status === 'sending')
  useEffect(() => {
    if (!isSending) return
    const t = setInterval(load, 2000)
    return () => clearInterval(t)
  }, [isSending, load])

  // Save the draft so it survives a reload.
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch {
      // ignore
    }
  }, [draft])

  const set = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }))
  const count = data?.subscribers.length ?? 0
  const ready = draft.subject.trim() && draft.body.trim()

  async function sendTest() {
    setBusy(true)
    setMsg(null)
    try {
      const r = await api('/api/admin/emails/test', { method: 'POST', body: draft })
      setMsg({
        ok: true,
        text: r.previewOnly
          ? `Preview mode: the test email was saved to server/data/outbox/ instead of being sent to ${r.to}.`
          : `Test email sent to ${r.to}.`,
      })
    } catch (err) {
      setMsg({ ok: false, text: err.message })
    } finally {
      setBusy(false)
    }
  }

  async function sendAll() {
    if (!confirm(`Send “${draft.subject}” to ${count} subscriber${count === 1 ? '' : 's'}? This can’t be undone.`)) return
    setBusy(true)
    setMsg(null)
    try {
      await api('/api/admin/emails/send', { method: 'POST', body: draft })
      setDraft({ subject: '', body: '' })
      setMsg({ ok: true, text: 'Sending started. Progress is shown below.' })
      load()
    } catch (err) {
      setMsg({ ok: false, text: err.message })
    } finally {
      setBusy(false)
    }
  }

  async function addSubscriber(e) {
    e.preventDefault()
    try {
      await api('/api/admin/subscribers/add', { method: 'POST', body: { email: newSub } })
      setNewSub('')
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  async function removeSubscriber(email) {
    if (!confirm(`Remove ${email} from the email list?`)) return
    await api('/api/admin/subscribers/remove', { method: 'POST', body: { email } }).catch((err) => alert(err.message))
    load()
  }

  if (loadError) return <p className="notice error">{loadError}</p>
  if (!data) return <p className="muted">Loading…</p>

  return (
    <div className="credits-admin">
      {!data.mailConfigured && (
        <p className="notice">
          <strong>Preview mode.</strong> Email isn’t set up yet, so nothing is actually sent: each email is
          saved as a file in <code>server/data/outbox/</code> instead. Add your email provider’s SMTP settings to
          .env.local to send for real (see README → Mass email).
        </p>
      )}

      <div className="card form">
        <h2>Write an email</h2>
        <label className="field">
          <span>Subject</span>
          <input value={draft.subject} maxLength={200} onChange={set('subject')} placeholder="New work: the Harbor series" />
        </label>
        <label className="field">
          <span>Message (leave a blank line between paragraphs; links work)</span>
          <textarea rows={10} value={draft.body} onChange={set('body')} placeholder={'Hi friends,\n\nI just finished…'} />
        </label>
        {ready && (
          <div className="email-preview">
            <p className="muted small">Preview</p>
            <h3>{draft.subject}</h3>
            <p>{draft.body}</p>
            <p className="muted small">Each email ends with a “View the gallery” button and an unsubscribe link.</p>
          </div>
        )}
        {msg && <p className={`notice ${msg.ok ? 'success' : 'error'}`}>{msg.text}</p>}
        <div className="toolbar">
          <button className="btn ghost" disabled={!ready || busy} onClick={sendTest}>Send a test to me</button>
          <button className="btn primary" disabled={!ready || busy || count === 0 || isSending} onClick={sendAll}>
            Send to {count} subscriber{count === 1 ? '' : 's'}
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Sent emails</h2>
        {data.campaigns.length === 0 ? (
          <p className="muted">Nothing sent yet.</p>
        ) : (
          <ul className="history">
            {data.campaigns.map((c) => (
              <li key={c.id} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span>
                    <strong>{c.subject}</strong>
                    <span className="muted small"> · {new Date(c.createdAt).toLocaleString()}{c.previewOnly ? ' · preview only' : ''}</span>
                  </span>
                  <span className={c.failed ? 'neg' : 'pos'}>
                    {c.status === 'sending' ? 'Sending…' : c.status === 'stopped' ? 'Stopped' : 'Sent'} {c.sent}/{c.total}
                    {c.failed > 0 && ` · ${c.failed} failed`}
                  </span>
                </div>
                {c.status === 'sending' && (
                  <div className="progress"><span style={{ width: `${(100 * (c.sent + c.failed)) / Math.max(c.total, 1)}%` }} /></div>
                )}
                {c.failures?.length > 0 && (
                  <p className="muted small">Failed: {c.failures.map((f) => `${f.email} (${f.error})`).join(', ')}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <div className="section-head" style={{ marginBottom: 12 }}>
          <h2>Subscribers ({count})</h2>
          {count > 0 && <button className="btn ghost small" onClick={() => downloadCsv(data.subscribers)}>Download CSV</button>}
        </div>
        <form className="inline-form" onSubmit={addSubscriber}>
          <input type="email" required placeholder="Add someone who asked to join" value={newSub} onChange={(e) => setNewSub(e.target.value)} />
          <button className="btn ghost">Add</button>
        </form>
        {count === 0 ? (
          <p className="muted">No subscribers yet. Visitors can sign up in the site footer or when creating an account.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Email</th><th>Name</th><th>Since</th><th></th></tr></thead>
              <tbody>
                {data.subscribers.map((s) => (
                  <tr key={s.email}>
                    <td>{s.email}</td>
                    <td>{s.name}</td>
                    <td>{new Date(s.subscribedAt).toLocaleDateString()}</td>
                    <td><button className="btn danger small" onClick={() => removeSubscriber(s.email)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
