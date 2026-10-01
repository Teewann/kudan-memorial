import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, isLoggedIn } from '../lib/api';
export default function Announcements() {
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const loggedIn = isLoggedIn();
    useEffect(() => {
        setLoading(true);
        setError(null);
        api(`/api/announcements?page=${page}&limit=${limit}`)
            .then((res) => setItems(res.items))
            .catch(() => setError('Could not load announcements.'))
            .finally(() => setLoading(false));
    }, [page, limit]);
    return (_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }, children: [_jsx("h1", { style: { margin: 0 }, children: "Announcements" }), loggedIn && (_jsx(Link, { to: "/announcements/new", className: "btn", style: { marginLeft: 'auto' }, children: "Post announcement" }))] }), loading && _jsx("div", { className: "skeleton" }), error && _jsx("p", { className: "error", children: error }), !loading && !error && items.length === 0 && (_jsx("p", { className: "muted", children: "No announcements right now." })), items.map((a) => (_jsxs(Link, { to: `/announcements/${a.id}`, className: "card", style: { display: 'block', color: 'inherit', textDecoration: 'none' }, children: [_jsx("h2", { style: { marginBottom: 4 }, children: a.name }), _jsxs("div", { className: "muted", style: { fontSize: '0.9rem', marginBottom: 8 }, children: ["Died ", new Date(a.dateOfDeath).toLocaleDateString()] }), a.burialPlace && _jsxs("p", { style: { margin: 0 }, children: [_jsx("strong", { children: "Burial:" }), " ", a.burialPlace] }), a.burialTime && _jsxs("p", { style: { margin: 0 }, children: [_jsx("strong", { children: "Time:" }), " ", a.burialTime] })] }, a.id))), items.length === limit && (_jsxs("div", { className: "pagination", children: [_jsx("button", { className: "btn secondary", disabled: page <= 1, onClick: () => setPage((p) => Math.max(1, p - 1)), children: "Previous" }), _jsxs("span", { children: ["Page ", page] }), _jsx("button", { className: "btn secondary", onClick: () => setPage((p) => p + 1), children: "Next" })] }))] }));
}
