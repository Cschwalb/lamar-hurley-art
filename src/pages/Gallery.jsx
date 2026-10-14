import { useMemo, useState } from 'react'
import { useStore } from '../store/store.js'
import ArtCard from '../components/ArtCard.jsx'

const FILTERS = [
  ['all', 'All'],
  ['available', 'Available'],
  ['sold', 'Sold'],
]

export default function Gallery() {
  const artworks = useStore((s) => s.artworks)
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('newest')

  const shown = useMemo(() => {
    let list = artworks
    if (filter === 'available') list = list.filter((a) => !a.sold)
    if (filter === 'sold') list = list.filter((a) => a.sold)
    const sorted = [...list]
    if (sort === 'newest') sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (sort === 'low') sorted.sort((a, b) => a.price - b.price)
    if (sort === 'high') sorted.sort((a, b) => b.price - a.price)
    return sorted
  }, [artworks, filter, sort])

  return (
    <section className="container section">
      <div className="section-head">
        <h1>Gallery</h1>
        <div className="toolbar">
          <div className="segmented" role="group" aria-label="Filter">
            {FILTERS.map(([key, label]) => (
              <button
                key={key}
                className={filter === key ? 'active' : ''}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            <option value="newest">Newest</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </div>
      </div>
      {shown.length === 0 ? (
        <p className="muted">No artwork here yet.</p>
      ) : (
        <div className="grid">
          {shown.map((a) => (
            <ArtCard key={a.id} art={a} />
          ))}
        </div>
      )}
    </section>
  )
}
