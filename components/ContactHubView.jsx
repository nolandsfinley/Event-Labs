import React, { useState, useEffect } from 'react';

const getKey = (projectId) => `eflow_contacts_${projectId || 'global'}`;
const load = (projectId) => { try { return JSON.parse(localStorage.getItem(getKey(projectId)) || '[]'); } catch { return []; } };
const save = (d, projectId) => localStorage.setItem(getKey(projectId), JSON.stringify(d));

const GROUPS = [
    { id: 'staff', label: 'ทีม Staff', icon: 'fa-people-group', color: 'bg-blue-100 text-blue-700' },
    { id: 'vendor', label: 'Vendors', icon: 'fa-handshake', color: 'bg-orange-100 text-orange-700' },
    { id: 'vip', label: 'VIP / Speaker', icon: 'fa-star', color: 'bg-amber-100 text-amber-700' },
    { id: 'security', label: 'ความปลอดภัย', icon: 'fa-shield-halved', color: 'bg-slate-100 text-slate-700' },
    { id: 'medical', label: 'ทีมการแพทย์', icon: 'fa-kit-medical', color: 'bg-red-100 text-red-700' },
    { id: 'venue', label: 'สถานที่', icon: 'fa-building', color: 'bg-green-100 text-green-700' },
    { id: 'press', label: 'สื่อมวลชน', icon: 'fa-camera', color: 'bg-purple-100 text-purple-700' },
    { id: 'other', label: 'อื่นๆ', icon: 'fa-user', color: 'bg-gray-100 text-gray-600' },
];

const DEFAULT_FORM = { name: '', role: '', phone: '', phone2: '', line: '', email: '', group: 'staff', note: '', priority: false };

