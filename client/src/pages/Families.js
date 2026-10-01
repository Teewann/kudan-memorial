import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
export default function Families() {
    const [items, setItems] = useState(null);
    useEffect(() => {
        api('/api/families').then((r) => setItems(r.items)).catch(() => setItems([]));
    }, []);
    return (_jsxs("div", { children: [_jsx("h1", { children: "Families" }), _jsx(Link, { to: "/families/new", className: "btn", style: { marginBottom: '1rem', display: 'inline-flex' }, children: "Register a Family" }), items === null && _jsx("div", { className: "skeleton" }), items?.length === 0 && _jsx("p", { children: "No families registered yet." }), items?.map((f) => (_jsxs(Link, { to: `/families/${f.id}`, className: "card", style: { display: 'block', textDecoration: 'none', color: 'inherit' }, children: [_jsx("strong", { children: f.name }), _jsx("div", { className: "badge", children: f.ward }), _jsxs("div", { style: { color: 'var(--color-gray)' }, children: [f.memberCount, " member(s) recorded"] })] }, f.id)))] }));
}
