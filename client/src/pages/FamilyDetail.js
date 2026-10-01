import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, isLoggedIn } from '../lib/api';
export default function FamilyDetail() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [error, setError] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const loggedIn = isLoggedIn();
    async function load() {
        try {
            const res = await api(`/api/families/${id}`);
            setData(res);
        }
        catch {
            setError(true);
        }
    }
    useEffect(() => { load(); }, [id]);
    async function removeMember(memberId) {
        if (!confirm('Remove this member from the family?'))
            return;
        try {
            await api(`/api/families/${id}/members/${memberId}`, { method: 'DELETE' });
            setData((prev) => prev ? { ...prev, members: prev.members.filter((m) => m.id !== memberId) } : prev);
        }
        catch {
            alert('Could not remove member.');
        }
    }
    if (error)
        return _jsx("p", { children: "This family could not be found." });
    if (!data)
        return _jsx("div", { className: "skeleton" });
    const { family, members, deceasedMembers } = data;
    return (_jsxs("div", { children: [_jsxs("div", { className: "breadcrumb", children: [_jsx(Link, { to: "/families", children: "Families" }), " / ", family.name] }), _jsxs("div", { className: "card", children: [_jsx("h1", { style: { marginBottom: 0 }, children: family.name }), _jsx("div", { className: "badge", style: { marginTop: 8 }, children: family.ward }), family.headName && _jsxs("p", { style: { marginTop: 12 }, children: [_jsx("strong", { children: "Head of family:" }), " ", family.headName] }), family.phone && _jsxs("p", { children: [_jsx("strong", { children: "Phone:" }), " ", family.phone] }), family.history && _jsx("p", { style: { whiteSpace: 'pre-wrap' }, children: family.history })] }), _jsxs("div", { className: "card", children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 12 }, children: [_jsx("h2", { style: { margin: 0 }, children: "Living members" }), loggedIn && (_jsx("button", { className: "btn secondary", style: { marginLeft: 'auto', minHeight: 40 }, onClick: () => setShowAdd((v) => !v), children: showAdd ? 'Cancel' : 'Add member' }))] }), showAdd && loggedIn && (_jsx(AddMemberForm, { familyId: family.id, onAdded: (m) => {
                            setData((prev) => prev ? { ...prev, members: [...prev.members, m] } : prev);
                            setShowAdd(false);
                        } })), members.length === 0 ? (_jsx("p", { className: "muted", children: "No members added yet." })) : (members.map((m) => (_jsxs("div", { className: "detail-row", children: [_jsx("span", { style: { fontWeight: 600 }, children: m.name }), m.relation && _jsxs("span", { className: "muted", children: ["(", m.relation, ")"] }), m.phone && _jsx("span", { className: "muted", children: m.phone }), loggedIn && (_jsx("button", { className: "btn secondary", style: { marginLeft: 'auto', minHeight: 36, padding: '0 0.75rem' }, onClick: () => removeMember(m.id), children: "Remove" }))] }, m.id))))] }), _jsxs("div", { className: "card", children: [_jsx("h2", { children: "Deceased members" }), deceasedMembers.length === 0 ? (_jsx("p", { className: "muted", children: "None recorded yet." })) : (deceasedMembers.map((d) => (_jsxs(Link, { to: `/deceased/${d.id}`, className: "detail-row", style: { color: 'inherit', textDecoration: 'none' }, children: [_jsx("span", { style: { fontWeight: 600 }, children: d.fullName }), _jsxs("span", { className: "muted", style: { marginLeft: 'auto' }, children: ["died ", d.dateOfDeath] })] }, d.id)))), _jsx("p", { className: "muted", style: { marginTop: 12, fontSize: '0.9rem' }, children: "To add a deceased member, register them from the Add a Deceased page and choose this family in the form." })] })] }));
}
function AddMemberForm({ familyId, onAdded, }) {
    const [name, setName] = useState('');
    const [relation, setRelation] = useState('');
    const [phone, setPhone] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    async function onSubmit(e) {
        e.preventDefault();
        if (saving)
            return;
        setSaving(true);
        setError(null);
        try {
            const res = await api(`/api/families/${familyId}/members`, {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    relation: relation || undefined,
                    phone: phone || undefined,
                }),
            });
            onAdded(res.member);
        }
        catch {
            setError('Could not add member.');
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsxs("form", { onSubmit: onSubmit, style: { marginTop: 12, marginBottom: 12 }, children: [_jsxs("div", { className: "field", children: [_jsx("label", { children: "Full name *" }), _jsx("input", { required: true, value: name, onChange: (e) => setName(e.target.value) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { children: "Relation (e.g. son, daughter, wife)" }), _jsx("input", { value: relation, onChange: (e) => setRelation(e.target.value) })] }), _jsxs("div", { className: "field", children: [_jsx("label", { children: "Phone (optional)" }), _jsx("input", { value: phone, onChange: (e) => setPhone(e.target.value) })] }), error && _jsx("div", { className: "field error", children: error }), _jsx("button", { className: "btn", type: "submit", disabled: saving, children: saving ? 'Adding...' : 'Add member' })] }));
}
