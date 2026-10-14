import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useStore, markSold } from '../store/store.js'
import { money } from '../config.js'
import { api } from '../api.js'
import { useAuth } from '../auth/AuthContext.jsx'
import PayPalCheckout from '../components/PayPalCheckout.jsx'
import ApplePayButton from '../components/ApplePayButton.jsx'

export default function ArtworkPage() {
  const { id } = useParams()
  const { pathname } = useLocation()
  const artwork = useStore((s) => s.artworks.find((a) => a.id === id))
  const { user, setUser } = useAuth()

  const [useCredits, setUseCredits] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [receipt, setReceipt] = useState(null)

  if (!artwork) {
    return (
      <section className="container section narrow">
        <h1>Artwork not found</h1>
        <Link to="/gallery" className="btn primary">Back to the gallery</Link>
      </section>
    )
  }

  const available = user?.credits ?? 0
  const creditsUsed = useCredits ? Math.min(available, artwork.price) : 0
  const total = Math.round((artwork.price - creditsUsed) * 100) / 100

  async function complete(payment = {}) {
    setError('')
    setBusy(true)
    // Snapshot the order details before the piece is marked sold.
    const summary = { title: artwork.title, creditsUsed, amountPaid: total, ...payment }
    try {
      const result = await api('/api/orders/complete', {
        method: 'POST',
        body: {
          artworkId: artwork.id,
          title: artwork.title,
          price: artwork.price,
          creditsUsed,
          amountPaid: total,
          paypalOrderId: payment.paypalOrderId,
          payer: payment.payer,
          payerEmail: payment.payerEmail,
        },
      })
      if (result.user) setUser(result.user)
      markSold(artwork.id)
      setReceipt(summary)
    } catch (err) {
      if (total > 0 && payment.paypalOrderId) {
        // The buyer has already paid; don't leave them without a receipt.
        markSold(artwork.id)
        setReceipt({ ...summary, warning: err.message })
      } else {
        setError(err.message)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="container section artwork-page">
      <Link to="/gallery" className="back">← Gallery</Link>
      <div className="artwork-layout">
        <div className="artwork-image">
          <img src={artwork.image} alt={artwork.title} />
        </div>
        <div className="artwork-info">
          <h1>{artwork.title}</h1>
          <p className="muted">
            {[artwork.medium, artwork.size, artwork.year].filter(Boolean).join(' · ')}
          </p>
          <p className="price large">{money(artwork.price)}</p>
          <p className="description">{artwork.description}</p>

          {receipt ? (
            <div className="notice success">
              <h3>Thank you!</h3>
              <p>
                “{receipt.title}” is yours.{' '}
                {receipt.creditsUsed > 0 && <>{money(receipt.creditsUsed)} in credits applied. </>}
                {receipt.amountPaid > 0 && <>{money(receipt.amountPaid)} paid. </>}
              </p>
              {receipt.paypalOrderId && <p className="muted">PayPal order {receipt.paypalOrderId}</p>}
              {receipt.warning && (
                <p className="muted">
                  Your payment went through, but we couldn’t save the order ({receipt.warning}).
                  Please keep the PayPal order number above.
                </p>
              )}
              <p>We’ll be in touch about shipping.</p>
              {user && <Link to="/account">View my purchases</Link>}
            </div>
          ) : artwork.sold ? (
            <div className="notice">This piece has found a home. Browse the gallery for available work.</div>
          ) : (
            <div className="checkout">
              <h2>Buy this piece</h2>
              {user ? (
                available > 0 && (
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={useCredits}
                      onChange={(e) => setUseCredits(e.target.checked)}
                    />
                    Use my credits ({money(available)} available)
                  </label>
                )
              ) : (
                <p className="muted small">
                  Have store credits? <Link to={`/login?next=${encodeURIComponent(pathname)}`}>Sign in</Link> to use them.
                </p>
              )}
              <dl className="totals">
                <div><dt>Price</dt><dd>{money(artwork.price)}</dd></div>
                {creditsUsed > 0 && (
                  <div><dt>Credits</dt><dd>−{money(creditsUsed)}</dd></div>
                )}
                <div className="total"><dt>Total</dt><dd>{money(total)}</dd></div>
              </dl>

              {error && <p className="notice error">{error}</p>}

              {total > 0 ? (
                <div className="pay-options">
                  <ApplePayButton artwork={artwork} total={total} onPaid={complete} onError={setError} />
                  <PayPalCheckout artwork={artwork} total={total} onPaid={complete} onError={setError} />
                </div>
              ) : (
                <button className="btn primary block" disabled={busy} onClick={() => complete()}>
                  {busy ? 'One moment…' : 'Complete purchase with credits'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
