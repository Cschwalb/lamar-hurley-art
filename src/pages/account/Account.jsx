import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import { api } from '../../api.js'
import { money } from '../../config.js'

export default function Account() {
  const { user, loading, setUser, logout } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [saved, setSaved] = useState('')
  const [pw, setPw] = useState({ current: '', next: '' })
  const [pwMsg, setPwMsg] = useState(null)

  useEffect(() => {
    if (!user) return
    api('/api/account')
      .then((d) => {
        setData(d)
        setName(d.user.name)
      })
      .catch((err) => setError(err.message))
  }, [user])

  if (loading) return <section className="container section narrow"><p className="muted">Loading…</p></section>
  if (!user) return <Navigate to="/login?next=/account" replace />

  async function saveName(e) {
    e.preventDefault()
    try {
      const { user } = await api('/api/account', { method: 'PATCH', body: { name } })
      setUser(user)
      setSaved('Saved.')
    } catch (err) {
      setSaved(err.message)
    }
  }

  async function changePassword(e) {
    e.preventDefault()
    try {
      await api('/api/account/password', { method: 'POST', body: pw })
      setPw({ current: '', next: '' })
      setPwMsg({ ok: true, text: 'Password changed.' })
    } catch (err) {
      setPwMsg({ ok: false, text: err.message })
    }
  }

  return (
    <section className="container section account">
      <div className="section-head">
        <h1>My account</h1>
        <div className="toolbar">
          {user.isAdmin && <Link to="/admin" className="btn ghost small">Admin panel</Link>}
          <button
            className="btn ghost small"
            onClick={async () => {
              await logout()
              navigate('/')
            }}
          >
            Sign out
          </button>
        </div>
      </div>
      {error && <p className="notice error">{error}</p>}

      <div className="account-grid">
        <div className="card">
          <h2>Store credits</h2>
          <p className="balance">{money(user.credits)}</p>
          <p className="muted">Each credit is worth {money(1)} off any piece at checkout.</p>
          {data?.creditLog.length > 0 && (
            <ul className="history">
              {data.creditLog.map((h) => (
                <li key={h.id}>
                  <span>
                    {h.note}
                    <span className="muted small"> · {new Date(h.at).toLocaleDateString()}</span>
                  </span>
                  <span className={h.amount < 0 ? 'neg' : 'pos'}>
                    {h.amount > 0 ? '+' : ''}{money(h.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/gallery" className="btn ghost">Browse the gallery</Link>
        </div>

        <div className="card">
          <h2>My purchases</h2>
          {!data ? (
            <p className="muted">Loading…</p>
          ) : data.orders.length === 0 ? (
            <p className="muted">No purchases yet.</p>
          ) : (
            <ul className="history">
              {data.orders.map((o) => (
                <li key={o.id}>
                  <span>
                    <Link to={`/art/${o.artworkId}`}>{o.artworkTitle}</Link>
                    <span className="muted small"> · {new Date(o.at).toLocaleDateString()}</span>
                  </span>
                  <span>{money(o.price)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2>Emails</h2>
          <label className="check">
            <input
              type="checkbox"
              disabled={!data}
              checked={Boolean(data?.subscribed)}
              onChange={async (e) => {
                const wanted = e.target.checked
                setData((d) => ({ ...d, subscribed: wanted }))
                try {
                  const { subscribed } = await api('/api/account/subscription', {
                    method: 'POST',
                    body: { subscribed: wanted },
                  })
                  setData((d) => ({ ...d, subscribed }))
                } catch (err) {
                  setData((d) => ({ ...d, subscribed: !wanted }))
                  setError(err.message)
                }
              }}
            />
            Email me about new work and shows
          </label>
          <p className="muted small">You can unsubscribe at any time.</p>
        </div>

        <form className="card form" onSubmit={saveName}>
          <h2>Profile</h2>
          <label className="field">
            <span>Email</span>
            <input value={user.email} disabled />
          </label>
          <label className="field">
            <span>Name</span>
            <input value={name} onChange={(e) => { setName(e.target.value); setSaved('') }} />
          </label>
          {saved && <p className="muted small">{saved}</p>}
          <button className="btn primary">Save</button>
        </form>

        <form className="card form" onSubmit={changePassword}>
          <h2>Change password</h2>
          <label className="field">
            <span>Current password</span>
            <input type="password" required autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          </label>
          <label className="field">
            <span>New password (at least 8 characters)</span>
            <input type="password" required minLength={8} autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          </label>
          {pwMsg && <p className={`notice ${pwMsg.ok ? 'success' : 'error'}`}>{pwMsg.text}</p>}
          <button className="btn primary">Change password</button>
        </form>
      </div>
    </section>
  )
}
