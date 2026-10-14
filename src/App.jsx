import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import AdBanner from './components/AdBanner.jsx'
import Home from './pages/Home.jsx'
import Gallery from './pages/Gallery.jsx'
import ArtworkPage from './pages/ArtworkPage.jsx'
import Account from './pages/account/Account.jsx'
import AuthForm from './pages/account/AuthForm.jsx'
import Admin from './pages/admin/Admin.jsx'
import NotFound from './pages/NotFound.jsx'
import Unsubscribe from './pages/Unsubscribe.jsx'

export default function App() {
  return (
    <div className="app">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/art/:id" element={<ArtworkPage />} />
          <Route path="/login" element={<AuthForm mode="login" key="login" />} />
          <Route path="/signup" element={<AuthForm mode="signup" key="signup" />} />
          <Route path="/account" element={<Account />} />
          <Route path="/credits" element={<Navigate to="/account" replace />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <AdBanner />
    </div>
  )
}
