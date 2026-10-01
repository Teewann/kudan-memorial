import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, isLoggedIn } from '../lib/api';
export default function AddFamily() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', headName: '', ward: '', phone: '', history: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    if (!isLoggedIn()) {
        return _jsxs("p", { children: ["Please ", _jsx(Link, { to: "/login", children: "log in" }), " to register a family."] });
    }
    async function onSubmit(e) {
        e.preventDefault();
        if (saving)
            return;
        setSaving(true);
        setError(null);
        try {
            const res = await api('/api/families', {
                method: 'POST',
                body: JSON.stringify(form),
            });
            navigate(`/families/${res.family.id}`);
        }
        catch {
            setError('Could not save this family. Please try again.');
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsxs("div", { children: [_jsx("h1", { children: "Register a Family" }), _jsxs("form", { onSubmit: onSubmit, children: [_jsxs("div", { className: "field", children: [_jsx("label", { children: "Family name * (e.g. \"Gidan Malam Audu\")" }), _jsx("input", { required: true, value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { children: "Head of family" }), _jsx("input", { value: form.headName, onChange: (e) => setForm({ ...form, headName: e.target.value }) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { children: "Ward / area *" }), _jsx("input", { required: true, value: form.ward, onChange: (e) => setForm({ ...form, ward: e.target.value }) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { children: "Phone" }), _jsx("input", { value: form.phone, onChange: (e) => setForm({ ...form, phone: e.target.value }) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { children: "Family history (optional)" }), _jsx("textarea", { value: form.history, onChange: (e) => setForm({ ...form, history: e.target.value }) })] }), error && _jsx("div", { className: "field error", children: error }), _jsx("button", { className: "btn", type: "submit", disabled: saving, children: saving ? 'Saving…' : 'Register family' })] })] }));
}
