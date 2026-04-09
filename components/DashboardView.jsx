import React, { useMemo, useState } from 'react';

const formatDate = (d) => d ? new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '-';

const DashboardView = ({ cloudLayouts = [], currentUser, userPlan = {}, setShowUpgradeModal, isPro, onNavigate }) => {
    const [eventDate, setEventDate] = useState(localStorage.getItem('eflow_event_date') || '');
    const [eventName, setEventName] = useState(localStorage.getItem('eflow_event_name') || 'งานของคุณ');
    const [editingHeader, setEditingHeader] = useState(false);

    // D-Day countdown
    const daysLeft = useMemo(() => {
        if (!eventDate) return null;
        const diff = new Date(eventDate) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }, [eventDate]);

    // Health score from checklist in localStorage
    const checklistItems = useMemo(() => {
        try { return JSON.parse(localStorage.getItem('eflow_checklist') || '[]'); } catch { return []; }
    }, []);
    const total = checklistItems.length;
    const done = checklistItems.filter(i => i.done).length;
    const healthPct = total > 0 ? Math.round((done / total) * 100) : 0;

    // Budget from localStorage
    const budgetItems = useMemo(() => {
        try { return JSON.parse(localStorage.getItem('eflow_budget') || '[]'); } catch { return []; }
    }, []);
    const totalIncome = budgetItems.filter(i => i.type === 'income').reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const totalExpense = budgetItems.filter(i => i.type === 'expense').reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const netBalance = totalIncome - totalExpense;

    // Vendors from localStorage
    const vendors = useMemo(() => {
        try { return JSON.parse(localStorage.getItem('eflow_vendors') || '[]'); } catch { return []; }
    }, []);
    const pendingVendors = vendors.filter(v => v.status === 'pending').length;

    // Guests from localStorage
    const guests = useMemo(() => {
        try { return JSON.parse(localStorage.getItem('eflow_guests') || '[]'); } catch { return []; }
    }, []);
    const confirmedGuests = guests.filter(g => g.status === 'confirmed').length;

    // Urgent alerts
    const alerts = useMemo(() => {
        const a = [];
        if (daysLeft !== null && daysLeft <= 30 && daysLeft > 0) a.push({ icon: 'fa-calendar-day', color: 'text-orange-600 bg-orange-50', text: `เหลือ ${daysLeft} วันถึงวันงาน!`, action: null });
        if (pendingVendors > 0) a.push({ icon: 'fa-handshake', color: 'text-yellow-600 bg-yellow-50', text: `${pendingVendors} Vendor ยังรอการยืนยัน`, action: 'vendors' });
        const overdueItems = checklistItems.filter(i => !i.done && i.dueDate && new Date(i.dueDate) < new Date());
        if (overdueItems.length > 0) a.push({ icon: 'fa-circle-exclamation', color: 'text-red-600 bg-red-50', text: `${overdueItems.length} รายการใน Checklist เกินกำหนด!`, action: 'checklist' });
        if (netBalance < 0) a.push({ icon: 'fa-sack-dollar', color: 'text-red-600 bg-red-50', text: `งบประมาณติดลบ ฿${Math.abs(netBalance).toLocaleString()}`, action: 'budget' });
        if (a.length === 0) a.push({ icon: 'fa-circle-check', color: 'text-green-600 bg-green-50', text: 'ทุกอย่างเรียบร้อย! ไม่มีรายการเร่งด่วน', action: null });
        return a.slice(0, 4);
    }, [daysLeft, pendingVendors, checklistItems, netBalance]);

    const healthColor = healthPct >= 70 ? '#22c55e' : healthPct >= 40 ? '#f59e0b' : '#ef4444';
    const circumference = 2 * Math.PI * 36;
    const strokeDash = circumference - (healthPct / 100) * circumference;

    const saveHeader = () => {
        localStorage.setItem('eflow_event_date', eventDate);
        localStorage.setItem('eflow_event_name', eventName);
        setEditingHeader(false);
    };

    return (
        <div className="flex-1 overflow-y-auto bg-[#f5f5f7]">
            {/* === Top Header Banner === */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-10 py-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #6366f1 0%, transparent 60%)' }} />
                <div className="relative flex justify-between items-center">
                    <div>
                        {editingHeader ? (
                            <div className="space-y-2">
                                <input value={eventName} onChange={e => setEventName(e.target.value)} className="text-2xl font-black text-white bg-white/10 rounded-lg px-3 py-1 border border-white/20 outline-none" placeholder="ชื่องาน" />
                                <div className="flex gap-2 items-center">
                                    <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="bg-white/10 text-white rounded-lg px-3 py-1 border border-white/20 outline-none text-sm" />
                                    <button onClick={saveHeader} className="px-4 py-1.5 bg-blue-500 text-white text-sm font-bold rounded-lg hover:bg-blue-400">บันทึก</button>
                                    <button onClick={() => setEditingHeader(false)} className="px-3 py-1.5 bg-white/10 text-white text-sm rounded-lg">ยกเลิก</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">กองบัญชาการ</p>
                                <h1 className="text-3xl font-black text-white mb-1">{eventName}</h1>
                                {eventDate ? (
                                    <p className="text-white/60 text-sm">📅 วันงาน: {formatDate(eventDate)}</p>
                                ) : (
                                    <p className="text-white/40 text-sm italic">ยังไม่ได้ตั้งวันงาน</p>
                                )}
                            </>
                        )}
                    </div>
                    <div className="flex gap-3">
                        {!editingHeader && (
                            <button onClick={() => setEditingHeader(true)} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl border border-white/10 transition flex items-center gap-2">
                                <i className="fa-solid fa-pen-to-square text-xs" /> ตั้งค่างาน
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-8 space-y-6">
                {/* === Row 1: KPI Cards === */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Health Score */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">ความคืบหน้า</p>
                        <div className="flex items-center gap-4">
                            <svg className="w-16 h-16 shrink-0" viewBox="0 0 80 80">
                                <circle cx="40" cy="40" r="36" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                                <circle cx="40" cy="40" r="36" fill="none" stroke={healthColor} strokeWidth="8"
                                    strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDash}
                                    transform="rotate(-90 40 40)" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
                                <text x="40" y="46" textAnchor="middle" fontSize="16" fontWeight="900" fill={healthColor}>{healthPct}%</text>
                            </svg>
                            <div>
                                <p className="text-2xl font-black text-slate-800">{done}/{total}</p>
                                <p className="text-xs text-slate-400 font-medium">รายการเสร็จ</p>
                            </div>
                        </div>
                    </div>

                    {/* D-Day */}
                    <div className={`rounded-2xl p-5 shadow-sm border ${daysLeft !== null && daysLeft <= 7 ? 'bg-red-50 border-red-200' : daysLeft !== null && daysLeft <= 30 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">D-Day</p>
                        {daysLeft !== null ? (
                            <>
                                <p className={`text-4xl font-black ${daysLeft <= 7 ? 'text-red-600' : daysLeft <= 30 ? 'text-amber-600' : 'text-slate-800'}`}>{daysLeft}<span className="text-lg ml-1 font-bold">วัน</span></p>
                                <p className="text-xs text-slate-400 mt-1">{formatDate(eventDate)}</p>
                            </>
                        ) : (
                            <div>
                                <p className="text-slate-400 text-sm font-medium mb-2">ยังไม่ได้ตั้งวันงาน</p>
                                <button onClick={() => setEditingHeader(true)} className="text-xs text-blue-600 font-bold hover:underline">ตั้งวันงาน →</button>
                            </div>
                        )}
                    </div>

                    {/* Budget */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 cursor-pointer hover:border-green-300 transition" onClick={() => onNavigate('budget')}>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">งบประมาณ</p>
                        <p className={`text-2xl font-black ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {netBalance >= 0 ? '+' : ''}฿{netBalance.toLocaleString()}
                        </p>
                        <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400">
                            <span className="text-green-500">↑ ฿{totalIncome.toLocaleString()}</span>
                            <span className="text-red-500">↓ ฿{totalExpense.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Guests */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 cursor-pointer hover:border-blue-300 transition" onClick={() => onNavigate('guests')}>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">ผู้เข้าร่วม</p>
                        <p className="text-3xl font-black text-slate-800">{confirmedGuests}<span className="text-lg text-slate-400 font-bold">/{guests.length}</span></p>
                        <p className="text-xs text-slate-400 mt-1">ยืนยันแล้ว / ทั้งหมด</p>
                    </div>
                </div>

                {/* === Row 2: Alerts + Projects === */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Urgent Alerts */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-black text-slate-800 text-sm">🔔 รายการเร่งด่วน</h3>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">{alerts.length} รายการ</span>
                        </div>
                        <div className="p-3 space-y-2">
                            {alerts.map((al, i) => (
                                <div
                                    key={i}
                                    className={`flex items-center gap-3 p-3 rounded-xl ${al.color} ${al.action ? 'cursor-pointer hover:opacity-80' : ''}`}
                                    onClick={() => al.action && onNavigate(al.action)}
                                >
                                    <i className={`fa-solid ${al.icon} w-4`} />
                                    <p className="text-xs font-bold flex-1">{al.text}</p>
                                    {al.action && <i className="fa-solid fa-chevron-right text-[10px] opacity-50" />}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Projects */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-black text-slate-800 text-sm">📐 ผังงาน (Floor Plans)</h3>
                            <button onClick={() => onNavigate('projects')} className="text-[10px] text-blue-600 font-bold hover:underline">ดูทั้งหมด →</button>
                        </div>
                        <div className="p-3 space-y-2">
                            {cloudLayouts.length === 0 ? (
                                <div className="text-center py-8">
                                    <i className="fa-solid fa-table-columns text-slate-300 text-3xl mb-2 block" />
                                    <p className="text-slate-400 text-sm font-medium">ยังไม่มีผังงาน</p>
                                    <button onClick={() => onNavigate('projects')} className="mt-2 text-xs text-blue-600 font-bold hover:underline">+ สร้างผังแรก</button>
                                </div>
                            ) : cloudLayouts.slice(0, 3).map(l => {
                                const totalSeats = (l.zones || []).reduce((s, z) => s + (z.rows || 0) * (z.columns || 0), 0);
                                return (
                                    <div key={l.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-blue-50 cursor-pointer transition" onClick={() => onNavigate('projects')}>
                                        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <i className="fa-solid fa-border-all text-blue-500 text-xs" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-700 truncate">{l.name}</p>
                                            <p className="text-[10px] text-slate-400">{totalSeats} ที่นั่ง</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* === Row 3: Quick Access === */}
                <div>
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">เครื่องมือด่วน</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {[
                            { icon: 'fa-list-check', label: 'Checklist', sub: `${done}/${total}`, tab: 'checklist', color: 'text-violet-600 bg-violet-50' },
                            { icon: 'fa-sack-dollar', label: 'งบประมาณ', sub: `฿${totalIncome.toLocaleString()}`, tab: 'budget', color: 'text-green-600 bg-green-50' },
                            { icon: 'fa-truck', label: 'Vendors', sub: `${vendors.length} ราย`, tab: 'vendors', color: 'text-orange-600 bg-orange-50' },
                            { icon: 'fa-users', label: 'ผู้เข้าร่วม', sub: `${guests.length} คน`, tab: 'guests', color: 'text-blue-600 bg-blue-50' },
                            { icon: 'fa-border-all', label: 'ผังงาน', sub: `${cloudLayouts.length} ผัง`, tab: 'projects', color: 'text-indigo-600 bg-indigo-50' },
                        ].map(item => (
                            <button
                                key={item.tab}
                                onClick={() => onNavigate(item.tab)}
                                className="bg-white border border-slate-100 rounded-2xl p-4 text-left hover:border-slate-300 hover:shadow-md transition-all group"
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${item.color}`}>
                                    <i className={`fa-solid ${item.icon}`} />
                                </div>
                                <p className="text-sm font-black text-slate-700">{item.label}</p>
                                <p className="text-xs text-slate-400 font-medium">{item.sub}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
