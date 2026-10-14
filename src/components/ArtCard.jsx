import { Link } from 'react-router-dom'
import { money } from '../config.js'

export default function ArtCard({ art }) {
  return (
    <Link to={`/art/${art.id}`} className="art-card">
      <div className="art-frame">
        <img src={art.image} alt={art.title} loading="lazy" />
        {art.sold && <span className="badge sold">Sold</span>}
      </div>
      <div className="art-meta">
        <h3>{art.title}</h3>
        <p className="muted">{art.medium}</p>
        <p className="price">{art.sold ? 'Sold' : money(art.price)}</p>
      </div>
    </Link>
  )
}
