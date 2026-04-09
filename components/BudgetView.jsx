import React, { useState, useMemo, useEffect } from 'react';

const getKey = (projectId) => `eflow_budget_${projectId || 'global'}`;
const load = (projectId) => { try { return JSON.parse(localStorage.getItem(getKey(projectId)) || '[]'); } catch { return []; } };
const save = (d, projectId) => localStorage.setItem(getKey(projectId), JSON.stringify(d));

const CATEGORIES = ['สถานที่', 'เทคนิค/AV', 'อาหาร/เลี้ยง', 'วิทยากร', 'PR/การตลาด', 'บุคลากร', 'ความปลอดภัย', 'โลจิสติกส์', 'รายรับสปอนเซอร์', 'ค่าลงทะเบียน', 'อื่นๆ'];

const BudgetView = ({ projectId }) => {
    const [items, setItems] = useState(() => load(projectId));
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ type: 'expense', desc: '', cat: 'อื่นๆ', amount: '', status: 'pending', note: '', date: new Date().toISOString().slice(0, 10) });
    const [filter, setFilter] = useState('all');
    const [editId, setEditId] = useState(null);

    useEffect(() => save(items, projectId), [items, projectId]);

    const submit = () => {
        if (!form.desc.trim() || !form.amount) return;
        if (editId) {
            setItems(prev => prev.map(i => i.id === editId ? { ...i, ...form, amount: Number(form.amount) } : i));
            setEditId(null);
        } else {
            setItems(prev => [...prev, { id: Date.now().toString(), ...form, amount: Number(form.amount), createdAt: new Date().toISOString() }]);
        }
        setForm({ type: 'expense', desc: '', cat: 'อื่นๆ', amount: '', status: 'pending', note: '', date: new Date().toISOString().slice(0, 10) });
        setShowForm(false);
    };

    const startEdit = (item) => {
        setForm({ type: item.type, desc: item.desc, cat: item.cat, amount: String(item.amount), status: item.status, note: item.note || '', date: item.date || new Date().toISOString().slice(0, 10) });
        setEditId(item.id);
        setShowForm(true);
    };

    const remove = (id) => setItems(prev => prev.filter(i => i.id !== id));
    const toggleStatus = (id) => setItems(prev => prev.map(i => i.id === id ? { ...i, status: i.status === 'paid' ? 'pending' : 'paid' } : i));

    const income = items.filter(i => i.type === 'income');
    const expense = items.filter(i => i.type === 'expense');
    const totalIncome = income.reduce((s, i) => s + i.amount, 0);
    const totalExpense = expense.reduce((s, i) => s + i.amount, 0);
    const netBalance = totalIncome - totalExpense;
    const paidExpense = expense.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
    const pendingExpense = expense.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0);

    const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);

    // Category breakdown for expenses
    const catBreakdown = useMemo(() => {
        const map = {};
        expense.forEach(i => { map[i.cat] = (map[i.cat] || 0) + i.amount; });
        return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
    }, [expense]);

    return (
        <div className="flex-1 overflow-y-auto bg-[#f5f5f7]">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-8 py-5 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">💰 งบประมาณ</h2>
                    <p className="text-sm text-slate-400 font-medium">{items.length} รายการ</p>
                </div>
                <button onClick={() => { setEditId(null); setForm({ type: 'expense', desc: '', cat: 'อื่นๆ', amount: '', status: 'pending', note: '', date: new Date().toISOString().slice(0, 10) }); setShowForm(v => !v); }}
                    className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition flex items-center gap-2">
                    <i className="fa-solid fa-plus" /> เพิ่มรายการ
                </button>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <div className="bg-green-50 border-b border-green-100 px-8 py-5">
                    <h4 className="text-sm font-black text-green-800 mb-4">{editId ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none">
                            <option value="expense">💸 รายจ่าย</option>
                            <option value="income">💰 รายรับ</option>
                        </select>
                        <input value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} placeholder="รายละเอียด" className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" />
                        <input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} type="number" placeholder="จำนวนเงิน (บาท)" className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400" />
                        <select value={form.cat} onChange={e => setForm(f => ({ ...f, cat: e.target.value }))} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none">
                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                        <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none">
                            <option value="pending">⏳ รอชำระ</option>
                            <option value="paid">✅ จ่ายแล้ว</option>
                        </select>
                        <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                        <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="หมายเหตุ (ไม่บังคับ)" className="col-span-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                        <div className="flex gap-2">
                            <button onClick={submit} className="flex-1 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition">{editId ? 'บันทึก' : '+ เพิ่ม'}</button>
                            <button onClick={() => { setShowForm(false); setEditId(null); }} className="flex-1 py-2.5 bg-white border border-slate-200 text-sm font-bold rounded-xl hover:bg-slate-50 transition">ยกเลิก</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-6 space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className={`rounded-2xl p-5 ${netBalance >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">ยอดคงเหลือ</p>
                        <p className={`text-3xl font-black ${netBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>{netBalance >= 0 ? '+' : ''}฿{Math.abs(netBalance).toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">รายรับรวม</p>
                        <p className="text-2xl font-black text-green-600">+฿{totalIncome.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">รายจ่ายรวม</p>
                        <p className="text-2xl font-black text-red-600">-฿{totalExpense.toLocaleString()}</p>
                    </div>
                    <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">รอชำระ</p>
                        <p className="text-2xl font-black text-amber-700">฿{pendingExpense.toLocaleString()}</p>
                    </div>
                </div>

                {/* Category breakdown */}
                {catBreakdown.length > 0 && (
                    <div className="bg-white rounded-2xl p-5 border border-slate-100">
                        <h4 className="text-sm font-black text-slate-700 mb-4">สัดส่วนรายจ่ายตามหมวด</h4>
                        <div className="space-y-3">
                            {catBreakdown.map(([cat, amt]) => (
                                <div key={cat} className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-500 w-28 shrink-0">{cat}</span>
                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-rose-400 to-red-500 rounded-full" style={{ width: `${(amt / totalExpense) * 100}%` }} />
                                    </div>
                                    <span className="text-xs font-black text-slate-600 w-24 text-right">฿{amt.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filter + Table */}
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100 flex gap-2">
                        {[{ v: 'all', l: 'ทั้งหมด' }, { v: 'income', l: '💰 รายรับ' }, { v: 'expense', l: '💸 รายจ่าย' }].map(f => (
                            <button key={f.v} onClick={() => setFilter(f.v)} className={`px-3 py-1 rounded-full text-xs font-bold transition ${filter === f.v ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{f.l}</button>
                        ))}
                    </div>
                    <div className="divide-y divide-slate-50">
                        {filtered.length === 0 && (
                            <div className="text-center py-12 text-slate-300">
                                <i className="fa-solid fa-sack-dollar text-4xl mb-3 block" />
                                <p className="font-bold text-slate-400">ยังไม่มีรายการ</p>
                            </div>
                        )}
                        {filtered.map(item => (
                            <div key={item.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 group transition">
                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${item.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    <i className={`fa-solid ${item.type === 'income' ? 'fa-arrow-up' : 'fa-arrow-down'}`} />
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-700 truncate">{item.desc}</p>
                                    <p className="text-[10px] text-slate-400">{item.cat} · {item.date}</p>
                                </div>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full cursor-pointer ${item.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`} onClick={() => toggleStatus(item.id)}>
                                    {item.status === 'paid' ? '✅ จ่ายแล้ว' : '⏳ รอ'}
                                </span>
                                <p className={`text-sm font-black w-28 text-right ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                    {item.type === 'income' ? '+' : '-'}฿{item.amount.toLocaleString()}
                                </p>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                    <button onClick={() => startEdit(item)} className="w-7 h-7 rounded-md bg-blue-50 text-blue-500 hover:bg-blue-100 flex items-center justify-center"><i className="fa-solid fa-pen text-xs" /></button>
                                    <button onClick={() => remove(item.id)} className="w-7 h-7 rounded-md bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center"><i className="fa-solid fa-trash text-xs" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BudgetView;
