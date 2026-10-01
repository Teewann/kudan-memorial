import { useState } from 'react';
import { Routes, Route, Link, NavLink, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import DeceasedList from './pages/DeceasedList';
import DeceasedDetail from './pages/DeceasedDetail';
import EditDeceased from './pages/EditDeceased';
import AddDeceased from './pages/AddDeceased';
import Families from './pages/Families';
import FamilyDetail from './pages/FamilyDetail';
import AddFamily from './pages/AddFamily';
import Login from './pages/Login';
import Register from './pages/Register';
import Moderation from './pages/Moderation';
import Announcements from './pages/Announcements';
import AnnouncementDetail from './pages/AnnouncementDetail';
import AddAnnouncement from './pages/AddAnnouncement';
import { isLoggedIn, clearToken } from './lib/api';

export default function App() {
  const loggedIn = isLoggedIn();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  function closeMenu() { setMenuOpen(false); }

  return (
    <div className="layout">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <img src="/mark.svg" alt="" />
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
        <NavLink to="/deceased/new" onClick={closeMenu}
          className={({ isActive }) => isActive ? 'active' : ''}>
          Add a Deceased
        </NavLink>
        <NavLink to="/families/new" onClick={closeMenu}
          className={({ isActive }) => isActive ? 'active' : ''}>
          Register a Family
        </NavLink>
        {loggedIn && (
          <NavLink to="/moderation" onClick={closeMenu}
            className={({ isActive }) => isActive ? 'active' : ''}>
            Moderation
          </NavLink>
        )}
      </aside>

      {menuOpen && <div className="scrim" onClick={closeMenu} />}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header className="topbar">
          <button
            className="menu-btn"
            aria-label="Open menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            &#9776;
          </button>

          <Link to="/" className="brand">
            <img src="/mark.svg" alt="" />
            Kudan Memorial
          </Link>

          <div style={{ marginLeft: 'auto' }}>
            {loggedIn ? (
              <button
                className="btn secondary"
                onClick={() => { clearToken(); window.location.href = '/'; }}
              >
                Log out
              </button>
            ) : (
              <Link to="/login" className="btn secondary">Log in</Link>
            )}
          </div>
        </header>

        <main className="content" key={location.pathname}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/deceased" element={<DeceasedList />} />
            <Route path="/deceased/new" element={<AddDeceased />} />
            <Route path="/deceased/:id" element={<DeceasedDetail />} />
            <Route path="/deceased/:id/edit" element={<EditDeceased />} />
            <Route path="/families" element={<Families />} />
            <Route path="/families/new" element={<AddFamily />} />
            <Route path="/families/:id" element={<FamilyDetail />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/announcements/new" element={<AddAnnouncement />} />
            <Route path="/announcements/:id" element={<AnnouncementDetail />} />
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
            Entries are reviewed before appearing publicly.
          </span>
        </footer>
      </div>
    </div>
  );
}