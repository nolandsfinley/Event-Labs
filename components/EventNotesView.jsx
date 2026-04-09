import React, { useState, useEffect } from 'react';

const getKey = (pid) => `eflow_notes_${pid || 'global'}`;
const load = (pid) => { try { return JSON.parse(localStorage.getItem(getKey(pid)) || '[]'); } catch { return []; } };
const save = (d, pid) => localStorage.setItem(getKey(pid), JSON.stringify(d));

const TAGS = [
    { id: 'decision', label: 'คำตัดสินใจ', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 'budget', label: 'งบประมาณ', color: 'bg-green-100 text-green-700 border-green-200' },
    { id: 'vendor', label: 'Vendor', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { id: 'venue', label: 'สถานที่', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { id: 'guest', label: 'ผู้เข้าร่วม', color: 'bg-pink-100 text-pink-700 border-pink-200' },
    { id: 'issue', label: 'ปัญหา/ความเสี่ยง', color: 'bg-red-100 text-red-700 border-red-200' },
    { id: 'idea', label: 'ไอเดีย', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { id: 'general', label: 'ทั่วไป', color: 'bg-slate-100 text-slate-600 border-slate-200' },
];

const fmtDate = (d) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const DEFAULT_FORM = { title: '', body: '', tag: 'general', who: '', important: false };

const EventNotesView = ({ projectId }) => {
    const [notes, setNotes] = useState(() => load(projectId));
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(DEFAULT_FORM);
    const [editId, setEditId] = useState(null);
    const [filterTag, setFilterTag] = useState('all');
    const [search, setSearch] = useState('');
    const [expandId, setExpandId] = useState(null);

    useEffect(() => save(notes, projectId), [notes, projectId]);

    const submit = () => {
        if (!form.title.trim()) return;
        if (editId) {
            setNotes(p => p.map(n => n.id === editId ? { ...n, ...form, updatedAt: new Date().toISOString() } : n));
            setEditId(null);
        } else {
            setNotes(p => [{ id: Date.now().toString(), ...form, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...p]);
        }
        setForm(DEFAULT_FORM);
        setShowForm(false);
    };

    const remove = (id) => setNotes(p => p.filter(n => n.id !== id));
    const startEdit = (n) => { setForm({ ...n }); setEditId(n.id); setShowForm(true); };
    const toggleImportant = (id) => setNotes(p => p.map(n => n.id === id ? { ...n, important: !n.important } : n));

    const tagInfo = (id) => TAGS.find(t => t.id === id) || TAGS[7];

    const filtered = notes.filter(n => {
        if (filterTag !== 'all' && n.tag !== filterTag) return false;
        const q = search.toLowerCase();
        if (q && !n.title.toLowerCase().includes(q) && !n.body.toLowerCase().includes(q)) return false;
        return true;
    }).sort((a, b) => {
        if (a.important && !b.important) return -1;
        if (!a.important && b.important) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return (
        <div className="flex-1 overflow-y-auto bg-[#f5f5f7]">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-8 py-5 flex flex-wrap justify-between items-center gap-3">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">📝 บันทึก & Decision Log</h2>
                    <p className="text-sm text-slate-400 font-medium">{notes.length} รายการ · {notes.filter(n => n.important).length} สำคัญ</p>
                </div>
                <button onClick={() => { setEditId(null); setForm(DEFAULT_FORM); setShowForm(v => !v); }}
                    className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition flex items-center gap-2">
                    <i className="fa-solid fa-plus" /> บันทึกใหม่
                </button>
            </div>

            {/* Add / Edit Form */}
            {showForm && (
                <div className="bg-amber-50 border-b border-amber-100 px-8 py-5">
                    <h4 className="text-sm font-black text-amber-800 mb-4">{editId ? 'แก้ไขบันทึก' : 'บันทึกใหม่'}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="หัวข้อ *" autoFocus
                            className="col-span-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-400" />
                        <select value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none">
                            {TAGS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                        </select>
                        <input value={form.who} onChange={e => setForm(f => ({ ...f, who: e.target.value }))} placeholder="ผู้ตัดสินใจ / ผู้บันทึก"
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                        <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="รายละเอียด..." rows={4}
                            className="col-span-2 md:col-span-4 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none focus:border-amber-400" />
                        <label className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 cursor-pointer">
                            <input type="checkbox" checked={form.important} onChange={e => setForm(f => ({ ...f, important: e.target.checked }))} className="accent-amber-400" />
                            <span className="text-sm font-bold text-amber-600">⭐ สำคัญ/ด่วน</span>
                        </label>
                        <div className="flex gap-2">
                            <button onClick={submit} className="flex-1 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition">{editId ? 'บันทึก' : '+ บันทึก'}</button>
                            <button onClick={() => { setShowForm(false); setEditId(null); }} className="flex-1 py-2.5 bg-white border text-sm font-bold rounded-xl hover:bg-slate-50 transition">ยกเลิก</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-6 space-y-4">
                {/* Filter */}
                <div className="flex flex-wrap gap-2 items-center bg-white rounded-xl p-3 border border-slate-100">
                    <div className="relative">
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหา..." className="pl-8 pr-3 py-2 bg-slate-50 rounded-lg text-sm outline-none w-32" />
                    </div>
                    {['all', ...TAGS.map(t => t.id)].map(id => {
                        const t = id === 'all' ? null : TAGS.find(x => x.id === id);
                        return (
                            <button key={id} onClick={() => setFilterTag(id)}
                                className={`px-2.5 py-1 rounded-full text-xs font-bold transition ${filterTag === id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                {id === 'all' ? 'ทั้งหมด' : t?.label}
                            </button>
                        );
                    })}
                </div>

                {/* Notes list */}
                {filtered.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
                        <i className="fa-solid fa-note-sticky text-slate-200 text-5xl mb-4 block" />
                        <p className="text-slate-400 font-bold text-lg mb-2">ยังไม่มีบันทึก</p>
                        <button onClick={() => setShowForm(true)} className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-700 transition">
                            + เพิ่มบันทึกแรก
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(note => {
                            const tag = tagInfo(note.tag);
                            const isExpanded = expandId === note.id;
                            return (
                                <div key={note.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition ${note.important ? 'border-amber-200' : 'border-slate-100 hover:border-slate-200'}`}>
                                    <div className="px-5 py-4 flex items-start gap-3 group">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                {note.important && <i className="fa-solid fa-star text-amber-400 text-sm" />}
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${tag.color}`}>{tag.label}</span>
                                                {note.who && <span className="text-[10px] text-slate-400 font-medium"><i className="fa-solid fa-user mr-1 text-[9px]" />{note.who}</span>}
                                            </div>
                                            <p className="font-black text-slate-800 text-sm">{note.title}</p>
                                            {note.body && (
                                                <p className={`text-sm text-slate-500 mt-1 leading-relaxed ${!isExpanded && note.body.length > 120 ? 'line-clamp-2' : ''}`}>
                                                    {note.body}
                                                </p>
                                            )}
                                            {note.body && note.body.length > 120 && (
                                                <button onClick={() => setExpandId(isExpanded ? null : note.id)} className="text-xs text-blue-500 font-bold mt-1 hover:text-blue-700">
                                                    {isExpanded ? 'ย่อ' : 'อ่านต่อ...'}
                                                </button>
                                            )}
                                            <p className="text-[10px] text-slate-300 mt-2">{fmtDate(note.createdAt)}{note.updatedAt !== note.createdAt && ` · แก้ไข ${fmtDate(note.updatedAt)}`}</p>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                                            <button onClick={() => toggleImportant(note.id)} className={`w-7 h-7 rounded-md flex items-center justify-center text-xs transition ${note.important ? 'bg-amber-100 text-amber-500' : 'bg-slate-100 text-slate-300 hover:text-amber-400'}`}>
                                                <i className="fa-solid fa-star" />
                                            </button>
                                            <button onClick={() => startEdit(note)} className="w-7 h-7 rounded-md bg-blue-50 text-blue-500 hover:bg-blue-100 flex items-center justify-center">
                                                <i className="fa-solid fa-pen text-xs" />
                                            </button>
                                            <button onClick={() => remove(note.id)} className="w-7 h-7 rounded-md bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center">
                                                <i className="fa-solid fa-trash text-xs" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventNotesView;
