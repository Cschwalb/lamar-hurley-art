import { Link } from 'react-router-dom'
import { useStore } from '../store/store.js'
import ArtCard from '../components/ArtCard.jsx'
import { useAuth } from '../auth/AuthContext.jsx'

export default function Home() {
  const artworks = useStore((s) => s.artworks)
  const { user } = useAuth()
  const available = artworks.filter((a) => !a.sold)
  const hero = available[0] ?? artworks[0]
  const featured = available.slice(0, 3)

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <p className="eyebrow">Original works</p>
            <h1>Color, rhythm and memory, painted by hand.</h1>
            <p className="lead">
              Explore the collection of LaMar Huley and bring an original piece home. Every
              work is one of a kind and ships directly from the studio.
            </p>
            <div className="actions">
              <Link to="/gallery" className="btn primary">View the gallery</Link>
              {user ? (
                <Link to="/account" className="btn ghost">My account</Link>
              ) : (
                <Link to="/signup" className="btn ghost">Create an account</Link>
              )}
            </div>
          </div>
          {hero && (
            <Link to={`/art/${hero.id}`} className="hero-art">
              <img src={hero.image} alt={hero.title} />
              <span className="caption">{hero.title}</span>
            </Link>
          )}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="container section">
          <div className="section-head">
            <h2>Available now</h2>
            <Link to="/gallery">See all →</Link>
          </div>
          <div className="grid">
            {featured.map((a) => (
              <ArtCard key={a.id} art={a} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
