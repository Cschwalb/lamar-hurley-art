import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { resetDemoData } from '../../store/store.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import UploadArtwork from './UploadArtwork.jsx'
import ManageArtworks from './ManageArtworks.jsx'
import ManageCredits from './ManageCredits.jsx'
import Orders from './Orders.jsx'
import ManageAds from './ManageAds.jsx'
import ManageEmails from './ManageEmails.jsx'

// Only accounts whose email is listed in ADMIN_EMAILS (.env.local) are admins.
// The server enforces this for credits and orders.
export default function Admin() {
  const { user, loading } = useAuth()

  if (loading) return <section className="container section narrow"><p className="muted">Loading…</p></section>
  if (!user) return <Navigate to="/login?next=/admin" replace />
  if (!user.isAdmin) {
    return (
      <section className="container section narrow">
        <h1>Admin</h1>
        <p className="muted">
          Your account ({user.email}) isn’t an admin. Add it to ADMIN_EMAILS in .env.local and restart the server.
        </p>
        <Link to="/" className="btn primary">Back to the site</Link>
      </section>
    )
  }

  return (
    <section className="container section admin">
      <div className="section-head">
        <h1>Admin</h1>
        <div className="toolbar">
          <button
            className="btn ghost small"
            onClick={() => {
              if (confirm('Reset all artworks and ads to the demo data? (Accounts, credits and orders are not affected.)')) resetDemoData()
            }}
          >
            Reset demo data
          </button>
        </div>
      </div>
      <nav className="tabs">
        <NavLink to="/admin/upload">Upload artwork</NavLink>
        <NavLink to="/admin/artworks">Artworks</NavLink>
        <NavLink to="/admin/credits">Credits</NavLink>
        <NavLink to="/admin/orders">Orders</NavLink>
        <NavLink to="/admin/ads">Ads</NavLink>
        <NavLink to="/admin/emails">Emails</NavLink>
      </nav>
      <Routes>
        <Route index element={<Navigate to="/admin/upload" replace />} />
        <Route path="upload" element={<UploadArtwork />} />
        <Route path="artworks" element={<ManageArtworks />} />
        <Route path="credits" element={<ManageCredits />} />
        <Route path="orders" element={<Orders />} />
        <Route path="ads" element={<ManageAds />} />
        <Route path="emails" element={<ManageEmails />} />
        <Route path="*" element={<Navigate to="/admin/upload" replace />} />
      </Routes>
    </section>
  )
}
