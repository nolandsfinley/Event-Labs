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

const ProjectGrid = ({
    currentUser,
    cloudLayouts,
    handleCreateNew,
    loadLayout,
    deleteLayout,
    updateLayoutName,
    onOpenWorkspace,
    isPro = false,
    userPlan = { plan: 'free', duration: null, expiry: null },
    setShowUpgradeModal
}) => {
    const { plan, expiry } = userPlan;
    const days = useMemo(() => daysRemaining(expiry), [expiry]);
    const expiryStr = useMemo(() => formatThaiDate(expiry), [expiry]);
    const isExpiringSoon = plan === 'rental' && days !== null && days <= 7;

    // Plan badge config for header
    const headerBadge = () => {
        if (plan === 'lifetime') return (
            <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                <i className="fa-solid fa-crown text-xs"></i> Pro Lifetime
            </span>
        );
        if (plan === 'rental') return (
            <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                <i className="fa-solid fa-gem text-xs"></i> Pro Rental
                {expiryStr && <span className="opacity-70">· หมดอายุ {expiryStr}</span>}
            </span>
        );
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                Free Plan · {cloudLayouts.length}/3 โปรเจกต์
            </span>
        );
    };

    return (
        <main className="flex-1 p-10 pt-10 overflow-y-auto bg-slate-50/50">

            {/* === Header === */}
            <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
                <div className="flex flex-wrap gap-3 items-center">
                    <h1 className="text-4xl font-bold text-[#1c1c1e]">แฟ้มงาน</h1>
                    {headerBadge()}
                    {currentUser && plan !== 'free' && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                            <i className="fa-solid fa-cloud text-blue-400"></i> Cloud Sync
                        </span>
                    )}
                </div>
                {plan === 'free' && (
                    <button
                        onClick={() => setShowUpgradeModal && setShowUpgradeModal(true)}
                        className="text-sm font-black px-5 py-2 bg-slate-900 text-white rounded-full hover:bg-blue-600 transition-all shadow flex items-center gap-2"
                    >
                        <i className="fa-solid fa-crown text-amber-400 text-xs"></i>
                        อัปเกรด Pro
                    </button>
                )}
            </div>

            {/* === Expiry Warning Banner (Rental) === */}
            {isExpiringSoon && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                            <i className="fa-solid fa-triangle-exclamation text-red-500"></i>
                        </div>
                        <div>
                            <p className="text-sm font-black text-red-800">แพ็กเกจ Pro Rental ของคุณใกล้หมดอายุ!</p>
                            <p className="text-xs text-red-600 font-medium">เหลืออีก <strong>{days} วัน</strong> · หมดอายุวันที่ {expiryStr}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowUpgradeModal && setShowUpgradeModal(true)}
                        className="flex-shrink-0 px-4 py-2 bg-red-500 text-white text-xs font-black rounded-xl hover:bg-red-600 transition whitespace-nowrap"
                    >
                        ต่ออายุทันที
                    </button>
                </div>
            )}

            {/* === Free Plan Project Limit Banner === */}
            {plan === 'free' && cloudLayouts.length >= 2 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <i className="fa-solid fa-lock text-blue-500"></i>
                        </div>
                        <div>
                            <p className="text-sm font-black text-blue-900">คุณใช้โปรเจกต์ครบ {cloudLayouts.length}/3 แล้ว</p>
                            <p className="text-xs text-blue-700 font-medium">อัปเกรดเป็น Pro เพื่อสร้างโปรเจกต์ได้ไม่จำกัด</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowUpgradeModal && setShowUpgradeModal(true)}
                        className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition whitespace-nowrap shadow"
                    >
                        <i className="fa-solid fa-crown mr-1 text-amber-300"></i> Upgrade Pro
                    </button>
                </div>
            )}

            {/* === Project Cards Grid === */}
            <div className="hero-selection-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">

                {/* Create New Card */}
                <div
                    onClick={handleCreateNew}
                    className="project-card aspect-[3/4] border-2 border-dashed border-[#d1d1d6] bg-white hover:bg-[#e3e3e8] rounded-xl flex flex-col items-center justify-center text-[#8e8e93] hover:text-[#3a3a3c] cursor-pointer transition hover:scale-105"
                >
                    <i className="fa-solid fa-circle-plus text-4xl mb-2"></i>
                    <span className="text-sm font-semibold">สร้างงานใหม่</span>
                    {plan === 'free' && cloudLayouts.length >= 2 && (
                        <span className="mt-2 text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <i className="fa-solid fa-lock text-[9px]"></i> Pro
                        </span>
                    )}
                </div>

                {/* Existing Project Cards */}
                {cloudLayouts.map(l => {
                    let tSeats = 0;
                    let hCount = 0;
                    if (l.zones) l.zones.forEach(z => {
                        tSeats += (z.rows || 0) * (z.columns || 0);
                        hCount += z.hiddenChairs ? z.hiddenChairs.length : 0;
                    });
                    const dateStr = new Date(l.updatedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

                    return (
                        <div key={l.id} className="group cursor-pointer project-card-enter">
                            <div
                                onClick={() => loadLayout(l)}
                                className="project-card aspect-[3/4] bg-gradient-to-br from-slate-50 to-slate-200 rounded-r-xl rounded-l-sm shadow-md hover:shadow-xl hover:-translate-y-1 transition-all relative border overflow-hidden hover:scale-105"
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-2 bg-black/5 border-r border-white/20 z-10" />
                                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-white via-white/90 to-transparent pt-12">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-2">
                                        <i className="fa-solid fa-border-all text-[#007aff]"></i>
                                    </div>
                                    <p className="text-2xl font-bold leading-none text-slate-800">{tSeats - hCount}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">ที่นั่ง</p>
                                </div>
                                {/* Open Workspace button */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); onOpenWorkspace && onOpenWorkspace(l); }}
                                    className="absolute top-2 left-2 px-2 py-1 bg-blue-600 text-white rounded-lg opacity-0 group-hover:opacity-100 shadow z-20 transition hover:bg-blue-700 flex items-center gap-1 text-[10px] font-black"
                                >
                                    <i className="fa-solid fa-gauge-high text-[9px]" /> Workspace
                                </button>
                                <button
                                    onClick={(e) => deleteLayout(e, l.id)}
                                    className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 text-red-500 hover:bg-white shadow z-20 transition"
                                >
                                    <i className="fa-solid fa-trash-can"></i>
                                </button>
                            </div>
                            <div className="px-1 mt-3">
                                <input
                                    type="text"
                                    defaultValue={l.name}
                                    onBlur={(e) => {
                                        if (e.target.value !== l.name) updateLayoutName(l.id, e.target.value);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') e.target.blur();
                                    }}
                                    className="block w-full font-bold text-sm bg-transparent border-none focus:outline-none focus:ring-0 focus:bg-white/50 rounded px-1 -ml-1 text-slate-800 transition-colors"
                                />
                                <p className="text-[11px] text-slate-500 mt-0.5">อัปเดต: {dateStr}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* === Lifetime Member Appreciation === */}
            {plan === 'lifetime' && cloudLayouts.length === 0 && (
                <div className="mt-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                        <i className="fa-solid fa-crown text-amber-500 text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-black text-slate-800 mb-2">ยินดีต้อนรับสมาชิก Pro Lifetime!</h3>
                    <p className="text-slate-500 text-sm font-medium">เริ่มสร้างโปรเจกต์แรกของคุณได้เลย ไม่มีข้อจำกัด ✨</p>
                </div>
            )}
        </main>
    );
};

export default ProjectGrid;
