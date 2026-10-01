import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsxs("div", { className: "layout", children: [_jsxs("aside", { className: `sidebar ${menuOpen ? 'open' : ''}`, children: [_jsx(Link, { to: "/", onClick: closeMenu, children: "Home" }), _jsx(Link, { to: "/deceased", onClick: closeMenu, children: "Deceased Register" }), _jsx(Link, { to: "/families", onClick: closeMenu, children: "Families" }), _jsx(Link, { to: "/announcements", onClick: closeMenu, children: "Announcements" }), _jsx(Link, { to: "/deceased/new", onClick: closeMenu, children: "Add a Deceased" }), _jsx(Link, { to: "/families/new", onClick: closeMenu, children: "Register a Family" }), loggedIn && _jsx(Link, { to: "/moderation", onClick: closeMenu, children: "Moderation" })] }), menuOpen && _jsx("div", { className: "scrim", onClick: closeMenu }), _jsxs("div", { style: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }, children: [_jsxs("header", { className: "topbar", children: [_jsx("button", { className: "menu-btn", "aria-label": "Menu", onClick: () => setMenuOpen((v) => !v), children: "\u2630" }), _jsx(Link, { to: "/", className: "brand", children: "Kudan Memorial" }), _jsx("div", { style: { marginLeft: 'auto' }, children: loggedIn ? (_jsx("button", { className: "btn secondary", onClick: () => { clearToken(); window.location.href = '/'; }, children: "Log out" })) : (_jsx(Link, { to: "/login", className: "btn secondary", children: "Log in" })) })] }), _jsx("main", { className: "content", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Home, {}) }), _jsx(Route, { path: "/deceased", element: _jsx(DeceasedList, {}) }), _jsx(Route, { path: "/deceased/new", element: _jsx(AddDeceased, {}) }), _jsx(Route, { path: "/deceased/:id", element: _jsx(DeceasedDetail, {}) }), _jsx(Route, { path: "/families", element: _jsx(Families, {}) }), _jsx(Route, { path: "/families/new", element: _jsx(AddFamily, {}) }), _jsx(Route, { path: "/families/:id", element: _jsx(FamilyDetail, {}) }), _jsx(Route, { path: "/announcements", element: _jsx(Announcements, {}) }), _jsx(Route, { path: "/announcements/new", element: _jsx(AddAnnouncement, {}) }), _jsx(Route, { path: "/announcements/:id", element: _jsx(AnnouncementDetail, {}) }), _jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/register", element: _jsx(Register, {}) }), _jsx(Route, { path: "/moderation", element: _jsx(Moderation, {}) })] }) }, location.pathname)] })] }));
}
