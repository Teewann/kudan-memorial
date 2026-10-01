import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setToken } from '../lib/api';
export default function Register() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    async function onSubmit(e) {
        e.preventDefault();
        if (saving)
            return;
        setSaving(true);
        setError(null);
        try {
            const res = await api('/api/auth/register', { method: 'POST', body: JSON.stringify(form) });
            setToken(res.token);
            navigate('/families/new');
        }
        catch {
            setError('Could not create your account. That phone number may already be registered.');
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsxs("div", { children: [_jsx("h1", { children: "Create an account" }), _jsx("p", { children: "You only need this to register a family. Your phone number and a password are all that is required." }), _jsxs("form", { onSubmit: onSubmit, children: [_jsxs("div", { className: "field", children: [_jsx("label", { children: "Full name *" }), _jsx("input", { required: true, value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { children: "Phone number *" }), _jsx("input", { required: true, value: form.phone, onChange: (e) => setForm({ ...form, phone: e.target.value }) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { children: "Email (optional)" }), _jsx("input", { type: "email", value: form.email, onChange: (e) => setForm({ ...form, email: e.target.value }) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { children: "Password *" }), _jsx("input", { required: true, type: "password", minLength: 4, value: form.password, onChange: (e) => setForm({ ...form, password: e.target.value }) })] }), error && _jsx("div", { className: "field error", children: error }), _jsx("button", { className: "btn", type: "submit", disabled: saving, children: saving ? 'Creating, please wait' : 'Create account' })] }), _jsxs("p", { children: ["Already have an account? ", _jsx(Link, { to: "/login", children: "Log in" })] })] }));
}
