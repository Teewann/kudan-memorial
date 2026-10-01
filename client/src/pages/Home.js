import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
export default function Home() {
    const [recent, setRecent] = useState(null);
    const [onThisDay, setOnThisDay] = useState(null);
    const [total, setTotal] = useState(null);
    useEffect(() => {
        api('/api/deceased?limit=6&sort=newest')
            .then((r) => { setRecent(r.items); setTotal(r.total); })
            .catch(() => { setRecent([]); setTotal(0); });
        api('/api/deceased/on-this-day')
            .then((r) => setOnThisDay(r.items))
            .catch(() => setOnThisDay([]));
    }, []);
    return (_jsxs("div", { children: [_jsx("h1", { children: "Kudan Memorial" }), _jsx("p", { children: "A lasting record of the people of Kudan, so the town never forgets." }), _jsxs("div", { style: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', margin: '1.5rem 0' }, children: [_jsx(Link, { to: "/deceased/new", className: "btn", children: "Register a Deceased" }), _jsx(Link, { to: "/families/new", className: "btn secondary", children: "Register a Family" })] }), total !== null && (_jsx("p", { className: "muted", children: total === 0
                    ? 'No records yet. Be the first to register someone.'
                    : `${total} ${total === 1 ? 'person' : 'people'} recorded so far.` })), onThisDay && onThisDay.length > 0 && (_jsxs(_Fragment, { children: [_jsx("h2", { style: { marginTop: '2rem' }, children: "On this day" }), _jsx("p", { className: "muted", children: "Remembering those whose anniversary falls today." }), onThisDay.map((p) => (_jsxs(Link, { to: `/deceased/${p.id}`, className: "list-item", children: [p.photoUrl ? (_jsx("img", { src: p.photoUrl, alt: "", className: "thumb" })) : (_jsx("div", { className: "thumb" })), _jsxs("div", { children: [_jsx("div", { style: { fontWeight: 600 }, children: p.fullName }), _jsxs("div", { className: "meta", children: [p.ward, " \u00B7 died ", new Date(p.dateOfDeath).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })] })] })] }, p.id)))] })), _jsx("h2", { style: { marginTop: '2rem' }, children: "Recently added" }), recent === null && (_jsxs(_Fragment, { children: [_jsx("div", { className: "skeleton" }), _jsx("div", { className: "skeleton" }), _jsx("div", { className: "skeleton" })] })), recent && recent.length === 0 && (_jsx("p", { className: "muted", children: "No records yet. Be the first to register someone." })), recent && recent.map((p) => (_jsxs(Link, { to: `/deceased/${p.id}`, className: "list-item", children: [p.photoUrl ? (_jsx("img", { src: p.photoUrl, alt: "", className: "thumb" })) : (_jsx("div", { className: "thumb" })), _jsxs("div", { children: [_jsx("div", { style: { fontWeight: 600 }, children: p.fullName }), _jsxs("div", { className: "meta", children: [p.ward, " \u00B7 ", p.dateOfDeath] })] })] }, p.id))), _jsx("p", { style: { marginTop: '1rem' }, children: _jsx(Link, { to: "/deceased", children: "See all in the register" }) })] }));
}
