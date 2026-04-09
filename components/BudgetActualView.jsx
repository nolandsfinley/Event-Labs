import React, { useState, useEffect, useMemo } from 'react';

const getKey = (pid) => `eflow_budget_actual_${pid || 'global'}`;
const load = (pid) => { try { return JSON.parse(localStorage.getItem(getKey(pid)) || '[]'); } catch { return []; } };
const save = (d, pid) => localStorage.setItem(getKey(pid), JSON.stringify(d));

const CATEGORIES = [
    'สถานที่ (Venue)', 'อาหาร & เครื่องดื่ม', 'AV & เทคนิค',
    'การตกแต่ง', 'ของที่ระลึก / Gift', 'การตลาด & ประชาสัมพันธ์',
    'ทีมงาน & Staff', 'การเดินทาง & โลจิสติกส์', 'ที่พัก', 'ความปลอดภัย',
    'การแพทย์ & ประกัน', 'เอกสาร & ทำเนียบ', 'อื่นๆ'
];

const fmt = (n) => `฿${(n || 0).toLocaleString()}`;
const pct = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0;

const DEFAULT_FORM = { category: CATEGORIES[0], description: '', budgeted: '', actual: '', note: '', paid: false };

const BudgetActualView = ({ projectId }) => {
    const [items, setItems] = useState(() => load(projectId));
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(DEFAULT_FORM);
    const [editId, setEditId] = useState(null);
    const [filterCat, setFilterCat] = useState('all');
    const [sortBy, setSortBy] = useState('category');

    useEffect(() => save(items, projectId), [items, projectId]);

    const submit = () => {
        if (!form.description.trim()) return;
        const entry = { ...form, budgeted: Number(form.budgeted) || 0, actual: Number(form.actual) || 0 };
        if (editId) {
            setItems(p => p.map(i => i.id === editId ? { ...i, ...entry } : i));
            setEditId(null);
        } else {
            setItems(p => [...p, { id: Date.now().toString(), ...entry }]);
        }
        setForm(DEFAULT_FORM);
        setShowForm(false);
    };

    const remove = (id) => setItems(p => p.filter(i => i.id !== id));
    const startEdit = (item) => { setForm({ ...item, budgeted: String(item.budgeted), actual: String(item.actual) }); setEditId(item.id); setShowForm(true); };
    const togglePaid = (id) => setItems(p => p.map(i => i.id === id ? { ...i, paid: !i.paid } : i));

    const filtered = items.filter(i => filterCat === 'all' || i.category === filterCat);
    const sorted = [...filtered].sort((a, b) => {
        if (sortBy === 'category') return a.category.localeCompare(b.category);
        if (sortBy === 'overspend') return (b.actual - b.budgeted) - (a.actual - a.budgeted);
        return b.budgeted - a.budgeted;
    });

    // ── Totals ──
    const totalBudgeted = items.reduce((s, i) => s + (i.budgeted || 0), 0);
    const totalActual = items.reduce((s, i) => s + (i.actual || 0), 0);
    const totalPaid = items.filter(i => i.paid).reduce((s, i) => s + (i.actual || 0), 0);
    const totalVariance = totalActual - totalBudgeted;
    const overallPct = pct(totalActual, totalBudgeted);

    // ── By category summary ──
    const byCat = useMemo(() => {
        const map = {};
        items.forEach(i => {
            if (!map[i.category]) map[i.category] = { budgeted: 0, actual: 0 };
            map[i.category].budgeted += i.budgeted || 0;
            map[i.category].actual += i.actual || 0;
        });
        return Object.entries(map).sort((a, b) => b[1].actual - a[1].actual);
    }, [items]);

    const StatusBar = ({ budgeted, actual }) => {
        const p = pct(actual, budgeted);
        const over = actual > budgeted;
        return (
            <div className="w-full">
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : p > 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(p, 100)}%` }} />
                </div>
                <div className="flex justify-between mt-0.5">
                    <span className="text-[9px] text-slate-400">{p}% ใช้ไป</span>
                    {over && <span className="text-[9px] text-red-500 font-bold">+{fmt(actual - budgeted)}</span>}
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 overflow-y-auto bg-[#f5f5f7]">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-8 py-5 flex flex-wrap justify-between items-center gap-3">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">📊 Budget vs Actual</h2>
                    <p className="text-sm text-slate-400 font-medium">{items.length} รายการ · ติดตามค่าใช้จ่ายจริงเทียบงบ</p>
                </div>
                <button onClick={() => { setEditId(null); setForm(DEFAULT_FORM); setShowForm(v => !v); }}
                    className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition flex items-center gap-2">
                    <i className="fa-solid fa-plus" /> เพิ่มรายการ
                </button>
            </div>

            {/* Summary Cards */}
            <div className="px-8 pt-6 grid grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">งบประมาณรวม</p>
                    <p className="text-2xl font-black text-slate-800">{fmt(totalBudgeted)}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ค่าใช้จ่ายจริง</p>
                    <p className={`text-2xl font-black ${totalActual > totalBudgeted ? 'text-red-600' : 'text-emerald-600'}`}>{fmt(totalActual)}</p>
                    <div className="mt-2">
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${overallPct > 100 ? 'bg-red-500' : overallPct > 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(overallPct, 100)}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">{overallPct}% ของงบทั้งหมด</p>
                    </div>
                </div>
                <div className={`rounded-2xl border p-4 shadow-sm ${totalVariance > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Variance</p>
                    <p className={`text-2xl font-black ${totalVariance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {totalVariance > 0 ? '+' : ''}{fmt(totalVariance)}
                    </p>
                    <p className={`text-xs font-bold mt-1 ${totalVariance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                        {totalVariance > 0 ? '🔴 เกินงบ' : '🟢 อยู่ในงบ'}
                    </p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">ชำระแล้ว</p>
                    <p className="text-2xl font-black text-blue-600">{fmt(totalPaid)}</p>
                    <p className="text-xs text-slate-400 mt-1">{items.filter(i => i.paid).length}/{items.length} รายการ</p>
                </div>
            </div>

            {/* Category breakdown chart */}
            {byCat.length > 0 && (
                <div className="px-8 mt-4 bg-white mx-8 rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">สรุปตามหมวดหมู่</p>
                    <div className="space-y-3">
                        {byCat.map(([cat, vals]) => {
                            const p2 = pct(vals.actual, vals.budgeted);
                            const over = vals.actual > vals.budgeted;
                            return (
                                <div key={cat} className="grid grid-cols-[1fr_80px_80px_120px] gap-3 items-center">
                                    <div>
                                        <p className="text-xs font-bold text-slate-700 truncate">{cat}</p>
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                                            <div className={`h-full rounded-full ${over ? 'bg-red-500' : p2 > 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                                style={{ width: `${Math.min(p2, 100)}%` }} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 text-right font-medium">{fmt(vals.budgeted)}</p>
                                    <p className={`text-xs font-black text-right ${over ? 'text-red-600' : 'text-slate-700'}`}>{fmt(vals.actual)}</p>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full text-right ${over ? 'bg-red-100 text-red-600' : p2 > 80 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                                        {p2}% · {over ? `+${fmt(vals.actual - vals.budgeted)}` : `เหลือ ${fmt(vals.budgeted - vals.actual)}`}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Add/Edit Form */}
            {showForm && (
                <div className="bg-blue-50 border-y border-blue-100 px-8 py-5 mt-4">
                    <h4 className="text-sm font-black text-blue-800 mb-4">{editId ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400">
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="รายละเอียด *" autoFocus className="col-span-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                        <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="หมายเหตุ" className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">฿</span>
                            <input value={form.budgeted} onChange={e => setForm(f => ({ ...f, budgeted: e.target.value }))} placeholder="งบที่ตั้ง" type="number" min="0" className="w-full pl-7 pr-3 bg-white border border-slate-200 rounded-xl py-2.5 text-sm outline-none" />
                        </div>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">฿</span>
                            <input value={form.actual} onChange={e => setForm(f => ({ ...f, actual: e.target.value }))} placeholder="ค่าจริง (actual)" type="number" min="0" className="w-full pl-7 pr-3 bg-white border border-slate-200 rounded-xl py-2.5 text-sm outline-none" />
                        </div>
                        <label className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 cursor-pointer">
                            <input type="checkbox" checked={form.paid} onChange={e => setForm(f => ({ ...f, paid: e.target.checked }))} className="accent-blue-600" />
                            <span className="text-sm font-bold text-slate-700">✅ ชำระแล้ว</span>
                        </label>
                        <div className="flex gap-2">
                            <button onClick={submit} className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition">{editId ? 'บันทึก' : '+ เพิ่ม'}</button>
                            <button onClick={() => { setShowForm(false); setEditId(null); }} className="flex-1 py-2.5 bg-white border text-sm font-bold rounded-xl hover:bg-slate-50 transition">ยกเลิก</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters + Table */}
            <div className="px-8 py-5">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none">
                        <option value="all">ทุกหมวด</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none">
                        <option value="category">เรียงตามหมวด</option>
                        <option value="budget">เรียงตามงบ</option>
                        <option value="overspend">เรียงตามเกินงบ</option>
                    </select>
                    <p className="text-xs text-slate-400 ml-auto">{filtered.length} รายการ</p>
                </div>

                {sorted.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
                        <i className="fa-solid fa-chart-bar text-slate-200 text-5xl mb-4 block" />
                        <p className="text-slate-400 font-bold text-lg mb-4">ยังไม่มีรายการงบประมาณ</p>
                        <button onClick={() => setShowForm(true)} className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-700 transition">+ เพิ่มรายการแรก</button>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">รายการ</th>
                                    <th className="px-4 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">งบตั้งไว้</th>
                                    <th className="px-4 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">ค่าจริง</th>
                                    <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-36">สถานะ</th>
                                    <th className="px-4 py-3 w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {sorted.map(item => {
                                    const over = (item.actual || 0) > (item.budgeted || 0);
                                    const v = (item.actual || 0) - (item.budgeted || 0);
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/50 group">
                                            <td className="px-4 py-3">
                                                <p className="text-xs font-black text-slate-700">{item.description}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] text-slate-400">{item.category}</span>
                                                    {item.paid && <span className="text-[9px] bg-green-100 text-green-600 font-black px-1.5 py-0.5 rounded-full">✅ ชำระแล้ว</span>}
                                                    {item.note && <span className="text-[10px] text-slate-300 italic">{item.note}</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right text-xs font-bold text-slate-500">{fmt(item.budgeted)}</td>
                                            <td className={`px-4 py-3 text-right text-xs font-black ${over ? 'text-red-600' : 'text-slate-800'}`}>
                                                {fmt(item.actual)}
                                                {v !== 0 && <span className={`block text-[9px] ${over ? 'text-red-400' : 'text-green-500'}`}>{over ? '+' : ''}{fmt(v)}</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                {item.budgeted > 0 && <StatusBar budgeted={item.budgeted} actual={item.actual || 0} />}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                                    <button onClick={() => togglePaid(item.id)} className={`w-6 h-6 rounded flex items-center justify-center text-[10px] ${item.paid ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}><i className="fa-solid fa-check" /></button>
                                                    <button onClick={() => startEdit(item)} className="w-6 h-6 rounded bg-blue-50 text-blue-500 flex items-center justify-center"><i className="fa-solid fa-pen text-[10px]" /></button>
                                                    <button onClick={() => remove(item.id)} className="w-6 h-6 rounded bg-red-50 text-red-400 flex items-center justify-center"><i className="fa-solid fa-trash text-[10px]" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                                <tr>
                                    <td className="px-4 py-3 text-xs font-black text-slate-700">รวมทั้งหมด</td>
                                    <td className="px-4 py-3 text-right text-xs font-black text-slate-700">{fmt(totalBudgeted)}</td>
                                    <td className={`px-4 py-3 text-right text-sm font-black ${totalVariance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{fmt(totalActual)}</td>
                                    <td colSpan={2} className="px-4 py-3 text-xs font-black text-right">
                                        <span className={`px-3 py-1 rounded-full ${totalVariance > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {totalVariance > 0 ? `เกิน ${fmt(totalVariance)}` : `เหลือ ${fmt(-totalVariance)}`}
                                        </span>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

// fix: StatusBar component needs access to pct helper - it's defined inside the component above this line but JSX references it.  Actually it IS defined correctly above. But it's a nested component — let me inline it properly.
const StatusBar = ({ budgeted, actual }) => {
    const p = pct(actual, budgeted);
    const over = actual > budgeted;
    return (
        <div className="w-full">
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : p > 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(p, 100)}%` }} />
            </div>
            <div className="flex justify-between mt-0.5">
                <span className="text-[9px] text-slate-400">{p}%</span>
                {over && <span className="text-[9px] text-red-500 font-bold">+{fmt(actual - budgeted)}</span>}
            </div>
        </div>
    );
};

export default BudgetActualView;
