import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
export default function Condolences({ deceasedId }) {
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit] = useState(10);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [authorName, setAuthorName] = useState('');
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);
    const [submitMessage, setSubmitMessage] = useState(null);
    const [submitError, setSubmitError] = useState(null);
    useEffect(() => {
        setLoading(true);
        setError(null);
        api(`/api/condolences/deceased/${deceasedId}?page=${page}&limit=${limit}`)
            .then((res) => {
            setItems(res.items);
            setTotal(res.total);
        })
            .catch(() => setError('Could not load condolences.'))
            .finally(() => setLoading(false));
    }, [deceasedId, page, limit]);
    async function onSubmit(e) {
        e.preventDefault();
        if (saving)
            return;
        setSaving(true);
        setSubmitError(null);
        setSubmitMessage(null);
        try {
            await api(`/api/condolences/deceased/${deceasedId}`, {
                method: 'POST',
                body: JSON.stringify({ authorName, message }),
            });
            setAuthorName('');
            setMessage('');
            setSubmitMessage('Thank you. Your message has been received and will appear after a moderator reviews it.');
        }
        catch {
            setSubmitError('Could not send your message. Please try again.');
        }
        finally {
            setSaving(false);
        }
    }
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return (_jsxs("div", { className: "card", children: [_jsx("h2", { children: "Condolences and prayers" }), loading && _jsx("div", { className: "skeleton" }), error && _jsx("p", { className: "error", children: error }), !loading && !error && items.length === 0 && (_jsx("p", { className: "muted", children: "No messages yet. Be the first to leave one." })), items.map((c) => (_jsxs("div", { style: { padding: '0.75rem 0', borderBottom: '1px solid var(--color-border)' }, children: [_jsx("div", { style: { fontWeight: 600 }, children: c.authorName }), _jsx("div", { className: "muted", style: { fontSize: '0.85rem', marginBottom: 4 }, children: new Date(c.createdAt).toLocaleDateString() }), _jsx("div", { style: { whiteSpace: 'pre-wrap' }, children: c.message })] }, c.id))), totalPages > 1 && (_jsxs("div", { className: "pagination", children: [_jsx("button", { className: "btn secondary", disabled: page <= 1, onClick: () => setPage((p) => Math.max(1, p - 1)), children: "Previous" }), _jsxs("span", { children: ["Page ", page, " of ", totalPages] }), _jsx("button", { className: "btn secondary", disabled: page >= totalPages, onClick: () => setPage((p) => Math.min(totalPages, p + 1)), children: "Next" })] })), _jsx("h3", { style: { marginTop: '1.5rem' }, children: "Leave a condolence or prayer" }), _jsx("p", { className: "muted", style: { fontSize: '0.9rem' }, children: "Your message will appear after a moderator reviews it. Please keep it respectful." }), _jsxs("form", { onSubmit: onSubmit, children: [_jsxs("div", { className: "field", children: [_jsx("label", { children: "Your name *" }), _jsx("input", { required: true, value: authorName, onChange: (e) => setAuthorName(e.target.value), maxLength: 120 })] }), _jsxs("div", { className: "field", children: [_jsx("label", { children: "Your message *" }), _jsx("textarea", { required: true, value: message, onChange: (e) => setMessage(e.target.value), maxLength: 2000 })] }), submitError && _jsx("div", { className: "field error", children: submitError }), submitMessage && _jsx("div", { className: "field", style: { color: 'var(--color-accent)' }, children: submitMessage }), _jsx("button", { className: "btn", type: "submit", disabled: saving, children: saving ? 'Sending...' : 'Send condolence' })] })] }));
}
