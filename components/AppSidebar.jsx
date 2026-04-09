import React, { useMemo } from 'react';

const formatThaiDate = (date) => {
    if (!date) return null;
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
};

const daysRemaining = (expiryDate) => {
    if (!expiryDate) return null;
    const diff = expiryDate - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const NAV_ITEMS = [
    { tab: 'dashboard', icon: 'fa-gauge-high',   label: 'Command Center', section: 'main' },
    { tab: 'projects',  icon: 'fa-border-all',   label: 'ผังงาน (Floor Plan)', section: 'main' },
    { tab: 'checklist', icon: 'fa-list-check',   label: 'Master Checklist',  section: 'tools' },
    { tab: 'budget',    icon: 'fa-sack-dollar',  label: 'งบประมาณ',           section: 'tools' },
    { tab: 'vendors',   icon: 'fa-handshake',    label: 'Vendors & Suppliers',section: 'tools' },
    { tab: 'guests',    icon: 'fa-users',        label: 'ผู้เข้าร่วม',         section: 'tools' },
    { tab: 'account',   icon: 'fa-gear',         label: 'บัญชี & ตั้งค่า',     section: 'settings' },
];

const AppSidebar = ({
    searchQuery,
    setSearchQuery,
    isPro,
    userPlan = { plan: 'free', duration: null, expiry: null },
    setShowUpgradeModal,
    currentUser,
    handleLogout,
    activeTab,
    setActiveTab,
}) => {
    const { plan, duration, expiry } = userPlan;

    const days = useMemo(() => daysRemaining(expiry), [expiry]);
    const expiryStr = useMemo(() => formatThaiDate(expiry), [expiry]);

    const progressPct = useMemo(() => {
        if (plan !== 'rental' || !expiry || !duration) return 0;
        const durationMonths = { '1m': 1, '3m': 3, '6m': 6, '9m': 9, '1y': 12 };
        const totalDays = (durationMonths[duration] || 1) * 30;
        const used = totalDays - (days || 0);
        return Math.min(100, Math.max(0, Math.round((used / totalDays) * 100)));
    }, [plan, expiry, duration, days]);

    const planBadge = {
        free:     { label: 'Free Plan',   color: 'bg-slate-100 text-slate-500 border border-slate-200' },
        rental:   { label: 'Pro Rental',  color: 'bg-blue-50 text-blue-600 border border-blue-200' },
        lifetime: { label: '👑 Lifetime', color: 'bg-amber-50 text-amber-600 border border-amber-200' },
    }[plan] || { label: 'Free Plan', color: 'bg-slate-100 text-slate-500 border border-slate-200' };

    const isExpiringSoon = plan === 'rental' && days !== null && days <= 7;

    const mainItems = NAV_ITEMS.filter(n => n.section === 'main');
    const toolItems = NAV_ITEMS.filter(n => n.section === 'tools');
    const settingsItems = NAV_ITEMS.filter(n => n.section === 'settings');

    return (
        <aside className="w-60 bg-white border-r border-slate-100 h-screen flex flex-col z-20 shrink-0 shadow-sm">
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-100">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                    <i className="fa-solid fa-water text-white text-sm"></i>
                </div>
                <div>
                    <span className="font-black text-slate-900 tracking-tight text-base">Eflow</span>
                    <span className="text-[10px] text-slate-400 font-bold ml-1.5">Event OS</span>
                </div>
            </div>

            {/* Search */}
            <div className="px-4 pt-4 pb-2">
                <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>
                    <input
                        type="text"
                        placeholder="ค้นหา..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-blue-300 focus:ring-2 focus:ring-blue-100 rounded-lg py-2 pl-8 pr-3 text-xs outline-none transition-all"
                    />
                </div>
            </div>

            {/* Nav Sections */}
            <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">

                {/* Main */}
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-1.5">ภาพรวม</p>
                    <div className="space-y-0.5">
                        {mainItems.map(item => (
                            <button
                                key={item.tab}
                                onClick={() => setActiveTab(item.tab)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold transition-all text-left ${
                                    activeTab === item.tab
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <i className={`fa-solid ${item.icon} w-4 text-center text-xs`}></i>
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Event Tools */}
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-1.5">เครื่องมือประสานงาน</p>
                    <div className="space-y-0.5">
                        {toolItems.map(item => (
                            <button
                                key={item.tab}
                                onClick={() => setActiveTab(item.tab)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold transition-all text-left group ${
                                    activeTab === item.tab
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <i className={`fa-solid ${item.icon} w-4 text-center text-xs`}></i>
                                <span className="flex-1">{item.label}</span>
                                {!isPro && item.tab !== 'projects' && item.tab !== 'dashboard' && (
                                    <i className="fa-solid fa-lock text-[9px] opacity-40 group-hover:opacity-60"></i>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
                {/* Settings */}
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-1.5">บัญชี</p>
                    <div className="space-y-0.5">
                        {settingsItems.map(item => (
                            <button
                                key={item.tab}
                                onClick={() => setActiveTab(item.tab)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold transition-all text-left ${
                                    activeTab === item.tab
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <i className={`fa-solid ${item.icon} w-4 text-center text-xs`}></i>
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* --- Bottom Section --- */}
            <div className="px-3 pb-4 border-t border-slate-100 pt-3 space-y-2.5">

                {/* FREE: Upsell Banner */}
                {plan === 'free' && (
                    <div
                        onClick={() => setShowUpgradeModal(true)}
                        className="bg-gradient-to-br from-indigo-600 to-blue-700 p-3.5 rounded-xl shadow-md shadow-blue-200 cursor-pointer hover:scale-[1.02] active:scale-100 transition-all"
                    >
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                                <i className="fa-solid fa-crown text-amber-300 text-xs"></i>
                            </div>
                            <h4 className="text-white font-black text-xs">Upgrade to Pro</h4>
                        </div>
                        <p className="text-white/70 text-[10px] leading-relaxed">ปลดล็อกเครื่องมือประสานงานทั้งหมด</p>
                    </div>
                )}

                {/* RENTAL: Expiry Progress */}
                {plan === 'rental' && expiry && (
                    <div className={`p-3 rounded-xl border ${isExpiringSoon ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-100'}`}>
                        <div className="flex justify-between items-center mb-1.5">
                            <span className={`text-[10px] font-black uppercase tracking-wider ${isExpiringSoon ? 'text-red-600' : 'text-blue-700'}`}>
                                <i className={`fa-solid fa-clock mr-1 ${isExpiringSoon ? 'text-red-500' : 'text-blue-500'}`}></i>
                                Pro Rental
                            </span>
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${isExpiringSoon ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                {days} วัน
                            </span>
                        </div>
                        <div className="h-1 bg-white/80 rounded-full overflow-hidden mb-1.5">
                            <div className={`h-full rounded-full transition-all ${isExpiringSoon ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${progressPct}%` }} />
                        </div>
                        <p className={`text-[9px] font-bold ${isExpiringSoon ? 'text-red-500' : 'text-slate-400'}`}>
                            {isExpiringSoon ? '⚠️ ใกล้หมดอายุ! ' : 'หมดอายุ '}{expiryStr}
                        </p>
                        {isExpiringSoon && (
                            <button onClick={() => setShowUpgradeModal(true)} className="mt-1.5 w-full py-1 bg-red-500 text-white text-[10px] font-black rounded-md hover:bg-red-600 transition">
                                ต่ออายุ
                            </button>
                        )}
                    </div>
                )}

                {/* LIFETIME: Gold Badge */}
                {plan === 'lifetime' && (
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <i className="fa-solid fa-crown text-amber-500 text-xs"></i>
                        </div>
                        <div>
                            <p className="text-xs font-black text-amber-700">Pro Lifetime</p>
                            <p className="text-[9px] text-amber-500 font-bold">ใช้งานได้ตลอดชีพ ✨</p>
                        </div>
                    </div>
                )}

                {/* User Card */}
                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-black text-sm ${
                        plan === 'lifetime' ? 'bg-amber-100 text-amber-600' :
                        plan === 'rental'   ? 'bg-blue-100 text-blue-600' :
                                              'bg-slate-200 text-slate-500'
                    }`}>
                        {currentUser?.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="text-xs overflow-hidden flex-1 min-w-0">
                        <div className="font-bold text-slate-800 truncate text-[11px]">{currentUser?.email?.split('@')[0] || 'User'}</div>
                        <span className={`inline-block text-[9px] font-black mt-0.5 px-1.5 py-0.5 rounded uppercase tracking-tighter ${planBadge.color}`}>
                            {planBadge.label}
                        </span>
                    </div>
                    <button onClick={handleLogout} title="ออกจากระบบ"
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 hover:text-red-500 text-slate-400 transition flex-shrink-0">
                        <i className="fa-solid fa-right-from-bracket text-xs"></i>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default AppSidebar;
