import React, { useState, useMemo, useEffect } from 'react';

const CATEGORIES = [
    { id: 'venue', label: 'สถานที่', icon: 'fa-building', color: 'bg-blue-100 text-blue-600' },
    { id: 'av', label: 'เทคนิค (AV/เสียง)', icon: 'fa-microphone', color: 'bg-purple-100 text-purple-600' },
    { id: 'food', label: 'อาหาร/เลี้ยงรับรอง', icon: 'fa-utensils', color: 'bg-orange-100 text-orange-600' },
    { id: 'security', label: 'ความปลอดภัย', icon: 'fa-shield-halved', color: 'bg-red-100 text-red-600' },
    { id: 'pr', label: 'PR / การตลาด', icon: 'fa-bullhorn', color: 'bg-pink-100 text-pink-600' },
    { id: 'speaker', label: 'วิทยากร/แขกรับเชิญ', icon: 'fa-person-chalkboard', color: 'bg-green-100 text-green-600' },
    { id: 'logistics', label: 'โลจิสติกส์', icon: 'fa-truck', color: 'bg-amber-100 text-amber-600' },
    { id: 'other', label: 'อื่นๆ', icon: 'fa-ellipsis', color: 'bg-slate-100 text-slate-600' },
];

const EVENT_TEMPLATES = {
    conference: {
        label: 'งานประชุม / Conference',
        items: [
            { cat: 'venue', text: 'จองสถานที่จัดงาน (ห้องประชุม)', priority: 'high' },
            { cat: 'venue', text: 'ตรวจสอบจำนวนที่นั่งรองรับได้' },
            { cat: 'venue', text: 'จัดเตรียมรถรับส่งผู้เข้าร่วม', priority: 'medium' },
            { cat: 'av', text: 'จัดเตรียมระบบ Sound System', priority: 'high' },
            { cat: 'av', text: 'ติดตั้ง Projector / LED Screen', priority: 'high' },
            { cat: 'av', text: 'ทดสอบระบบ Live Streaming' },
            { cat: 'av', text: 'จัดเตรียม Microphone แบบ Wireless' },
            { cat: 'food', text: 'จัดเตรียมอาหารว่างและเครื่องดื่ม', priority: 'medium' },
            { cat: 'food', text: 'จัดเตรียมอาหารกลางวัน (ถ้ามี)' },
            { cat: 'food', text: 'ตรวจสอบ Dietary Restrictions ผู้เข้าร่วม' },
            { cat: 'security', text: 'จ้างเจ้าหน้าที่รักษาความปลอดภัย' },
            { cat: 'security', text: 'จัดทำบัตรผ่านประตูสำหรับผู้เข้าร่วม' },
            { cat: 'pr', text: 'ออกแบบสื่อโปรโมทงาน (Poster/Banner)', priority: 'high' },
            { cat: 'pr', text: 'ประกาศงานบน Social Media' },
            { cat: 'pr', text: 'ส่งอีเมลเชิญผู้เข้าร่วม' },
            { cat: 'pr', text: 'ติดต่อสื่อมวลชน / Press' },
            { cat: 'speaker', text: 'ยืนยีันวิทยากรทุกคน', priority: 'high' },
            { cat: 'speaker', text: 'รับ Bio และ Photo วิทยากร' },
            { cat: 'speaker', text: 'ส่งรายละเอียดงานให้วิทยากร' },
            { cat: 'speaker', text: 'จัดเตรียม Script และ Timing' },
            { cat: 'logistics', text: 'จัดเตรียม Name Badge ผู้เข้าร่วม' },
            { cat: 'logistics', text: 'จัดเตรียม Registration Desk' },
            { cat: 'logistics', text: 'เตรียม Rundown ให้ทีมงาน' },
            { cat: 'logistics', text: 'ทำสรุปหลังงาน (Post-Event Report)' },
        ]
    },
    gala: {
        label: 'งานเลี้ยง / Gala Dinner',
        items: [
            { cat: 'venue', text: 'จองห้อง Ballroom / สถานที่เลี้ยง', priority: 'high' },
            { cat: 'venue', text: 'ออกแบบ Floor Plan โต๊ะอาหาร' },
            { cat: 'food', text: 'เลือกเมนูและตกลงกับ Caterer', priority: 'high' },
            { cat: 'food', text: 'จัดเตรียม Welcome Drink' },
            { cat: 'food', text: 'เตรียม Wedding/Gala Cake (ถ้ามี)' },
            { cat: 'av', text: 'จัดเตรียม DJ / Live Music', priority: 'high' },
            { cat: 'av', text: 'ออกแบบแสงไฟและบรรยากาศ' },
            { cat: 'pr', text: 'ออกแบบ Invitation Card', priority: 'high' },
            { cat: 'pr', text: 'ส่ง RSVP และติดตามการตอบรับ' },
            { cat: 'security', text: 'จัด Dress Code และแจ้งผู้เข้าร่วม' },
            { cat: 'logistics', text: 'จัดทำ Seating Plan' },
            { cat: 'logistics', text: 'เตรียม Name Card บนโต๊ะ' },
        ]
    },
};

