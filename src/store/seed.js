import { placeholderArt } from './placeholderArt.js'

// Sample pieces shown on first load. Replace them from the admin panel
// (delete these, upload real photos) or edit this file.
export const seedArtworks = [
  {
    id: 'seed-1',
    title: 'Harbor at Dusk',
    medium: 'Acrylic on canvas',
    size: '24 × 30 in',
    year: 2025,
    price: 850,
    description:
      'Warm evening light folding over still water. Layered acrylic washes with a heavy palette-knife finish.',
    image: placeholderArt(11, ['#1f2a44', '#e07a5f', '#f2cc8f', '#3d405b', '#81b29a']),
    sold: false,
    createdAt: '2025-03-01T00:00:00.000Z',
  },
  {
    id: 'seed-2',
    title: 'Southern Rhythm',
    medium: 'Oil on canvas',
    size: '36 × 48 in',
    year: 2024,
    price: 1600,
    description:
      'A study in movement and sound, inspired by Sunday mornings and brass bands rolling down the avenue.',
    image: placeholderArt(42, ['#f4ede1', '#c1121f', '#003049', '#fdf0d5', '#669bbc']),
    sold: false,
    createdAt: '2025-02-01T00:00:00.000Z',
  },
  {
    id: 'seed-3',
    title: 'Garden Memory',
    medium: 'Mixed media',
    size: '18 × 24 in',
    year: 2025,
    price: 540,
    description: 'Pressed textures and soft greens recalling a grandmother’s backyard in early spring.',
    image: placeholderArt(7, ['#e9edc9', '#588157', '#a3b18a', '#344e41', '#dda15e']),
    sold: false,
    createdAt: '2025-01-15T00:00:00.000Z',
  },
  {
    id: 'seed-4',
    title: 'Night Market',
    medium: 'Acrylic on panel',
    size: '20 × 20 in',
    year: 2023,
    price: 720,
    description: 'Neon reflections and crowded stalls, painted from sketches made on location.',
    image: placeholderArt(99, ['#10002b', '#ff006e', '#ffbe0b', '#3a86ff', '#8338ec']),
    sold: true,
    createdAt: '2024-11-01T00:00:00.000Z',
  },
  {
    id: 'seed-5',
    title: 'Quiet Stone',
    medium: 'Oil on linen',
    size: '16 × 20 in',
    year: 2024,
    price: 450,
    description: 'Muted earth tones and a single warm accent. A meditation on patience.',
    image: placeholderArt(5, ['#ede0d4', '#7f5539', '#b08968', '#9c6644', '#ddb892']),
    sold: false,
    createdAt: '2024-10-01T00:00:00.000Z',
  },
  {
    id: 'seed-6',
    title: 'Blue Hour',
    medium: 'Watercolor on paper',
    size: '12 × 16 in',
    year: 2025,
    price: 320,
    description: 'The fleeting minutes after sunset, captured in quick transparent layers.',
    image: placeholderArt(23, ['#caf0f8', '#0077b6', '#03045e', '#90e0ef', '#00b4d8']),
    sold: false,
    createdAt: '2025-04-01T00:00:00.000Z',
  },
]


// Ads shown in the banner at the bottom of every public page.
export const seedAds = [
  {
    id: 'ad-1',
    text: 'Commissions are open: get an original piece made just for your space.',
    linkLabel: 'Browse the gallery',
    linkUrl: '/gallery',
    image: '',
    active: true,
  },
  {
    id: 'ad-2',
    text: 'Collectors earn store credit on every referral. Check your balance anytime.',
    linkLabel: 'My account',
    linkUrl: '/account',
    image: '',
    active: true,
  },
]
