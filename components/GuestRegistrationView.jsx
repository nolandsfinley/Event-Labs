import React, { useState, useEffect, useRef } from 'react';

const FORM_KEY = (pid) => `eflow_regform_${pid}`;
const GUESTS_KEY = (pid) => `eflow_guests_${pid}`;

const loadForm = (pid) => { try { return JSON.parse(localStorage.getItem(FORM_KEY(pid)) || 'null'); } catch { return null; } };
const loadGuests = (pid) => { try { return JSON.parse(localStorage.getItem(GUESTS_KEY(pid)) || '[]'); } catch { return []; } };
const saveForm = (data, pid) => localStorage.setItem(FORM_KEY(pid), JSON.stringify(data));

const DEFAULT_FIELDS = [
    { id: 'f1', label: 'ชื่อ - นามสกุล', type: 'text', required: true, enabled: true },
    { id: 'f2', label: 'อีเมล', type: 'email', required: true, enabled: true },
    { id: 'f3', label: 'เบอร์โทรศัพท์', type: 'tel', required: false, enabled: true },
    { id: 'f4', label: 'ตำแหน่ง / องค์กร', type: 'text', required: false, enabled: true },
    { id: 'f5', label: 'ประเภทอาหาร (Dietary)', type: 'select', required: false, enabled: true, options: 'ทั่วไป,มังสวิรัติ,Vegan,Halal,ไม่รับประทานอาหาร' },
    { id: 'f6', label: 'ความต้องการพิเศษ', type: 'textarea', required: false, enabled: false },
    { id: 'f7', label: 'รหัสเชิญ / Invite Code', type: 'text', required: false, enabled: false },
];

const DEFAULT_CONFIG = {
    title: 'ลงทะเบียนเข้าร่วมงาน',
    subtitle: '',
    welcomeText: 'กรุณากรอกข้อมูลเพื่อลงทะเบียนเข้าร่วมงาน',
    thankYouText: 'ลงทะเบียนสำเร็จ! ขอบคุณที่สนใจเข้าร่วมงาน',
    primaryColor: '#3b82f6',
    fields: DEFAULT_FIELDS,
    isOpen: true,
};

