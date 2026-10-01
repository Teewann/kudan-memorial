import { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import DeceasedList from './pages/DeceasedList';
import DeceasedDetail from './pages/DeceasedDetail';
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
        <Link to="/" onClick={closeMenu}>Home</Link>
        <Link to="/deceased" onClick={closeMenu}>Deceased Register</Link>
        <Link to="/families" onClick={closeMenu}>Families</Link>
        <Link to="/announcements" onClick={closeMenu}>Announcements</Link>
        <Link to="/deceased/new" onClick={closeMenu}>Add a Deceased</Link>
        <Link to="/families/new" onClick={closeMenu}>Register a Family</Link>
        {loggedIn && <Link to="/moderation" onClick={closeMenu}>Moderation</Link>}
      </aside>

      {menuOpen && <div className="scrim" onClick={closeMenu} />}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header className="topbar">
          <button
            className="menu-btn"
            aria-label="Menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            ☰
          </button>
          <Link to="/" className="brand">Kudan Memorial</Link>
          <div style={{ marginLeft: 'auto' }}>
            {loggedIn ? (
              <button className="btn secondary" onClick={() => { clearToken(); location.href = '/'; }}>
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
            <Route path="/families" element={<Families />} />
            <Route path="/families/new" element={<AddFamily />} />
            <Route path="/families/:id" element={<FamilyDetail />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/announcements/new" element={<AddAnnouncement />} />
            <Route path="/announcements/:id" element={<AnnouncementDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/moderation" element={<Moderation />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}