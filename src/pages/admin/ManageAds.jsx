import { useState } from 'react'
import { useStore, addAd, updateAd, deleteAd } from '../../store/store.js'
import { fileToResizedDataUrl } from './imageUtils.js'

const empty = { text: '', linkLabel: '', linkUrl: '', image: '' }

export default function ManageAds() {
  const ads = useStore((s) => s.ads)
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setForm((f) => ({ ...f, image: '' }))
      const image = await fileToResizedDataUrl(file, 240, 0.85)
      setForm((f) => ({ ...f, image }))
    } catch (err) {
      setError(err.message)
    }
  }

  function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      addAd({ ...form, text: form.text.trim(), linkUrl: form.linkUrl.trim() })
      setForm(empty)
      e.target.reset()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="credits-admin">
      <form className="card form" onSubmit={onSubmit}>
        <h2>New ad</h2>
        <p className="muted small">
          Active ads rotate in the banner at the bottom of every public page.
        </p>
        <label className="field">
          <span>Message *</span>
          <input required maxLength={160} value={form.text} onChange={set('text')} placeholder="Spring show opens May 3rd at the Riverside Gallery" />
        </label>
        <div className="row">
          <label className="field">
            <span>Button text</span>
            <input value={form.linkLabel} onChange={set('linkLabel')} placeholder="Learn more" />
          </label>
          <label className="field">
            <span>Link (https://… or a page like /gallery)</span>
            <input value={form.linkUrl} onChange={set('linkUrl')} placeholder="https://example.com" />
          </label>
        </div>
        <label className="field">
          <span>Small image or logo (optional)</span>
          <input type="file" accept="image/*" onChange={onFile} />
        </label>
        {form.image && <img className="ad-image" src={form.image} alt="Preview" />}
        {error && <p className="notice error">{error}</p>}
        <button className="btn primary">Add ad</button>
      </form>

      <div className="card">
        <h2>Ads</h2>
        {ads.length === 0 ? (
          <p className="muted">No ads yet. The banner is hidden until you add one.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th></th><th>Message</th><th>Link</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {ads.map((ad) => (
                  <tr key={ad.id}>
                    <td>{ad.image && <img className="thumb" src={ad.image} alt="" />}</td>
                    <td>{ad.text}</td>
                    <td className="small">{ad.linkUrl ? `${ad.linkLabel || 'Learn more'} → ${ad.linkUrl}` : '—'}</td>
                    <td>
                      <button className="btn ghost small" onClick={() => updateAd(ad.id, { active: !ad.active })}>
                        {ad.active ? 'Showing · pause' : 'Paused · show'}
                      </button>
                    </td>
                    <td>
                      <button className="btn danger small" onClick={() => confirm('Delete this ad?') && deleteAd(ad.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
