import React, { useState, useEffect, useRef } from 'react';

const getKey = (projectId) => `eflow_ros_${projectId || 'global'}`;
const load = (projectId) => { try { return JSON.parse(localStorage.getItem(getKey(projectId)) || '[]'); } catch { return []; } };
const save = (d, projectId) => localStorage.setItem(getKey(projectId), JSON.stringify(d));

const BLOCK_TYPES = [
    { id: 'setup', label: 'Setup/เตรียมงาน', color: 'bg-slate-400', light: 'bg-slate-50 border-slate-200 text-slate-700' },
    { id: 'ceremony', label: 'พิธีการ', color: 'bg-blue-500', light: 'bg-blue-50 border-blue-200 text-blue-700' },
    { id: 'break', label: 'Break/พัก', color: 'bg-green-500', light: 'bg-green-50 border-green-200 text-green-700' },
    { id: 'meal', label: 'รับประทานอาหาร', color: 'bg-orange-500', light: 'bg-orange-50 border-orange-200 text-orange-700' },
    { id: 'session', label: 'Session/กิจกรรม', color: 'bg-purple-500', light: 'bg-purple-50 border-purple-200 text-purple-700' },
    { id: 'vip', label: 'VIP Protocol', color: 'bg-amber-500', light: 'bg-amber-50 border-amber-200 text-amber-700' },
    { id: 'teardown', label: 'เก็บงาน', color: 'bg-rose-400', light: 'bg-rose-50 border-rose-200 text-rose-700' },
    { id: 'other', label: 'อื่นๆ', color: 'bg-gray-400', light: 'bg-gray-50 border-gray-200 text-gray-600' },
];

const DEFAULT_FORM = { time: '08:00', duration: 30, title: '', type: 'ceremony', owner: '', note: '', location: '' };

const pad = (n) => String(n).padStart(2, '0');
const toMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const fromMins = (m) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;

// Live clock
const useClock = () => {
    const [now, setNow] = useState(new Date());
    useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
    return now;
};

