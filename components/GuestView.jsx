import React, { useState, useMemo, useEffect } from 'react';

const getKey = (projectId) => `eflow_guests_${projectId || 'global'}`;
const load = (projectId) => { try { return JSON.parse(localStorage.getItem(getKey(projectId)) || '[]'); } catch { return []; } };
const save = (d, projectId) => localStorage.setItem(getKey(projectId), JSON.stringify(d));

const TYPES = ['VIP', 'Press', 'Speaker', 'Sponsor', 'General', 'Staff'];
const STATUSES = [
    { id: 'invited', label: 'เชิญแล้ว', color: 'bg-blue-100 text-blue-700' },
    { id: 'confirmed', label: 'ยืนยันแล้ว', color: 'bg-green-100 text-green-700' },
    { id: 'declined', label: 'ปฏิเสธ', color: 'bg-red-100 text-red-500' },
    { id: 'checkedin', label: 'เช็กอินแล้ว', color: 'bg-violet-100 text-violet-700' },
];

const DEFAULT_FORM = { name: '', org: '', email: '', phone: '', type: 'General', status: 'invited', dietary: '', note: '' };

const GuestView = ({ projectId }) => {
    const [guests, setGuests] = useState(() => load(projectId));
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(DEFAULT_FORM);
    const [editId, setEditId] = useState(null);
    const [filter, setFilter] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [search, setSearch] = useState('');
    const [importText, setImportText] = useState('');
    const [showImport, setShowImport] = useState(false);
    const [checkInMode, setCheckInMode] = useState(false);

    useEffect(() => save(guests, projectId), [guests, projectId]);

    const submit = () => {
        if (!form.name.trim()) return;
        if (editId) {
            setGuests(prev => prev.map(g => g.id === editId ? { ...g, ...form } : g));
            setEditId(null);
        } else {
            setGuests(prev => [...prev, { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }]);
        }
        setForm(DEFAULT_FORM); setShowForm(false);
    };

    const startEdit = (g) => { setForm({ ...g }); setEditId(g.id); setShowForm(true); };
    const remove = (id) => setGuests(prev => prev.filter(g => g.id !== id));
    const nextStatus = (id) => {
        const order = ['invited', 'confirmed', 'checkedin'];
        setGuests(prev => prev.map(g => {
            if (g.id !== id) return g;
            const idx = order.indexOf(g.status);
            return { ...g, status: order[Math.min(idx + 1, order.length - 1)] };
        }));
    };
    const checkIn = (id) => setGuests(prev => prev.map(g => g.id === id ? { ...g, status: 'checkedin', checkedInAt: new Date().toISOString() } : g));

    // Bulk import from CSV-style text
    const importGuests = () => {
        const lines = importText.split('\n').filter(l => l.trim());
        const newGuests = lines.map((line, i) => {
            const parts = line.split(',').map(p => p.trim());
            return { id: `imp-${Date.now()}-${i}`, name: parts[0] || '', org: parts[1] || '', email: parts[2] || '', phone: parts[3] || '', type: parts[4] || 'General', status: 'invited', dietary: '', note: '', createdAt: new Date().toISOString() };
        }).filter(g => g.name);
        setGuests(prev => [...prev, ...newGuests]);
        setImportText(''); setShowImport(false);
    };

    const filtered = useMemo(() => guests.filter(g => {
        if (filter !== 'all' && g.status !== filter) return false;
        if (filterType !== 'all' && g.type !== filterType) return false;
        if (search && !g.name.toLowerCase().includes(search.toLowerCase()) && !g.org?.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    }), [guests, filter, filterType, search]);

    const stats = { total: guests.length, confirmed: guests.filter(g => g.status === 'confirmed').length, checkedIn: guests.filter(g => g.status === 'checkedin').length, declined: guests.filter(g => g.status === 'declined').length };

    return (
        <div className="flex-1 overflow-y-auto bg-[#f5f5f7]">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-8 py-5 flex flex-wrap justify-between items-center gap-3">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">👥 ผู้เข้าร่วม (Guest List)</h2>
                    <p className="text-sm text-slate-400 font-medium">{stats.total} คน · {stats.confirmed} ยืนยัน · {stats.checkedIn} เช็กอินแล้ว</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setCheckInMode(v => !v)} className={`px-4 py-2 text-sm font-bold rounded-xl border transition flex items-center gap-2 ${checkInMode ? 'bg-violet-600 text-white border-violet-600' : 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100'}`}>
                        <i className="fa-solid fa-qrcode" /> {checkInMode ? 'ออกจากโหมดเช็กอิน' : 'โหมดเช็กอิน'}
                    </button>
                    <button onClick={() => setShowImport(v => !v)} className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition flex items-center gap-2">
                        <i className="fa-solid fa-upload" /> นำเข้า CSV
                    </button>
                    <button onClick={() => { setEditId(null); setForm(DEFAULT_FORM); setShowForm(v => !v); }} className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition flex items-center gap-2">
                        <i className="fa-solid fa-plus" /> เพิ่มผู้เข้าร่วม
                    </button>
                </div>
            </div>

            {/* Check-in mode banner */}
            {checkInMode && (
                <div className="bg-violet-600 text-white px-8 py-3 flex items-center gap-3">
                    <i className="fa-solid fa-circle-dot animate-pulse" />
                    <p className="text-sm font-bold">โหมดเช็กอิน · คลิกบัตรเพื่อเช็กอินผู้เข้าร่วม</p>
                    <span className="ml-auto text-sm font-black">{stats.checkedIn}/{stats.total} เข้าแล้ว</span>
                </div>
            )}

            {/* Import CSV */}
            {showImport && (
                <div className="bg-blue-50 border-b border-blue-100 px-8 py-4">
                    <p className="text-xs font-bold text-blue-700 mb-2">วางข้อมูล CSV: ชื่อ, องค์กร, อีเมล, โทร, ประเภท (แต่ละแถว 1 คน)</p>
                    <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={4} placeholder="ชื่อ A, บริษัท X, a@email.com, 089-xxx, VIP&#10;ชื่อ B, บริษัท Y, b@email.com, 081-xxx, General" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none font-mono" />
                    <div className="flex gap-2 mt-2">
                        <button onClick={importGuests} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700">นำเข้า</button>
                        <button onClick={() => setShowImport(false)} className="px-4 py-2 bg-white border text-sm font-bold rounded-xl">ยกเลิก</button>
                    </div>
                </div>
            )}

            {/* Add/Edit Form */}
            {showForm && (
                <div className="bg-blue-50 border-b border-blue-100 px-8 py-5">
                    <h4 className="text-sm font-black text-blue-800 mb-4">{editId ? 'แก้ไขผู้เข้าร่วม' : 'เพิ่มผู้เข้าร่วมใหม่'}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="ชื่อ-นามสกุล *" className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                        <input value={form.org} onChange={e => setForm(f => ({ ...f, org: e.target.value }))} placeholder="องค์กร / บริษัท" className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                        <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="อีเมล" className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                        <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="เบอร์โทร" className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                        <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none">
                            {TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                        <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none">
                            {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                        <input value={form.dietary} onChange={e => setForm(f => ({ ...f, dietary: e.target.value }))} placeholder="ข้อจำกัดอาหาร (Halal, Vegan...)" className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                        <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="หมายเหตุ" className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                        <div className="flex gap-2">
                            <button onClick={submit} className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700">{editId ? 'บันทึก' : '+ เพิ่ม'}</button>
                            <button onClick={() => { setShowForm(false); setEditId(null); }} className="flex-1 py-2.5 bg-white border text-sm font-bold rounded-xl">ยกเลิก</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-6 space-y-5">
                {/* KPI */}
                <div className="grid grid-cols-4 gap-3">
                    {[{ l: 'ทั้งหมด', v: stats.total, c: 'text-slate-700' }, { l: 'ยืนยัน', v: stats.confirmed, c: 'text-green-600' }, { l: 'เช็กอินแล้ว', v: stats.checkedIn, c: 'text-violet-600' }, { l: 'ปฏิเสธ', v: stats.declined, c: 'text-red-500' }].map(s => (
                        <div key={s.l} className="bg-white rounded-2xl p-4 border border-slate-100 text-center">
                            <p className={`text-3xl font-black ${s.c}`}>{s.v}</p>
                            <p className="text-xs text-slate-400 font-bold mt-1">{s.l}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 items-center">
                    <div className="relative">
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาชื่อ..." className="pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none w-36" />
                    </div>
                    {[{ v: 'all', l: 'ทั้งหมด' }, ...STATUSES.map(s => ({ v: s.id, l: s.label }))].map(f => (
                        <button key={f.v} onClick={() => setFilter(f.v)} className={`px-3 py-1 rounded-full text-xs font-bold transition ${filter === f.v ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{f.l}</button>
                    ))}
                    <div className="w-px h-4 bg-slate-200 mx-1" />
                    {['all', ...TYPES].map(t => (
                        <button key={t} onClick={() => setFilterType(t)} className={`px-3 py-1 rounded-full text-xs font-bold transition ${filterType === t ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{t === 'all' ? 'ทุกประเภท' : t}</button>
                    ))}
                </div>

                {/* Guest Cards */}
                <div className="space-y-2">
                    {filtered.length === 0 && (
                        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                            <i className="fa-solid fa-users text-slate-300 text-5xl mb-4 block" />
                            <p className="text-slate-400 font-bold">ยังไม่มีผู้เข้าร่วม</p>
                        </div>
                    )}
                    {filtered.map(g => {
                        const status = STATUSES.find(s => s.id === g.status) || STATUSES[0];
                        const isCheckedIn = g.status === 'checkedin';
                        return (
                            <div
                                key={g.id}
                                className={`bg-white rounded-2xl border shadow-sm flex items-center gap-4 px-5 py-4 transition group ${checkInMode && !isCheckedIn ? 'cursor-pointer hover:border-violet-400 hover:bg-violet-50' : ''} ${isCheckedIn ? 'border-green-200 bg-green-50/30' : 'border-slate-100'}`}
                                onClick={() => checkInMode && !isCheckedIn && checkIn(g.id)}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${isCheckedIn ? 'bg-green-200 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {g.name[0]?.toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-black text-slate-800">{g.name}</p>
                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">{g.type}</span>
                                        {g.dietary && <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold">🌿 {g.dietary}</span>}
                                    </div>
                                    <div className="flex gap-3 mt-0.5 flex-wrap">
                                        {g.org && <p className="text-xs text-slate-400">{g.org}</p>}
                                        {g.email && <p className="text-xs text-slate-400">{g.email}</p>}
                                        {isCheckedIn && g.checkedInAt && <p className="text-xs text-green-600 font-bold">✅ เช็กอิน {new Date(g.checkedInAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {checkInMode && !isCheckedIn && (
                                        <button onClick={(e) => { e.stopPropagation(); checkIn(g.id); }} className="px-3 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-lg">เช็กอิน</button>
                                    )}
                                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-full cursor-pointer ${status.color}`} onClick={(e) => { e.stopPropagation(); nextStatus(g.id); }}>{status.label}</span>
                                    {!checkInMode && (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                            <button onClick={() => startEdit(g)} className="w-7 h-7 rounded-md bg-blue-50 text-blue-500 hover:bg-blue-100 flex items-center justify-center"><i className="fa-solid fa-pen text-xs" /></button>
                                            <button onClick={() => remove(g.id)} className="w-7 h-7 rounded-md bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center"><i className="fa-solid fa-trash text-xs" /></button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default GuestView;