const ContactHubView = ({ projectId }) => {
    const [contacts, setContacts] = useState(() => load(projectId));
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(DEFAULT_FORM);
    const [editId, setEditId] = useState(null);
    const [search, setSearch] = useState('');
    const [filterGroup, setFilterGroup] = useState('all');
    const [dayMode, setDayMode] = useState(false);

    useEffect(() => save(contacts, projectId), [contacts, projectId]);

    const submit = () => {
        if (!form.name.trim() || !form.phone.trim()) return;
        if (editId) {
            setContacts(p => p.map(c => c.id === editId ? { ...c, ...form } : c));
            setEditId(null);
        } else {
            setContacts(p => [...p, { id: Date.now().toString(), ...form }]);
        }
        setForm(DEFAULT_FORM);
        setShowForm(false);
    };

    const remove = (id) => setContacts(p => p.filter(c => c.id !== id));
    const startEdit = (c) => { setForm({ ...c }); setEditId(c.id); setShowForm(true); };
    const togglePrio = (id) => setContacts(p => p.map(c => c.id === id ? { ...c, priority: !c.priority } : c));

    const groupInfo = (id) => GROUPS.find(g => g.id === id) || GROUPS[7];

    const filtered = contacts.filter(c => {
        if (filterGroup !== 'all' && c.group !== filterGroup) return false;
        if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.role.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const priority = filtered.filter(c => c.priority);
    const normal = filtered.filter(c => !c.priority);

    const ContactCard = ({ c }) => {
        const g = groupInfo(c.group);
        return (
            <div className={`bg-white rounded-2xl border shadow-sm p-4 group transition hover:shadow-md ${dayMode ? 'border-slate-200' : 'border-slate-100'}`}>
                <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${g.color}`}>
                        <i className={`fa-solid ${g.icon} text-sm`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="font-black text-slate-800 text-sm truncate">{c.name}</p>
                            {c.priority && <i className="fa-solid fa-star text-amber-400 text-xs" />}
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">{c.role}</p>
                        {/* Phone — big tap target in day mode */}
                        <a href={`tel:${c.phone}`}
                            className={`flex items-center gap-1.5 mt-2 font-black transition ${dayMode ? 'text-green-600 text-base hover:text-green-700' : 'text-slate-700 text-xs hover:text-blue-600'}`}>
                            <i className={`fa-solid fa-phone ${dayMode ? 'text-sm' : 'text-[10px]'}`} />
                            {c.phone}
                        </a>
                        {c.phone2 && (
                            <a href={`tel:${c.phone2}`}
                                className={`flex items-center gap-1.5 font-bold transition ${dayMode ? 'text-green-500 text-sm hover:text-green-600' : 'text-slate-400 text-[11px] hover:text-blue-500'}`}>
                                <i className="fa-solid fa-phone-flip text-[9px]" />{c.phone2}
                            </a>
                        )}
                        {c.line && <p className="text-[11px] text-slate-400 mt-1"><i className="fa-brands fa-line text-green-500 mr-1" />{c.line}</p>}
                        {c.note && <p className="text-[11px] text-slate-300 mt-1 italic">{c.note}</p>}
                    </div>
                    {!dayMode && (
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => togglePrio(c.id)} className={`w-7 h-7 rounded-md flex items-center justify-center text-xs ${c.priority ? 'bg-amber-100 text-amber-500' : 'bg-slate-100 text-slate-300 hover:text-amber-400'}`}>
                                <i className="fa-solid fa-star" />
                            </button>
                            <button onClick={() => startEdit(c)} className="w-7 h-7 rounded-md bg-blue-50 text-blue-500 hover:bg-blue-100 flex items-center justify-center">
                                <i className="fa-solid fa-pen text-xs" />
                            </button>
                            <button onClick={() => remove(c.id)} className="w-7 h-7 rounded-md bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center">
                                <i className="fa-solid fa-trash text-xs" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 overflow-y-auto bg-[#f5f5f7]">
            {/* Header */}
            <div className={`border-b px-8 py-5 flex flex-wrap justify-between items-center gap-3 ${dayMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'}`}>
                <div>
                    <h2 className={`text-2xl font-black ${dayMode ? 'text-white' : 'text-slate-800'}`}>📞 Contact Hub</h2>
                    <p className={`text-sm font-medium ${dayMode ? 'text-slate-400' : 'text-slate-400'}`}>
                        {contacts.length} รายชื่อ · {contacts.filter(c => c.priority).length} สำคัญ
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setDayMode(v => !v)}
                        className={`px-4 py-2 text-sm font-black rounded-xl transition flex items-center gap-2 ${dayMode ? 'bg-yellow-400 text-slate-900 hover:bg-yellow-300' : 'bg-slate-900 text-white hover:bg-slate-700'}`}>
                        <i className={`fa-solid ${dayMode ? 'fa-sun' : 'fa-tower-broadcast'}`} />
                        {dayMode ? 'ปิด Day-Of Mode' : 'Day-Of Mode'}
                    </button>
                    {!dayMode && (
                        <button onClick={() => { setEditId(null); setForm(DEFAULT_FORM); setShowForm(v => !v); }}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition flex items-center gap-2">
                            <i className="fa-solid fa-plus" /> เพิ่มรายชื่อ
                        </button>
                    )}
                </div>
            </div>

            {/* Add Form */}
            {showForm && !dayMode && (
                <div className="bg-blue-50 border-b border-blue-100 px-8 py-5">
                    <h4 className="text-sm font-black text-blue-800 mb-4">{editId ? 'แก้ไขรายชื่อ' : 'เพิ่มรายชื่อใหม่'}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="ชื่อ *" autoFocus className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                        <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="ตำแหน่ง / หน้าที่" className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                        <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="เบอร์โทรหลัก *" type="tel" className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                        <input value={form.phone2} onChange={e => setForm(f => ({ ...f, phone2: e.target.value }))} placeholder="เบอร์สำรอง" type="tel" className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                        <input value={form.line} onChange={e => setForm(f => ({ ...f, line: e.target.value }))} placeholder="LINE ID" className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                        <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                        <select value={form.group} onChange={e => setForm(f => ({ ...f, group: e.target.value }))} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none">
                            {GROUPS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                        </select>
                        <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="หมายเหตุ" className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                        <div className="flex gap-2">
                            <label className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 cursor-pointer flex-1">
                                <input type="checkbox" checked={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.checked }))} className="accent-amber-400" />
                                <span className="text-sm font-bold text-amber-600">⭐ สำคัญ</span>
                            </label>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={submit} className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition">{editId ? 'บันทึก' : '+ เพิ่ม'}</button>
                            <button onClick={() => { setShowForm(false); setEditId(null); }} className="flex-1 py-2.5 bg-white border text-sm font-bold rounded-xl hover:bg-slate-50 transition">ยกเลิก</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-6 space-y-5">
                {/* Search & Filter */}
                {!dayMode && (
                    <div className="flex flex-wrap gap-2 items-center bg-white rounded-xl p-3 border border-slate-100">
                        <div className="relative">
                            <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหา..." className="pl-8 pr-3 py-2 bg-slate-50 rounded-lg text-sm outline-none w-36" />
                        </div>
                        {['all', ...GROUPS.map(g => g.id)].map(id => {
                            const g = id === 'all' ? null : GROUPS.find(x => x.id === id);
                            return (
                                <button key={id} onClick={() => setFilterGroup(id)}
                                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition ${filterGroup === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                    {id === 'all' ? 'ทั้งหมด' : g?.label}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Priority contacts */}
                {priority.length > 0 && (
                    <div>
                        <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-3"><i className="fa-solid fa-star mr-1" />รายชื่อสำคัญ</p>
                        <div className={`grid gap-3 ${dayMode ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
                            {priority.map(c => <ContactCard key={c.id} c={c} />)}
                        </div>
                    </div>
                )}

                {/* Normal contacts grouped */}
                {GROUPS.map(g => {
                    const gc = normal.filter(c => c.group === g.id);
                    if (filterGroup !== 'all' && filterGroup !== g.id) return null;
                    if (gc.length === 0) return null;
                    return (
                        <div key={g.id}>
                            <p className={`text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${g.color.split(' ')[1]}`}>
                                <i className={`fa-solid ${g.icon}`} />{g.label}
                                <span className="text-slate-300">({gc.length})</span>
                            </p>
                            <div className={`grid gap-3 ${dayMode ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
                                {gc.map(c => <ContactCard key={c.id} c={c} />)}
                            </div>
                        </div>
                    );
                })}

                {filtered.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
                        <i className="fa-solid fa-address-book text-slate-200 text-5xl mb-4 block" />
                        <p className="text-slate-400 font-bold text-lg mb-2">ยังไม่มีรายชื่อ</p>
                        <button onClick={() => setShowForm(true)} className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-700 transition">
                            + เพิ่มรายชื่อแรก
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactHubView;
