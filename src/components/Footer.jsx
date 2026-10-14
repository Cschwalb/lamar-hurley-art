import { SITE_NAME, SITE_TAGLINE } from '../config.js'
import SubscribeForm from './SubscribeForm.jsx'

const YEAR = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div>
          <p>
            © {YEAR} {SITE_NAME} · {SITE_TAGLINE}
          </p>
          <p className="muted">All works are originals. Payments are processed securely by PayPal.</p>
        </div>
        <SubscribeForm />
      </div>
    </footer>
  )
}
