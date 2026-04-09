import React from 'react';

const EditorCanvas = ({
    workspaceRef,
    drawingOverlayRef,
    canvasRef,
    zoom,
    pan,
    activeMode,
    isSelectingArea,
    dragContext,
    exportArea,
    paperConfig,
    PAPER_SIZES,
    UNIT_SCALE,
    buildingProfile,
    stats,
    measuringPoints,
    tapeSpacing,
    tapeCount,
    zones,
    activeZoneId,
    setActiveZoneId,
    ZONE_COLORS,
    handleChairClick,
    guestNames,
    chairImages,
    renderSmartGuides,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    handleGestureChange,
    handleExportAreaStart,
    handleExportAreaMove,
    handleExportAreaEnd,
    zoomReset,
    targetZoomRef,
    smoothZoomTo,
    getBounds
}) => {
    return (
        <main
            ref={workspaceRef}
            className={`flex-1 relative overflow-hidden bg-white select-none z-0 ${isSelectingArea ? 'cursor-crosshair' :
                activeMode === 'pen' ? 'cursor-[url(https://img.icons8.com/material-rounded/24/000000/pen-range.png)_0_24,_auto]' :
                    activeMode === 'highlighter' ? 'cursor-[url(https://img.icons8.com/material-rounded/24/000000/highlighter.png)_0_24,_auto]' :
                        dragContext ? 'cursor-grabbing' : 'cursor-grab'
                }`}
            onPointerDown={(e) => {
                if (isSelectingArea) {
                    handleExportAreaStart(e);
                } else {
                    handlePointerDown(e);
                }
            }}
            onPointerMove={(e) => {
                if (isSelectingArea) {
                    handleExportAreaMove(e);
                } else {
                    handlePointerMove(e);
                }
            }}
            onPointerUp={(e) => {
                if (isSelectingArea) {
                    handleExportAreaEnd(e);
                } else {
                    handlePointerUp(e);
                }
            }}
            onPointerLeave={(e) => {
                if (isSelectingArea) return;
                handlePointerUp(e);
            }}
            onWheel={!isSelectingArea ? handleWheel : undefined}
            onGestureChange={!isSelectingArea ? handleGestureChange : undefined}
        >
            {/* CSS for Print Optimization */}
            <style>{`
            @media print {
                @page { size: landscape; margin: 0; }
                .no-print, aside, header, footer, .no-pan { display: none !important; }
                body, html { overflow: visible !important; height: auto !important; }
                main { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; height: 100% !important; background: white !important; overflow: visible !important; }
                .freeform-dot-grid { display: none !important; }
                .drawing-canvas { opacity: 1 !important; z-index: 20 !important; }
                ${exportArea ? `
                    .workspace-container {
                        transform: translate(${-exportArea.x}px, ${-exportArea.y}px) !important;
                        width: ${exportArea.width}px !important;
                        height: ${exportArea.height}px !important;
                        clip-path: rect(0 ${exportArea.width}px ${exportArea.height}px 0) !important;
                    }
                ` : ''}
            }
        `}</style>
            
            {/* Drawing Overlay */}
            <div
                ref={drawingOverlayRef}
                className="absolute inset-0 z-[25] no-print"
                style={{
                    pointerEvents: (activeMode === 'pen' || activeMode === 'highlighter') ? 'auto' : 'none',
                    cursor: 'crosshair',
                    touchAction: 'none'
                }}
            />

            <div className="absolute inset-0 freeform-dot-grid pointer-events-none" style={{
                backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
                backgroundPosition: `${pan.x}px ${pan.y}px`,
                opacity: 0.4,
                backgroundImage: `radial-gradient(circle, #cbd5e1 ${1.2 * zoom}px, transparent 0)`
            }} />

            {paperConfig.type !== 'infinite' && (() => {
                const scaleFactor = paperConfig.unit === 'mm' ? (UNIT_SCALE / 10) : 1;
                const pWidth = paperConfig.width * scaleFactor;
                const pHeight = paperConfig.height * scaleFactor;
                return (
                    <div
                        className="absolute bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] pointer-events-none z-0 transition-all duration-300"
                        style={{ left: 0, top: 0, width: pWidth, height: pHeight, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}
                    >
                        <div className="absolute inset-0 border border-slate-200" />
                        <div className="absolute -top-6 left-0 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <i className="fa-solid fa-file-lines"></i>
                            {PAPER_SIZES[paperConfig.type]?.name || 'Custom'} ({paperConfig.width}x{paperConfig.height} {paperConfig.unit})
                        </div>
                    </div>
                );
            })()}

            {isSelectingArea && exportArea && (
                <div className="fixed pointer-events-none z-50 border-2 border-dashed border-blue-500 bg-blue-500/10 shadow-md" style={{ left: `${exportArea.x}px`, top: `${exportArea.y}px`, width: `${exportArea.width}px`, height: `${exportArea.height}px` }}>
                    <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-br font-bold">
                        {Math.round(exportArea.width)} × {Math.round(exportArea.height)} px
                    </div>
                </div>
            )}

            <div className="no-pan fixed bottom-6 right-6 flex items-center bg-white/95 backdrop-blur-2xl rounded-2xl shadow-lg shadow-black/5 border border-slate-200/50 p-1.5 gap-0.5 z-50 no-print">
                <button onClick={() => { targetZoomRef.current = Math.max(zoom - 0.1, 0.15); smoothZoomTo(targetZoomRef.current, window.innerWidth / 2, window.innerHeight / 2); }} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-all text-slate-500 hover:text-slate-700 active:scale-90 text-xs"><i className="fa-solid fa-minus"></i></button>
                <button onClick={zoomReset} className="w-14 text-center text-[11px] font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg py-1 transition-all cursor-pointer">{Math.round(zoom * 100)}%</button>
                <button onClick={() => { targetZoomRef.current = Math.min(zoom + 0.1, 3); smoothZoomTo(targetZoomRef.current, window.innerWidth / 2, window.innerHeight / 2); }} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-all text-slate-500 hover:text-slate-700 active:scale-90 text-xs"><i className="fa-solid fa-plus"></i></button>
            </div>

            <div className="no-pan fixed top-20 left-[50%] -translate-x-1/2 flex items-center bg-white/90 backdrop-blur-xl rounded-full shadow-lg border border-slate-200/60 px-4 py-2 z-50 no-print pointer-events-none">
                {isSelectingArea ? (
                    <span className="text-xs font-bold text-blue-600 flex items-center gap-2"><i className="fa-solid fa-crosshairs"></i> ลากเพื่อเลือกพื้นที่ export · กด Esc ยกเลิก</span>
                ) : activeMode === 'edit_chair' ? (
                    <span className="text-xs font-bold text-[#007aff] flex items-center gap-2"><i className="fa-solid fa-eraser"></i> คลิก object เมนูจัดการ · ลากสลับตำแหน่ง · คีย์ลัด <kbd className="px-1 bg-white/80 rounded text-[10px]">R</kbd></span>
                ) : (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-2"><i className="fa-solid fa-arrows-up-down-left-right"></i> ลากป้ายชื่อโซนเพื่อย้าย · คีย์ลัด <kbd className="px-1 bg-white/80 rounded text-[10px]">M</kbd></span>
                )}
            </div>

            <div className="absolute transform-gpu origin-top-left" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transition: dragContext ? 'none' : 'transform 0.1s ease-out' }}>
                {buildingProfile.widthM > 0 && buildingProfile.lengthM > 0 && (() => {
                    const bWidthPx = buildingProfile.widthM * 100 * (UNIT_SCALE / 2);
                    const bLengthPx = buildingProfile.lengthM * 100 * (UNIT_SCALE / 2);
                    const buildingGap = 60;
                    return Array.from({ length: buildingProfile.buildingCount || 1 }).map((_, bi) => {
                        const offsetX = bi * (bWidthPx + buildingGap);
                        return (
                            <div key={`bldg-${bi}`} className="absolute pointer-events-none z-[1]" style={{ left: offsetX, top: 0, width: bWidthPx, height: bLengthPx }}>
                                <div className="absolute inset-0 border-2 border-dashed border-amber-400/60 rounded-md" />
                                <div className="absolute inset-0 bg-amber-50/15 rounded-md" />
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-amber-100/90 backdrop-blur-sm border border-amber-300/80 rounded-full px-3 py-0.5 shadow-sm whitespace-nowrap">
                                    <i className="fa-solid fa-building text-amber-600 text-[8px]" />
                                    <span className="text-[9px] font-bold text-amber-700">{buildingProfile.buildingCount > 1 ? `อาคาร ${bi + 1}` : 'อาคาร'}</span>
                                </div>
                            </div>
                        );
                    });
                })()}

                {stats.globalWidth > 0 && stats.globalHeight > 0 && (
                    <div className="absolute pointer-events-none opacity-40 z-0" style={{ left: stats.globalMinX * (UNIT_SCALE / 2), top: stats.globalMinY * (UNIT_SCALE / 2), width: stats.globalWidth * (UNIT_SCALE / 2), height: stats.globalHeight * (UNIT_SCALE / 2) }}>
                        <div className="absolute -top-10 left-0 right-0 h-px bg-slate-500 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-slate-500 rounded-full absolute left-0" /><div className="w-1.5 h-1.5 bg-slate-500 rounded-full absolute right-0" /><span className="bg-[#f2f2f7] px-2 text-[10px] font-bold text-slate-600">กว้าง {stats.totalWidthM} ม.</span></div>
                        <div className="absolute -left-10 top-0 bottom-0 w-px bg-slate-500 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-slate-500 rounded-full absolute top-0" /><div className="w-1.5 h-1.5 bg-slate-500 rounded-full absolute bottom-0" /><span className="bg-[#f2f2f7] px-2 py-0.5 text-[10px] font-bold text-slate-600 origin-center -rotate-90 whitespace-nowrap">ยาว {stats.totalHeightM} ม.</span></div>
                    </div>
                )}

                {renderSmartGuides()}

                <canvas ref={canvasRef} className="absolute pointer-events-none z-[15]" style={{ left: 0, top: 0, width: '10000px', height: '10000px', imageRendering: 'pixelated' }} />

                {/* Tape Measure Overlay */}
                {measuringPoints && (
                    <div className="absolute pointer-events-none z-[40]" style={{ left: 0, top: 0 }}>
                        <svg width="10000" height="10000" style={{ pointerEvents: 'none' }}>
                            <defs>
                                <filter id="glow">
                                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* Main Ruler Line */}
                            <line
                                x1={measuringPoints.start.x * (UNIT_SCALE / 2)}
                                y1={measuringPoints.start.y * (UNIT_SCALE / 2)}
                                x2={measuringPoints.end.x * (UNIT_SCALE / 2)}
                                y2={measuringPoints.end.y * (UNIT_SCALE / 2)}
                                stroke="#4f46e5" strokeWidth="2" strokeDasharray="5,3" filter="url(#glow)"
                            />

                            {/* Distance Calculations */}
                            {(() => {
                                const dx = measuringPoints.end.x - measuringPoints.start.x;
                                const dy = measuringPoints.end.y - measuringPoints.start.y;
                                const distCm = Math.sqrt(dx * dx + dy * dy);
                                const distM = distCm / 100;

                                // Marks calculation
                                const angle = Math.atan2(dy, dx);
                                const marks = [];
                                for (let i = 0; i <= distCm; i += 10) {
                                    const isLarge = i % 100 === 0;
                                    const markLen = isLarge ? 12 : 6;
                                    const mx = measuringPoints.start.x + (i * Math.cos(angle));
                                    const my = measuringPoints.start.y + (i * Math.sin(angle));
                                    const px = mx * (UNIT_SCALE / 2);
                                    const py = my * (UNIT_SCALE / 2);

                                    const ox = Math.cos(angle + Math.PI / 2) * markLen;
                                    const oy = Math.sin(angle + Math.PI / 2) * markLen;

                                    marks.push(
                                        <g key={i}>
                                            <line
                                                x1={px - ox / 2} y1={py - oy / 2} x2={px + ox / 2} y2={py + oy / 2}
                                                stroke={isLarge ? '#4f46e5' : '#818cf8'} strokeWidth={isLarge ? 2 : 1}
                                            />
                                            {isLarge && i > 0 && i < distCm && (
                                                <text x={px + ox} y={py + oy} fill="#4f46e5" fontSize="10" fontWeight="bold" textAnchor="middle" transform={`rotate(${(angle * 180 / Math.PI) + 90}, ${px + ox}, ${py + oy})`}>
                                                    {i / 100}m
                                                </text>
                                            )}
                                        </g>
                                    );
                                }

                                // Spacing Markers
                                const spacingMarkers = [];
                                if (tapeSpacing > 0 && tapeCount > 1) {
                                    for (let i = 1; i < tapeCount; i++) {
                                        const sDist = i * tapeSpacing;
                                        if (sDist > distCm) break;
                                        const sx = measuringPoints.start.x + (sDist * Math.cos(angle));
                                        const sy = measuringPoints.start.y + (sDist * Math.sin(angle));
                                        const spx = sx * (UNIT_SCALE / 2);
                                        const spy = sy * (UNIT_SCALE / 2);
                                        spacingMarkers.push(
                                            <g key={`spacing-${i}`}>
                                                <circle cx={spx} cy={spy} r="4" fill="#fbbf24" stroke="white" strokeWidth="1" opacity="0.8" />
                                                <rect x={spx - 10} y={spy - 10} width="20" height="20" rx="3" fill="#fbbf24" opacity="0.3" stroke="#fbbf24" strokeWidth="1" />
                                                <text x={spx} y={spy + 20} fill="#d97706" fontSize="8" fontWeight="black" textAnchor="middle">#{i + 1} ({sDist / 100}m)</text>
                                            </g>
                                        );
                                    }
                                }

                                return (
                                    <>
                                        {marks}
                                        {spacingMarkers}
                                        <g transform={`translate(${measuringPoints.end.x * (UNIT_SCALE / 2) + 15}, ${measuringPoints.end.y * (UNIT_SCALE / 2)})`}>
                                            <rect x="0" y="-12" width="65" height="24" rx="12" fill="#4f46e5" />
                                            <text x="32" y="4" fill="white" fontSize="11" fontWeight="black" textAnchor="middle">
                                                {distM.toFixed(2)} m
                                            </text>
                                        </g>
                                    </>
                                );
                            })()}
                        </svg>
                    </div>
                )}

                {zones.map(zone => {
                    if (!zone) return null;
                    const b = getBounds(zone);
                    const isZoneActive = activeZoneId === zone.id;
                    if (b.width <= 0 && b.height <= 0 && !isZoneActive) return null;
                    const isDraggingThis = dragContext?.zoneId === zone.id;
                    const cInfo = ZONE_COLORS[zone.color] || ZONE_COLORS.blue;
                    const zoneRotation = zone.rotation || 0;
                    const customBackground = zone.gradient || zone.customColor || null;

                    return (
                        <div key={zone.id} className={`absolute transition-all ${isDraggingThis ? 'duration-0 z-10' : 'duration-200 z-10'} ${isZoneActive ? `ring-4 ring-offset-8 ${cInfo.ring}/20 rounded` : ''}`} style={{ left: (zone.x || 0) * (UNIT_SCALE / 2), top: (zone.y || 0) * (UNIT_SCALE / 2), width: Math.max(10, b.width) * (UNIT_SCALE / 2), height: Math.max(10, b.height) * (UNIT_SCALE / 2), transform: `rotate(${zoneRotation}deg)`, transformOrigin: 'center center' }}>
                            <div data-zone-id={zone.id} className={`zone-draggable absolute -top-8 left-0 px-3 py-1 rounded shadow-sm text-[9px] font-bold whitespace-nowrap cursor-grab active:cursor-grabbing flex items-center gap-1 ${isZoneActive ? (customBackground ? 'bg-slate-800 text-white' : `${cInfo.bg} text-white`) : 'bg-white/90 text-slate-600 border border-slate-200 hover:border-slate-400'}`} style={{ transform: `rotate(${-zoneRotation}deg)`, transformOrigin: 'left center' }}>
                                <i className="fa-solid fa-arrows-up-down-left-right opacity-70 pointer-events-none"></i> <span className="pointer-events-none">{zone.name || 'โซนไม่มีชื่อ'}</span>
                            </div>

                            {zone.type === 'stage' || zone.type === 'booth' ? (
                                <div className={`w-full h-full relative border-4 border-black/20 shadow-inner flex flex-col items-center justify-center overflow-hidden ${zone.type === 'stage' ? 'rounded-md' : 'rounded-sm'} ${!customBackground ? cInfo.bg : ''}`} style={{ background: customBackground, backgroundImage: zone.image ? `url(${zone.image})` : (customBackground || undefined), backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                    {!zone.image && (
                                        <>
                                            <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMSIvPjxwYXRoIGQ9Ik0wIDRMMCAwTDEgME0wIDRaIiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAuMiIvPjwvc3ZnPg==')]"></div>
                                            <span className="text-white/60 font-black text-sm tracking-widest uppercase pointer-events-none drop-shadow-md mix-blend-overlay">{zone.name || (zone.type === 'stage' ? 'STAGE' : 'BOOTH')}</span>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="relative w-full h-full">
                                    {Array.from({ length: zone.rows || 0 }).map((_, ri) => (
                                        <div key={ri} className="flex pointer-events-none" style={{ marginBottom: ri === (zone.rows - 1) ? 0 : (zone.spacingY || 0) * (UNIT_SCALE / 2) }}>
                                            {Array.from({ length: zone.columns || 0 }).map((_, ci) => {
                                                const chairKey = `${ri}-${ci}`;
                                                const isH = zone.hiddenChairs?.includes(chairKey);
                                                const guestName = guestNames?.[zone.id]?.[chairKey] || '';
                                                const chairImg = chairImages?.[zone.id]?.[chairKey];
                                                return (
                                                    <div key={ci} onClick={(e) => { e.stopPropagation(); setActiveZoneId(zone.id); handleChairClick(zone.id, ri, ci); }} className={`chair-element relative flex-shrink-0 border-2 rounded-[6px] transition-all pointer-events-auto ${activeMode === 'edit_chair' ? 'cursor-grab active:cursor-grabbing' : ''} ${isH ? 'opacity-10 bg-transparent border-dashed border-slate-300' : `bg-white shadow-sm ${isZoneActive ? cInfo.border : 'border-slate-300'} hover:border-slate-800`}`} style={{ width: (zone.chairWidth || 0) * (UNIT_SCALE / 2), height: (zone.chairHeight || 0) * (UNIT_SCALE / 2), marginRight: ci === (zone.columns - 1) ? 0 : (zone.spacingX || 0) * (UNIT_SCALE / 2) }}>
                                                        {!isH && (
                                                            <div className="relative flex flex-col items-center justify-center h-full w-full text-center px-0.5 overflow-hidden rounded-[4px]">
                                                                {chairImg && <img src={chairImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" />}
                                                                <div className="relative z-[1] flex flex-col items-center justify-center w-full h-full">
                                                                    {guestName ? (
                                                                        <span className="text-[4px] font-bold text-slate-800 leading-tight truncate">{guestName}</span>
                                                                    ) : (
                                                                        <span className="text-[5px] font-medium text-slate-600">{String.fromCharCode(65 + ri)}{ci + 1}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </main>
    );
};

export default EditorCanvas;
