import React, { useState, useMemo } from 'react';
import ChecklistView from './ChecklistView';
import BudgetView from './BudgetView';
import VendorView from './VendorView';
import GuestView from './GuestView';
import EquipmentView from './EquipmentView';
import RunOfShowView from './RunOfShowView';
import ContactHubView from './ContactHubView';
import SOPView from './SOPView';
import EventNotesView from './EventNotesView';
import CateringView from './CateringView';
import BudgetActualView from './BudgetActualView';
import VendorScorecardView from './VendorScorecardView';
import LogisticsView from './LogisticsView';
import TicketView from './TicketView';
import BriefingExportView from './BriefingExportView';
import SmartAlertsView from './SmartAlertsView';
import DayOfModeView from './DayOfModeView';
import MediaVaultView from './MediaVaultView';
import ProjectCloneView from './ProjectCloneView';
import AITaskGeneratorView from './AITaskGeneratorView';
import GuestRegistrationView from './GuestRegistrationView';
import MultiDayView from './MultiDayView';
import QRToolView from './QRToolView';
import DebriefView from './DebriefView';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const dDay = (dateStr) => {
    if (!dateStr) return null;
    const diff = new Date(dateStr) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const fmtDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
};

// ─── Project-level Dashboard ──────────────────────────────────────────────────
const ProjectDashboard = ({ project, onNavigate }) => {
    const days = dDay(project.eventDate);
    const pid = project.id;

    const checklist = useMemo(() => { try { return JSON.parse(localStorage.getItem(`eflow_checklist_${pid}`) || '[]'); } catch { return []; } }, [pid]);
    const budget = useMemo(() => { try { return JSON.parse(localStorage.getItem(`eflow_budget_${pid}`) || '[]'); } catch { return []; } }, [pid]);
    const vendors = useMemo(() => { try { return JSON.parse(localStorage.getItem(`eflow_vendors_${pid}`) || '[]'); } catch { return []; } }, [pid]);
    const guests = useMemo(() => { try { return JSON.parse(localStorage.getItem(`eflow_guests_${pid}`) || '[]'); } catch { return []; } }, [pid]);
    const equipment = useMemo(() => { try { return JSON.parse(localStorage.getItem(`eflow_equipment_${pid}`) || '[]'); } catch { return []; } }, [pid]);
    const ros = useMemo(() => { try { return JSON.parse(localStorage.getItem(`eflow_ros_${pid}`) || '[]'); } catch { return []; } }, [pid]);

    const taskDone = checklist.filter(i => i.done).length;
    const taskTotal = checklist.length;
    const taskPct = taskTotal > 0 ? Math.round((taskDone / taskTotal) * 100) : 0;
    const overdueCount = checklist.filter(i => !i.done && i.dueDate && new Date(i.dueDate) < new Date()).length;

    const totalExpense = budget.filter(i => i.type === 'expense').reduce((s, i) => s + i.amount, 0);
    const totalIncome = budget.filter(i => i.type === 'income').reduce((s, i) => s + i.amount, 0);

    const confirmedVendors = vendors.filter(v => v.status === 'confirmed').length;
    const confirmedGuests = guests.filter(g => g.status === 'confirmed' || g.status === 'checkedin').length;
    const readyEquipment = equipment.filter(e => e.status === 'confirmed' || e.status === 'arrived').length;
    const rosDone = ros.filter(r => r.done).length;

    const scores = [];
    if (taskTotal > 0) scores.push(taskPct);
    if (vendors.length > 0) scores.push(Math.round((confirmedVendors / vendors.length) * 100));
    if (guests.length > 0) scores.push(Math.round((confirmedGuests / guests.length) * 100));
    if (equipment.length > 0) scores.push(Math.round((readyEquipment / equipment.length) * 100));
    const health = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    const healthColor = health >= 80 ? 'text-green-600' : health >= 50 ? 'text-amber-500' : 'text-red-500';
    const healthBg = health >= 80 ? 'from-green-500 to-emerald-600' : health >= 50 ? 'from-amber-400 to-orange-500' : 'from-red-500 to-rose-600';

    const alerts = [
        overdueCount > 0 && { type: 'danger', icon: 'fa-triangle-exclamation', msg: `${overdueCount} งานเกินกำหนดใน Checklist`, tab: 'checklist' },
        vendors.filter(v => v.status === 'pending').length > 0 && { type: 'warn', icon: 'fa-clock', msg: `${vendors.filter(v => v.status === 'pending').length} Vendor รอตอบกลับ`, tab: 'vendors' },
        equipment.filter(e => e.status === 'missing').length > 0 && { type: 'danger', icon: 'fa-box-open', msg: `${equipment.filter(e => e.status === 'missing').length} อุปกรณ์หาไม่ได้`, tab: 'equipment' },
        (totalExpense > totalIncome && totalIncome > 0) && { type: 'warn', icon: 'fa-sack-dollar', msg: 'รายจ่ายเกินรายรับ', tab: 'budget' },
    ].filter(Boolean);

    const quickStats = [
        { icon: 'fa-list-check', label: 'Checklist', val: `${taskDone}/${taskTotal}`, sub: `${taskPct}%`, color: 'text-blue-600', bg: 'bg-blue-50', tab: 'checklist' },
        { icon: 'fa-clapperboard', label: 'Run-of-Show', val: `${rosDone}/${ros.length}`, sub: 'กำหนดการ', color: 'text-indigo-600', bg: 'bg-indigo-50', tab: 'runofshow' },
        { icon: 'fa-sack-dollar', label: 'งบประมาณ', val: `฿${totalExpense.toLocaleString()}`, sub: 'รายจ่าย', color: 'text-rose-600', bg: 'bg-rose-50', tab: 'budget' },
        { icon: 'fa-handshake', label: 'Vendors', val: `${confirmedVendors}/${vendors.length}`, sub: 'ยืนยัน', color: 'text-orange-600', bg: 'bg-orange-50', tab: 'vendors' },
        { icon: 'fa-users', label: 'ผู้เข้าร่วม', val: `${confirmedGuests}/${guests.length}`, sub: 'ยืนยัน', color: 'text-violet-600', bg: 'bg-violet-50', tab: 'guests' },
        { icon: 'fa-boxes-stacked', label: 'อุปกรณ์', val: `${readyEquipment}/${equipment.length}`, sub: 'พร้อม', color: 'text-emerald-600', bg: 'bg-emerald-50', tab: 'equipment' },
    ];

    return (
        <div className="flex-1 overflow-y-auto bg-[#f5f5f7] p-6 space-y-5">
            {/* D-Day Banner */}
            <div className={`bg-gradient-to-r ${days !== null && days <= 7 ? 'from-red-500 to-rose-600' : days !== null && days <= 30 ? 'from-amber-500 to-orange-600' : 'from-blue-600 to-indigo-700'} rounded-2xl p-6 text-white shadow-lg`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold opacity-75 mb-1">วันงาน</p>
                        <p className="text-2xl font-black">{fmtDate(project.eventDate)}</p>
                        {project.venue && <p className="text-sm opacity-75 mt-1"><i className="fa-solid fa-location-dot mr-1" />{project.venue}</p>}
                    </div>
                    <div className="text-right">
                        {days !== null ? (
                            <>
                                <p className="text-6xl font-black leading-none">{days < 0 ? '✅' : days}</p>
                                <p className="text-sm font-bold opacity-75 mt-1">{days < 0 ? 'เสร็จแล้ว' : days === 0 ? 'วันนี้!' : 'วันที่เหลือ'}</p>
                            </>
                        ) : <p className="text-2xl font-black opacity-50">ยังไม่กำหนดวัน</p>}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-5">
                {/* Health Score */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col items-center justify-center text-center col-span-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Health Score</p>
                    <div className="relative w-24 h-24 mb-3">
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                            <circle cx="18" cy="18" r="15.9" fill="none"
                                stroke={health >= 80 ? '#22c55e' : health >= 50 ? '#f59e0b' : '#ef4444'}
                                strokeWidth="3" strokeLinecap="round"
                                strokeDasharray={`${health} ${100 - health}`}
                                className="transition-all duration-700" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-2xl font-black ${healthColor}`}>{health}%</span>
                        </div>
                    </div>
                    <p className={`text-sm font-black ${healthColor}`}>
                        {health >= 80 ? '🟢 พร้อมมาก' : health >= 50 ? '🟡 กำลังดำเนินการ' : '🔴 ต้องเร่งดำเนินการ'}
                    </p>
                </div>

                {/* Alerts */}
                <div className="col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">🚨 สิ่งที่ต้องดำเนินการ</p>
                    {alerts.length === 0 ? (
                        <div className="flex items-center gap-3 py-6">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                <i className="fa-solid fa-check text-green-600" />
                            </div>
                            <p className="text-sm font-bold text-green-700">ทุกอย่างดำเนินไปได้ดี!</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {alerts.map((a, i) => (
                                <button key={i} onClick={() => onNavigate && onNavigate(a.tab)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition hover:opacity-80 ${a.type === 'danger' ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
                                    <i className={`fa-solid ${a.icon} ${a.type === 'danger' ? 'text-red-500' : 'text-amber-500'} text-sm w-4`} />
                                    <p className={`text-xs font-bold flex-1 ${a.type === 'danger' ? 'text-red-700' : 'text-amber-700'}`}>{a.msg}</p>
                                    <i className="fa-solid fa-arrow-right text-[9px] opacity-30" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Stats — clickable */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {quickStats.map(s => (
                    <button key={s.label} onClick={() => onNavigate && onNavigate(s.tab)}
                        className="bg-white rounded-2xl border border-slate-100 p-4 text-center hover:shadow-md hover:border-slate-300 transition group">
                        <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition`}>
                            <i className={`fa-solid ${s.icon} ${s.color} text-sm`} />
                        </div>
                        <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{s.label}</p>
                        <p className="text-[10px] text-slate-300">{s.sub}</p>
                    </button>
                ))}
            </div>

            {/* Checklist Progress */}
            {taskTotal > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 p-5">
                    <div className="flex justify-between items-center mb-3">
                        <p className="text-sm font-black text-slate-700">ความคืบหน้า Checklist</p>
                        <span className="text-sm font-black text-blue-600">{taskPct}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${healthBg} transition-all duration-700`} style={{ width: `${taskPct}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                        {taskDone} จาก {taskTotal} รายการ · {overdueCount > 0 ? <span className="text-red-500 font-bold">{overdueCount} เกินกำหนด</span> : 'ไม่มีงานค้าง'}
                    </p>
                </div>
            )}

            {/* Special Tools */}
            <div className="grid grid-cols-2 gap-3">
                <button onClick={() => onNavigate?.('smart_alerts')}
                    className="bg-white rounded-2xl border border-slate-100 p-4 text-left hover:shadow-md transition group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-bl-full -mr-4 -mt-4 opacity-50" />
                    <i className="fa-solid fa-bell text-amber-500 text-lg mb-2 relative z-10" />
                    <p className="font-black text-xs text-slate-800 relative z-10">Smart Alerts</p>
                    <p className="text-[10px] text-slate-400 relative z-10">ระบบแจ้งเตือนอัจฉริยะ</p>
                </button>
                <button onClick={() => onNavigate?.('dayof')}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left hover:shadow-md transition group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-green-500/10 rounded-bl-full -mr-2 -mt-2 animate-pulse" />
                    <i className="fa-solid fa-bolt text-green-400 text-lg mb-2 relative z-10" />
                    <p className="font-black text-xs text-white relative z-10">Day-Of Mode</p>
                    <p className="text-[10px] text-slate-500 relative z-10">ศูนย์บัญฉาการวันงาน</p>
                </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {[
                    { tab: 'runofshow', icon: 'fa-clapperboard', label: 'Run-of-Show', desc: 'กำหนดการวันงาน', color: 'from-indigo-500 to-blue-600' },
                    { tab: 'contacts', icon: 'fa-phone', label: 'Contact Hub', desc: 'เบอร์ฉุกเฉินทั้งหมด', color: 'from-green-500 to-emerald-600' },
                    { tab: 'sop', icon: 'fa-triangle-exclamation', label: 'SOP ฉุกเฉิน', desc: 'แผนรับมือสถานการณ์', color: 'from-red-500 to-rose-600' },
                ].map(t => (
                    <button key={t.tab} onClick={() => onNavigate && onNavigate(t.tab)}
                        className={`bg-gradient-to-br ${t.color} text-white rounded-2xl p-5 text-left hover:opacity-90 transition shadow-sm hover:shadow-md`}>
                        <i className={`fa-solid ${t.icon} text-2xl mb-3 block opacity-90`} />
                        <p className="font-black text-sm">{t.label}</p>
                        <p className="text-xs opacity-70 mt-0.5">{t.desc}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

// ─── Nav Config ───────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
    {
        label: 'ภาพรวม',
        items: [
            { tab: 'dashboard', icon: 'fa-gauge-high', label: 'Dashboard' },
            { tab: 'smart_alerts', icon: 'fa-bell', label: 'Smart Alerts', badge: 'NEW' },
            { tab: 'dayof', icon: 'fa-bolt', label: 'Day-Of Mode', badge: 'LIVE' },
        ]
    },
    {
        label: 'วางแผนงาน',
        items: [
            { tab: 'runofshow', icon: 'fa-clapperboard', label: 'Run-of-Show' },
            { tab: 'multiday', icon: 'fa-calendar-week', label: 'Multi-Day Content', badge: 'NEW' },
            { tab: 'checklist', icon: 'fa-list-check', label: 'Checklist งาน' },
            { tab: 'ai_gen', icon: 'fa-wand-sparkles', label: 'AI Task Generator', badge: 'AI' },
            { tab: 'notes', icon: 'fa-note-sticky', label: 'บันทึก & Decisions' },
        ]
    },
    {
        label: 'บุคลากร & Guests',
        items: [
            { tab: 'contacts', icon: 'fa-phone', label: 'Contact Hub & SOP' },
            { tab: 'guests', icon: 'fa-users', label: 'Guests List' },
            { tab: 'self_reg', icon: 'fa-globe', label: 'Guest Self-Reg', badge: 'WEB' },
            { tab: 'tickets', icon: 'fa-ticket', label: 'Ticket & QR Code' },
            { tab: 'qrtool', icon: 'fa-qrcode', label: 'QR Generator Tool', badge: 'WOW' },
        ]
    },
    {
        label: 'Logistics & Spend',
        items: [
            { tab: 'budget_actual', icon: 'fa-chart-bar', label: 'Budget (Actual vs Plan)' },
            { tab: 'catering', icon: 'fa-utensils', label: 'Catering & Dining' },
            { tab: 'logistics', icon: 'fa-square-parking', label: 'Parking & Map' },
            { tab: 'vendors', icon: 'fa-handshake', label: 'Vendors' },
            { tab: 'vendor_scorecard', icon: 'fa-trophy', label: 'Vendor Scorecard' },
            { tab: 'equipment', icon: 'fa-boxes-stacked', label: 'อุปกรณ์ & วัสดุ' },
            { tab: 'media', icon: 'fa-photo-film', label: 'Media Vault', badge: 'NEW' },
        ]
    },
    {
        label: 'สรุปและส่งออก',
        items: [
            { tab: 'briefing', icon: 'fa-file-export', label: 'Summary & Export' },
            { tab: 'debrief', icon: 'fa-clipboard-check', label: 'Post-Event Debrief' },
        ]
    },
    {
        label: 'เครื่องมือระบบ',
        items: [
            { tab: 'clone', icon: 'fa-copy', label: 'Clone โปรเจกต์' },
            { tab: 'floorplan', icon: 'fa-border-all', label: 'ผังงาน (Floor Plan)', external: true },
        ]
    },
];

// ─── Main Workspace ──────────────────────────────────────────────────────────
const ProjectWorkspace = ({ project, onBack, onOpenFloorPlan, isPro, setShowUpgradeModal }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const days = dDay(project.eventDate);
    const pid = project.id;

    const handleTabClick = (tab) => {
        if (tab === 'floorplan') { onOpenFloorPlan && onOpenFloorPlan(project); return; }
        setActiveTab(tab);
    };

    return (
        <div className="flex w-full h-screen overflow-hidden bg-[#f5f5f7]">
            {/* Project Sidebar */}
            <aside className="w-56 bg-white border-r border-slate-100 h-screen flex flex-col z-20 shrink-0 shadow-sm">
                {/* Back + Project Info */}
                <div className="px-4 pt-4 pb-3 border-b border-slate-100">
                    <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-600 transition mb-3 group">
                        <i className="fa-solid fa-arrow-left text-[10px] group-hover:-translate-x-0.5 transition" />
                        กลับหน้าหลัก
                    </button>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                        <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                                <i className="fa-solid fa-calendar-days text-white text-xs" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-black text-slate-800 text-xs leading-tight truncate" title={project.name}>{project.name}</p>
                                {days !== null && (
                                    <p className={`text-[10px] font-bold mt-0.5 ${days <= 7 ? 'text-red-500' : days <= 30 ? 'text-amber-500' : 'text-blue-500'}`}>
                                        {days < 0 ? '✅ จบแล้ว' : days === 0 ? '🎉 วันนี้!' : `D-${days}`}
                                    </p>
                                )}
                                {project.eventDate && <p className="text-[9px] text-slate-400 mt-0.5">{fmtDate(project.eventDate)}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-3">
                    {NAV_SECTIONS.map(section => (
                        <div key={section.label}>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 mb-1">{section.label}</p>
                            <div className="space-y-0.5">
                                {section.items.map(item => (
                                    <button key={item.tab} onClick={() => handleTabClick(item.tab)}
                                        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold transition-all text-left ${activeTab === item.tab ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                                        <i className={`fa-solid ${item.icon} w-3.5 text-center text-[10px]`} />
                                        <span className="flex-1 leading-tight">{item.label}</span>
                                        {item.badge && <span className="text-[7px] bg-blue-500 text-white font-black px-1 py-0.5 rounded" style={{ fontSize: '7px' }}>{item.badge}</span>}
                                        {item.external && <i className="fa-solid fa-arrow-up-right-from-square text-[8px] opacity-30" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="px-3 pb-4 border-t border-slate-100 pt-3">
                    <div className="bg-slate-50 rounded-xl p-2 text-center">
                        <p className="text-[9px] text-slate-400 font-bold">Project ID</p>
                        <p className="text-[8px] font-mono text-slate-300 mt-0.5 truncate">{pid}</p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            {activeTab === 'dashboard' && <ProjectDashboard project={project} onNavigate={handleTabClick} />}
            {activeTab === 'runofshow' && <RunOfShowView projectId={pid} />}
            {activeTab === 'checklist' && <ChecklistView projectId={pid} />}
            {activeTab === 'budget' && <BudgetView projectId={pid} />}
            {activeTab === 'budget_actual' && <BudgetActualView projectId={pid} />}
            {activeTab === 'notes' && <EventNotesView projectId={pid} />}
            {activeTab === 'vendors' && <VendorView projectId={pid} />}
            {activeTab === 'vendor_scorecard' && <VendorScorecardView projectId={pid} />}
            {activeTab === 'guests' && <GuestView projectId={pid} />}
            {activeTab === 'tickets' && <TicketView projectId={pid} />}
            {activeTab === 'qrtool' && <QRToolView projectId={pid} />}
            {activeTab === 'equipment' && <EquipmentView projectId={pid} />}
            {activeTab === 'catering' && <CateringView projectId={pid} />}
            {activeTab === 'contacts' && <ContactHubView projectId={pid} />}
            {activeTab === 'sop' && <SOPView projectId={pid} />}
            {activeTab === 'logistics' && <LogisticsView projectId={pid} />}
            {activeTab === 'briefing' && <BriefingExportView projectId={pid} project={project} />}
            {activeTab === 'debrief' && <DebriefView projectId={pid} />}
            {activeTab === 'smart_alerts' && <SmartAlertsView projectId={pid} />}
            {activeTab === 'dayof' && <DayOfModeView projectId={pid} project={project} onNavigate={handleTabClick} />}
            {activeTab === 'media' && <MediaVaultView projectId={pid} />}
            {activeTab === 'clone' && <ProjectCloneView projectId={pid} project={project} onBack={() => setActiveTab('dashboard')} onCloneSuccess={(newP) => {
                window.location.reload();
            }} />}
            {activeTab === 'ai_gen' && <AITaskGeneratorView projectId={pid} />}
            {activeTab === 'self_reg' && <GuestRegistrationView projectId={pid} project={project} />}
            {activeTab === 'multiday' && <MultiDayView projectId={pid} />}
        </div>
    );
};

export default ProjectWorkspace;
