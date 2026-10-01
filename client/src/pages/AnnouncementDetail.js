import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, isLoggedIn } from '../lib/api';
export default function AnnouncementDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [error, setError] = useState(false);
    const [busy, setBusy] = useState(false);
    const loggedIn = isLoggedIn();
    useEffect(() => {
        api(`/api/announcements/${id}`)
            .then((res) => setData(res.announcement))
            .catch(() => setError(true));
    }, [id]);
    async function remove() {
        if (!confirm('Delete this announcement? This cannot be undone.'))
            return;
        setBusy(true);
        try {
            await api(`/api/announcements/${id}`, { method: 'DELETE' });
            navigate('/announcements');
        }
        catch {
            alert('Could not delete.');
            setBusy(false);
        }
    }
    if (error)
        return _jsx("p", { children: "This announcement could not be found." });
    if (!data)
        return _jsx("div", { className: "skeleton" });
    return (_jsxs("div", { children: [_jsxs("div", { className: "breadcrumb", children: [_jsx(Link, { to: "/announcements", children: "Announcements" }), " / ", data.name] }), _jsxs("div", { className: "card", children: [_jsx("h1", { style: { marginBottom: 4 }, children: data.name }), _jsxs("div", { className: "muted", style: { marginBottom: 16 }, children: ["Died ", new Date(data.dateOfDeath).toLocaleDateString()] }), data.burialPlace && (_jsxs("div", { className: "detail-row", children: [_jsx("span", { className: "label", children: "Burial place" }), _jsx("span", { children: data.burialPlace })] })), data.burialTime && (_jsxs("div", { className: "detail-row", children: [_jsx("span", { className: "label", children: "Burial time" }), _jsx("span", { children: data.burialTime })] })), data.note && (_jsx("p", { style: { marginTop: 16, whiteSpace: 'pre-wrap' }, children: data.note })), loggedIn && (_jsx("button", { className: "btn danger", style: { marginTop: 12 }, disabled: busy, onClick: remove, children: busy ? 'Deleting...' : 'Delete announcement' }))] })] }));
}
