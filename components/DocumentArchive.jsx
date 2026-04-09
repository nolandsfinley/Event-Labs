import React from 'react';

const DocumentArchive = ({ 
    slots, 
    updateSlotName, 
    onFileSelected, 
    removeFile, 
    onPreviewFile, 
    addNewSlot, 
    DEFAULT_SLOTS_COUNT, 
    isPro 
}) => {
    return (
        <main className="flex-1 overflow-hidden relative group/canvas bg-[#0f172a] thin-scrollbar">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none"></div>
            
            <div className="relative h-full overflow-y-auto p-12 lg:p-20 scroll-smooth">
                {/* Header Section */}
                <div className="max-w-7xl mx-auto mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Asset Management</span>
                            </div>
                            <div className={`px-3 py-1 border rounded-full ${isPro ? 'bg-amber-500/10 border-amber-500/20' : 'bg-slate-500/10 border-slate-500/20'}`}>
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isPro ? 'text-amber-400' : 'text-slate-400'}`}>
                                    {isPro ? 'Pro Archive' : 'Basic Archive'}
                                </span>
                            </div>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-none">
                            DOCUMENT<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400">ARCHIVE.</span>
                        </h1>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 text-right">
                        <p className="text-slate-500 font-bold text-sm tracking-tight max-w-[280px]">
                            Centralized repository for technical specifications, floor plans, and production assets.
                        </p>
                        <div className="h-1 w-20 bg-gradient-to-r from-blue-600 to-transparent rounded-full"></div>
                    </div>
                </div>

                {/* Grid Section */}
                <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                    {slots.map((slot, index) => {
                        const hasFile = !!slot.file;
                        // Limit for non-pro users
                        const isLocked = !isPro && index >= DEFAULT_SLOTS_COUNT;

                        if (isLocked) {
                            return (
                                <div key={slot.id} className="relative aspect-[3/4] rounded-[2.5rem] bg-slate-900/40 border border-white/5 flex flex-col items-center justify-center gap-4 group/locked overflow-hidden backdrop-blur-sm">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent"></div>
                                    <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center border border-white/10 text-slate-600 mb-2">
                                        <i className="fa-solid fa-lock text-xl"></i>
                                    </div>
                                    <div className="text-center px-6">
                                        <p className="text-slate-400 font-black text-xs uppercase tracking-widest mb-1">Slot Locked</p>
                                        <p className="text-[10px] text-slate-600 font-bold leading-relaxed">Upgrade to Pro to unlock more slots.</p>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div 
                                key={slot.id} 
                                className={`group/card relative aspect-[3/4] rounded-[2.5rem] overflow-hidden border transition-all duration-500 ${hasFile 
                                    ? 'bg-slate-900 border-white/10 hover:border-blue-500/50 hover:shadow-[0_0_50px_rgba(59,130,246,0.15)]' 
                                    : 'bg-slate-900/60 border-white/5 border-dashed hover:border-white/20'}`}
                            >
                                {/* Static Indicator */}
                                <div className="absolute top-8 left-8 z-10">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm ${hasFile ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-600'}`}>
                                        {String(index + 1).padStart(2, '0')}
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="absolute inset-0 p-8 pt-24 flex flex-col items-center justify-center text-center">
                                    {hasFile ? (
                                        <div className="w-full space-y-6 animate-[cardFadeIn_0.5s_ease-out]">
                                            <div className="relative mx-auto w-24 h-24 mb-4">
                                                <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 group-hover/card:opacity-40 transition-opacity"></div>
                                                <div className="relative w-full h-full bg-slate-800 rounded-3xl border border-white/10 flex items-center justify-center text-3xl text-blue-400 shadow-2xl overflow-hidden">
                                                    {slot.file.type === 'application/pdf' ? (
                                                        <i className="fa-solid fa-file-pdf"></i>
                                                    ) : (
                                                        <img src={slot.file.url} alt="" className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Filename</p>
                                                <p className="text-white font-bold text-sm truncate px-4">{slot.file.name}</p>
                                            </div>
                                            
                                            <div className="pt-4 flex items-center justify-center gap-3">
                                                <button 
                                                    onClick={() => onPreviewFile(slot.file)}
                                                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-blue-600 hover:border-blue-500 transition-all"
                                                >
                                                    <i className="fa-solid fa-eye text-xs"></i>
                                                </button>
                                                <button 
                                                    onClick={() => removeFile(slot.id)}
                                                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-red-600 hover:border-red-500 transition-all"
                                                >
                                                    <i className="fa-solid fa-trash-can text-xs"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer group/upload">
                                            <input type="file" className="hidden" onChange={(e) => onFileSelected(slot.id, e)} accept="image/jpeg,image/png,image/webp,application/pdf" />
                                            <div className="w-16 h-16 rounded-full border-2 border-slate-800 flex items-center justify-center text-slate-700 group-hover/upload:border-blue-500 group-hover/upload:bg-blue-600 group-hover/upload:text-white transition-all transform group-hover/upload:scale-110">
                                                <i className="fa-solid fa-arrow-up-from-bracket text-xl"></i>
                                            </div>
                                            <span className="mt-4 text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] group-hover/upload:text-blue-400 transition-colors">Select Asset</span>
                                        </label>
                                    )}
                                </div>

                                {/* Footer Info Area */}
                                <div className="h-20 bg-gradient-to-b from-[#1e293b] to-[#0f172a] border-t border-white/5 flex flex-col items-center justify-center px-4 py-3 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
                                    <input
                                        type="text"
                                        value={slot.name}
                                        onChange={(e) => updateSlotName(slot.id, e.target.value)}
                                        className="w-full bg-transparent text-center text-[14px] font-black text-white hover:text-blue-400 focus:text-blue-400 outline-none placeholder:text-slate-700 transition-all uppercase tracking-tight"
                                        placeholder="Set Name..."
                                    />
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${hasFile ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'bg-slate-800'}`}></div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${hasFile ? 'text-cyan-400' : 'text-slate-600'}`}>
                                            {hasFile ? 'Localized' : 'Ready'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* New Slot Button Card */}
                    <button
                        onClick={addNewSlot}
                        className="group aspect-[3/4] rounded-[2.5rem] border-4 border-dashed border-slate-800 bg-slate-900/20 flex flex-col items-center justify-center gap-4 hover:border-blue-500/50 hover:bg-blue-600/5 transition-all text-slate-700 hover:text-blue-500 shadow-inner"
                    >
                        <div className="w-16 h-16 rounded-3xl border-2 border-slate-800 flex items-center justify-center group-hover:border-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all rotate-45 group-hover:rotate-0">
                            <i className="fa-solid fa-plus text-2xl -rotate-45 group-hover:rotate-0 transition-transform"></i>
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.4em] opacity-30 group-hover:opacity-100">Add Content</span>
                    </button>
                </div>
            </div>
        </main>
    );
};

export default DocumentArchive;
