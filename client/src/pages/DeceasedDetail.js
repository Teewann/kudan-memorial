import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import ImageViewer from '../components/ImageViewer';
import Condolences from '../components/Condolences';
export default function DeceasedDetail() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [error, setError] = useState(false);
    const [viewerOpen, setViewerOpen] = useState(false);
    useEffect(() => {
        api(`/api/deceased/${id}`)
            .then(setData)
            .catch(() => setError(true));
    }, [id]);
    if (error)
        return _jsx("p", { children: "This record could not be found." });
    if (!data)
        return _jsx("div", { className: "skeleton" });
    const { person, family } = data;
    const shareUrl = window.location.href;
    const waText = encodeURIComponent(`In loving memory of ${person.fullName}. ${shareUrl}`);
    return (_jsxs("div", { children: [_jsxs("div", { className: "breadcrumb", children: [_jsx(Link, { to: "/deceased", children: "Deceased Register" }), " / ", person.fullName] }), _jsxs("div", { className: "card", children: [_jsxs("div", { className: "deceased-card", children: [person.photoUrl ? (_jsx("img", { src: person.photoUrl, alt: "", onClick: () => setViewerOpen(true), style: { cursor: 'zoom-in' } })) : (_jsx("div", { className: "photo-placeholder" })), _jsxs("div", { children: [_jsx("h1", { style: { marginBottom: 0 }, children: person.fullName }), person.hausaName && _jsx("div", { className: "muted", children: person.hausaName }), _jsx("div", { className: "badge", style: { marginTop: 8 }, children: person.ward })] })] }), _jsxs("div", { style: { marginTop: '1.25rem' }, children: [_jsxs("div", { className: "detail-row", children: [_jsx("span", { className: "label", children: "Date of death" }), _jsx("span", { children: person.dateOfDeath })] }), person.dateOfBirth && (_jsxs("div", { className: "detail-row", children: [_jsx("span", { className: "label", children: "Date of birth" }), _jsx("span", { children: person.dateOfBirth })] })), person.parentName && (_jsxs("div", { className: "detail-row", children: [_jsx("span", { className: "label", children: "Parent" }), _jsx("span", { children: person.parentName })] })), person.spouseName && (_jsxs("div", { className: "detail-row", children: [_jsx("span", { className: "label", children: "Spouse" }), _jsx("span", { children: person.spouseName })] })), person.graveLocation && (_jsxs("div", { className: "detail-row", children: [_jsx("span", { className: "label", children: "Resting place" }), _jsx("span", { children: person.graveLocation })] })), family && (_jsxs("div", { className: "detail-row", children: [_jsx("span", { className: "label", children: "Family" }), _jsx("span", { children: _jsx(Link, { to: `/families/${family.id}`, children: family.name }) })] }))] }), person.bio && (_jsx("p", { style: { marginTop: '1.25rem', whiteSpace: 'pre-wrap' }, children: person.bio })), _jsx("a", { className: "btn accent", style: { marginTop: '0.5rem' }, href: `https://wa.me/?text=${waText}`, target: "_blank", rel: "noreferrer", children: "Share on WhatsApp" })] }), viewerOpen && person.photoUrl && (_jsx(ImageViewer, { src: person.photoUrl, alt: person.fullName, onClose: () => setViewerOpen(false) })), _jsx(Condolences, { deceasedId: person.id }), "    "] }));
}
