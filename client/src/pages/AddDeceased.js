import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, compressImage } from '../lib/api';
export default function AddDeceased() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        fullName: '', hausaName: '', ward: '', dateOfDeath: '', dateOfBirth: '',
        bio: '', graveLocation: '', parentName: '', spouseName: '',
        submittedByName: '', submittedByPhone: '',
    });
    const [photo, setPhoto] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    async function onPhotoChange(e) {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setPhoto(await compressImage(file));
    }
    async function onSubmit(e) {
        e.preventDefault();
        if (saving)
            return; // prevent double-submit
        setSaving(true);
        setError(null);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
            if (photo)
                fd.append('photo', photo, 'photo.jpg');
            const res = await api('/api/deceased', { method: 'POST', formData: fd });
            navigate(`/deceased/${res.person.id}`);
        }
        catch {
            setError('Could not save this record. Please check the form and try again.');
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsxs("div", { children: [_jsx("h1", { children: "Register a Deceased Person" }), _jsx("p", { children: "New entries are reviewed by a moderator before appearing publicly." }), _jsxs("form", { onSubmit: onSubmit, children: [_jsxs("div", { className: "field", children: [_jsx("label", { children: "Full name *" }), _jsx("input", { required: true, value: form.fullName, onChange: (e) => setForm({ ...form, fullName: e.target.value }) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { children: "Hausa / Arabic name" }), _jsx("input", { value: form.hausaName, onChange: (e) => setForm({ ...form, hausaName: e.target.value }) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { children: "Ward / area in Kudan *" }), _jsx("input", { required: true, value: form.ward, onChange: (e) => setForm({ ...form, ward: e.target.value }) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { children: "Date of death *" }), _jsx("input", { required: true, type: "date", value: form.dateOfDeath, onChange: (e) => setForm({ ...form, dateOfDeath: e.target.value }) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { children: "Date of birth (if known)" }), _jsx("input", { type: "date", value: form.dateOfBirth, onChange: (e) => setForm({ ...form, dateOfBirth: e.target.value }) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { children: "Photo" }), _jsx("input", { type: "file", accept: "image/*", onChange: onPhotoChange })] }), _jsxs("div", { className: "field", children: [_jsx("label", { children: "Parent's name" }), _jsx("input", { value: form.parentName, onChange: (e) => setForm({ ...form, parentName: e.target.value }) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { children: "Spouse's name" }), _jsx("input", { value: form.spouseName, onChange: (e) => setForm({ ...form, spouseName: e.target.value }) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { children: "Resting place" }), _jsx("input", { value: form.graveLocation, onChange: (e) => setForm({ ...form, graveLocation: e.target.value }) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { children: "Short biography / remembrance" }), _jsx("textarea", { value: form.bio, onChange: (e) => setForm({ ...form, bio: e.target.value }) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { children: "Your name *" }), _jsx("input", { required: true, value: form.submittedByName, onChange: (e) => setForm({ ...form, submittedByName: e.target.value }) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { children: "Your phone number *" }), _jsx("input", { required: true, value: form.submittedByPhone, onChange: (e) => setForm({ ...form, submittedByPhone: e.target.value }) })] }), error && _jsx("div", { className: "field error", children: error }), _jsx("button", { className: "btn", type: "submit", disabled: saving, children: saving ? 'Saving, please wait' : 'Submit for review' })] })] }));
}
