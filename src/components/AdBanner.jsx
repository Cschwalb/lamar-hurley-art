import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useStore } from '../store/store.js'

const ROTATE_MS = 8000
const DISMISS_KEY = 'lh-ad-dismissed'

function readDismissed() {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

function AdLink({ ad }) {
  if (!ad.linkUrl) return null
  const label = ad.linkLabel || 'Learn more'
  // Internal paths stay in the app; anything else opens in a new tab.
  return ad.linkUrl.startsWith('/') ? (
    <Link to={ad.linkUrl} className="btn primary small">{label}</Link>
  ) : (
    <a href={ad.linkUrl} className="btn primary small" target="_blank" rel="noopener noreferrer sponsored">
      {label}
    </a>
  )
}

// Advertising banner fixed to the bottom of every public page.
// Ads are managed in Admin → Ads and rotate every few seconds.
export default function AdBanner() {
  const { pathname } = useLocation()
  const ads = useStore((s) => s.ads)
  const active = ads.filter((a) => a.active)
  const [index, setIndex] = useState(0)
  const [dismissed, setDismissed] = useState(readDismissed)

  useEffect(() => {
    if (active.length < 2) return
    const t = setInterval(() => setIndex((i) => i + 1), ROTATE_MS)
    return () => clearInterval(t)
  }, [active.length])

  if (dismissed || active.length === 0 || pathname.startsWith('/admin')) return null

  const ad = active[index % active.length]

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // Dismissal just won't survive a reload.
    }
    setDismissed(true)
  }

  return (
    <>
      {/* Spacer so the fixed banner never covers the footer. */}
      <div className="ad-spacer" aria-hidden="true" />
      <aside className="ad-banner" aria-label="Advertisement">
        <div className="container ad-inner">
          <span className="ad-label">Ad</span>
          {ad.image && <img className="ad-image" src={ad.image} alt="" />}
          <p className="ad-text" key={ad.id}>{ad.text}</p>
          <AdLink ad={ad} />
          {active.length > 1 && (
            <div className="ad-dots" role="tablist" aria-label="Choose ad">
              {active.map((a, i) => (
                <button
                  key={a.id}
                  className={i === index % active.length ? 'active' : ''}
                  aria-label={`Ad ${i + 1}`}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>
          )}
          <button className="ad-close" aria-label="Close ad" onClick={dismiss}>×</button>
        </div>
      </aside>
    </>
  )
}
