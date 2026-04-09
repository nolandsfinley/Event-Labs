import React, { useState, useMemo, useEffect } from 'react';

const getKey = (projectId) => `eflow_equipment_${projectId || 'global'}`;
const load = (projectId) => { try { return JSON.parse(localStorage.getItem(getKey(projectId)) || '[]'); } catch { return []; } };
const save = (d, projectId) => localStorage.setItem(getKey(projectId), JSON.stringify(d));

const CATEGORIES = ['เสียง/AV', 'แสงไฟ', 'โต๊ะ/เก้าอี้', 'เวที/โครงสร้าง', 'คอมพิวเตอร์/IT', 'ไฟฟ้า/สายไฟ', 'ป้าย/สื่อสิ่งพิมพ์', 'ยานพาหนะ', 'อื่นๆ'];
const SOURCES = [
    { id: 'internal', label: 'เบิกภายใน', color: 'bg-green-100 text-green-700', icon: 'fa-building' },
    { id: 'rent', label: 'เช่า', color: 'bg-blue-100 text-blue-700', icon: 'fa-handshake' },
    { id: 'purchase', label: 'จัดซื้อ', color: 'bg-purple-100 text-purple-700', icon: 'fa-cart-shopping' },
    { id: 'borrow', label: 'ยืม', color: 'bg-amber-100 text-amber-700', icon: 'fa-hand-holding' },
];
const STATUSES = [
    { id: 'needed', label: 'ต้องการ', color: 'bg-slate-100 text-slate-600' },
    { id: 'ordered', label: 'สั่งแล้ว / จอง', color: 'bg-blue-100 text-blue-700' },
    { id: 'confirmed', label: 'ยืนยันแล้ว', color: 'bg-green-100 text-green-700' },
    { id: 'arrived', label: 'มาถึงแล้ว', color: 'bg-violet-100 text-violet-700' },
    { id: 'missing', label: 'หาไม่ได้', color: 'bg-red-100 text-red-600' },
];

const DEFAULT_FORM = {
    name: '', category: 'อื่นๆ', quantity: 1, unit: 'ชิ้น',
    source: 'internal', status: 'needed', vendor: '', cost: '', note: '',
};

