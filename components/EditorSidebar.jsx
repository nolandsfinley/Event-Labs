import React from 'react';
import { SidebarCollapsible, ZoneDimensionControl, BuildingMetricControl } from './Shared';

const EditorSidebar = ({ 
    activeMode, 
    setActiveMode, 
    MODES, 
    undoDrawing, 
    redoDrawing, 
    drawings, 
    redoStack, 
    setDrawings, 
    DRAWING_COLORS, 
    drawingColor, 
    setDrawingColor, 
    drawingWidth, 
    setDrawingWidth, 
    zones, 
    activeZoneId, 
    setActiveZoneId, 
    addNewZone, 
    deleteActiveZone, 
    ZONE_COLORS, 
    activeZone, 
    SidebarCollapsible 
}) => {
    return (
        <aside className="w-[140px] sm:w-[180px] lg:w-[240px] h-full bg-[#f2f2f7]/95 backdrop-blur-md border-r border-slate-200/80 p-4 shrink-0 overflow-y-auto z-20 flex flex-col gap-6 thin-scrollbar no-print">
            <div className="grid grid-cols-2 gap-2">
                {MODES.map((m) => (
                    <button
                        key={m.id}
                        type="button"
                        onClick={() => setActiveMode(m.id)}
                        className={`py-2 px-1 text-[9px] sm:text-[10px] font-bold rounded-xl flex flex-col justify-center items-center gap-1 transition-all ${activeMode === m.id ? 'bg-white shadow-md ' + m.color : 'text-slate-500 hover:bg-white/60'}`}
                    >
                        <i className={`fa-solid ${m.icon} text-sm`}></i>
                        <span className="truncate w-full text-center">{m.label}</span>
                        <span className="text-[7px] font-black opacity-40">{m.key}</span>
                    </button>
                ))}
            </div>

            {(activeMode === 'pen' || activeMode === 'highlighter') && (
                <div className="p-4 bg-white shadow-lg shadow-indigo-100/50 rounded-2xl border border-indigo-200 space-y-4 animate-[cardFadeIn_0.3s_ease-out]">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-rose-500/10 rounded-lg flex items-center justify-center">
                                <i className={`fa-solid ${activeMode === 'pen' ? 'fa-pen-nib text-rose-500' : 'fa-highlighter text-amber-500'} text-[10px]`}></i>
                            </div>
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                                {activeMode === 'pen' ? 'หัวปากกา' : 'หัวไฮไลท์'}
                            </h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={undoDrawing}
                                disabled={drawings.length === 0}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-sm"
                                title="เลิกทำ (Cmd+Z)"
                            >
                                <i className="fa-solid fa-rotate-left text-[10px]"></i>
                            </button>
                            <button
                                onClick={redoDrawing}
                                disabled={redoStack.length === 0}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-sm"
                                title="ทำซ้ำ (Cmd+Shift+Z)"
                            >
                                <i className="fa-solid fa-rotate-right text-[10px]"></i>
                            </button>
                            <button 
                                onClick={() => { if (window.confirm('ล้างภาพวาดทั้งหมดใช่หรือไม่?')) setDrawings([]) }} 
                                className="text-[10px] font-bold text-red-500 hover:text-red-600 transition flex items-center gap-1.5 ml-1"
                            >
                                <i className="fa-solid fa-trash-can"></i> ล้าง
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">เลือกสีที่ต้องการ</p>
                        <div className="flex flex-wrap gap-2.5 px-0.5">
                            {DRAWING_COLORS.map(c => (
                                <button key={c} onClick={() => setDrawingColor(c)} className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${drawingColor === c ? 'border-slate-800 scale-110 shadow-md' : 'border-transparent shadow-sm'}`} style={{ backgroundColor: c }} />
                            ))}
                            <div className="relative group">
                                <input type="color" value={drawingColor} onChange={(e) => setDrawingColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
                                <div className="w-8 h-8 rounded-full border-2 border-slate-200 shadow-sm flex items-center justify-center bg-gradient-to-tr from-rose-400 via-emerald-400 to-blue-400 hover:scale-110 transition-transform">
                                    <i className="fa-solid fa-plus text-white text-[10px]"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 pt-1">
                        <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1">
                            <span>ความหนาเส้น</span>
                            <span className="text-slate-600">{drawingWidth} px</span>
                        </div>
                        <input type="range" min={1} max={50} value={drawingWidth} onChange={(e) => setDrawingWidth(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800" />
                    </div>

                    <div className="p-3 bg-indigo-50 border border-indigo-100/50 rounded-xl">
                        <p className="text-[9px] font-medium text-indigo-700 leading-snug">
                            <i className="fa-solid fa-info-circle mr-1 opacity-70"></i> <b>เคล็ดลับ:</b> ลากเมาส์บนพื้นหลังเพื่อวาดภาพได้อิสระ และสามารถใช้ Cmd+Z เพื่อ Undo ได้
                        </p>
                    </div>
                </div>
            )}

            <div className="space-y-2.5">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span className="flex items-center gap-1.5"><i className="fa-solid fa-grip"></i> โซน (Zones)</span>
                    <div className="flex gap-1 ml-auto shrink-0">
                        <button className="text-[#007aff] hover:bg-blue-50 w-7 h-7 flex items-center justify-center rounded border border-transparent hover:border-blue-100 transition shadow-sm bg-white" onClick={() => addNewZone('seating')} title="เพิ่มโซนที่นั่ง"><i className="fa-solid fa-chair"></i></button>
                        <button className="text-emerald-600 hover:bg-emerald-50 w-7 h-7 flex items-center justify-center rounded border border-transparent hover:border-emerald-100 transition shadow-sm bg-white" onClick={() => addNewZone('stage')} title="เพิ่มเวที"><i className="fa-solid fa-layer-group"></i></button>
                        <button className="text-amber-600 hover:bg-amber-50 w-7 h-7 flex items-center justify-center rounded border border-transparent hover:border-amber-100 transition shadow-sm bg-white" onClick={() => addNewZone('booth')} title="เพิ่มบูธ/พาร์ทิชัน"><i className="fa-solid fa-store"></i></button>
                    </div>
                </div>
                {zones.map(z => (
                    <div key={z.id} onClick={() => setActiveZoneId(z.id)} className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex justify-between items-center cursor-pointer transition ${activeZoneId === z.id ? 'bg-white border-slate-300 shadow-sm' : 'bg-[#f2f2f7] border-transparent text-slate-500 hover:bg-[#e3e3e8]'}`}>
                        <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                            <div className={`shrink-0 w-2.5 h-2.5 rounded-full ${ZONE_COLORS[z.color].bg}`} />
                            <input
                                type="text"
                                value={z.name}
                                onChange={(e) => {
                                    // Note: This logic might need to be passed as a prop function if setZones is not enough
                                    // For simplicity, we assume setZones is passed
                                    setDrawings(prev => prev); // dummy to trigger something if needed
                                }}
                                // The actual onChange is more complex in app.jsx, let's keep it simple for now or prop it
                                readOnly
                                className="bg-transparent border-none outline-none focus:ring-0 w-full font-bold text-xs p-0 text-slate-700 placeholder-slate-400"
                                placeholder={z.name}
                            />
                        </div>
                        {activeZoneId === z.id && zones.length > 1 && (
                            <i
                                className="fa-solid fa-trash-can text-red-500 p-1.5 transition-colors hover:bg-red-50 rounded-lg"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteActiveZone(true);
                                }}
                                title="ลบโซนนี้ทันที"
                            ></i>
                        )}
                    </div>
                ))}
            </div>

            {activeZone && (activeMode !== 'pen' && activeMode !== 'highlighter') && (
                <div className="space-y-3 pt-4 border-t border-slate-200/60">
                    <SidebarCollapsible title="รูปลักษณ์และข้อมูล" icon={<i className="fa-solid fa-palette text-blue-500" />}>
                        {/* More settings could go here */}
                        <div className="p-2 text-[10px] text-slate-500 font-medium">
                            Zone: {activeZone.name} ({activeZone.type})
                        </div>
                    </SidebarCollapsible>
                </div>
            )}
        </aside>
    );
};

export default EditorSidebar;
