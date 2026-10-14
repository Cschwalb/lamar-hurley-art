import { useEffect, useState } from 'react'
import { api } from '../../api.js'
import { money } from '../../config.js'

export default function Orders() {
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/api/admin/orders').then((d) => setOrders(d.orders)).catch((err) => setError(err.message))
  }, [])

  if (error) return <p className="notice error">{error}</p>
  if (!orders) return <p className="muted">Loading…</p>
  if (orders.length === 0) return <p className="muted">No sales yet.</p>
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr><th>Date</th><th>Artwork</th><th>Buyer</th><th>Credits</th><th>Paid</th><th>PayPal order</th></tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{new Date(o.at).toLocaleDateString()}</td>
              <td>{o.artworkTitle}</td>
              <td>
                {o.payerName || '—'}
                {o.email && <div className="muted small">{o.email}{o.userId ? '' : ' (guest)'}</div>}
              </td>
              <td>{o.creditsUsed ? money(o.creditsUsed) : '—'}</td>
              <td>{money(o.amountPaid)}</td>
              <td className="mono">{o.paypalOrderId || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
