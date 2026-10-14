// Lightweight client-side data store backed by localStorage.
//
// Artworks and ads live here (in the browser) for now. Accounts, credits and
// orders are on the server (server/index.js). See README → "Going to production".

import { useSyncExternalStore } from 'react'
import { seedArtworks, seedAds } from './seed.js'

const STORAGE_KEY = 'lh-art-store-v1'

function initialState() {
  return {
    artworks: seedArtworks,
    ads: seedAds,
  }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const { artworks, ads } = { ...initialState(), ...JSON.parse(raw) }
      return { artworks, ads }
    }
  } catch {
    // Corrupt or unavailable storage: fall back to seed data.
  }
  return initialState()
}

let state = load()
const listeners = new Set()

function setState(updater) {
  const next = updater(state)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch (err) {
    // Most likely the ~5 MB localStorage quota (large uploaded images).
    throw new Error(
      'Could not save: browser storage is full. Try a smaller image, or connect a real backend.',
      { cause: err },
    )
  }
  state = next
  listeners.forEach((l) => l())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Keep multiple open tabs in sync.
window.addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) {
    state = load()
    listeners.forEach((l) => l())
  }
})

export function useStore(selector) {
  return useSyncExternalStore(subscribe, () => selector(state))
}

const newId = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
const round2 = (n) => Math.round(n * 100) / 100

// ---- Artworks -------------------------------------------------------------

export function addArtwork(fields) {
  const artwork = {
    id: newId('art'),
    sold: false,
    createdAt: new Date().toISOString(),
    ...fields,
    price: round2(Number(fields.price)),
  }
  setState((s) => ({ ...s, artworks: [artwork, ...s.artworks] }))
  return artwork
}

export function updateArtwork(id, fields) {
  setState((s) => ({
    ...s,
    artworks: s.artworks.map((a) => (a.id === id ? { ...a, ...fields } : a)),
  }))
}

export function deleteArtwork(id) {
  setState((s) => ({ ...s, artworks: s.artworks.filter((a) => a.id !== id) }))
}

export function markSold(id) {
  updateArtwork(id, { sold: true })
}

// ---- Ads (bottom banner) --------------------------------------------------

export function addAd(fields) {
  const ad = { id: newId('ad'), active: true, image: '', ...fields }
  setState((s) => ({ ...s, ads: [...s.ads, ad] }))
  return ad
}

export function updateAd(id, fields) {
  setState((s) => ({ ...s, ads: s.ads.map((a) => (a.id === id ? { ...a, ...fields } : a)) }))
}

export function deleteAd(id) {
  setState((s) => ({ ...s, ads: s.ads.filter((a) => a.id !== id) }))
}

export function resetDemoData() {
  setState(() => initialState())
}
