import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api.js'

// Opened from the "Unsubscribe" link at the bottom of every email.
export default function Unsubscribe() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [state, setState] = useState(token ? { loading: true } : { error: 'This unsubscribe link is incomplete.' })

  // Only call once, even when React runs effects twice in development.
  const started = useRef(false)
  useEffect(() => {
    if (!token || started.current) return
    started.current = true
    api('/api/unsubscribe', { method: 'POST', body: { token } })
      .then(({ email }) => setState({ email }))
      .catch((err) => setState({ error: err.message }))
  }, [token])

  return (
    <section className="container section narrow">
      <h1>Unsubscribe</h1>
      {state.loading && <p className="muted">One moment…</p>}
      {state.error && <p className="notice error">{state.error}</p>}
      {!state.loading && !state.error && (
        <p>
          {state.email
            ? <>{state.email} won’t get any more emails from us.</>
            : <>You’re already unsubscribed.</>}
        </p>
      )}
      <Link to="/" className="btn ghost">Back to the site</Link>
    </section>
  )
}
