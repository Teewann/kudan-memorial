import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
export default function Moderation() {
    const [tab, setTab] = useState('deceased');
    return (_jsxs("div", { children: [_jsx("h1", { children: "Moderation" }), _jsxs("div", { style: { display: 'flex', gap: 8, marginBottom: 16 }, children: [_jsx("button", { className: tab === 'deceased' ? 'btn' : 'btn secondary', onClick: () => setTab('deceased'), children: "Deceased submissions" }), _jsx("button", { className: tab === 'condolences' ? 'btn' : 'btn secondary', onClick: () => setTab('condolences'), children: "Condolences" })] }), tab === 'deceased' && _jsx(DeceasedTab, {}), tab === 'condolences' && _jsx(CondolencesTab, {})] }));
}
function DeceasedTab() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(null);
    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await api('/api/moderation/pending');
            setItems(res.items);
        }
        catch {
            setError('Could not load pending submissions.');
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => { load(); }, []);
    async function act(id, action) {
        if (busy)
            return;
        setBusy(id);
        try {
            await api(`/api/moderation/${id}/${action}`, { method: 'PATCH' });
            setItems((prev) => prev.filter((p) => p.id !== id));
        }
        catch {
            setError('Action failed. Try again.');
        }
        finally {
            setBusy(null);
        }
    }
    if (loading)
        return _jsx("p", { children: "Loading..." });
    if (error)
        return _jsx("p", { className: "error", children: error });
    if (items.length === 0)
        return _jsx("p", { className: "muted", children: "No pending submissions right now." });
    return (_jsx("div", { children: items.map((p) => (_jsxs("div", { className: "card", children: [_jsxs("h2", { children: [p.fullName, p.hausaName ? ` (${p.hausaName})` : ''] }), p.photoUrl && _jsx("img", { src: p.photoUrl, alt: "", style: { maxWidth: 160, borderRadius: 8, marginBottom: 8 } }), _jsxs("p", { children: [_jsx("strong", { children: "Ward:" }), " ", p.ward] }), _jsxs("p", { children: [_jsx("strong", { children: "Date of death:" }), " ", new Date(p.dateOfDeath).toLocaleDateString()] }), _jsxs("p", { children: [_jsx("strong", { children: "Submitted by:" }), " ", p.submittedByName, " (", p.submittedByPhone, ")"] }), p.bio && _jsx("p", { children: p.bio }), _jsxs("div", { style: { display: 'flex', gap: 8, marginTop: 8 }, children: [_jsx("button", { className: "btn", disabled: busy === p.id, onClick: () => act(p.id, 'approve'), children: busy === p.id ? 'Working...' : 'Approve' }), _jsx("button", { className: "btn secondary", disabled: busy === p.id, onClick: () => act(p.id, 'reject'), children: "Reject" })] })] }, p.id))) }));
}
function CondolencesTab() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(null);
    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await api('/api/condolences/pending');
            setItems(res.items);
        }
        catch {
            setError('Could not load pending condolences.');
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => { load(); }, []);
    async function act(id, action) {
        if (busy)
            return;
        setBusy(id);
        try {
            await api(`/api/condolences/${id}/${action}`, { method: 'PATCH' });
            setItems((prev) => prev.filter((p) => p.id !== id));
        }
        catch {
            setError('Action failed. Try again.');
        }
        finally {
            setBusy(null);
        }
    }
    if (loading)
        return _jsx("p", { children: "Loading..." });
    if (error)
        return _jsx("p", { className: "error", children: error });
    if (items.length === 0)
        return _jsx("p", { className: "muted", children: "No pending condolences right now." });
    return (_jsx("div", { children: items.map((c) => (_jsxs("div", { className: "card", children: [_jsxs("p", { className: "muted", style: { fontSize: '0.85rem' }, children: ["For ", _jsxs(Link, { to: `/deceased/${c.deceasedId}`, children: ["record #", c.deceasedId] }), ", ", new Date(c.createdAt).toLocaleDateString()] }), _jsx("p", { style: { fontWeight: 600 }, children: c.authorName }), _jsx("p", { style: { whiteSpace: 'pre-wrap' }, children: c.message }), _jsxs("div", { style: { display: 'flex', gap: 8, marginTop: 8 }, children: [_jsx("button", { className: "btn", disabled: busy === c.id, onClick: () => act(c.id, 'approve'), children: busy === c.id ? 'Working...' : 'Approve' }), _jsx("button", { className: "btn secondary", disabled: busy === c.id, onClick: () => act(c.id, 'reject'), children: "Reject" })] })] }, c.id))) }));
}
