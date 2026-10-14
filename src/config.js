export const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test'
export const CURRENCY = import.meta.env.VITE_CURRENCY || 'USD'

export const SITE_NAME = 'LaMar Huley'
export const SITE_TAGLINE = 'Distinctive Artist'

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: CURRENCY })
export const money = (n) => fmt.format(n)

// Apple Pay needs a configured server (server/index.js), a verified domain and
// HTTPS, so it is off until explicitly enabled. See README → Apple Pay.
export const APPLE_PAY_ENABLED = import.meta.env.VITE_ENABLE_APPLE_PAY === 'true'
