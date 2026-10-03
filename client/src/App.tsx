import { useState } from 'react';
import { Routes, Route, Link, NavLink, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import DeceasedPage from './pages/DeceasedPage';
import DeceasedDetail from './pages/DeceasedDetail';
import EditDeceased from './pages/EditDeceased';
import FamiliesPage from './pages/FamiliesPage';
import FamilyDetail from './pages/FamilyDetail';
import AnnouncementsPage from './pages/AnnouncementsPage';
import AnnouncementDetail from './pages/AnnouncementDetail';
import Gallery from './pages/Gallery';
import Login from './pages/Login';
import Register from './pages/Register';
import Moderation from './pages/Moderation';
import InstallPrompt from './components/InstallPrompt';
import ConfirmDialog from './components/ConfirmDialog';
import { isLoggedIn, clearToken } from './lib/api';

export default function App() {
  const loggedIn = isLoggedIn();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const location = useLocation();

  function closeMenu() { setMenuOpen(false); }

  function doLogout() {
    clearToken();
    window.location.href = '/';
  }

  return (
    <div className="layout">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <img src="/mark.jpg" alt="" />
          <span>Kudan Memorial</span>
        </div>

        <NavLink to="/" end onClick={closeMenu}
          className={({ isActive }) => isActive ? 'active' : ''}>
          Home
        </NavLink>
        <NavLink to="/deceased" onClick={closeMenu}
          className={({ isActive }) => isActive ? 'active' : ''}>
          Deceased Register
        </NavLink>
        <NavLink to="/families" onClick={closeMenu}
          className={({ isActive }) => isActive ? 'active' : ''}>
          Families
        </NavLink>
        <NavLink to="/announcements" onClick={closeMenu}
          className={({ isActive }) => isActive ? 'active' : ''}>
          Announcements
        </NavLink>
        <NavLink to="/gallery" onClick={closeMenu}
          className={({ isActive }) => isActive ? 'active' : ''}>
          Gallery
        </NavLink>

        {loggedIn && (
          <NavLink to="/moderation" onClick={closeMenu}
            className={({ isActive }) => isActive ? 'active' : ''}>
            Moderation
          </NavLink>
        )}

        <div className="sidebar-footer">
          {loggedIn ? (
            <button
              type="button"
              className="sidebar-signout"
              onClick={() => setShowLogout(true)}
            >
              Sign out
            </button>
          ) : (
            <NavLink to="/login" onClick={closeMenu} className="sidebar-signout">
              Log in
            </NavLink>
          )}
        </div>
      </aside>

      {menuOpen && <div className="scrim" onClick={closeMenu} />}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header className="topbar">
          <button
            type="button"
            className="menu-btn"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? '\u2715' : '\u2630'}
          </button>

          <Link to="/" className="brand">Kudan Memorial</Link>

          <div style={{ marginLeft: 'auto' }}>
            {loggedIn ? (
              <button
                type="button"
                className="btn secondary"
                onClick={() => setShowLogout(true)}
              >
                Log out
              </button>
            ) : (
              <Link to="/login" className="btn secondary">Log in</Link>
            )}
          </div>
        </header>

        <main className="content" key={location.pathname}>
          <InstallPrompt />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/stats" element={<Home />} />

            <Route path="/deceased" element={<DeceasedPage />} />
            <Route path="/deceased/new" element={<DeceasedPage />} />
            <Route path="/deceased/:id" element={<DeceasedDetail />} />
            <Route path="/deceased/:id/edit" element={<EditDeceased />} />

            <Route path="/families" element={<FamiliesPage />} />
            <Route path="/families/new" element={<FamiliesPage />} />
            <Route path="/families/:id" element={<FamilyDetail />} />

            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/announcements/new" element={<AnnouncementsPage />} />
            <Route path="/announcements/:id" element={<AnnouncementDetail />} />

            <Route path="/gallery" element={<Gallery />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/moderation" element={<Moderation />} />
            <Route path="*" element={
              <div>
                <h1>Page not found</h1>
                <p className="muted">This page does not exist. Go back to <Link to="/">Home</Link>.</p>
              </div>
            } />
          </Routes>
        </main>

        <footer style={{
          borderTop: '1px solid var(--color-border)',
          padding: '1rem 1.25rem',
          color: 'var(--color-gray)',
          fontSize: '0.875rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <span>Kudan Memorial, Kudan LGA, Kaduna State</span>
          <span style={{ marginLeft: 'auto' }}>
            Developed by Yakubu Ibrahim (T 1)  08135956426 <a href="https://web.facebook.com/Teewannn/" target="_blank" rel="noopener noreferrer">
              Visit my website
            </a>
          </span>
        </footer>
      </div>

      <ConfirmDialog
        open={showLogout}
        title="Log out?"
        message="You will need to log in again with your phone and password."
        confirmLabel="Log out"
        cancelLabel="Cancel"
        danger
        onConfirm={doLogout}
        onCancel={() => setShowLogout(false)}
      />
    </div>
  );
}