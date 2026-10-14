import { useState } from 'react'
import { api } from '../api.js'

// Newsletter sign-up shown in the footer.
export default function SubscribeForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)

  async function onSubmit(e) {
    e.preventDefault()
    setStatus({ busy: true })
    try {
      await api('/api/subscribe', { method: 'POST', body: { email } })
      setEmail('')
      setStatus({ ok: true, text: 'Thanks! You’re on the list.' })
    } catch (err) {
      setStatus({ ok: false, text: err.message })
    }
  }

  return (
    <form className="subscribe" onSubmit={onSubmit}>
      <label htmlFor="subscribe-email">
        <strong>Get emails about new work and shows</strong>
      </label>
      <div className="subscribe-row">
        <input
          id="subscribe-email"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="btn primary" disabled={status?.busy}>Subscribe</button>
      </div>
      {status?.text && <p className={`small ${status.ok ? 'pos' : 'neg'}`}>{status.text}</p>}
    </form>
  )
}
