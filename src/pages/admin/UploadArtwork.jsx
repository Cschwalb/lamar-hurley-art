import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addArtwork } from '../../store/store.js'
import { fileToResizedDataUrl } from './imageUtils.js'

const empty = { title: '', price: '', medium: '', size: '', year: '', description: '' }

export default function UploadArtwork() {
  const navigate = useNavigate()
  const [form, setForm] = useState(empty)
  const [image, setImage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setBusy(true)
    try {
      setImage(await fileToResizedDataUrl(file))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (!image) return setError('Please choose an image.')
    if (!(Number(form.price) > 0)) return setError('Please enter a price above zero.')
    try {
      const art = addArtwork({ ...form, year: form.year ? Number(form.year) : '', image })
      navigate(`/art/${art.id}`)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form className="card form upload" onSubmit={onSubmit}>
      <div className="upload-grid">
        <label className="dropzone">
          {image ? <img src={image} alt="Preview" /> : <span>{busy ? 'Processing…' : 'Choose an image'}</span>}
          <input type="file" accept="image/*" onChange={onFile} />
        </label>
        <div className="fields">
          <label className="field">
            <span>Title *</span>
            <input required value={form.title} onChange={set('title')} />
          </label>
          <label className="field">
            <span>Price *</span>
            <input required type="number" min="1" step="0.01" value={form.price} onChange={set('price')} />
          </label>
          <div className="row">
            <label className="field">
              <span>Medium</span>
              <input value={form.medium} placeholder="Oil on canvas" onChange={set('medium')} />
            </label>
            <label className="field">
              <span>Size</span>
              <input value={form.size} placeholder="24 × 36 in" onChange={set('size')} />
            </label>
            <label className="field">
              <span>Year</span>
              <input type="number" value={form.year} onChange={set('year')} />
            </label>
          </div>
          <label className="field">
            <span>Description</span>
            <textarea rows={4} value={form.description} onChange={set('description')} />
          </label>
          {error && <p className="notice error">{error}</p>}
          <button className="btn primary" disabled={busy}>Publish to gallery</button>
        </div>
      </div>
    </form>
  )
}
