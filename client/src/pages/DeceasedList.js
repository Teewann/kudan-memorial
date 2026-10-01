import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
export default function DeceasedList() {
    const [items, setItems] = useState(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [sort, setSort] = useState('newest');
    const [q, setQ] = useState('');
    const limit = 20;
    const load = useCallback(() => {
        setItems(null);
        const params = new URLSearchParams({ page: String(page), limit: String(limit), sort });
        if (q)
            params.set('q', q);
        api(`/api/deceased?${params}`)
            .then((r) => { setItems(r.items); setTotal(r.total); })
            .catch(() => setItems([]));
    }, [page, sort, q]);
    useEffect(() => { load(); }, [load]);
    // Debounced search — never fire a request on every keystroke.
    useEffect(() => {
        const t = setTimeout(load, 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q]);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return (_jsxs("div", { children: [_jsx("h1", { children: "Deceased Register" }), _jsx("div", { className: "field", children: _jsx("input", { placeholder: "Search by name\u2026", value: q, onChange: (e) => { setPage(1); setQ(e.target.value); } }) }), _jsx("div", { className: "field", children: _jsxs("select", { value: sort, onChange: (e) => { setPage(1); setSort(e.target.value); }, children: [_jsx("option", { value: "newest", children: "Newest recorded first" }), _jsx("option", { value: "oldest", children: "Oldest recorded first" }), _jsx("option", { value: "dod_newest", children: "Date of death (newest)" }), _jsx("option", { value: "dod_oldest", children: "Date of death (oldest)" }), _jsx("option", { value: "name", children: "Name (A\u2013Z)" })] }) }), items === null && (_jsxs(_Fragment, { children: [_jsx("div", { className: "skeleton" }), _jsx("div", { className: "skeleton" }), _jsx("div", { className: "skeleton" })] })), items?.length === 0 && _jsx("p", { children: "No records found." }), items?.map((p) => (_jsxs(Link, { to: `/deceased/${p.id}`, className: "card deceased-card", style: { textDecoration: 'none', color: 'inherit' }, children: [p.photoUrl ? _jsx("img", { src: p.photoUrl, alt: "" }) : _jsx("div", { className: "photo-placeholder" }), _jsxs("div", { children: [_jsx("strong", { children: p.fullName }), _jsx("div", { className: "badge", children: p.ward }), _jsx("div", { style: { color: 'var(--color-gray)' }, children: p.dateOfDeath })] })] }, p.id))), _jsxs("div", { className: "pagination", children: [_jsx("button", { className: "btn secondary", disabled: page <= 1, onClick: () => setPage((p) => p - 1), children: "Previous" }), _jsxs("span", { children: ["Page ", page, " of ", totalPages] }), _jsx("button", { className: "btn secondary", disabled: page >= totalPages, onClick: () => setPage((p) => p + 1), children: "Next" })] })] }));
}
