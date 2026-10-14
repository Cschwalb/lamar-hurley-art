import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api.js'
import { money } from '../../config.js'
import { useAuth } from '../../auth/AuthContext.jsx'

export default function ManageCredits() {
  const { refresh } = useAuth()
  const [data, setData] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [form, setForm] = useState({ email: '', amount: '', note: '' })
  const [msg, setMsg] = useState(null)

  const load = useCallback(() => {
    api('/api/admin/customers').then(setData).catch((err) => setLoadError(err.message))
  }, [])
  useEffect(load, [load])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function onSubmit(e) {
    e.preventDefault()
    try {
      const amt = Number(form.amount)
      await api('/api/admin/credits', { method: 'POST', body: form })
      setMsg({ ok: true, text: `${amt > 0 ? 'Gave' : 'Removed'} ${money(Math.abs(amt))} ${amt > 0 ? 'to' : 'from'} ${form.email}.` })
      setForm({ email: '', amount: '', note: '' })
      load()
      refresh() // in case the admin gave credits to themselves
    } catch (err) {
      setMsg({ ok: false, text: err.message })
    }
  }

  const customers = data?.customers ?? []

  return (
    <div className="credits-admin">
      <form className="card form" onSubmit={onSubmit}>
        <h2>Give credits</h2>
        <p className="muted small">
          Credits go to an email address. If that person doesn’t have an account yet, the credits
          are waiting for them when they sign up with that email.
        </p>
        <div className="row">
          <label className="field">
            <span>Customer email *</span>
            <input type="email" required value={form.email} onChange={set('email')} list="customer-emails" />
            <datalist id="customer-emails">
              {customers.map((c) => <option key={c.email} value={c.email}>{c.name}</option>)}
            </datalist>
          </label>
          <label className="field">
            <span>Amount * (negative to remove)</span>
            <input type="number" step="0.01" required value={form.amount} onChange={set('amount')} />
          </label>
        </div>
        <label className="field">
          <span>Note (the customer sees this)</span>
          <input value={form.note} placeholder="Thank you for the referral" onChange={set('note')} />
        </label>
        {msg && <p className={`notice ${msg.ok ? 'success' : 'error'}`}>{msg.text}</p>}
        <button className="btn primary">Save</button>
      </form>

      {loadError && <p className="notice error">{loadError}</p>}

      <div className="card">
        <h2>Customers</h2>
        {!data ? (
          <p className="muted">Loading…</p>
        ) : customers.length === 0 ? (
          <p className="muted">No customers yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Email</th><th>Name</th><th>Account</th><th>Credits</th></tr></thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.email}>
                    <td>{c.email}</td>
                    <td>{c.name}</td>
                    <td>{c.hasAccount ? `Joined ${new Date(c.joined).toLocaleDateString()}` : <span className="muted">No account yet</span>}</td>
                    <td>{money(c.credits)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Credit history</h2>
        {!data ? null : data.creditLog.length === 0 ? (
          <p className="muted">No credit activity yet.</p>
        ) : (
          <ul className="history">
            {data.creditLog.map((h) => (
              <li key={h.id}>
                <span>
                  {h.email} · {h.note}
                  <span className="muted small"> · {new Date(h.at).toLocaleString()}</span>
                </span>
                <span className={h.amount < 0 ? 'neg' : 'pos'}>{h.amount > 0 ? '+' : ''}{money(h.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
