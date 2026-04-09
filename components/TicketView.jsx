import React, { useState, useEffect, useMemo } from 'react';

const getKey = (pid) => `eflow_tickets_${pid || 'global'}`;
const load = (pid) => { try { return JSON.parse(localStorage.getItem(getKey(pid)) || 'null') || defaultState(); } catch { return defaultState(); } };
const save = (d, pid) => localStorage.setItem(getKey(pid), JSON.stringify(d));

function defaultState() {
    return {
        event_name: '',
        ticket_types: [
            { id: '1', name: 'VIP', price: 3000, quota: 50, sold: 0, complimentary: 0, color: 'bg-amber-500' },
            { id: '2', name: 'General', price: 500, quota: 300, sold: 0, complimentary: 0, color: 'bg-blue-500' },
        ],
        qrcodes: [],
        note: '',
    };
}

const COLORS = ['bg-amber-500', 'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-pink-500', 'bg-red-500', 'bg-slate-500'];

const TicketView = ({ projectId }) => {
    const [data, setData] = useState(() => load(projectId));
    const [activeTab, setActiveTab] = useState('tickets');
    const [editingType, setEditingType] = useState(null);
    const [showAddType, setShowAddType] = useState(false);
    const [newType, setNewType] = useState({ name: '', price: '', quota: '', complimentary: 0, color: 'bg-blue-500' });
    const [qrInput, setQrInput] = useState({ label: '', value: '', type: 'url' });

    useEffect(() => save(data, projectId), [data, projectId]);

    const updateTypeField = (id, field, val) => {
        setData(p => ({ ...p, ticket_types: p.ticket_types.map(t => t.id === id ? { ...t, [field]: field === 'name' || field === 'color' ? val : Number(val) || 0 } : t) }));
    };

    const addType = () => {
        if (!newType.name.trim()) return;
        setData(p => ({ ...p, ticket_types: [...p.ticket_types, { id: Date.now().toString(), ...newType, price: Number(newType.price) || 0, quota: Number(newType.quota) || 0, sold: 0, complimentary: Number(newType.complimentary) || 0 }] }));
        setNewType({ name: '', price: '', quota: '', complimentary: 0, color: 'bg-blue-500' });
        setShowAddType(false);
    };

    const removeType = (id) => setData(p => ({ ...p, ticket_types: p.ticket_types.filter(t => t.id !== id) }));

    const addQR = () => {
        if (!qrInput.label.trim() || !qrInput.value.trim()) return;
        setData(p => ({ ...p, qrcodes: [...p.qrcodes, { id: Date.now().toString(), ...qrInput }] }));
        setQrInput({ label: '', value: '', type: 'url' });
    };

    const removeQR = (id) => setData(p => ({ ...p, qrcodes: p.qrcodes.filter(q => q.id !== id) }));

    const { totalQuota, totalSold, totalComp, totalRevenue, totalAvail } = useMemo(() => ({
        totalQuota: data.ticket_types.reduce((s, t) => s + (t.quota || 0), 0),
        totalSold: data.ticket_types.reduce((s, t) => s + (t.sold || 0), 0),
        totalComp: data.ticket_types.reduce((s, t) => s + (t.complimentary || 0), 0),
        totalRevenue: data.ticket_types.reduce((s, t) => s + ((t.sold || 0) * (t.price || 0)), 0),
        totalAvail: data.ticket_types.reduce((s, t) => s + Math.max(0, (t.quota || 0) - (t.sold || 0) - (t.complimentary || 0)), 0),
    }), [data]);

    const QRImage = ({ value, size = 120 }) => {
        const encoded = encodeURIComponent(value);
        return <img src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&format=png&margin=4`} alt="QR" width={size} height={size} className="rounded-lg" />;
    };

    return (
        <div className="flex-1 overflow-y-auto bg-[#f5f5f7]">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-8 py-5 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">🎫 Ticket & Registration</h2>
                    <p className="text-sm text-slate-400 font-medium">ติดตามบัตร, ยอดขาย, และ QR Code สำหรับงาน</p>
                </div>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                    {['tickets', 'qr'].map(t => (
                        <button key={t} onClick={() => setActiveTab(t)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${activeTab === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                            {t === 'tickets' ? '🎫 บัตร' : '📱 QR Codes'}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'tickets' && (
                <div className="p-6 space-y-5">
                    {/* Summary */}
                    <div className="grid grid-cols-5 gap-3">
                        {[
                            { label: 'โควต้าทั้งหมด', val: totalQuota.toLocaleString(), icon: 'fa-ticket', color: 'text-slate-700', bg: 'bg-slate-100' },
                            { label: 'ขายแล้ว', val: totalSold.toLocaleString(), icon: 'fa-check-circle', color: 'text-green-600', bg: 'bg-green-100' },
                            { label: 'Complimentary', val: totalComp.toLocaleString(), icon: 'fa-gift', color: 'text-purple-600', bg: 'bg-purple-100' },
                            { label: 'คงเหลือ', val: totalAvail.toLocaleString(), icon: 'fa-hourglass-half', color: 'text-amber-600', bg: 'bg-amber-100' },
                            { label: 'รายรับรวม', val: `฿${totalRevenue.toLocaleString()}`, icon: 'fa-sack-dollar', color: 'text-blue-600', bg: 'bg-blue-100' },
                        ].map(s => (
                            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm">
                                <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                                    <i className={`fa-solid ${s.icon} ${s.color} text-sm`} />
                                </div>
                                <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Overall progress */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                        <div className="flex justify-between mb-2">
                            <p className="text-sm font-black text-slate-700">ความคืบหน้าการขายบัตรรวม</p>
                            <span className="text-sm font-black text-blue-600">{totalQuota > 0 ? Math.round(((totalSold + totalComp) / totalQuota) * 100) : 0}%</span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
                            {totalQuota > 0 && <>
                                <div className="h-full bg-green-500 transition-all" style={{ width: `${(totalSold / totalQuota) * 100}%` }} />
                                <div className="h-full bg-purple-400 transition-all" style={{ width: `${(totalComp / totalQuota) * 100}%` }} />
                            </>}
                        </div>
                        <div className="flex gap-4 mt-2">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full inline-block" />ขายแล้ว</span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1"><span className="w-2 h-2 bg-purple-400 rounded-full inline-block" />Complimentary</span>
                        </div>
                    </div>

                    {/* Ticket Types */}
                    <div className="space-y-3">
                        {data.ticket_types.map(t => {
                            const used = (t.sold || 0) + (t.complimentary || 0);
                            const avail = Math.max(0, (t.quota || 0) - used);
                            const pct = t.quota > 0 ? Math.round((used / t.quota) * 100) : 0;
                            const isEditing = editingType === t.id;

                            return (
                                <div key={t.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                    <div className="flex items-center gap-0">
                                        <div className={`w-2 self-stretch ${t.color}`} />
                                        <div className="flex-1 p-5">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-black text-white ${t.color}`}>{t.name}</span>
                                                    <span className="text-sm font-black text-slate-600">฿{(t.price || 0).toLocaleString()}/ใบ</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => setEditingType(isEditing ? null : t.id)} className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg hover:bg-slate-200 transition">
                                                        {isEditing ? 'เสร็จ' : 'แก้ไข'}
                                                    </button>
                                                    <button onClick={() => removeType(t.id)} className="px-3 py-1 bg-red-50 text-red-400 text-xs font-bold rounded-lg hover:bg-red-100 transition">ลบ</button>
                                                </div>
                                            </div>

                                            {isEditing ? (
                                                <div className="grid grid-cols-5 gap-2">
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400">ชื่อบัตร</label>
                                                        <input value={t.name} onChange={e => updateTypeField(t.id, 'name', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400">ราคา (฿)</label>
                                                        <input type="number" value={t.price} onChange={e => updateTypeField(t.id, 'price', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400">โควต้ารวม</label>
                                                        <input type="number" value={t.quota} onChange={e => updateTypeField(t.id, 'quota', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400">ขายแล้ว</label>
                                                        <input type="number" value={t.sold} onChange={e => updateTypeField(t.id, 'sold', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400">Complimentary</label>
                                                        <input type="number" value={t.complimentary} onChange={e => updateTypeField(t.id, 'complimentary', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none" />
                                                    </div>
                                                    <div className="col-span-5 flex gap-2 flex-wrap">
                                                        {COLORS.map(c => <button key={c} onClick={() => updateTypeField(t.id, 'color', c)} className={`w-6 h-6 rounded-full ${c} ${t.color === c ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`} />)}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-4 gap-3">
                                                    {[
                                                        { label: 'โควต้า', val: t.quota || 0 },
                                                        { label: 'ขายแล้ว', val: t.sold || 0 },
                                                        { label: 'Comp', val: t.complimentary || 0 },
                                                        { label: 'คงเหลือ', val: avail },
                                                    ].map(s => (
                                                        <div key={s.label} className="text-center">
                                                            <p className="text-xl font-black text-slate-800">{s.val.toLocaleString()}</p>
                                                            <p className="text-[10px] text-slate-400">{s.label}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="mt-3">
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full ${t.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-1">{pct}% ของโควต้า · รายรับ ฿{((t.sold || 0) * (t.price || 0)).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Add new type */}
                        {showAddType ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                                <p className="text-sm font-black text-blue-800 mb-3">เพิ่มประเภทบัตรใหม่</p>
                                <div className="grid grid-cols-4 gap-2 mb-3">
                                    <input value={newType.name} onChange={e => setNewType(p => ({ ...p, name: e.target.value }))} placeholder="ชื่อบัตร *" autoFocus className="bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-sm outline-none" />
                                    <input type="number" value={newType.price} onChange={e => setNewType(p => ({ ...p, price: e.target.value }))} placeholder="ราคา (฿)" className="bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-sm outline-none" />
                                    <input type="number" value={newType.quota} onChange={e => setNewType(p => ({ ...p, quota: e.target.value }))} placeholder="โควต้า" className="bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-sm outline-none" />
                                    <div className="flex gap-1 flex-wrap items-center">
                                        {COLORS.map(c => <button key={c} onClick={() => setNewType(p => ({ ...p, color: c }))} className={`w-5 h-5 rounded-full ${c} ${newType.color === c ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`} />)}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={addType} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition">+ เพิ่ม</button>
                                    <button onClick={() => setShowAddType(false)} className="px-4 py-2 bg-white border text-sm font-bold rounded-xl">ยกเลิก</button>
                                </div>
                            </div>
                        ) : (
                            <button onClick={() => setShowAddType(true)} className="w-full border-2 border-dashed border-slate-200 rounded-2xl py-4 text-sm font-bold text-slate-400 hover:border-blue-300 hover:text-blue-500 transition flex items-center justify-center gap-2">
                                <i className="fa-solid fa-plus" /> เพิ่มประเภทบัตร
                            </button>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'qr' && (
                <div className="p-6 space-y-5">
                    {/* QR Generator */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                        <h3 className="text-sm font-black text-slate-700 mb-4">📱 สร้าง QR Code ใหม่</h3>
                        <div className="grid grid-cols-3 gap-3">
                            <input value={qrInput.label} onChange={e => setQrInput(p => ({ ...p, label: e.target.value }))} placeholder="ชื่อ QR Code *" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                            <select value={qrInput.type} onChange={e => setQrInput(p => ({ ...p, type: e.target.value }))} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none">
                                <option value="url">URL / ลิงก์</option>
                                <option value="text">ข้อความ</option>
                                <option value="phone">เบอร์โทร</option>
                                <option value="wifi">Wi-Fi</option>
                            </select>
                            <input value={qrInput.value} onChange={e => setQrInput(p => ({ ...p, value: e.target.value }))}
                                placeholder={qrInput.type === 'phone' ? 'เบอร์โทร' : qrInput.type === 'wifi' ? 'WIFI:S:ชื่อ;T:WPA;P:รหัส;;' : qrInput.type === 'text' ? 'ข้อความ' : 'https://...'}
                                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                        </div>
                        {qrInput.value && qrInput.label && (
                            <div className="mt-4 flex items-center gap-5 p-4 bg-slate-50 rounded-xl">
                                <QRImage value={qrInput.value} size={100} />
                                <div className="flex-1">
                                    <p className="font-black text-slate-800">{qrInput.label}</p>
                                    <p className="text-xs text-slate-400 break-all">{qrInput.value}</p>
                                    <button onClick={addQR} className="mt-2 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition">
                                        💾 บันทึก QR Code นี้
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Saved QRs */}
                    {data.qrcodes.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                            <h3 className="text-sm font-black text-slate-700 mb-4">📋 QR Code ที่บันทึกไว้</h3>
                            <div className="grid grid-cols-3 gap-4">
                                {data.qrcodes.map(qr => (
                                    <div key={qr.id} className="border border-slate-100 rounded-xl p-4 text-center group relative hover:border-blue-200 transition">
                                        <QRImage value={qr.value} size={120} />
                                        <p className="text-sm font-black text-slate-800 mt-3">{qr.label}</p>
                                        <p className="text-[10px] text-slate-400 truncate">{qr.value}</p>
                                        <a href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qr.value)}&format=png`}
                                            download={`${qr.label}.png`} target="_blank" rel="noopener noreferrer"
                                            className="mt-2 w-full py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition flex items-center justify-center gap-1.5">
                                            <i className="fa-solid fa-download text-[10px]" /> Download
                                        </a>
                                        <button onClick={() => removeQR(qr.id)} className="absolute top-2 right-2 w-6 h-6 bg-red-50 text-red-400 rounded-md text-[10px] opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                            <i className="fa-solid fa-times" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const QRImage = ({ value, size = 120 }) => {
    const encoded = encodeURIComponent(value);
    return <img src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&format=png&margin=4`}
        alt="QR Code" width={size} height={size} className="rounded-lg mx-auto" />;
};

export default TicketView;
