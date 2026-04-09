import React, { useState, useMemo, useEffect } from 'react';

const getKey = (projectId) => `eflow_vendors_${projectId || 'global'}`;
const load = (projectId) => { try { return JSON.parse(localStorage.getItem(getKey(projectId)) || '[]'); } catch { return []; } };
const save = (d, projectId) => localStorage.setItem(getKey(projectId), JSON.stringify(d));

const CATS = ['AV/เทคนิค', 'อาหาร/Catering', 'ความปลอดภัย', 'ขนส่ง', 'สถานที่', 'ตกแต่ง/Deco', 'ถ่ายภาพ/วิดีโอ', 'พิธีกร', 'อื่นๆ'];
const STATUSES = [
    { id: 'prospect', label: 'กำลังพิจารณา', color: 'bg-slate-100 text-slate-600' },
    { id: 'pending', label: 'รอตอบกลับ', color: 'bg-amber-100 text-amber-700' },
    { id: 'negotiating', label: 'อยู่ระหว่างต่อรอง', color: 'bg-blue-100 text-blue-700' },
    { id: 'confirmed', label: 'ยืนยันแล้ว', color: 'bg-green-100 text-green-700' },
    { id: 'rejected', label: 'ไม่เลือก', color: 'bg-red-100 text-red-500' },
];

const DEFAULT_FORM = { name: '', cat: 'อื่นๆ', contact: '', email: '', phone: '', price: '', status: 'prospect', note: '', rating: 0 };