const EquipmentView = ({ projectId }) => {
    const [items, setItems] = useState(() => load(projectId));
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(DEFAULT_FORM);
    const [editId, setEditId] = useState(null);
    const [filterCat, setFilterCat] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterSource, setFilterSource] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => save(items, projectId), [items, projectId]);

    const submit = () => {
        if (!form.name.trim()) return;
        const entry = { ...form, quantity: Number(form.quantity) || 1, cost: Number(form.cost) || 0 };
        if (editId) {
            setItems(prev => prev.map(i => i.id === editId ? { ...i, ...entry } : i));
            setEditId(null);
        } else {
            setItems(prev => [...prev, { id: Date.now().toString(), ...entry, createdAt: new Date().toISOString() }]);
        }
        setForm(DEFAULT_FORM);
        setShowForm(false);
    };

    const startEdit = (item) => {
        setForm({ ...item, quantity: String(item.quantity), cost: String(item.cost || '') });
        setEditId(item.id);
        setShowForm(true);
    };

    const remove = (id) => setItems(prev => prev.filter(i => i.id !== id));

    const nextStatus = (id) => {
        const order = ['needed', 'ordered', 'confirmed', 'arrived'];
        setItems(prev => prev.map(i => {
            if (i.id !== id) return i;
            const idx = order.indexOf(i.status);
            return { ...i, status: order[Math.min(idx + 1, order.length - 1)] };
        }));
    };

    const filtered = useMemo(() => items.filter(i => {
        if (filterCat !== 'all' && i.category !== filterCat) return false;
        if (filterStatus !== 'all' && i.status !== filterStatus) return false;
        if (filterSource !== 'all' && i.source !== filterSource) return false;
        if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    }), [items, filterCat, filterStatus, filterSource, search]);

    // Stats
    const totalCost = items.filter(i => i.source !== 'internal').reduce((s, i) => s + (i.cost || 0), 0);
    const arrived = items.filter(i => i.status === 'arrived').length;
    const missing = items.filter(i => i.status === 'missing').length;
    const confirmed = items.filter(i => i.status === 'confirmed' || i.status === 'arrived').length;

    // Group by category for display
    const grouped = useMemo(() => {
        const g = {};
        filtered.forEach(i => {
            if (!g[i.category]) g[i.category] = [];
            g[i.category].push(i);
        });
        return g;
    }, [filtered]);

    const srcInfo = (id) => SOURCES.find(s => s.id === id) || SOURCES[0];
    const stInfo = (id) => STATUSES.find(s => s.id === id) || STATUSES[0];

    return (
        <div className="flex-1 overflow-y-auto bg-[#f5f5f7]">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-8 py-5 flex flex-wrap justify-between items-center gap-3">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">📦 อุปกรณ์ & วัสดุ</h2>
                    <p className="text-sm text-slate-400 font-medium">
                        {items.length} รายการ · {confirmed} พร้อมแล้ว
                        {missing > 0 && <span className="text-red-500 font-bold"> · {missing} หาไม่ได้!</span>}
                    </p>
                </div>
                <button
                    onClick={() => { setEditId(null); setForm(DEFAULT_FORM); setShowForm(v => !v); }}
                    className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition flex items-center gap-2"
                >
                    <i className="fa-solid fa-plus" /> เพิ่มอุปกรณ์
                </button>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div className="bg-purple-50 border-b border-purple-100 px-8 py-5">
                    <h4 className="text-sm font-black text-purple-800 mb-4">{editId ? 'แก้ไขอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่'}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="ชื่ออุปกรณ์ *" autoFocus
                            className="col-span-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-400" />
                        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none">
                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                        <div className="flex gap-2">
                            <input value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                                type="number" min="1" placeholder="จำนวน"
                                className="w-20 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                            <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                                placeholder="หน่วย"
                                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                        </div>
                        <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none">
                            {SOURCES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                        <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none">
                            {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                        <input value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
                            placeholder="ผู้จัดหา / ร้านค้า"
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                        <input value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
                            type="number" placeholder="ราคา/ค่าเช่า (บาท)"
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                        <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                            placeholder="หมายเหตุ"
                            className="col-span-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                        <div className="flex gap-2">
                            <button onClick={submit} className="flex-1 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition">
                                {editId ? 'บันทึก' : '+ เพิ่ม'}
                            </button>
                            <button onClick={() => { setShowForm(false); setEditId(null); }}
                                className="flex-1 py-2.5 bg-white border text-sm font-bold rounded-xl hover:bg-slate-50 transition">
                                ยกเลิก
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-6 space-y-5">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 text-center">
                        <p className="text-3xl font-black text-slate-700">{items.length}</p>
                        <p className="text-xs text-slate-400 font-bold mt-1">รายการทั้งหมด</p>
                    </div>
                    <div className="bg-green-50 rounded-2xl p-5 border border-green-100 text-center">
                        <p className="text-3xl font-black text-green-600">{arrived}</p>
                        <p className="text-xs text-slate-400 font-bold mt-1">มาถึงแล้ว</p>
                    </div>
                    <div className={`rounded-2xl p-5 border text-center ${missing > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'}`}>
                        <p className={`text-3xl font-black ${missing > 0 ? 'text-red-600' : 'text-slate-300'}`}>{missing}</p>
                        <p className="text-xs text-slate-400 font-bold mt-1">หาไม่ได้</p>
                    </div>
                    <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 text-center">
                        <p className="text-2xl font-black text-blue-700">฿{totalCost.toLocaleString()}</p>
                        <p className="text-xs text-slate-400 font-bold mt-1">ค่าใช้จ่ายรวม</p>
                    </div>
                </div>

                {/* Source breakdown */}
                <div className="grid grid-cols-4 gap-3">
                    {SOURCES.map(s => {
                        const count = items.filter(i => i.source === s.id).length;
                        return (
                            <div key={s.id} className={`rounded-xl p-3 border flex items-center gap-2.5 ${s.color.replace('text-', 'border-').replace('-700', '-100').replace('-600', '-100')} bg-white`}>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}>
                                    <i className={`fa-solid ${s.icon} text-xs`} />
                                </div>
                                <div>
                                    <p className="text-lg font-black text-slate-700">{count}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{s.label}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 items-center bg-white rounded-xl p-3 border border-slate-100">
                    <div className="relative">
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="ค้นหา..." className="pl-8 pr-3 py-2 bg-slate-50 rounded-lg text-sm outline-none w-32 focus:bg-white border border-transparent focus:border-blue-300" />
                    </div>
                    <div className="w-px h-4 bg-slate-200" />
                    {['all', ...CATEGORIES].map(c => (
                        <button key={c} onClick={() => setFilterCat(c)}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold transition ${filterCat === c ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                            {c === 'all' ? 'ทุกหมวด' : c}
                        </button>
                    ))}
                    <div className="w-px h-4 bg-slate-200" />
                    {[{ v: 'all', l: 'ทุกสถานะ' }, ...STATUSES.map(s => ({ v: s.id, l: s.label }))].map(f => (
                        <button key={f.v} onClick={() => setFilterStatus(f.v)}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold transition ${filterStatus === f.v ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                            {f.l}
                        </button>
                    ))}
                </div>

                {/* Equipment List grouped by category */}
                {filtered.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
                        <i className="fa-solid fa-box-open text-slate-200 text-5xl mb-4 block" />
                        <p className="text-slate-400 font-bold text-lg mb-2">ยังไม่มีรายการอุปกรณ์</p>
                        <p className="text-slate-300 text-sm mb-4">เพิ่มอุปกรณ์ที่ต้องใช้ในงาน เช่น เสียง แสง โต๊ะ เก้าอี้</p>
                        <button onClick={() => setShowForm(true)}
                            className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-700 transition">
                            + เพิ่มรายการแรก
                        </button>
                    </div>
                ) : (
                    Object.entries(grouped).map(([cat, catItems]) => (
                        <div key={cat}>
                            <div className="flex items-center gap-2 mb-3">
                                <h3 className="font-black text-sm text-slate-700">{cat}</h3>
                                <span className="text-xs text-slate-400 font-bold">({catItems.length} รายการ)</span>
                            </div>
                            <div className="space-y-2">
                                {catItems.map(item => {
                                    const src = srcInfo(item.source);
                                    const st = stInfo(item.status);
                                    return (
                                        <div key={item.id}
                                            className={`bg-white rounded-xl border shadow-sm flex items-center gap-4 px-5 py-3.5 group transition ${item.status === 'missing' ? 'border-red-200 bg-red-50/30' : item.status === 'arrived' ? 'border-green-200' : 'border-slate-100 hover:border-slate-300'}`}>
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${src.color}`}>
                                                <i className={`fa-solid ${src.icon} text-sm`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-black text-slate-800">{item.name}</p>
                                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">{item.quantity} {item.unit}</span>
                                                    {item.vendor && <span className="text-[10px] text-slate-400"><i className="fa-solid fa-store mr-1" />{item.vendor}</span>}
                                                    {item.cost > 0 && <span className="text-[10px] font-bold text-slate-600">฿{item.cost.toLocaleString()}</span>}
                                                </div>
                                                {item.note && <p className="text-[11px] text-slate-400 mt-0.5">{item.note}</p>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => nextStatus(item.id)}
                                                    className={`text-[10px] font-black px-3 py-1.5 rounded-full cursor-pointer hover:opacity-80 transition ${st.color}`}>
                                                    {st.label}
                                                </button>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                                    <button onClick={() => startEdit(item)} className="w-7 h-7 rounded-md bg-blue-50 text-blue-500 hover:bg-blue-100 flex items-center justify-center">
                                                        <i className="fa-solid fa-pen text-xs" />
                                                    </button>
                                                    <button onClick={() => remove(item.id)} className="w-7 h-7 rounded-md bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center">
                                                        <i className="fa-solid fa-trash text-xs" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default EquipmentView;