const RunOfShowView = ({ projectId }) => {
    const [blocks, setBlocks] = useState(() => load(projectId));
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(DEFAULT_FORM);
    const [editId, setEditId] = useState(null);
    const [dayMode, setDayMode] = useState(false);
    const now = useClock();
    const nowRef = useRef(null);

    useEffect(() => save(blocks, projectId), [blocks, projectId]);

    const sorted = [...blocks].sort((a, b) => toMins(a.time) - toMins(b.time));

    const submit = () => {
        if (!form.title.trim()) return;
        const entry = { ...form, duration: Number(form.duration) || 30 };
        if (editId) {
            setBlocks(p => p.map(b => b.id === editId ? { ...b, ...entry } : b));
            setEditId(null);
        } else {
            setBlocks(p => [...p, { id: Date.now().toString(), ...entry }]);
        }
        setForm(DEFAULT_FORM);
        setShowForm(false);
    };

    const remove = (id) => setBlocks(p => p.filter(b => b.id !== id));
    const toggle = (id) => setBlocks(p => p.map(b => b.id === id ? { ...b, done: !b.done } : b));
    const startEdit = (b) => { setForm({ ...b, duration: String(b.duration) }); setEditId(b.id); setShowForm(true); };

    const typeInfo = (id) => BLOCK_TYPES.find(t => t.id === id) || BLOCK_TYPES[7];
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const currentBlock = sorted.find(b => {
        const s = toMins(b.time);
        return nowMins >= s && nowMins < s + (b.duration || 30);
    });
    const nextBlock = currentBlock ? sorted[sorted.indexOf(currentBlock) + 1] : sorted.find(b => toMins(b.time) > nowMins);

    // Scroll to now indicator
    useEffect(() => { if (dayMode && nowRef.current) nowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, [dayMode]);

    return (
        <div className="flex-1 overflow-y-auto bg-[#f5f5f7]">
            {/* Header */}
            <div className={`border-b px-8 py-5 flex flex-wrap justify-between items-center gap-3 ${dayMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'}`}>
                <div>
                    <h2 className={`text-2xl font-black ${dayMode ? 'text-white' : 'text-slate-800'}`}>
                        🎬 Run-of-Show
                    </h2>
                    <p className={`text-sm font-medium ${dayMode ? 'text-slate-400' : 'text-slate-400'}`}>
                        {blocks.length} บล็อก · {sorted.filter(b => b.done).length} เสร็จแล้ว
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Live Clock */}
                    <div className={`text-2xl font-black font-mono tabular-nums ${dayMode ? 'text-white' : 'text-slate-700'}`}>
                        {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
                    </div>
                    <button
                        onClick={() => setDayMode(v => !v)}
                        className={`px-4 py-2 text-sm font-black rounded-xl transition flex items-center gap-2 ${dayMode ? 'bg-yellow-400 text-slate-900 hover:bg-yellow-300' : 'bg-slate-900 text-white hover:bg-blue-700'}`}
                    >
                        <i className={`fa-solid ${dayMode ? 'fa-sun' : 'fa-tower-broadcast'}`} />
                        {dayMode ? 'ออกจาก Day-Of Mode' : 'Day-Of Mode'}
                    </button>
                    {!dayMode && (
                        <button onClick={() => { setEditId(null); setForm(DEFAULT_FORM); setShowForm(v => !v); }}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition flex items-center gap-2">
                            <i className="fa-solid fa-plus" /> เพิ่มช่วงเวลา
                        </button>
                    )}
                </div>
            </div>

            {/* Day-Of Mode: Current + Next */}
            {dayMode && (
                <div className="bg-slate-900 px-8 pb-6 grid grid-cols-2 gap-4">
                    <div className={`rounded-2xl p-5 border ${currentBlock ? `${typeInfo(currentBlock.type).light} border-2` : 'bg-slate-800 border-slate-700'}`}>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">🟢 กำลังดำเนินการอยู่</p>
                        {currentBlock ? (
                            <>
                                <p className="text-2xl font-black text-slate-900">{currentBlock.title}</p>
                                <p className="text-sm font-bold text-slate-600 mt-1">{currentBlock.time} · {currentBlock.duration} นาที</p>
                                {currentBlock.owner && <p className="text-xs text-slate-500 mt-1"><i className="fa-solid fa-user mr-1" />{currentBlock.owner}</p>}
                            </>
                        ) : <p className="text-slate-400 font-bold">ไม่มีกิจกรรมในขณะนี้</p>}
                    </div>
                    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">⏭ ต่อไป</p>
                        {nextBlock ? (
                            <>
                                <p className="text-2xl font-black text-white">{nextBlock.title}</p>
                                <p className="text-sm font-bold text-slate-300 mt-1">{nextBlock.time} · {nextBlock.duration} นาที</p>
                                {nextBlock.owner && <p className="text-xs text-slate-400 mt-1"><i className="fa-solid fa-user mr-1" />{nextBlock.owner}</p>}
                            </>
                        ) : <p className="text-slate-500 font-bold">จบกำหนดการแล้ว</p>}
                    </div>
                </div>
            )}

            {/* Add/Edit Form */}
            {showForm && !dayMode && (
                <div className="bg-blue-50 border-b border-blue-100 px-8 py-5">
                    <h4 className="text-sm font-black text-blue-800 mb-4">{editId ? 'แก้ไขช่วงเวลา' : 'เพิ่มช่วงเวลาใหม่'}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="flex gap-2 items-center">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 block mb-1">เวลาเริ่ม</label>
                                <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                                    className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 block mb-1">นาที</label>
                                <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                                    min="5" step="5" className="w-20 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                            </div>
                        </div>
                        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            placeholder="ชื่อกิจกรรม *" autoFocus
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                        <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none">
                            {BLOCK_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                        </select>
                        <input value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                            placeholder="ผู้รับผิดชอบ"
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                        <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                            placeholder="สถานที่/สถานี"
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                        <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                            placeholder="หมายเหตุ"
                            className="col-span-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                        <div className="flex gap-2">
                            <button onClick={submit} className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition">
                                {editId ? 'บันทึก' : '+ เพิ่ม'}
                            </button>
                            <button onClick={() => { setShowForm(false); setEditId(null); }}
                                className="flex-1 py-2.5 bg-white border text-sm font-bold rounded-xl hover:bg-slate-50 transition">ยกเลิก</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Timeline */}
            <div className={`p-6 ${dayMode ? 'bg-slate-900' : ''}`}>
                {sorted.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
                        <i className="fa-solid fa-clapperboard text-slate-200 text-5xl mb-4 block" />
                        <p className="text-slate-400 font-bold text-lg mb-2">ยังไม่มีกำหนดการ</p>
                        <p className="text-slate-300 text-sm mb-4">เพิ่มช่วงเวลาเพื่อสร้าง Run-of-Show ของงาน</p>
                        <button onClick={() => setShowForm(true)}
                            className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-700 transition">
                            + เพิ่มช่วงเวลาแรก
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Vertical timeline line */}
                        <div className={`absolute left-[4.5rem] top-0 bottom-0 w-px ${dayMode ? 'bg-slate-700' : 'bg-slate-200'}`} />

                        <div className="space-y-2">
                            {sorted.map((block, idx) => {
                                const t = typeInfo(block.type);
                                const startMins = toMins(block.time);
                                const endMins = startMins + (block.duration || 30);
                                const isCurrent = dayMode && nowMins >= startMins && nowMins < endMins;
                                const isPast = dayMode && nowMins >= endMins;

                                return (
                                    <div key={block.id} ref={isCurrent ? nowRef : null} className="relative flex gap-4 group">
                                        {/* Time column */}
                                        <div className={`w-16 shrink-0 text-right pt-3 ${dayMode ? 'text-slate-400' : 'text-slate-400'} text-xs font-black`}>
                                            {block.time}
                                        </div>
                                        {/* Dot */}
                                        <div className="relative flex flex-col items-center">
                                            <div className={`w-3 h-3 rounded-full mt-3.5 shrink-0 z-10 ring-2 ring-white ${isCurrent ? 'bg-yellow-400 ring-yellow-200 scale-150' : isPast ? 'bg-slate-300' : t.color}`} />
                                        </div>
                                        {/* Card */}
                                        <div className={`flex-1 rounded-xl border p-3 mb-2 transition ${isCurrent ? 'ring-2 ring-yellow-400 shadow-lg ' + t.light : isPast ? 'bg-slate-800/30 border-slate-700 opacity-60' : dayMode ? 'bg-slate-800 border-slate-700' : t.light + ' hover:shadow-sm'}`}>
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${t.color} text-white`}>{t.label}</span>
                                                        <p className={`font-black text-sm ${dayMode ? (isPast ? 'text-slate-500 line-through' : 'text-white') : 'text-slate-800'} ${block.done && !dayMode ? 'line-through opacity-50' : ''}`}>
                                                            {block.title}
                                                        </p>
                                                        {isCurrent && <span className="text-[10px] font-black text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full animate-pulse">LIVE</span>}
                                                    </div>
                                                    <div className="flex gap-3 mt-1 flex-wrap">
                                                        <span className={`text-[11px] font-bold ${dayMode ? 'text-slate-400' : 'text-slate-400'}`}>
                                                            <i className="fa-solid fa-clock mr-1 text-[9px]" />{block.duration} นาที · จบ {fromMins(endMins)}
                                                        </span>
                                                        {block.owner && <span className={`text-[11px] font-bold ${dayMode ? 'text-slate-400' : 'text-slate-400'}`}><i className="fa-solid fa-user mr-1 text-[9px]" />{block.owner}</span>}
                                                        {block.location && <span className={`text-[11px] font-bold ${dayMode ? 'text-slate-400' : 'text-slate-400'}`}><i className="fa-solid fa-location-dot mr-1 text-[9px]" />{block.location}</span>}
                                                    </div>
                                                    {block.note && <p className={`text-[11px] mt-1 ${dayMode ? 'text-slate-500' : 'text-slate-400'}`}>{block.note}</p>}
                                                </div>
                                                {!dayMode && (
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                                                        <button onClick={() => toggle(block.id)}
                                                            className={`w-7 h-7 rounded-md flex items-center justify-center text-xs transition ${block.done ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400 hover:bg-green-50 hover:text-green-500'}`}>
                                                            <i className="fa-solid fa-check" />
                                                        </button>
                                                        <button onClick={() => startEdit(block)}
                                                            className="w-7 h-7 rounded-md bg-blue-50 text-blue-500 hover:bg-blue-100 flex items-center justify-center">
                                                            <i className="fa-solid fa-pen text-xs" />
                                                        </button>
                                                        <button onClick={() => remove(block.id)}
                                                            className="w-7 h-7 rounded-md bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center">
                                                            <i className="fa-solid fa-trash text-xs" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RunOfShowView;
