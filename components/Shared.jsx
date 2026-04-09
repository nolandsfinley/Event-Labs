import React, { useState, useEffect, useRef } from 'react';

export const formatPresetLabel = (n, suffix) => {
    if (suffix === 'm') return n === 0 ? 'Unlimited' : `${n} m`;
    if (suffix === 'cm') return `${n} cm`;
    if (suffix === 'rows') return n === 0 ? 'Auto' : `${n} rows`;
    if (suffix === 'cols') return n === 0 ? 'Auto' : `${n} cols`;
    return `${n} ${suffix || ''}`;
};

export const BuildingMetricControl = ({ title, field, min, max, presets, presetSuffix, buildingProfile, setBuildingProfile, cardClass }) => {
    const val = Math.max(min, Math.min(max, Number(buildingProfile[field]) || 0));
    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(String(val));
    const [presetOpen, setPresetOpen] = useState(false);
    const presetRef = useRef(null);

    useEffect(() => {
        if (!editing) setText(String(val));
    }, [val, editing]);

    useEffect(() => {
        if (!presetOpen) return;
        const close = (e) => {
            if (presetRef.current && !presetRef.current.contains(e.target)) setPresetOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [presetOpen]);

    const setClamped = (n) => {
        let num = typeof n === 'number' ? n : parseInt(String(n).replace(/[^\d-]/g, ''), 10);
        if (Number.isNaN(num)) num = min;
        num = Math.round(num);
        num = Math.max(min, Math.min(max, num));
        setBuildingProfile((p) => ({ ...p, [field]: num }));
    };

    return (
        <div className={`rounded-xl border border-slate-200/60 bg-white/40 p-2.5 space-y-2 transition-all hover:bg-white/60 ${cardClass || ''}`}>
            <div className="flex items-center justify-between gap-2 px-0.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{title}</p>
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => setClamped(val - 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
                        <i className="fa-solid fa-minus text-[8px]"></i>
                    </button>
                    <div className="relative">
                        <input
                            type="text"
                            inputMode="numeric"
                            value={editing ? text : String(val)}
                            onFocus={() => { setEditing(true); setText(String(val)); }}
                            onChange={(e) => setText(e.target.value)}
                            onBlur={() => { setEditing(false); const n = parseInt(text, 10); if (Number.isNaN(n)) setClamped(val); else setClamped(n); }}
                            className="w-10 text-center text-xs font-black text-indigo-600 bg-indigo-50/50 rounded-lg py-1 border-none outline-none focus:ring-1 focus:ring-indigo-300"
                        />
                        <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-slate-100 border border-white text-[6px] font-black text-slate-400">
                            {presetSuffix === 'm' ? 'm' : '#'}
                        </span>
                    </div>
                    <button type="button" onClick={() => setClamped(val + 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
                        <i className="fa-solid fa-plus text-[8px]"></i>
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <input type="range" min={min} max={max} value={val} onChange={(e) => setClamped(e.target.value)} className="flex-1 h-1 bg-slate-100 rounded-full cursor-pointer accent-indigo-500 hover:accent-indigo-600 transition-all" />
                <div className="relative shrink-0" ref={presetRef}>
                    <button
                        type="button"
                        onClick={() => setPresetOpen((o) => !o)}
                        className="p-1 px-1.5 flex items-center justify-center rounded-lg bg-slate-100/80 border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <i className="fa-solid fa-list-ul text-[8px]" />
                    </button>
                    {presetOpen && (
                        <ul className="absolute right-0 bottom-full mb-2 z-[100] bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-2xl py-1 min-w-[7rem] max-h-48 overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
                            {presets.map((p) => (
                                <li key={`b-${field}-${p}`}>
                                    <button
                                        type="button"
                                        className="w-full text-left px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                        onClick={() => { setClamped(p); setPresetOpen(false); }}
                                    >
                                        {formatPresetLabel(p, presetSuffix)}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export const SidebarCollapsible = ({ title, icon, defaultOpen = true, children }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-slate-200/50 rounded-xl overflow-hidden bg-white/40 shadow-sm transition-all hover:bg-white/60">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-white/20 transition-colors"
            >
                <span className="flex items-center gap-2 min-w-0">
                    {icon ? <span className="shrink-0 text-slate-400">{icon}</span> : null}
                    <span className="truncate">{title}</span>
                </span>
                <i className={`fa-solid fa-chevron-down text-slate-300 text-[8px] shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
            </button>
            {open ? (
                <div className="px-2.5 pb-2.5 pt-0.5 space-y-2.5 border-t border-slate-100/50 animate-in fade-in slide-in-from-top-1 duration-200">
                    {children}
                </div>
            ) : null}
        </div>
    );
};

export const ZoneDimensionControl = ({
    title,
    field,
    min,
    max,
    presets,
    presetSuffix,
    activeZone,
    activeZoneId,
    setZones,
    cardGradient,
    cardBorder,
    accentText,
    btnBorder,
    rangeAccent,
}) => {
    if (!activeZone) return null;

    const val = Math.max(min, Math.min(max, Number(activeZone?.[field] || 0)));
    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(String(val));
    const [presetOpen, setPresetOpen] = useState(false);
    const presetRef = useRef(null);

    useEffect(() => {
        if (!editing) setText(String(val));
    }, [val, editing]);

    useEffect(() => {
        if (!presetOpen) return;
        const close = (e) => {
            if (presetRef.current && !presetRef.current.contains(e.target)) setPresetOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [presetOpen]);

    const setClamped = (n) => {
        let num = typeof n === 'number' ? n : parseInt(String(n).replace(/[^\d-]/g, ''), 10);
        if (Number.isNaN(num)) num = min;
        num = Math.round(num);
        num = Math.max(min, Math.min(max, num));
        setZones((zs) => zs.map((z) => (z.id === activeZoneId ? { ...z, [field]: num } : z)));
    };

    return (
        <div className={`rounded-xl border ${cardBorder || 'border-slate-200/60'} bg-white/40 p-2.5 space-y-2 transition-all hover:bg-white/60`}>
            <div className="flex items-center justify-between gap-2 px-0.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{title}</p>
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => setClamped(val - 1)} className={`w-6 h-6 flex items-center justify-center bg-white rounded-lg border ${btnBorder || 'border-slate-200'} text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm`}>
                        <i className="fa-solid fa-minus text-[8px]"></i>
                    </button>
                    <div className="relative">
                        <input
                            type="text"
                            inputMode="numeric"
                            value={editing ? text : String(val)}
                            onFocus={() => { setEditing(true); setText(String(val)); }}
                            onChange={(e) => setText(e.target.value)}
                            onBlur={() => { setEditing(false); const n = parseInt(text, 10); if (Number.isNaN(n)) setClamped(val); else setClamped(n); }}
                            className={`w-10 text-center text-xs font-black ${accentText || 'text-indigo-600'} bg-slate-50 rounded-lg py-1 border-none outline-none focus:ring-1 focus:ring-indigo-300`}
                        />
                    </div>
                    <button type="button" onClick={() => setClamped(val + 1)} className={`w-6 h-6 flex items-center justify-center bg-white rounded-lg border ${btnBorder || 'border-slate-200'} text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm`}>
                        <i className="fa-solid fa-plus text-[8px]"></i>
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <input type="range" min={min} max={max} value={val} onChange={(e) => setClamped(e.target.value)} className={`flex-1 h-1 bg-slate-100 rounded-full cursor-pointer ${rangeAccent || 'accent-indigo-500'}`} />
                <div className="relative shrink-0" ref={presetRef}>
                    <button type="button" onClick={() => setPresetOpen((o) => !o)} className="p-1 px-1.5 flex items-center justify-center rounded-lg bg-slate-100/80 border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
                        <i className="fa-solid fa-list-ul text-[8px]" />
                    </button>
                    {presetOpen && (
                        <ul className="absolute right-0 bottom-full mb-2 z-[100] bg-white border border-slate-200 rounded-xl shadow-2xl py-1 min-w-[7rem] max-h-48 overflow-y-auto">
                            {presets.map((p) => (
                                <li key={`p-${field}-${p}`}>
                                    <button
                                        type="button"
                                        className="w-full text-left px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                        onClick={() => { setClamped(p); setPresetOpen(false); }}
                                    >
                                        {formatPresetLabel(p, presetSuffix)}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};
