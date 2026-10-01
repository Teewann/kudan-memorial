import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
export default function AddAnnouncement() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [dateOfDeath, setDateOfDeath] = useState('');
    const [burialTime, setBurialTime] = useState('');
    const [burialPlace, setBurialPlace] = useState('');
    const [note, setNote] = useState('');
    const [daysVisible, setDaysVisible] = useState('30');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    async function onSubmit(e) {
        e.preventDefault();
        if (saving)
            return;
        setSaving(true);
        setError(null);
        try {
            await api('/api/announcements', {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    dateOfDeath,
                    burialTime: burialTime || undefined,
                    burialPlace: burialPlace || undefined,
                    note: note || undefined,
                    daysVisible: Number(daysVisible) || 30,
                }),
            });
            navigate('/announcements');
        }
        catch {
            setError('Could not post announcement. Are you logged in as a moderator?');
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsxs("div", { children: [_jsx("h1", { children: "Post announcement" }), _jsx("p", { className: "muted", children: "Announcements are public and stay visible for the number of days you choose." }), _jsxs("form", { onSubmit: onSubmit, children: [_jsxs("div", { className: "field", children: [_jsx("label", { children: "Full name of the deceased *" }), _jsx("input", { required: true, value: name, onChange: (e) => setName(e.target.value), maxLength: 160 })] }), _jsxs("div", { className: "field", children: [_jsx("label", { children: "Date of death *" }), _jsx("input", { required: true, type: "date", value: dateOfDeath, onChange: (e) => setDateOfDeath(e.target.value) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { children: "Burial place" }), _jsx("input", { value: burialPlace, onChange: (e) => setBurialPlace(e.target.value), maxLength: 200 })] }), _jsxs("div", { className: "field", children: [_jsx("label", { children: "Burial time" }), _jsx("input", { value: burialTime, onChange: (e) => setBurialTime(e.target.value), maxLength: 80, placeholder: "e.g. 2:00 PM, Friday" })] }), _jsxs("div", { className: "field", children: [_jsx("label", { children: "Note" }), _jsx("textarea", { value: note, onChange: (e) => setNote(e.target.value), maxLength: 4000, placeholder: "Any additional message for the community." })] }), _jsxs("div", { className: "field", children: [_jsx("label", { children: "Stay visible for (days)" }), _jsx("input", { type: "number", min: 1, max: 365, value: daysVisible, onChange: (e) => setDaysVisible(e.target.value) })] }), error && _jsx("div", { className: "field error", children: error }), _jsx("button", { className: "btn", type: "submit", disabled: saving, children: saving ? 'Posting...' : 'Post announcement' })] })] }));
}
