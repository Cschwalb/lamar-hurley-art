# LaMar Huley · Distinctive Artist

A React website to showcase and sell original artwork, with PayPal and Apple Pay
checkout, customer accounts with store credits, a newsletter / mass emailer, and an admin
panel for uploading work, giving out credits, running ads and emailing subscribers.

## Quick start

```bash
npm install
cp .env.example .env.local   # then edit values
npm run dev                  # site on http://localhost:5173, API on :3001
```

`npm run dev` starts two things together: the website (Vite) and the API server
(`server/index.js`) that handles accounts, credits, orders and Apple Pay.

**Becoming the admin:** put your email in `ADMIN_EMAILS` in `.env.local`, restart
`npm run dev`, then create an account on the site with that email. The Admin
link appears in the menu once you're signed in. `npm run build` then `npm start`
serves the built site and the API from one Node process.

## What's included

| Page | Path | What it does |
| --- | --- | --- |
| Home | `/` | Hero piece and three available works |
| Gallery | `/gallery` | All artwork, filter (all / available / sold) and sort by date or price |
| Artwork | `/art/:id` | Large image, details, and checkout: signed-in buyers can apply credits, then pay the rest with Apple Pay or PayPal (guests can buy too) |
| Sign up / Sign in | `/signup`, `/login` | Customer accounts (email + password) |
| My account | `/account` | Credit balance and history, purchases, email subscription, name, password |
| Unsubscribe | `/unsubscribe` | Opened from the link in every email |
| Admin | `/admin` | Admin accounts only: upload artwork, edit prices / mark sold / delete, give or remove credits, view orders, manage ads, email subscribers |

**Ad banner:** a banner fixed to the bottom of every public page (hidden in the
admin panel). Active ads rotate every 8 seconds; visitors can close it for the
rest of their visit. Add, pause or delete ads in Admin → Ads. Links starting with
`/` open a page on this site; full `https://` links open in a new tab.

**Credits:** one credit = 1 unit of currency (e.g. $1) off a purchase. The admin
grants credits to an email address (it doesn't need an account yet; the credits
are there when that person signs up). At checkout, signed-in buyers can apply
their credits, and the server deducts them. If credits cover the whole price, the
order completes without PayPal.

## Configuration (`.env.local`)

| Variable | Default | Notes |
| --- | --- | --- |
| `VITE_PAYPAL_CLIENT_ID` | `test` | Your PayPal REST app client ID. `test` uses PayPal's public sandbox. |
| `VITE_CURRENCY` | `USD` | Currency for prices and PayPal orders. |
| `ADMIN_EMAILS` | | Server only. Comma-separated emails whose accounts are admins. |
| `VITE_ENABLE_APPLE_PAY` | `false` | Show the Apple Pay button (see Apple Pay below). |
| `PAYPAL_CLIENT_SECRET` | | Server only. Your PayPal app secret. Never prefix with `VITE_`. |
| `PAYPAL_ENV` | `sandbox` | Server only. `sandbox` or `live`. |
| `API_PORT` | `3001` | Server only. Port for `server/index.js`. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | | Server only. Email sending (see Mass email). Empty = preview mode. |
| `SITE_URL` | `http://localhost:5173` | Server only. Public site address, used in email links. |
| `DB_FILE` | `server/data/db.json` | Server only. Where accounts, credits and orders are saved. |

To test payments, create a sandbox app at
<https://developer.paypal.com/dashboard/applications>, put its client ID in
`.env.local`, and pay with a sandbox buyer account.

## Mass email

Visitors join the email list from the form in the site footer, by ticking the box
when they create an account, or from My account. In **Admin → Emails** you can
write an email, send yourself a test, then send it to every subscriber. Each email
uses the site's look, ends with a "View the gallery" button, and has an
unsubscribe link (plus the `List-Unsubscribe` header, so Gmail and Apple Mail show
their own Unsubscribe button). You can also add or remove subscribers and
download the list as a CSV.

**Preview mode:** until email is set up, nothing is actually sent. Each email is
saved as an `.eml` file in `server/data/outbox/`, which you can open in any mail app.

**To send for real**, add your email provider's SMTP settings to `.env.local`:

```
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
MAIL_FROM=LaMar Huley <studio@yourdomain.com>
SITE_URL=https://yourdomain.com
```

For more than a few dozen people, use a sending service (Brevo, Mailgun,
SendGrid, Amazon SES, Postmark) rather than a personal Gmail account, which
limits daily sends and may flag bulk mail. Set up SPF and DKIM for your domain
as the provider describes so emails don't land in spam. Emails are sent one at a
time; progress shows in the Emails tab.

