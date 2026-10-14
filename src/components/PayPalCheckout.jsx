import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js'
import { CURRENCY } from '../config.js'

// Renders PayPal Smart Buttons for a single artwork purchase.
//
// NOTE: orders are created and captured in the browser here, which is fine
// for a sandbox demo. In production, create and capture orders on your server
// (PayPal Orders v2 API) so the price can't be tampered with. See README.
export default function PayPalCheckout({ artwork, total, onPaid, onError }) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer()

  if (isRejected) {
    return (
      <p className="notice error">
        PayPal couldn’t load. Check your internet connection and the VITE_PAYPAL_CLIENT_ID setting.
      </p>
    )
  }
  if (isPending) return <p className="muted">Loading PayPal…</p>

  return (
    <PayPalButtons
      style={{ layout: 'vertical', shape: 'rect', color: 'gold', label: 'pay' }}
      forceReRender={[artwork.id, total]}
      createOrder={(_data, actions) =>
        actions.order.create({
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: artwork.id,
              description: `${artwork.title} (original artwork)`.slice(0, 127),
              amount: { currency_code: CURRENCY, value: total.toFixed(2) },
            },
          ],
        })
      }
      onApprove={async (_data, actions) => {
        const details = await actions.order.capture()
        const payer = details.payer?.name
        onPaid({
          paypalOrderId: details.id,
          payer: payer ? `${payer.given_name ?? ''} ${payer.surname ?? ''}`.trim() : '',
          payerEmail: details.payer?.email_address ?? '',
        })
      }}
      onError={(err) => {
        console.error(err)
        onError?.('Something went wrong with PayPal. You have not been charged.')
      }}
    />
  )
}
