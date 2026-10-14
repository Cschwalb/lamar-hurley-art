import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="container section narrow">
      <h1>Page not found</h1>
      <p className="muted">That page doesn’t exist, or the piece has been removed.</p>
      <Link to="/gallery" className="btn primary">Back to the gallery</Link>
    </section>
  )
}
