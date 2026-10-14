import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'

// Only allow redirects within this site.
function safeNext(next) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/account'
}

export default function AuthForm({ mode }) {
  const isSignup = mode === 'signup'
  const { user, login, signup } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const [form, setForm] = useState({ name: '', email: '', password: '', subscribe: false })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={next} replace />

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const otherQuery = params.get('next') ? `?next=${encodeURIComponent(next)}` : ''

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (isSignup) await signup(form)
      else await login(form.email, form.password)
      navigate(next, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="container section narrow auth-page">
      <h1>{isSignup ? 'Create your account' : 'Sign in'}</h1>
      <p className="muted">
        {isSignup
          ? 'Keep track of your purchases and use store credits from the artist.'
          : 'Welcome back.'}
      </p>
      <form className="card form" onSubmit={onSubmit}>
        {isSignup && (
          <label className="field">
            <span>Name</span>
            <input autoComplete="name" value={form.name} onChange={set('name')} />
          </label>
        )}
        <label className="field">
          <span>Email</span>
          <input type="email" required autoComplete="email" value={form.email} onChange={set('email')} />
        </label>
        <label className="field">
          <span>Password{isSignup && ' (at least 8 characters)'}</span>
          <input
            type="password"
            required
            minLength={isSignup ? 8 : undefined}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            value={form.password}
            onChange={set('password')}
          />
        </label>
        {isSignup && (
          <label className="check">
            <input
              type="checkbox"
              checked={form.subscribe}
              onChange={(e) => setForm((f) => ({ ...f, subscribe: e.target.checked }))}
            />
            Email me about new work and shows
          </label>
        )}
        {error && <p className="notice error">{error}</p>}
        <button className="btn primary" disabled={busy}>
          {busy ? 'One moment…' : isSignup ? 'Create account' : 'Sign in'}
        </button>
        <p className="muted small">
          {isSignup ? (
            <>Already have an account? <Link to={`/login${otherQuery}`}>Sign in</Link></>
          ) : (
            <>New here? <Link to={`/signup${otherQuery}`}>Create an account</Link></>
          )}
        </p>
      </form>
    </section>
  )
}