const VendorView = ({ projectId }) => {
    const [vendors, setVendors] = useState(() => load(projectId));
    const [filter, setFilter] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(DEFAULT_FORM);
    const [editId, setEditId] = useState(null);
    const [expand, setExpand] = useState(null);
    const [search, setSearch] = useState('');

    useEffect(() => save(vendors, projectId), [vendors, projectId]);

    const submit = () => {
        if (!form.name.trim()) return;
        if (editId) {
            setVendors(prev => prev.map(v => v.id === editId ? { ...v, ...form, price: Number(form.price) || 0 } : v));
            setEditId(null);
        } else {
            setVendors(prev => [...prev, { id: Date.now().toString(), ...form, price: Number(form.price) || 0, createdAt: new Date().toISOString() }]);
        }
        setForm(DEFAULT_FORM); setShowForm(false);
    };

    const startEdit = (v) => { setForm({ ...v, price: String(v.price || '') }); setEditId(v.id); setShowForm(true); };
    const remove = (id) => setVendors(prev => prev.filter(v => v.id !== id));
    const nextStatus = (id) => {
        const order = ['prospect', 'pending', 'negotiating', 'confirmed'];
        setVendors(prev => prev.map(v => {
            if (v.id !== id) return v;
            const idx = order.indexOf(v.status);
            return { ...v, status: order[Math.min(idx + 1, order.length - 1)] };
        }));
    };

    const filtered = useMemo(() => vendors.filter(v => {
        if (filter !== 'all' && v.cat !== filter) return false;
        if (filterStatus !== 'all' && v.status !== filterStatus) return false;
        if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    }), [vendors, filter, filterStatus, search]);

    const confirmed = vendors.filter(v => v.status === 'confirmed').length;
    const pending = vendors.filter(v => v.status === 'pending').length;
    const totalValue = vendors.filter(v => v.status === 'confirmed').reduce((s, v) => s + (v.price || 0), 0);

    return (
        <div className="flex-1 overflow-y-auto bg-[#f5f5f7]">
            <div className="bg-white border-b border-slate-100 px-8 py-5 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">🤝 Vendors & Suppliers</h2>
                    <p className="text-sm text-slate-400 font-medium">{vendors.length} ราย · {confirmed} ยืนยัน · {pending} รอตอบ</p>
                </div>
                <button onClick={() => { setEditId(null); setForm(DEFAULT_FORM); setShowForm(v => !v); }} className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition flex items-center gap-2">
                    <i className="fa-solid fa-plus" /> เพิ่ม Vendor
                </button>
            </div>

            {showForm && (
                <div className="bg-orange-50 border-b border-orange-100 px-8 py-5">
                    <h4 className="text-sm font-black text-orange-800 mb-4">{editId ? 'แก้ไข Vendor' : 'เพิ่ม Vendor ใหม่'}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="ชื่อบริษัท / ร้านค้า *" className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400" />
                        <select value={form.cat} onChange={e => setForm(f => ({ ...f, cat: e.target.value }))} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none">
                            {CATS.map(c => <option key={c}>{c}</option>)}
                        </select>
                        <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} placeholder="ชื่อผู้ติดต่อ" className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                        <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="เบอร์โทร" className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                        <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="อีเมล" className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                        <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} type="number" placeholder="ราคาประมาณ (บาท)" className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                        <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none">
                            {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                        <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="หมายเหตุ" className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                        <div className="flex gap-2">
                            <button onClick={submit} className="flex-1 py-2.5 bg-orange-600 text-white text-sm font-bold rounded-xl hover:bg-orange-700 transition">{editId ? 'บันทึก' : '+ เพิ่ม'}</button>
                            <button onClick={() => { setShowForm(false); setEditId(null); }} className="flex-1 py-2.5 bg-white border text-sm font-bold rounded-xl hover:bg-slate-50 transition">ยกเลิก</button>
                        </div>
                    </div>
                </div>
            )}

            {/* KPI */}
            <div className="p-6 space-y-5">
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 text-center">
                        <p className="text-3xl font-black text-green-600">{confirmed}</p>
                        <p className="text-xs text-slate-400 font-bold mt-1">ยืนยันแล้ว</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 text-center">
                        <p className="text-3xl font-black text-amber-600">{pending}</p>
                        <p className="text-xs text-slate-400 font-bold mt-1">รอตอบกลับ</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-slate-100 text-center">
                        <p className="text-2xl font-black text-slate-700">฿{totalValue.toLocaleString()}</p>
                        <p className="text-xs text-slate-400 font-bold mt-1">มูลค่าที่ยืนยันแล้ว</p>
                    </div>
                </div>

                {/* Filters + Search */}
                <div className="flex flex-wrap gap-2 items-center">
                    <div className="relative">
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหา..." className="pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 w-36" />
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                        <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-full text-xs font-bold transition ${filter === 'all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>ทุกหมวด</button>
                        {CATS.map(c => (
                            <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1 rounded-full text-xs font-bold transition ${filter === c ? 'bg-orange-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{c}</button>
                        ))}
                    </div>
                </div>

                {/* Vendor Cards */}
                <div className="space-y-3">
                    {filtered.length === 0 && (
                        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                            <i className="fa-solid fa-handshake text-slate-300 text-5xl mb-4 block" />
                            <p className="text-slate-400 font-bold">ยังไม่มี Vendor</p>
                        </div>
                    )}
                    {filtered.map(v => {
                        const status = STATUSES.find(s => s.id === v.status) || STATUSES[0];
                        return (
                            <div key={v.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="flex items-center gap-4 px-5 py-4">
                                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                                        <i className="fa-solid fa-store text-orange-500 text-sm" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-black text-slate-800">{v.name}</p>
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">{v.cat}</span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                            {v.contact && <p className="text-xs text-slate-400"><i className="fa-solid fa-user mr-1" />{v.contact}</p>}
                                            {v.phone && <p className="text-xs text-slate-400"><i className="fa-solid fa-phone mr-1" />{v.phone}</p>}
                                            {v.price > 0 && <p className="text-xs font-bold text-slate-600">฿{v.price.toLocaleString()}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => nextStatus(v.id)} className={`text-[10px] font-black px-3 py-1.5 rounded-full cursor-pointer hover:opacity-80 transition ${status.color}`}>
                                            {status.label}
                                        </button>
                                        <button onClick={() => setExpand(expand === v.id ? null : v.id)} className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition">
                                            <i className={`fa-solid fa-chevron-${expand === v.id ? 'up' : 'down'} text-xs`} />
                                        </button>
                                    </div>
                                </div>
                                {expand === v.id && (
                                    <div className="border-t border-slate-50 px-5 py-4 bg-slate-50/50 flex gap-3 flex-wrap">
                                        {v.email && <a href={`mailto:${v.email}`} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"><i className="fa-solid fa-envelope" />{v.email}</a>}
                                        {v.note && <p className="text-xs text-slate-500 flex-1">📝 {v.note}</p>}
                                        <div className="flex gap-2 ml-auto">
                                            <button onClick={() => startEdit(v)} className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100"><i className="fa-solid fa-pen mr-1" />แก้ไข</button>
                                            <button onClick={() => remove(v.id)} className="px-3 py-1.5 bg-red-50 text-red-500 text-xs font-bold rounded-lg hover:bg-red-100"><i className="fa-solid fa-trash mr-1" />ลบ</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default VendorView;