const genId = () => `g-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const GuestRegistrationView = ({ projectId, project }) => {
    const [config, setConfig] = useState(() => loadForm(projectId) || { ...DEFAULT_CONFIG, title: `ลงทะเบียน: ${project?.name || 'งาน'}`, subtitle: project?.eventDate ? new Date(project.eventDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : '' });
    const [tab, setTab] = useState('config'); // config | preview | registrations
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [guests, setGuests] = useState(() => loadGuests(projectId));
    const [formValues, setFormValues] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [editingField, setEditingField] = useState(null);
    const canvasRef = useRef();

    useEffect(() => { saveForm(config, projectId); }, [config, projectId]);

    // Generate QR code using canvas
    useEffect(() => {
        const url = `${window.location.origin}${window.location.pathname}#register/${projectId}`;
        generateQR(url);
    }, [projectId]);

    const generateQR = async (url) => {
        try {
            const QRCode = await import('qrcode');
            const dataUrl = await QRCode.toDataURL(url, { width: 256, margin: 2, color: { dark: '#1e293b', light: '#ffffff' } });
            setQrDataUrl(dataUrl);
        } catch (e) {
            // Fallback: use free QR API
            setQrDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(url)}&color=1e293b&bgcolor=ffffff`);
        }
    };

    const updateField = (id, key, val) => {
        setConfig(prev => ({
            ...prev,
            fields: prev.fields.map(f => f.id === id ? { ...f, [key]: val } : f)
        }));
    };

    const addCustomField = () => {
        const newField = { id: `cf-${Date.now()}`, label: 'ฟิลด์ใหม่', type: 'text', required: false, enabled: true };
        setConfig(prev => ({ ...prev, fields: [...prev.fields, newField] }));
    };

    const removeField = (id) => {
        if (DEFAULT_FIELDS.find(f => f.id === id)) return; // Protect default fields
        setConfig(prev => ({ ...prev, fields: prev.fields.filter(f => f.id !== id) }));
    };

    // Form submission (simulation - saves to local guests)
    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitError('');

        // Validate required
        const enabledRequired = config.fields.filter(f => f.enabled && f.required);
        for (const field of enabledRequired) {
            if (!formValues[field.id]?.trim()) {
                setSubmitError(`กรุณากรอก "${field.label}"`);
                return;
            }
        }

        const nameField = config.fields.find(f => f.id === 'f1');
        const emailField = config.fields.find(f => f.id === 'f2');
        const phoneField = config.fields.find(f => f.id === 'f3');
        const orgField = config.fields.find(f => f.id === 'f4');

        const guest = {
            id: genId(),
            name: formValues['f1'] || '',
            email: formValues['f2'] || '',
            phone: formValues['f3'] || '',
            organization: formValues['f4'] || '',
            dietary: formValues['f5'] || '',
            notes: formValues['f6'] || '',
            status: 'registered',
            registeredAt: new Date().toISOString(),
            source: 'self-registration',
            customFields: Object.fromEntries(
                config.fields.filter(f => !['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7'].includes(f.id) && f.enabled)
                    .map(f => [f.label, formValues[f.id] || ''])
            ),
        };

        const updatedGuests = [...guests, guest];
        setGuests(updatedGuests);
        localStorage.setItem(GUESTS_KEY(projectId), JSON.stringify(updatedGuests));
        setSubmitted(true);
    };

    const registrationUrl = `${window.location.origin}${window.location.pathname}#register/${projectId}`;

    const downloadQR = () => {
        if (!qrDataUrl) return;
        const a = document.createElement('a');
        a.href = qrDataUrl;
        a.download = `registration-qr-${projectId}.png`;
        a.click();
    };

    const TABS = [
        { key: 'config', label: 'ตั้งค่าฟอร์ม', icon: 'fa-sliders' },
        { key: 'preview', label: 'Preview ฟอร์ม', icon: 'fa-eye' },
        { key: 'qr', label: 'QR & Link', icon: 'fa-qrcode' },
        { key: 'registrations', label: `ผู้ลงทะเบียน (${guests.filter(g => g.source === 'self-registration').length})`, icon: 'fa-users' },
    ];

    return (
        <div className="flex-1 overflow-hidden bg-[#f5f5f7] flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-8 py-5 shrink-0">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">🌐 Guest Self-Registration</h2>
                        <p className="text-sm text-slate-400 font-medium">สร้างฟอร์มลงทะเบียน · Generate QR Code · ข้อมูลเข้า Guest Module อัตโนมัติ</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-500">ฟอร์ม{config.isOpen ? 'เปิดรับ' : 'ปิด'}อยู่</span>
                        <button onClick={() => setConfig(prev => ({ ...prev, isOpen: !prev.isOpen }))}
                            className={`relative w-12 h-6 rounded-full transition ${config.isOpen ? 'bg-green-500' : 'bg-slate-300'}`}>
                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${config.isOpen ? 'left-6' : 'left-0.5'}`} />
                        </button>
                    </div>
                </div>
                <div className="flex border-b border-slate-100 -mb-5 -mx-8 px-8">
                    {TABS.map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={`flex items-center gap-2 px-4 pb-3 pt-1 text-xs font-black border-b-2 transition -mb-px ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                            <i className={`fa-solid ${t.icon} text-[11px]`} />
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {/* ── CONFIG TAB ── */}
                {tab === 'config' && (
                    <div className="max-w-2xl mx-auto space-y-5">
                        {/* Basic info */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                            <p className="text-sm font-black text-slate-700 mb-4">ข้อความในฟอร์ม</p>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 block mb-1">หัวข้อฟอร์ม</label>
                                    <input value={config.title} onChange={e => setConfig(p => ({ ...p, title: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 block mb-1">คำอธิบายย่อ (subtitle)</label>
                                    <input value={config.subtitle} onChange={e => setConfig(p => ({ ...p, subtitle: e.target.value }))}
                                        placeholder="เช่น วันที่ 20 มิถุนายน 2025 ณ โรงแรม..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 block mb-1">ข้อความต้อนรับ</label>
                                    <textarea value={config.welcomeText} onChange={e => setConfig(p => ({ ...p, welcomeText: e.target.value }))}
                                        rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 block mb-1">ข้อความหลังลงทะเบียนสำเร็จ</label>
                                    <input value={config.thankYouText} onChange={e => setConfig(p => ({ ...p, thankYouText: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 block mb-1">สีหลัก (Primary Color)</label>
                                    <div className="flex items-center gap-3">
                                        <input type="color" value={config.primaryColor} onChange={e => setConfig(p => ({ ...p, primaryColor: e.target.value }))}
                                            className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5" />
                                        <input value={config.primaryColor} onChange={e => setConfig(p => ({ ...p, primaryColor: e.target.value }))}
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none font-mono" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fields config */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-sm font-black text-slate-700">ฟิลด์ในฟอร์ม</p>
                                <button onClick={addCustomField} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                    <i className="fa-solid fa-plus" /> เพิ่มฟิลด์
                                </button>
                            </div>
                            <div className="space-y-2">
                                {config.fields.map(field => (
                                    <div key={field.id} className={`flex items-center gap-3 p-3 rounded-xl border transition ${field.enabled ? 'bg-slate-50 border-slate-100' : 'bg-slate-50/50 border-dashed border-slate-200 opacity-60'}`}>
                                        <button onClick={() => updateField(field.id, 'enabled', !field.enabled)} className="shrink-0">
                                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${field.enabled ? 'bg-blue-500 border-blue-500' : 'border-slate-300'}`}>
                                                {field.enabled && <i className="fa-solid fa-check text-white text-[8px]" />}
                                            </div>
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            {editingField === field.id ? (
                                                <input value={field.label} onChange={e => updateField(field.id, 'label', e.target.value)}
                                                    onBlur={() => setEditingField(null)} autoFocus
                                                    className="bg-white border border-blue-300 rounded-lg px-2 py-1 text-xs font-bold outline-none w-full" />
                                            ) : (
                                                <p className="text-xs font-bold text-slate-700 truncate cursor-pointer" onDoubleClick={() => setEditingField(field.id)}>
                                                    {field.label}
                                                    {field.required && <span className="text-red-400 ml-0.5">*</span>}
                                                </p>
                                            )}
                                            <p className="text-[10px] text-slate-400">{field.type}</p>
                                        </div>
                                        <select value={field.type} onChange={e => updateField(field.id, 'type', e.target.value)}
                                            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] outline-none font-bold text-slate-600">
                                            {['text', 'email', 'tel', 'select', 'textarea', 'number'].map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        <label className="flex items-center gap-1 text-[10px] text-slate-500 font-bold cursor-pointer shrink-0">
                                            <input type="checkbox" checked={!!field.required} onChange={e => updateField(field.id, 'required', e.target.checked)} className="accent-red-500 w-3 h-3" />
                                            จำเป็น
                                        </label>
                                        {!DEFAULT_FIELDS.find(f => f.id === field.id) && (
                                            <button onClick={() => removeField(field.id)} className="w-5 h-5 text-red-300 hover:text-red-500 flex items-center justify-center shrink-0">
                                                <i className="fa-solid fa-times text-[10px]" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── PREVIEW TAB ── */}
                {tab === 'preview' && (
                    <div className="max-w-lg mx-auto">
                        {!config.isOpen && (
                            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700 font-bold text-center">
                                <i className="fa-solid fa-lock mr-2" /> ฟอร์มปิดอยู่ — ผู้ใช้จะไม่สามารถลงทะเบียนได้
                            </div>
                        )}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden">
                            {/* Form header */}
                            <div className="p-6 text-white" style={{ backgroundColor: config.primaryColor }}>
                                <h1 className="text-xl font-black">{config.title || 'ลงทะเบียน'}</h1>
                                {config.subtitle && <p className="text-sm opacity-80 mt-1">{config.subtitle}</p>}
                            </div>

                            {submitted ? (
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: config.primaryColor + '20' }}>
                                        <i className="fa-solid fa-circle-check text-3xl" style={{ color: config.primaryColor }} />
                                    </div>
                                    <p className="font-black text-slate-800 text-lg">{config.thankYouText}</p>
                                    <button onClick={() => { setSubmitted(false); setFormValues({}); }} className="mt-4 text-xs text-slate-400 font-bold hover:text-slate-600">ลงทะเบียนใหม่</button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                    {config.welcomeText && <p className="text-sm text-slate-500">{config.welcomeText}</p>}
                                    {config.fields.filter(f => f.enabled).map(field => (
                                        <div key={field.id}>
                                            <label className="text-xs font-black text-slate-600 block mb-1.5">
                                                {field.label}{field.required && <span className="text-red-400 ml-0.5">*</span>}
                                            </label>
                                            {field.type === 'textarea' ? (
                                                <textarea value={formValues[field.id] || ''} onChange={e => setFormValues(p => ({ ...p, [field.id]: e.target.value }))}
                                                    rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none focus:border-blue-400" />
                                            ) : field.type === 'select' ? (
                                                <select value={formValues[field.id] || ''} onChange={e => setFormValues(p => ({ ...p, [field.id]: e.target.value }))}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none">
                                                    <option value="">เลือก...</option>
                                                    {(field.options || '').split(',').map(o => <option key={o} value={o.trim()}>{o.trim()}</option>)}
                                                </select>
                                            ) : (
                                                <input type={field.type} value={formValues[field.id] || ''} onChange={e => setFormValues(p => ({ ...p, [field.id]: e.target.value }))}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                                            )}
                                        </div>
                                    ))}
                                    {submitError && <p className="text-xs text-red-500 font-bold">{submitError}</p>}
                                    <button type="submit" disabled={!config.isOpen}
                                        className="w-full py-3 font-black text-white rounded-xl hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                                        style={{ backgroundColor: config.primaryColor }}>
                                        {config.isOpen ? 'ลงทะเบียน' : 'ฟอร์มปิดรับแล้ว'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                )}

                {/* ── QR TAB ── */}
                {tab === 'qr' && (
                    <div className="max-w-lg mx-auto space-y-5">
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm text-center">
                            <p className="text-sm font-black text-slate-700 mb-4">QR Code สำหรับลงทะเบียน</p>
                            {qrDataUrl ? (
                                <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 mx-auto rounded-2xl border border-slate-100" />
                            ) : (
                                <div className="w-48 h-48 mx-auto bg-slate-50 rounded-2xl flex items-center justify-center">
                                    <i className="fa-solid fa-spinner fa-spin text-slate-300 text-2xl" />
                                </div>
                            )}
                            <p className="text-xs text-slate-400 mt-3 mb-4">สแกน QR นี้เพื่อเปิดฟอร์มลงทะเบียน</p>
                            <button onClick={downloadQR} className="px-5 py-2.5 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-700 transition flex items-center gap-2 mx-auto">
                                <i className="fa-solid fa-download" /> Download QR PNG
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                            <p className="text-xs font-black text-slate-600 mb-2">Registration Link</p>
                            <div className="flex gap-2">
                                <input readOnly value={registrationUrl} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono outline-none" />
                                <button onClick={() => { navigator.clipboard.writeText(registrationUrl); }}
                                    className="px-3 py-2.5 bg-blue-50 text-blue-600 font-bold text-xs rounded-xl hover:bg-blue-100 transition">
                                    <i className="fa-solid fa-copy" /> Copy
                                </button>
                            </div>
                            <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
                                <p className="text-[10px] text-slate-400 font-bold">
                                    <i className="fa-solid fa-circle-info mr-1.5 text-blue-400" />
                                    ตอนนี้ลงทะเบียนได้บน device เดียวกัน ข้อมูลจะเข้า Guest Module อัตโนมัติ
                                    สำหรับ cross-device ต้องอัปเกรดเป็น Cloud Sync
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── REGISTRATIONS TAB ── */}
                {tab === 'registrations' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-sm font-black text-slate-600">{guests.filter(g => g.source === 'self-registration').length} ผู้ลงทะเบียนผ่านฟอร์ม</p>
                        </div>
                        {guests.filter(g => g.source === 'self-registration').length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
                                <i className="fa-solid fa-user-plus text-slate-200 text-5xl mb-4 block" />
                                <p className="text-slate-400 font-bold text-lg mb-1">ยังไม่มีผู้ลงทะเบียน</p>
                                <p className="text-slate-300 text-sm">ส่งลิงก์หรือ QR Code ให้ผู้เข้าร่วมกรอกข้อมูลเอง</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="grid grid-cols-[1fr_1fr_120px_120px_80px] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100">
                                    {['ชื่อ', 'อีเมล', 'โทร', 'ประเภทอาหาร', 'เวลา'].map(h => (
                                        <p key={h} className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{h}</p>
                                    ))}
                                </div>
                                {guests.filter(g => g.source === 'self-registration').map(g => (
                                    <div key={g.id} className="grid grid-cols-[1fr_1fr_120px_120px_80px] gap-4 px-5 py-3 border-b border-slate-50 hover:bg-slate-50/50">
                                        <p className="text-xs font-bold text-slate-800 truncate">{g.name}</p>
                                        <p className="text-xs text-slate-500 truncate">{g.email}</p>
                                        <p className="text-xs text-slate-500">{g.phone}</p>
                                        <p className="text-xs text-slate-500">{g.dietary || '-'}</p>
                                        <p className="text-[10px] text-slate-400">{g.registeredAt ? new Date(g.registeredAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GuestRegistrationView;
