import { useEffect, useState } from 'react'
import { usePayPalScriptReducer } from '@paypal/react-paypal-js'
import { api } from '../api.js'
import { APPLE_PAY_ENABLED, CURRENCY, SITE_NAME } from '../config.js'

const post = (url, body) => api(url, { method: 'POST', body })

// Apple Pay through PayPal. Renders nothing unless Apple Pay is enabled in
// .env.local, the device/browser supports it, and PayPal says the merchant
// account is eligible. Orders are created and captured by server/index.js.
export default function ApplePayButton({ artwork, total, onPaid, onError }) {
  const [{ isResolved }] = usePayPalScriptReducer()
  const [config, setConfig] = useState(null)

  useEffect(() => {
    if (!APPLE_PAY_ENABLED || !isResolved) return
    if (!window.ApplePaySession?.canMakePayments?.() || !window.paypal?.Applepay) return
    let cancelled = false
    window.paypal
      .Applepay()
      .config()
      .then((cfg) => !cancelled && cfg.isEligible && setConfig(cfg))
      .catch((err) => console.warn('Apple Pay not available:', err))
    return () => {
      cancelled = true
    }
  }, [isResolved])

  if (!config) return null

  function startPayment() {
    const applepay = window.paypal.Applepay()
    const session = new window.ApplePaySession(4, {
      countryCode: config.countryCode,
      merchantCapabilities: config.merchantCapabilities,
      supportedNetworks: config.supportedNetworks,
      currencyCode: CURRENCY,
      requiredShippingContactFields: ['name', 'email', 'phone', 'postalAddress'],
      requiredBillingContactFields: ['postalAddress'],
      total: { label: SITE_NAME, type: 'final', amount: total.toFixed(2) },
    })

    session.onvalidatemerchant = (event) => {
      applepay
        .validateMerchant({ validationUrl: event.validationURL, displayName: SITE_NAME })
        .then((result) => session.completeMerchantValidation(result.merchantSession))
        .catch((err) => {
          console.error(err)
          session.abort()
          onError?.('Apple Pay could not verify this store. Please try PayPal instead.')
        })
    }

    session.onpaymentauthorized = async (event) => {
      try {
        const order = await post('/api/paypal/orders', { artworkId: artwork.id, title: artwork.title, amount: total })
        await applepay.confirmOrder({
          orderId: order.id,
          token: event.payment.token,
          billingContact: event.payment.billingContact,
        })
        const capture = await post(`/api/paypal/orders/${order.id}/capture`)
        if (capture.status !== 'COMPLETED') throw new Error(`Payment ${capture.status || 'not completed'}`)
        session.completePayment(window.ApplePaySession.STATUS_SUCCESS)
        const contact = event.payment.shippingContact || {}
        onPaid({
          paypalOrderId: order.id,
          payer: [contact.givenName, contact.familyName].filter(Boolean).join(' '),
          payerEmail: contact.emailAddress || '',
        })
      } catch (err) {
        console.error(err)
        session.completePayment(window.ApplePaySession.STATUS_FAILURE)
        onError?.('Apple Pay payment failed. You have not been charged.')
      }
    }

    session.begin()
  }

  return (
    <button
      type="button"
      className="apple-pay-btn"
      lang="en"
      aria-label="Buy with Apple Pay"
      onClick={startPayment}
    />
  )
}
