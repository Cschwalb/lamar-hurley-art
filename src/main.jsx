import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './auth/AuthContext.jsx'
import { PAYPAL_CLIENT_ID, CURRENCY, APPLE_PAY_ENABLED } from './config.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PayPalScriptProvider
      options={{
        clientId: PAYPAL_CLIENT_ID,
        currency: CURRENCY,
        intent: 'capture',
        components: APPLE_PAY_ENABLED ? 'buttons,applepay' : 'buttons',
      }}
      deferLoading={false}
    >
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </PayPalScriptProvider>
  </StrictMode>,
)
