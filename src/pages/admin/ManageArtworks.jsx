import { Link } from 'react-router-dom'
import { useStore, updateArtwork, deleteArtwork } from '../../store/store.js'
import { money } from '../../config.js'

export default function ManageArtworks() {
  const artworks = useStore((s) => s.artworks)

  if (artworks.length === 0) return <p className="muted">No artworks yet. Upload one to get started.</p>

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th></th>
            <th>Title</th>
            <th>Price</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {artworks.map((a) => (
            <tr key={a.id}>
              <td><img className="thumb" src={a.image} alt="" /></td>
              <td><Link to={`/art/${a.id}`}>{a.title}</Link></td>
              <td>
                <input
                  className="price-input"
                  type="number"
                  min="1"
                  step="0.01"
                  defaultValue={a.price}
                  aria-label={`Price for ${a.title}`}
                  onBlur={(e) => {
                    const price = Number(e.target.value)
                    if (price > 0 && price !== a.price) updateArtwork(a.id, { price })
                    else e.target.value = a.price
                  }}
                />
                <span className="muted small"> {money(a.price)}</span>
              </td>
              <td>
                <button className="btn ghost small" onClick={() => updateArtwork(a.id, { sold: !a.sold })}>
                  {a.sold ? 'Sold · mark available' : 'Available · mark sold'}
                </button>
              </td>
              <td>
                <button
                  className="btn danger small"
                  onClick={() => confirm(`Delete “${a.title}”?`) && deleteArtwork(a.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
