import React from 'react';

const EditorHeader = ({ 
    goToHome, 
    layoutName, 
    setLayoutName, 
    currentLayoutId, 
    updateLayoutName, 
    activeTab, 
    setActiveTab, 
    loadProject, 
    saveProject, 
    handleExportClick, 
    isPro, 
    setShowUpgradeModal, 
    currentUser, 
    handleSaveToCloud 
}) => {
    return (
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex justify-between items-center z-30 shadow-sm relative no-pan">
            <div className="flex items-center gap-4">
                <button onClick={goToHome} className="flex items-center gap-1.5 text-[#007aff] hover:bg-[#007aff]/10 px-2 py-1.5 rounded-md transition text-sm font-medium">
                    <i className="fa-solid fa-chevron-left"></i> แฟ้มงาน
                </button>
                <div className="h-5 w-px bg-slate-300 mx-1" />
                <input
                    type="text"
                    value={layoutName}
                    onChange={(e) => setLayoutName(e.target.value)}
                    onBlur={(e) => {
                        if (currentLayoutId) {
                            updateLayoutName(currentLayoutId, e.target.value);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.target.blur();
                        }
                    }}
                    className="bg-transparent font-bold text-sm focus:outline-none w-48 text-slate-800 focus:bg-white/50 rounded px-1 transition-colors"
                />
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 flex items-center bg-[#f2f2f7] p-1 rounded-xl border border-slate-200/50 max-w-[calc(100vw-200px)] overflow-x-auto">
                {[
                    { id: "floorplan", icon: "fa-border-all", label: "ผังงาน" },
                    { id: "documents", icon: "fa-folder-open", label: "คลังเอกสาร" },
                    { id: "coordination", icon: "fa-clipboard-list", label: "ประสานงาน" },
                ].map((t) => (
                    <button 
                        key={t.id} 
                        type="button" 
                        onClick={() => setActiveTab(t.id)} 
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase transition-all flex items-center gap-1.5 tracking-wider ${activeTab === t.id ? "bg-white shadow-sm text-[#007aff]" : "text-slate-500 hover:text-slate-700"}`}
                    >
                        <i className={`fa-solid ${t.icon}`}></i>
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center bg-[#f2f2f7] p-1 rounded-lg">
                    <button onClick={loadProject} className="text-emerald-600 hover:bg-white hover:shadow-sm p-1.5 rounded-md transition px-3 flex items-center gap-1.5 text-xs font-bold border-r border-slate-300">
                        <i className="fa-solid fa-folder-open"></i> <span className="hidden md:inline">โหลดงาน</span>
                    </button>
                    <button onClick={saveProject} className="text-blue-600 hover:bg-white hover:shadow-sm p-1.5 rounded-md transition px-3 flex items-center gap-1.5 text-xs font-bold border-r border-slate-300">
                        <i className="fa-solid fa-save"></i> <span className="hidden md:inline">เซฟงาน</span>
                    </button>
                    <button onClick={handleExportClick} className="text-slate-600 hover:bg-white hover:shadow-sm p-1.5 rounded-md transition px-3 flex items-center gap-1.5 text-xs font-medium border-r border-slate-300">
                        <i className="fa-solid fa-download"></i> <span className="hidden md:inline">นำออก PDF</span>
                    </button>
                    {!isPro && (
                        <button
                            onClick={() => setShowUpgradeModal(true)}
                            className="text-amber-600 hover:bg-white hover:shadow-sm p-1.5 rounded-md transition px-3 flex items-center gap-1.5 text-xs font-bold border-r border-slate-300"
                        >
                            <i className="fa-solid fa-crown"></i> <span className="hidden md:inline">Upgrade Pro</span>
                        </button>
                    )}
                    <button 
                        onClick={handleSaveToCloud} 
                        className={`hover:bg-white hover:shadow-sm p-1.5 rounded-md transition px-3 flex items-center gap-1.5 text-xs font-bold ${currentUser ? 'text-blue-600' : 'text-red-600'}`}
                    >
                        <i className={`fa-solid ${currentUser ? 'fa-cloud' : 'fa-lock-open'}`}></i> 
                        <span className="hidden md:inline">{currentUser ? 'บันทึก ☁️' : '⚠️ ต้องเข้าสู่ระบบ'}</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default EditorHeader;
