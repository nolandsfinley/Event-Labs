import React, { useState, useMemo } from 'react';

const DISMISS_KEY = (pid) => `eflow_dismissed_alerts_${pid}`;
const getDismissed = (pid) => { try { return JSON.parse(localStorage.getItem(DISMISS_KEY(pid)) || '[]'); } catch { return []; } };
const saveDismissed = (arr, pid) => localStorage.setItem(DISMISS_KEY(pid), JSON.stringify(arr));

const daysBetween = (d1, d2) => Math.ceil((new Date(d1) - new Date(d2)) / 86400000);

const SmartAlertsView = ({ projectId, project, onNavigate }) => {
    const pid = projectId;
    const [dismissed, setDismissed] = useState(() => getDismissed(pid));
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    const dismiss = (id) => {
        const next = [...dismissed, id];
        setDismissed(next);
        saveDismissed(next, pid);
    };

    const undismiss = () => {
        setDismissed([]);
        saveDismissed([], pid);
    };

    const now = new Date();
    const eventDate = project?.eventDate ? new Date(project.eventDate) : null;
    const daysToEvent = eventDate ? daysBetween(eventDate, now) : null;

    // Load all module data
    const checklist = useMemo(() => { try { return JSON.parse(localStorage.getItem(`eflow_checklist_${pid}`) || '[]'); } catch { return []; } }, [pid]);
    const budget = useMemo(() => { try { return JSON.parse(localStorage.getItem(`eflow_budget_${pid}`) || '[]'); } catch { return []; } }, [pid]);
    const vendors = useMemo(() => { try { return JSON.parse(localStorage.getItem(`eflow_vendors_${pid}`) || '[]'); } catch { return []; } }, [pid]);
    const guests = useMemo(() => { try { return JSON.parse(localStorage.getItem(`eflow_guests_${pid}`) || '[]'); } catch { return []; } }, [pid]);
    const equipment = useMemo(() => { try { return JSON.parse(localStorage.getItem(`eflow_equipment_${pid}`) || '[]'); } catch { return []; } }, [pid]);
    const ros = useMemo(() => { try { return JSON.parse(localStorage.getItem(`eflow_ros_${pid}`) || '[]'); } catch { return []; } }, [pid]);
    const budgetActual = useMemo(() => { try { return JSON.parse(localStorage.getItem(`eflow_budget_actual_${pid}`) || '[]'); } catch { return []; } }, [pid]);

    const alerts = useMemo(() => {
        const list = [];

        // ── Checklist alerts ──
        checklist.forEach(item => {
            if (item.done) return;
            if (!item.dueDate) return;
            const days = daysBetween(new Date(item.dueDate), now);
            if (days < 0) {
                list.push({
                    id: `cl-overdue-${item.id}`,
                    urgency: 'critical', module: 'checklist',
                    moduleIcon: 'fa-list-check', moduleLabel: 'Checklist',
                    icon: 'fa-circle-exclamation', color: 'text-red-500', bg: 'bg-red-50 border-red-100',
                    title: `งานเกินกำหนด: "${item.title}"`,
                    sub: `เกินมาแล้ว ${Math.abs(days)} วัน`,
                    tab: 'checklist', action: '→ ไปแก้ไข'
                });
            } else if (days <= 3) {
                list.push({
                    id: `cl-urgent-${item.id}`,
                    urgency: 'high', module: 'checklist',
                    moduleIcon: 'fa-list-check', moduleLabel: 'Checklist',
                    icon: 'fa-triangle-exclamation', color: 'text-orange-500', bg: 'bg-orange-50 border-orange-100',
                    title: `งานด่วน: "${item.title}"`,
                    sub: `ภายใน ${days} วัน${item.assignee ? ` · ${item.assignee}` : ''}`,
                    tab: 'checklist', action: '→ ไปทำ'
                });
            } else if (days <= 7) {
                list.push({
                    id: `cl-soon-${item.id}`,
                    urgency: 'medium', module: 'checklist',
                    moduleIcon: 'fa-list-check', moduleLabel: 'Checklist',
                    icon: 'fa-clock', color: 'text-amber-500', bg: 'bg-amber-50 border-amber-100',
                    title: `งานใกล้ครบกำหนด: "${item.title}"`,
                    sub: `อีก ${days} วัน`,
                    tab: 'checklist', action: '→ ดู'
                });
            }
        });

        // ── Vendor alerts ──
        const pendingVendors = vendors.filter(v => v.status === 'pending' || !v.status);
        if (pendingVendors.length > 0) {
            list.push({
                id: 'vendor-pending',
                urgency: pendingVendors.length > 3 ? 'high' : 'medium',
                module: 'vendors', moduleIcon: 'fa-handshake', moduleLabel: 'Vendors',
                icon: 'fa-hourglass-half', color: 'text-amber-500', bg: 'bg-amber-50 border-amber-100',
                title: `${pendingVendors.length} Vendor รอยืนยัน`,
                sub: pendingVendors.slice(0, 3).map(v => v.name).join(', ') + (pendingVendors.length > 3 ? ` +${pendingVendors.length - 3}` : ''),
                tab: 'vendors', action: '→ ติดตาม'
            });
        }

        const missingPayVendors = vendors.filter(v => v.paymentStatus === 'unpaid' && v.status === 'confirmed');
        if (missingPayVendors.length > 0) {
            list.push({
                id: 'vendor-unpaid',
                urgency: 'high', module: 'vendors',
                moduleIcon: 'fa-handshake', moduleLabel: 'Vendors',
                icon: 'fa-money-bill-wave', color: 'text-red-500', bg: 'bg-red-50 border-red-100',
                title: `${missingPayVendors.length} Vendor ยังไม่ได้ชำระ`,
                sub: missingPayVendors.map(v => v.name).join(', '),
                tab: 'vendors', action: '→ ชำระ'
            });
        }

        // ── Budget alerts ──
        const totalIncome = budget.filter(i => i.type === 'income').reduce((s, i) => s + (i.amount || 0), 0);
        const totalExpense = budget.filter(i => i.type === 'expense').reduce((s, i) => s + (i.amount || 0), 0);
        if (totalIncome > 0 && totalExpense > totalIncome) {
            list.push({
                id: 'budget-over',
                urgency: 'critical', module: 'budget',
                moduleIcon: 'fa-sack-dollar', moduleLabel: 'งบประมาณ',
                icon: 'fa-circle-exclamation', color: 'text-red-500', bg: 'bg-red-50 border-red-100',
                title: 'รายจ่ายเกินงบประมาณ!',
                sub: `รายจ่าย ฿${totalExpense.toLocaleString()} / งบ ฿${totalIncome.toLocaleString()}`,
                tab: 'budget', action: '→ ตรวจสอบ'
            });
        } else if (totalIncome > 0 && totalExpense > totalIncome * 0.8) {
            list.push({
                id: 'budget-80pct',
                urgency: 'high', module: 'budget',
                moduleIcon: 'fa-sack-dollar', moduleLabel: 'งบประมาณ',
                icon: 'fa-triangle-exclamation', color: 'text-orange-500', bg: 'bg-orange-50 border-orange-100',
                title: 'งบใช้ไปเกิน 80% แล้ว',
                sub: `ใช้ไป ${Math.round((totalExpense / totalIncome) * 100)}% ของงบทั้งหมด`,
                tab: 'budget', action: '→ ดูงบ'
            });
        }

        // ── Budget vs Actual alerts ──
        budgetActual.forEach(item => {
            if ((item.actual || 0) > (item.budgeted || 0) * 1.1 && item.budgeted > 0) {
                list.push({
                    id: `ba-over-${item.id}`,
                    urgency: 'high', module: 'budget_actual',
                    moduleIcon: 'fa-chart-bar', moduleLabel: 'Budget vs Actual',
                    icon: 'fa-arrow-trend-up', color: 'text-red-500', bg: 'bg-red-50 border-red-100',
                    title: `${item.category}: เกินงบ ${Math.round(((item.actual - item.budgeted) / item.budgeted) * 100)}%`,
                    sub: `ตั้งไว้ ฿${(item.budgeted || 0).toLocaleString()} · จ่ายจริง ฿${(item.actual || 0).toLocaleString()}`,
                    tab: 'budget_actual', action: '→ ดู'
                });
            }
        });

        // ── Equipment alerts ──
        const missingEq = equipment.filter(e => e.status === 'missing');
        if (missingEq.length > 0) {
            list.push({
                id: 'equipment-missing',
                urgency: 'critical', module: 'equipment',
                moduleIcon: 'fa-boxes-stacked', moduleLabel: 'อุปกรณ์',
                icon: 'fa-circle-exclamation', color: 'text-red-500', bg: 'bg-red-50 border-red-100',
                title: `${missingEq.length} อุปกรณ์หาไม่ได้`,
                sub: missingEq.slice(0, 3).map(e => e.name).join(', '),
                tab: 'equipment', action: '→ จัดการ'
            });
        }
        const unconfirmedEq = equipment.filter(e => !e.status || e.status === 'pending');
        if (unconfirmedEq.length > 0) {
            list.push({
                id: 'equipment-pending',
                urgency: 'medium', module: 'equipment',
                moduleIcon: 'fa-boxes-stacked', moduleLabel: 'อุปกรณ์',
                icon: 'fa-clock', color: 'text-amber-500', bg: 'bg-amber-50 border-amber-100',
                title: `${unconfirmedEq.length} อุปกรณ์รอตรวจสอบ`,
                sub: unconfirmedEq.slice(0, 3).map(e => e.name).join(', '),
                tab: 'equipment', action: '→ ตรวจสอบ'
            });
        }

        // ── Guest alerts ──
        const unconfirmedGuests = guests.filter(g => !g.status || g.status === 'invited');
        if (unconfirmedGuests.length > 5) {
            list.push({
                id: 'guests-unconfirmed',
                urgency: 'medium', module: 'guests',
                moduleIcon: 'fa-users', moduleLabel: 'ผู้เข้าร่วม',
                icon: 'fa-user-clock', color: 'text-amber-500', bg: 'bg-amber-50 border-amber-100',
                title: `${unconfirmedGuests.length} คนยังไม่ยืนยันเข้าร่วม`,
                sub: `จากทั้งหมด ${guests.length} คน`,
                tab: 'guests', action: '→ ติดตาม'
            });
        }

        // ── D-Day alerts ──
        if (daysToEvent !== null) {
            if (daysToEvent === 0) {
                list.push({
                    id: 'dday-today',
                    urgency: 'info', module: 'dashboard',
                    moduleIcon: 'fa-calendar-star', moduleLabel: 'วันงาน',
                    icon: 'fa-star', color: 'text-blue-500', bg: 'bg-blue-50 border-blue-100',
                    title: '🎉 วันนี้คือวันงาน!',
                    sub: 'เปิด Day-Of Mode เพื่อจัดการแบบ real-time',
                    tab: 'dayof', action: '→ Day-Of Mode'
                });
            } else if (daysToEvent === 1) {
                list.push({
                    id: 'dday-tomorrow',
                    urgency: 'high', module: 'dashboard',
                    moduleIcon: 'fa-calendar', moduleLabel: 'วันงาน',
                    icon: 'fa-calendar-day', color: 'text-orange-500', bg: 'bg-orange-50 border-orange-100',
                    title: '⏰ พรุ่งนี้คือวันงาน!',
                    sub: 'ตรวจสอบ Checklist, อุปกรณ์ และ Briefing ให้พร้อม',
                    tab: 'briefing', action: '→ Export Briefing'
                });
            } else if (daysToEvent <= 7) {
                list.push({
                    id: 'dday-week',
                    urgency: 'medium', module: 'dashboard',
                    moduleIcon: 'fa-calendar', moduleLabel: 'วันงาน',
                    icon: 'fa-clock-rotate-left', color: 'text-amber-500', bg: 'bg-amber-50 border-amber-100',
                    title: `อีก ${daysToEvent} วันถึงวันงาน`,
                    sub: 'ตรวจสอบความพร้อมทุกหมวด',
                    tab: 'dashboard', action: '→ ดู Dashboard'
                });
            }
        }

        // ── Run-of-Show alert ──
        if (ros.length === 0) {
            list.push({
                id: 'ros-empty',
                urgency: 'medium', module: 'runofshow',
                moduleIcon: 'fa-clapperboard', moduleLabel: 'Run-of-Show',
                icon: 'fa-clapperboard', color: 'text-indigo-500', bg: 'bg-indigo-50 border-indigo-100',
                title: 'ยังไม่มีกำหนดการวันงาน',
                sub: 'สร้าง Run-of-Show เพื่อวางแผน Timeline งาน',
                tab: 'runofshow', action: '→ สร้าง'
            });
        }

        // ── Positive alerts ──
        const taskDone = checklist.filter(i => i.done).length;
        if (taskDone > 0 && taskDone === checklist.length && checklist.length > 0) {
            list.push({
                id: 'checklist-done',
                urgency: 'info', module: 'checklist',
                moduleIcon: 'fa-list-check', moduleLabel: 'Checklist',
                icon: 'fa-circle-check', color: 'text-green-500', bg: 'bg-green-50 border-green-100',
                title: '🎉 Checklist ครบ 100%',
                sub: `ทำสำเร็จทั้ง ${checklist.length} รายการ`,
                tab: 'checklist', action: '→ ดู'
            });
        }

        return list.filter(a => !dismissed.includes(a.id));
    }, [checklist, budget, vendors, guests, equipment, ros, budgetActual, dismissed, daysToEvent]);

    const URGENCY_ORDER = { critical: 0, high: 1, medium: 2, info: 3 };
    const URGENCY_LABELS = { critical: 'วิกฤต', high: 'สำคัญ', medium: 'ปานกลาง', info: 'ข้อมูล' };
    const URGENCY_COLORS = {
        critical: 'bg-red-100 text-red-700',
        high: 'bg-orange-100 text-orange-700',
        medium: 'bg-amber-100 text-amber-700',
        info: 'bg-blue-100 text-blue-700'
    };

    const filtered = alerts
        .filter(a => filter === 'all' || a.urgency === filter)
        .filter(a => !search || a.title.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency]);

    const criticalCount = alerts.filter(a => a.urgency === 'critical').length;
    const highCount = alerts.filter(a => a.urgency === 'high').length;
    const medCount = alerts.filter(a => a.urgency === 'medium').length;
    const infoCount = alerts.filter(a => a.urgency === 'info').length;

    return (
        <div className="flex-1 overflow-y-auto bg-[#f5f5f7]">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-8 py-5">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">🔔 Smart Alerts</h2>
                        <p className="text-sm text-slate-400 font-medium">ระบบแจ้งเตือนอัจฉริยะ — รวมทุก module ไว้ที่เดียว</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative">
                            <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-300 text-xs" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหา..." className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none w-48" />
                        </div>
                        {dismissed.length > 0 && (
                            <button onClick={undismiss} className="px-3 py-2 bg-slate-100 text-slate-500 text-xs font-bold rounded-xl hover:bg-slate-200 transition">
                                รีเซ็ต ({dismissed.length})
                            </button>
                        )}
                    </div>
                </div>

                {/* Urgency summary pills */}
                <div className="flex gap-2 flex-wrap">
                    {[
                        { key: 'all', label: 'ทั้งหมด', count: alerts.length, cls: 'bg-slate-900 text-white' },
                        { key: 'critical', label: 'วิกฤต', count: criticalCount, cls: 'bg-red-100 text-red-700' },
                        { key: 'high', label: 'สำคัญ', count: highCount, cls: 'bg-orange-100 text-orange-700' },
                        { key: 'medium', label: 'ปานกลาง', count: medCount, cls: 'bg-amber-100 text-amber-700' },
                        { key: 'info', label: 'ข้อมูล', count: infoCount, cls: 'bg-blue-100 text-blue-700' },
                    ].map(f => (
                        <button key={f.key} onClick={() => setFilter(f.key)}
                            className={`px-3 py-1.5 rounded-full text-xs font-black transition flex items-center gap-1.5 ${filter === f.key ? (f.key === 'all' ? 'bg-slate-900 text-white' : f.cls) : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                            {f.label}
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${filter === f.key ? 'bg-white/20' : 'bg-slate-200/50'}`}>{f.count}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Alert list */}
            <div className="p-6 space-y-3">
                {filtered.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-2xl border border-slate-100">
                        <i className="fa-solid fa-bell-slash text-slate-200 text-5xl mb-4 block" />
                        <p className="text-slate-400 font-bold text-lg mb-1">ไม่มีการแจ้งเตือน</p>
                        <p className="text-slate-300 text-sm">
                            {filter !== 'all' ? 'ลองเปลี่ยน filter ดูครับ' : 'ทุกอย่างดำเนินไปได้ดี! ✅'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map(alert => (
                            <div key={alert.id} className={`bg-white border rounded-2xl p-4 ${alert.bg} shadow-sm group relative transition hover:shadow-md`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${alert.bg}`}>
                                        <i className={`fa-solid ${alert.icon} ${alert.color} text-sm`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start gap-2 flex-wrap">
                                            <p className="text-sm font-black text-slate-800 flex-1">{alert.title}</p>
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${URGENCY_COLORS[alert.urgency]}`}>
                                                {URGENCY_LABELS[alert.urgency]}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-0.5">{alert.sub}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-slate-300 flex items-center gap-1">
                                                <i className={`fa-solid ${alert.moduleIcon} text-[9px]`} />
                                                {alert.moduleLabel}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        {onNavigate && (
                                            <button onClick={() => onNavigate(alert.tab)}
                                                className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition whitespace-nowrap">
                                                {alert.action}
                                            </button>
                                        )}
                                        <button onClick={() => dismiss(alert.id)}
                                            className="w-7 h-7 text-slate-300 hover:text-slate-500 transition flex items-center justify-center rounded-lg hover:bg-slate-100">
                                            <i className="fa-solid fa-times text-xs" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Summary Footer */}
                <div className="mt-4 bg-white rounded-2xl border border-slate-100 p-4 text-center">
                    <p className="text-xs text-slate-400 font-bold">
                        สแกน {checklist.length} checklist · {vendors.length} vendors · {guests.length} guests · {equipment.length} อุปกรณ์ · {ros.length} กำหนดการ
                    </p>
                    <p className="text-[10px] text-slate-300 mt-1">อัปเดตทุกครั้งที่เปิดหน้านี้</p>
                </div>
            </div>
        </div>
    );
};

export default SmartAlertsView;