const getKey = (projectId) => `eflow_checklist_${projectId || 'global'}`;

const loadItems = (projectId) => {
    try { return JSON.parse(localStorage.getItem(getKey(projectId)) || '[]'); } catch { return []; }
};

const saveItems = (items, projectId) => localStorage.setItem(getKey(projectId), JSON.stringify(items));

const ChecklistView = ({ projectId }) => {
    const [items, setItems] = useState(() => loadItems(projectId));
    const [filterCat, setFilterCat] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'done' | 'todo' | 'overdue'
    const [newText, setNewText] = useState('');
    const [newCat, setNewCat] = useState('other');
    const [newDue, setNewDue] = useState('');
    const [newPriority, setNewPriority] = useState('normal');
    const [showAddForm, setShowAddForm] = useState(false);
    const [showTemplateMenu, setShowTemplateMenu] = useState(false);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => { saveItems(items, projectId); }, [items, projectId]);

    const addItem = () => {
        if (!newText.trim()) return;
        const item = { id: Date.now().toString(), text: newText.trim(), cat: newCat, done: false, dueDate: newDue || null, priority: newPriority, createdAt: new Date().toISOString() };
        const updated = [...items, item];
        setItems(updated);
        setNewText(''); setNewDue(''); setNewPriority('normal'); setShowAddForm(false);
    };

    const loadTemplate = (key) => {
        const tpl = EVENT_TEMPLATES[key];
        if (!tpl) return;
        const newItems = tpl.items.map((t, i) => ({
            id: `tpl-${key}-${Date.now()}-${i}`,
            text: t.text, cat: t.cat, done: false,
            priority: t.priority || 'normal', dueDate: null,
            createdAt: new Date().toISOString()
        }));
        setItems(prev => [...prev, ...newItems]);
        setShowTemplateMenu(false);
    };

    const toggle = (id) => setItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));
    const remove = (id) => setItems(prev => prev.filter(i => i.id !== id));
    const clearDone = () => setItems(prev => prev.filter(i => !i.done));

    const now = new Date();
    const filtered = useMemo(() => items.filter(i => {
        if (filterCat !== 'all' && i.cat !== filterCat) return false;
        if (filterStatus === 'done') return i.done;
        if (filterStatus === 'todo') return !i.done;
        if (filterStatus === 'overdue') return !i.done && i.dueDate && new Date(i.dueDate) < now;
        return true;
    }), [items, filterCat, filterStatus, now]);

    const total = items.length;
    const done = items.filter(i => i.done).length;
    const overdue = items.filter(i => !i.done && i.dueDate && new Date(i.dueDate) < now).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    const groupedByCategory = useMemo(() => {
        const groups = {};
        filtered.forEach(i => {
            if (!groups[i.cat]) groups[i.cat] = [];
            groups[i.cat].push(i);
        });
        return groups;
    }, [filtered]);

    const priorityColor = { high: 'bg-red-100 text-red-600', medium: 'bg-amber-100 text-amber-600', normal: 'bg-slate-100 text-slate-500' };
    const priorityLabel = { high: 'สำคัญมาก', medium: 'ปานกลาง', normal: 'ปกติ' };

    return (
        <div className="flex-1 overflow-y-auto bg-[#f5f5f7]">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-8 py-5 flex justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">📋 Master Checklist</h2>
                        <p className="text-sm text-slate-400 font-medium">{done}/{total} รายการเสร็จ · {overdue > 0 ? <span className="text-red-500 font-bold">{overdue} เกินกำหนด</span> : 'ไม่มีงานค้าง'}</p>
                    </div>
                    {/* Progress bar */}
                    <div className="hidden sm:flex items-center gap-2 ml-4">
                        <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm font-black text-slate-600">{pct}%</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <button onClick={() => setShowTemplateMenu(v => !v)} className="px-4 py-2 bg-violet-50 text-violet-700 border border-violet-200 text-sm font-bold rounded-xl hover:bg-violet-100 transition flex items-center gap-2">
                            <i className="fa-solid fa-wand-magic-sparkles text-xs" /> โหลด Template
                        </button>
                        {showTemplateMenu && (
                            <div className="absolute right-0 top-10 bg-white border border-slate-200 rounded-xl shadow-xl z-20 w-56 overflow-hidden">
                                {Object.entries(EVENT_TEMPLATES).map(([k, v]) => (
                                    <button key={k} onClick={() => loadTemplate(k)} className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                                        {v.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button onClick={() => setShowAddForm(v => !v)} className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition flex items-center gap-2">
                        <i className="fa-solid fa-plus" /> เพิ่มรายการ
                    </button>
                </div>
            </div>

            {/* Add Form */}
            {showAddForm && (
                <div className="bg-blue-50 border-b border-blue-100 px-8 py-4">
                    <div className="flex flex-wrap gap-3 items-end">
                        <input value={newText} onChange={e => setNewText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem()}
                            placeholder="รายการใหม่..." autoFocus
                            className="flex-1 min-w-48 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                        <select value={newCat} onChange={e => setNewCat(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none">
                            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                        <select value={newPriority} onChange={e => setNewPriority(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none">
                            <option value="high">🔴 สำคัญมาก</option>
                            <option value="medium">🟡 ปานกลาง</option>
                            <option value="normal">⚪ ปกติ</option>
                        </select>
                        <input type="date" value={newDue} onChange={e => setNewDue(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                        <button onClick={addItem} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition">+ เพิ่ม</button>
                        <button onClick={() => setShowAddForm(false)} className="px-4 py-2.5 bg-white border border-slate-200 text-sm font-bold rounded-xl hover:bg-slate-50 transition">ยกเลิก</button>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white border-b border-slate-100 px-8 py-3 flex flex-wrap gap-2 items-center">
                <div className="flex gap-1.5 flex-wrap">
                    {[{ id: 'all', label: 'ทั้งหมด' }, { id: 'todo', label: 'ยังไม่เสร็จ' }, { id: 'overdue', label: '⚠️ เกินกำหนด' }, { id: 'done', label: '✅ เสร็จแล้ว' }].map(s => (
                        <button key={s.id} onClick={() => setFilterStatus(s.id)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition ${filterStatus === s.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{s.label}</button>
                    ))}
                </div>
                <div className="w-px h-4 bg-slate-200 mx-1" />
                <div className="flex gap-1.5 flex-wrap">
                    <button onClick={() => setFilterCat('all')} className={`px-3 py-1 rounded-full text-xs font-bold transition ${filterCat === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>ทุกหมวด</button>
                    {CATEGORIES.map(c => (
                        <button key={c.id} onClick={() => setFilterCat(c.id)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition ${filterCat === c.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{c.label}</button>
                    ))}
                </div>
                {done > 0 && (
                    <button onClick={clearDone} className="ml-auto text-xs text-red-500 font-bold hover:underline flex items-center gap-1">
                        <i className="fa-solid fa-trash-can" /> ลบที่เสร็จแล้ว ({done})
                    </button>
                )}
            </div>

            {/* List */}
            <div className="p-6 space-y-6">
                {filtered.length === 0 && (
                    <div className="text-center py-20">
                        <i className="fa-solid fa-list-check text-slate-300 text-5xl mb-4 block" />
                        <p className="text-slate-400 text-lg font-bold mb-2">ยังไม่มีรายการ</p>
                        <p className="text-slate-300 text-sm mb-4">กด "โหลด Template" เพื่อเริ่มจากรายการมาตรฐาน หรือเพิ่มเองได้เลย</p>
                        <button onClick={() => setShowAddForm(true)} className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-700 transition">+ เพิ่มรายการแรก</button>
                    </div>
                )}
                {Object.entries(groupedByCategory).map(([catId, catItems]) => {
                    const cat = CATEGORIES.find(c => c.id === catId) || { label: catId, icon: 'fa-circle', color: 'bg-slate-100 text-slate-600' };
                    const catDone = catItems.filter(i => i.done).length;
                    return (
                        <div key={catId}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs ${cat.color}`}>
                                    <i className={`fa-solid ${cat.icon}`} />
                                </div>
                                <h3 className="font-black text-sm text-slate-700">{cat.label}</h3>
                                <span className="text-xs text-slate-400 font-bold">{catDone}/{catItems.length}</span>
                            </div>
                            <div className="space-y-2">
                                {catItems.map(item => {
                                    const isOverdue = !item.done && item.dueDate && new Date(item.dueDate) < now;
                                    return (
                                        <div key={item.id} className={`flex items-center gap-3 bg-white rounded-xl px-4 py-3 border transition group shadow-sm ${item.done ? 'border-slate-100 opacity-60' : isOverdue ? 'border-red-200 bg-red-50/30' : 'border-slate-100 hover:border-slate-300'}`}>
                                            <button onClick={() => toggle(item.id)} className={`w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition ${item.done ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-blue-500'}`}>
                                                {item.done && <i className="fa-solid fa-check text-white text-[10px]" />}
                                            </button>
                                            <span className={`flex-1 text-sm font-medium ${item.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.text}</span>
                                            {item.priority && item.priority !== 'normal' && (
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${priorityColor[item.priority]}`}>{priorityLabel[item.priority]}</span>
                                            )}
                                            {item.dueDate && (
                                                <span className={`text-[10px] font-bold shrink-0 ${isOverdue ? 'text-red-600' : 'text-slate-400'}`}>
                                                    {isOverdue ? '⚠️' : '📅'} {new Date(item.dueDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                                </span>
                                            )}
                                            <button onClick={() => remove(item.id)} className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-50 text-red-400 transition shrink-0">
                                                <i className="fa-solid fa-xmark text-xs" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ChecklistView;
