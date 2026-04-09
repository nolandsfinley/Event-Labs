import React, { useState, useEffect, useRef } from 'react';

const KEY = (pid) => `eflow_multiday_${pid || 'global'}`;
const load = (pid) => { try { return JSON.parse(localStorage.getItem(KEY(pid)) || 'null'); } catch { return null; } };
const save = (d, pid) => localStorage.setItem(KEY(pid), JSON.stringify(d));

const genId = () => `d-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const genItemId = () => `i-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const EVENT_TYPES = [
    { id: 'start', label: 'เปิดงาน', color: '#22c55e' },
    { id: 'session', label: 'Session/กิจกรรม', color: '#3b82f6' },
    { id: 'break', label: 'พัก/อาหาร', color: '#f59e0b' },
    { id: 'vip', label: 'VIP / พิธีการ', color: '#8b5cf6' },
    { id: 'end', label: 'ปิดงาน', color: '#ef4444' },
    { id: 'other', label: 'อื่นๆ', color: '#64748b' },
];

const TYPE_MAP = Object.fromEntries(EVENT_TYPES.map(t => [t.id, t]));

const timeToMin = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
};

const DEFAULT_ITEM = { title: '', time: '09:00', duration: 60, owner: '', type: 'session', note: '', done: false };

const MultiDayView = ({ projectId, project }) => {
    const [data, setData] = useState(() => load(projectId) || { days: [] });
    const [activeDay, setActiveDay] = useState(null);
    const [showDayForm, setShowDayForm] = useState(false);
    const [dayForm, setDayForm] = useState({ name: '', date: '' });
    const [showItemForm, setShowItemForm] = useState(false);
    const [itemForm, setItemForm] = useState(DEFAULT_ITEM);
    const [editItemId, setEditItemId] = useState(null);
    const [now, setNow] = useState(new Date());

    useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);
    useEffect(() => { save(data, projectId); }, [data, projectId]);
    useEffect(() => { if (!activeDay && data.days.length > 0) setActiveDay(data.days[0].id); }, [data.days]);

    const addDay = () => {
        if (!dayForm.name.trim()) return;
        const newDay = { id: genId(), name: dayForm.name, date: dayForm.date, items: [] };
        setData(d => ({ ...d, days: [...d.days, newDay] }));
        setActiveDay(newDay.id);
        setDayForm({ name: '', date: '' }); setShowDayForm(false);
    };

    const removeDay = (id) => {
        if (!confirm('ลบวันนี้?')) return;
        setData(d => ({ ...d, days: d.days.filter(day => day.id !== id) }));
        if (activeDay === id) setActiveDay(data.days.find(d => d.id !== id)?.id || null);
    };

    const today = data.days.find(d => d.id === activeDay);

    const addItem = () => {
        if (!itemForm.title.trim()) return;
        if (editItemId) {
            setData(d => ({
                ...d,
                days: d.days.map(day => day.id === activeDay
                    ? { ...day, items: day.items.map(i => i.id === editItemId ? { ...i, ...itemForm } : i) }
                    : day)
            }));
            setEditItemId(null);
        } else {
            setData(d => ({
                ...d,
                days: d.days.map(day => day.id === activeDay
                    ? { ...day, items: [...day.items, { id: genItemId(), ...itemForm, done: false }] }
                    : day)
            }));
        }
        setItemForm(DEFAULT_ITEM); setShowItemForm(false);
    };

    const removeItem = (itemId) => setData(d => ({
        ...d,
        days: d.days.map(day => day.id === activeDay
            ? { ...day, items: day.items.filter(i => i.id !== itemId) }
            : day)
    }));

    const toggleDone = (itemId) => setData(d => ({
        ...d,
        days: d.days.map(day => day.id === activeDay
            ? { ...day, items: day.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i) }
            : day)
    }));

    const startEdit = (item) => {
        setItemForm({ title: item.title, time: item.time, duration: item.duration, owner: item.owner || '', type: item.type || 'session', note: item.note || '' });
        setEditItemId(item.id); setShowItemForm(true);
    };

    const sortedItems = today ? [...today.items].sort((a, b) => timeToMin(a.time) - timeToMin(b.time)) : [];

    const nowMin = now.getHours() * 60 + now.getMinutes();
    const currentItem = sortedItems.find(i => {
        const start = timeToMin(i.time);
        const end = start + (i.duration || 60);
        return nowMin >= start && nowMin < end;
    });

    const totalDone = data.days.reduce((s, d) => s + d.items.filter(i => i.done).length, 0);
    const totalItems = data.days.reduce((s, d) => s + d.items.length, 0);

    return (
        <div className="flex-1 overflow-hidden bg-[#f5f5f7] flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-8 py-5 shrink-0">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">🗓️ Multi-Day Event</h2>
                        <p className="text-sm text-slate-400 font-medium">
                            {data.days.length} วัน · {totalItems} กำหนดการ · ทำแล้ว {totalDone}/{totalItems}
                        </p>
                    </div>
                    <button onClick={() => { setShowDayForm(v => !v); setDayForm({ name: `Day ${data.days.length + 1}`, date: '' }); }}
                        className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition flex items-center gap-2">
                        <i className="fa-solid fa-plus" /> เพิ่มวัน
                    </button>
                </div>
            </div>

            {/* Add Day Form */}
            {showDayForm && (
                <div className="bg-blue-50 border-b border-blue-100 px-8 py-4 shrink-0 flex items-center gap-3">
                    <input value={dayForm.name} onChange={e => setDayForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="ชื่อวัน เช่น Day 1, วันแรก..." autoFocus
                        className="bg-white border border-blue-200 rounded-xl px-3 py-2.5 text-sm outline-none flex-1" />
                    <input type="date" value={dayForm.date} onChange={e => setDayForm(f => ({ ...f, date: e.target.value }))}
                        className="bg-white border border-blue-200 rounded-xl px-3 py-2.5 text-sm outline-none w-40" />
                    <button onClick={addDay} className="px-5 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition">+ เพิ่ม</button>
                    <button onClick={() => setShowDayForm(false)} className="px-4 py-2.5 text-slate-400 text-sm font-bold hover:text-slate-600 transition">ยกเลิก</button>
                </div>
            )}

            {data.days.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <i className="fa-solid fa-calendar-days text-slate-200 text-6xl mb-4 block" />
                        <p className="text-slate-400 font-black text-xl mb-2">ยังไม่มีวันงาน</p>
                        <p className="text-slate-300 text-sm mb-5">เพิ่ม Day 1, Day 2, ... ได้เลย</p>
                        <button onClick={() => { setShowDayForm(true); setDayForm({ name: 'Day 1', date: project?.eventDate || '' }); }}
                            className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-700 transition">
                            + เพิ่มวันแรก
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-1 overflow-hidden">
                    {/* Day Sidebar */}
                    <div className="w-52 border-r border-slate-100 bg-white overflow-y-auto shrink-0 py-2">
                        {data.days.map((day, idx) => {
                            const doneCount = day.items.filter(i => i.done).length;
                            const pct = day.items.length > 0 ? Math.round((doneCount / day.items.length) * 100) : 0;
                            const isToday = day.date && new Date(day.date).toDateString() === new Date().toDateString();
                            return (
                                <button key={day.id} onClick={() => setActiveDay(day.id)}
                                    className={`w-full text-left px-4 py-3 mb-0.5 transition ${activeDay === day.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <p className={`font-black text-sm ${activeDay === day.id ? 'text-blue-700' : 'text-slate-700'}`}>{day.name}</p>
                                        {isToday && <span className="text-[8px] bg-green-100 text-green-600 font-black px-1.5 py-0.5 rounded-full">TODAY</span>}
                                    </div>
                                    {day.date && <p className="text-[10px] text-slate-400 mb-1.5">{new Date(day.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</p>}
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-1 bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                        </div>
                                        <p className="text-[9px] font-black text-slate-400">{pct}%</p>
                                    </div>
                                    <p className="text-[10px] text-slate-300 mt-1">{day.items.length} กิจกรรม</p>
                                </button>
                            );
                        })}
                    </div>

                    {/* Timeline */}
                    <div className="flex-1 overflow-y-auto">
                        {today && (
                            <>
                                {/* Day Header */}
                                <div className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center shrink-0">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-black text-slate-800 text-lg">{today.name}</p>
                                            {today.date && <p className="text-sm text-slate-400">{new Date(today.date).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' })}</p>}
                                        </div>
                                        {currentItem && (
                                            <p className="text-xs text-green-600 font-bold flex items-center gap-1 mt-0.5">
                                                <i className="fa-solid fa-circle fa-beat text-green-500 text-[8px]" />
                                                ตอนนี้: {currentItem.title}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => removeDay(today.id)} className="px-3 py-2 bg-red-50 text-red-400 text-xs font-bold rounded-xl hover:bg-red-100 transition flex items-center gap-1">
                                            <i className="fa-solid fa-trash text-[10px]" /> ลบวัน
                                        </button>
                                        <button onClick={() => { setItemForm(DEFAULT_ITEM); setEditItemId(null); setShowItemForm(v => !v); }}
                                            className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition flex items-center gap-2">
                                            <i className="fa-solid fa-plus" /> เพิ่มกิจกรรม
                                        </button>
                                    </div>
                                </div>

                                {/* Item Form */}
                                {showItemForm && (
                                    <div className="bg-blue-50 border-b border-blue-100 p-5">
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="col-span-2">
                                                <input value={itemForm.title} onChange={e => setItemForm(f => ({ ...f, title: e.target.value }))}
                                                    placeholder="ชื่อกิจกรรม *" autoFocus className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                                            </div>
                                            <select value={itemForm.type} onChange={e => setItemForm(f => ({ ...f, type: e.target.value }))} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none">
                                                {EVENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                            </select>
                                            <input type="time" value={itemForm.time} onChange={e => setItemForm(f => ({ ...f, time: e.target.value }))}
                                                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                                            <div className="flex items-center gap-2">
                                                <input type="number" value={itemForm.duration} onChange={e => setItemForm(f => ({ ...f, duration: Number(e.target.value) }))}
                                                    min={5} step={5} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none flex-1" />
                                                <span className="text-xs text-slate-400 font-bold whitespace-nowrap">นาที</span>
                                            </div>
                                            <input value={itemForm.owner} onChange={e => setItemForm(f => ({ ...f, owner: e.target.value }))}
                                                placeholder="ผู้รับผิดชอบ" className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                                            <div className="col-span-3">
                                                <input value={itemForm.note} onChange={e => setItemForm(f => ({ ...f, note: e.target.value }))}
                                                    placeholder="หมายเหตุ (optional)" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <button onClick={addItem} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition">{editItemId ? 'บันทึก' : '+ เพิ่ม'}</button>
                                            <button onClick={() => { setShowItemForm(false); setEditItemId(null); }} className="px-4 py-2.5 bg-white border text-sm font-bold rounded-xl hover:bg-slate-50 transition">ยกเลิก</button>
                                        </div>
                                    </div>
                                )}

                                {/* Timeline Items */}
                                <div className="p-5 space-y-2">
                                    {sortedItems.length === 0 ? (
                                        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                                            <i className="fa-solid fa-timeline text-slate-200 text-4xl mb-3 block" />
                                            <p className="text-slate-400 font-bold">ยังไม่มีกิจกรรมใน{today.name}</p>
                                            <button onClick={() => setShowItemForm(true)} className="mt-3 px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-700 transition">+ เพิ่มกิจกรรม</button>
                                        </div>
                                    ) : (
                                        sortedItems.map((item, idx) => {
                                            const typeInfo = TYPE_MAP[item.type] || TYPE_MAP['other'];
                                            const startMin = timeToMin(item.time);
                                            const endMin = startMin + (item.duration || 60);
                                            const isNow = nowMin >= startMin && nowMin < endMin;
                                            const isPast = nowMin >= endMin;
                                            const endH = Math.floor(endMin / 60).toString().padStart(2, '0');
                                            const endM = (endMin % 60).toString().padStart(2, '0');

                                            return (
                                                <div key={item.id}
                                                    className={`flex gap-4 group ${isPast ? 'opacity-60' : ''}`}>
                                                    {/* Time column */}
                                                    <div className="w-16 text-right shrink-0 pt-3">
                                                        <p className={`text-xs font-black ${isNow ? 'text-green-600' : 'text-slate-500'}`}>{item.time}</p>
                                                        <p className="text-[9px] text-slate-300">{endH}:{endM}</p>
                                                    </div>

                                                    {/* Line */}
                                                    <div className="flex flex-col items-center w-5 shrink-0">
                                                        <div className="w-3 h-3 rounded-full mt-3.5 shrink-0 border-2 border-white shadow-sm" style={{ backgroundColor: typeInfo.color }} />
                                                        {idx < sortedItems.length - 1 && <div className="w-0.5 flex-1 mt-1 mb-0 bg-slate-100" />}
                                                    </div>

                                                    {/* Card */}
                                                    <div className={`flex-1 bg-white rounded-2xl border shadow-sm mb-2 overflow-hidden transition hover:shadow-md ${isNow ? 'border-green-200 shadow-green-50' : 'border-slate-100'}`}>
                                                        <div className="h-1" style={{ backgroundColor: typeInfo.color }} />
                                                        <div className="p-4">
                                                            <div className="flex items-start gap-3">
                                                                <button onClick={() => toggleDone(item.id)} className="mt-0.5 shrink-0">
                                                                    <i className={`fa-solid ${item.done ? 'fa-circle-check text-green-500' : 'fa-circle text-slate-200'} text-lg`} />
                                                                </button>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <p className={`font-black text-sm ${item.done ? 'line-through text-slate-400' : 'text-slate-800'}`}>{item.title}</p>
                                                                        {isNow && <span className="text-[9px] bg-green-100 text-green-600 font-black px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 animate-pulse"><i className="fa-solid fa-circle text-[7px]" /> NOW</span>}
                                                                    </div>
                                                                    <div className="flex items-center gap-3 mt-1">
                                                                        <span className="text-[10px] text-slate-400">{item.duration} นาที</span>
                                                                        {item.owner && <span className="text-[10px] text-slate-500 flex items-center gap-1"><i className="fa-solid fa-user text-[9px]" />{item.owner}</span>}
                                                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: typeInfo.color + '20', color: typeInfo.color }}>{typeInfo.label}</span>
                                                                    </div>
                                                                    {item.note && <p className="text-xs text-slate-400 mt-1">{item.note}</p>}
                                                                </div>
                                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                                                                    <button onClick={() => startEdit(item)} className="w-7 h-7 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center text-[10px]"><i className="fa-solid fa-pen" /></button>
                                                                    <button onClick={() => removeItem(item.id)} className="w-7 h-7 bg-red-50 text-red-400 rounded-lg flex items-center justify-center text-[10px]"><i className="fa-solid fa-trash" /></button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Day summary */}
                                {sortedItems.length > 0 && (
                                    <div className="mx-5 mb-5 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                                        <p className="text-xs font-black text-slate-500 mb-3">สรุปวัน{today.name}</p>
                                        <div className="grid grid-cols-4 gap-4 text-center">
                                            <div>
                                                <p className="text-xl font-black text-slate-800">{today.items.length}</p>
                                                <p className="text-[10px] text-slate-400">กิจกรรม</p>
                                            </div>
                                            <div>
                                                <p className="text-xl font-black text-green-600">{today.items.filter(i => i.done).length}</p>
                                                <p className="text-[10px] text-slate-400">ทำแล้ว</p>
                                            </div>
                                            <div>
                                                <p className="text-xl font-black text-slate-800">
                                                    {Math.round(today.items.reduce((s, i) => s + (i.duration || 0), 0) / 60 * 10) / 10} ชม.
                                                </p>
                                                <p className="text-[10px] text-slate-400">รวมเวลา</p>
                                            </div>
                                            <div>
                                                <p className="text-xl font-black text-blue-600">
                                                    {today.items.length > 0 ? Math.round((today.items.filter(i => i.done).length / today.items.length) * 100) : 0}%
                                                </p>
                                                <p className="text-[10px] text-slate-400">ความคืบหน้า</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MultiDayView;
