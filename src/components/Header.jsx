import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { SITE_NAME, SITE_TAGLINE } from '../config.js'
import { useAuth } from '../auth/AuthContext.jsx'

export default function Header() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand" onClick={close}>
          <span className="brand-name">{SITE_NAME}</span>
          <span className="brand-tag">{SITE_TAGLINE}</span>
        </Link>
        <button
          className="nav-toggle"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          ☰
        </button>
        <nav className={`nav ${open ? 'open' : ''}`}>
          <NavLink to="/gallery" onClick={close}>Gallery</NavLink>
          {user?.isAdmin && <NavLink to="/admin" onClick={close}>Admin</NavLink>}
          {user ? (
            <NavLink to="/account" onClick={close}>
              {user.name ? user.name.split(' ')[0] : 'My account'}
            </NavLink>
          ) : (
            <NavLink to="/login" onClick={close}>Sign in</NavLink>
          )}
        </nav>
      </div>
    </header>
  )
}
