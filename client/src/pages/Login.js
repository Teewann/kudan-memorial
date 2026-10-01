import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, setToken } from '../lib/api';
export default function Login() {
    const navigate = useNavigate();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    async function onSubmit(e) {
        e.preventDefault();
        if (saving)
            return;
        setSaving(true);
        setError(null);
        try {
            const res = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ phone, password }) });
            setToken(res.token);
            navigate('/');
        }
        catch {
            setError('Incorrect phone number or password.');
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsxs("div", { children: [_jsx("h1", { children: "Log in" }), _jsxs("form", { onSubmit: onSubmit, children: [_jsxs("div", { className: "field", children: [_jsx("label", { children: "Phone number" }), _jsx("input", { required: true, value: phone, onChange: (e) => setPhone(e.target.value) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { children: "Password" }), _jsx("input", { required: true, type: "password", value: password, onChange: (e) => setPassword(e.target.value) })] }), error && _jsx("div", { className: "field error", children: error }), _jsx("button", { className: "btn", type: "submit", disabled: saving, children: saving ? 'Logging in, please wait' : 'Log in' })] }), _jsxs("p", { children: ["No account yet? ", _jsx(Link, { to: "/register", children: "Register" })] })] }));
}