## Apple Pay

Apple Pay runs through your PayPal account, so payments land in the same place
as PayPal payments. The button only appears in Safari on Apple devices that have
Apple Pay set up; everyone else sees the PayPal buttons as before.

Because Apple Pay orders must be created on a server, it needs more setup than
plain PayPal:

1. In the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications),
   open your app → Features and turn on **Apple Pay** (sandbox and live).
   PayPal may ask you to complete Apple Pay onboarding for your business account.
2. Put the app's client ID and secret in `.env.local`
   (`VITE_PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`) and set `VITE_ENABLE_APPLE_PAY=true`.
3. Download PayPal's domain association file (link on the
   [Apple Pay integration page](https://developer.paypal.com/docs/checkout/apm/apple-pay/))
   and save it, with no file extension, as
   `public/.well-known/apple-developer-merchantid-domain-association`.
4. Deploy over **HTTPS** and register your domain in the dashboard
   (your app → Features → Apple Pay → Manage → Add Domain).
   Apple Pay never works on `http://localhost`.
5. To test in sandbox you also need an Apple sandbox tester account with a test
   card in Wallet (see PayPal's guide above).

Code: `src/components/ApplePayButton.jsx` (button and payment sheet) and
`server/index.js` (`POST /api/orders`, `POST /api/orders/:id/capture`).

## Project structure

```
server/
  index.js               API routes: accounts, admin, orders, PayPal/Apple Pay
  auth.js                Password hashing (scrypt), session cookies, admin check
  db.js                  JSON-file database (server/data/db.json)
  paypal.js              PayPal Orders v2 calls (uses your secret)
  mailer.js              Email template and sending (SMTP or preview outbox)
  env.js                 Loads .env / .env.local
src/
  main.jsx               App entry: router, accounts, PayPal script provider
  api.js                 fetch helper for the API server
  auth/AuthContext.jsx   Signed-in user, sign in / sign up / sign out
  App.jsx                Routes
  config.js              Env settings and money formatting
  index.css              All styles
  store/
    store.js             Artworks and ads (browser localStorage for now)
    seed.js              Sample artworks and ads
    placeholderArt.js    Generates abstract placeholder images
  components/
    Header, Footer, SubscribeForm, ArtCard, PayPalCheckout, ApplePayButton, AdBanner
  pages/
    Home, Gallery, ArtworkPage, Unsubscribe, NotFound
    account/
      AuthForm.jsx       Sign in and sign up
      Account.jsx        My account
    admin/
      Admin.jsx          Admin-only gate + tabs
      UploadArtwork.jsx  Image upload (resized in browser) + details
      ManageArtworks.jsx Edit price, mark sold, delete
      ManageCredits.jsx  Give/remove credits, balances, history
      Orders.jsx         Completed sales
      ManageAds.jsx      Bottom-banner ads
      ManageEmails.jsx   Write/send emails, subscriber list
```

## How data is stored right now

- **On the server** (`server/data/db.json`): accounts (passwords are hashed),
  sign-in sessions, credit balances and history, orders, email subscribers and
  sent emails. Back this file up;
  it's not in git.
- **In the browser** (`localStorage`, `src/store/store.js`): artworks, uploaded
  images and ads. These only exist in the browser that made the change, so an
  artwork uploaded on the artist's laptop is not yet visible to other visitors,
  and storage is limited to about 5 MB of images.
- The server trusts the artwork price the browser sends, because artworks aren't
  on the server yet. Credit balances and PayPal payments (when PayPal is
  configured) are checked on the server.

## Going to production

To sell for real, the remaining steps are:

1. **Move artworks and ads to the server** so every visitor sees uploads, and so
   the server looks up prices itself and marks pieces sold.
2. **Image storage** (Supabase Storage, S3, Cloudinary): upload originals there,
   save the URL on the artwork.
3. **A real database** once there are many customers: swap `server/db.js` for
   Postgres or SQLite (the rest of the server only uses `db.get()` / `db.update()`).
4. **Password reset by email** (can reuse the SMTP settings from Mass email).
5. **Server-side PayPal buttons**: switch `PayPalCheckout.jsx`'s `createOrder` /
   `onApprove` to the `/api/paypal/orders` endpoints Apple Pay already uses.
6. **Hosting**: `npm run build && npm start` runs everything on one Node host
   (Render, Railway, Fly.io, a VPS) behind HTTPS, with a persistent disk for
   `server/data/`.
