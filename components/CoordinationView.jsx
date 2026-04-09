import React from 'react';

const CoordinationView = ({ 
    coordinationRows, 
    setCoordinationRows, 
    zones, 
    ZONE_COLORS, 
    downloadCoordinationCsv 
}) => {
    return (
        <main className="flex-1 bg-white p-4 sm:p-6 overflow-x-auto thin-scrollbar">
            <div className="min-w-[1200px] h-full flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <i className="fa-solid fa-clipboard-list text-blue-500"></i>
                            ตารางประสานงานโซน
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">ระบุผู้รับผิดชอบและสถานะแต่ละโซน (Auto-sync กับผังหลัก)</p>
                    </div>
                    <button
                        onClick={downloadCoordinationCsv}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                    >
                        <i className="fa-solid fa-file-csv"></i>
                        นำออกข้อมูล CSV
                    </button>
                </div>

                <div className="flex-1 border border-slate-200 rounded-2xl bg-slate-50/50 overflow-hidden shadow-sm flex flex-col">
                    <div className="grid grid-cols-[1.5fr_1fr_1.5fr_1.2fr_1.2fr_1.5fr_1.2fr_1.2fr_1.2fr] bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider py-4 px-4 sticky top-0">
                        <div>ชื่อโซน / รายละเอียด</div>
                        <div className="text-center">จำนวน (Objects)</div>
                        <div>หน่วยงานรับผิดชอบ</div>
                        <div>ผู้ติดต่อ / เบอร์โทร</div>
                        <div>ผู้ประสานงานหลัก</div>
                        <div>หมายเหตุ / สถานะ</div>
                        <div className="text-center">รับของ (วันที่)</div>
                        <div className="text-center">ส่งคืน (วันที่)</div>
                        <div className="text-center">การตรวจสอบ</div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {coordinationRows.map((row) => (
                            <div key={row.zoneId} className="grid grid-cols-[1.5fr_1fr_1.5fr_1.2fr_1.2fr_1.5fr_1.2fr_1.2fr_1.2fr] items-center border-b border-slate-200 bg-white hover:bg-blue-50/30 transition-colors">
                                <div className="p-3 text-xs font-bold text-slate-700 border-r border-slate-100 flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${ZONE_COLORS[zones.find(z => z.id === row.zoneId)?.color]?.bg || 'bg-blue-500'}`} />
                                    {row.zoneName}
                                </div>
                                <div className="p-3 text-center text-xs font-black text-slate-500 border-r border-slate-100">{row.objectCount}</div>
                                <div className="p-2 border-r border-slate-100">
                                    <input
                                        type="text"
                                        value={row.responsibleOrg}
                                        onChange={(e) => setCoordinationRows(prev => prev.map(r => r.zoneId === row.zoneId ? { ...r, responsibleOrg: e.target.value } : r))}
                                        className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-400 rounded p-1.5 text-xs text-slate-800 outline-none hover:bg-slate-50"
                                        placeholder="หน่วยงาน..."
                                    />
                                </div>
                                <div className="p-2 border-r border-slate-100">
                                    <input
                                        type="text"
                                        value={row.contactAtOrg}
                                        onChange={(e) => setCoordinationRows(prev => prev.map(r => r.zoneId === row.zoneId ? { ...r, contactAtOrg: e.target.value } : r))}
                                        className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-400 rounded p-1.5 text-xs text-slate-800 outline-none hover:bg-slate-50"
                                        placeholder="ชื่อ / เบอร์..."
                                    />
                                </div>
                                <div className="p-2 border-r border-slate-100">
                                    <input
                                        type="text"
                                        value={row.coordinator}
                                        onChange={(e) => setCoordinationRows(prev => prev.map(r => r.zoneId === row.zoneId ? { ...r, coordinator: e.target.value } : r))}
                                        className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-400 rounded p-1.5 text-xs text-slate-800 outline-none hover:bg-slate-50"
                                        placeholder="ผู้รับงาน..."
                                    />
                                </div>
                                <div className="p-2 border-r border-slate-100">
                                    <textarea
                                        rows={1}
                                        value={row.notes}
                                        onChange={(e) => setCoordinationRows(prev => prev.map(r => r.zoneId === row.zoneId ? { ...r, notes: e.target.value } : r))}
                                        className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-400 rounded p-1.5 text-xs text-slate-800 outline-none hover:bg-slate-50 resize-none h-auto min-h-[30px]"
                                        placeholder="เน้นย้ำ / สถานะ..."
                                    />
                                </div>
                                <div className="p-2 border-r border-slate-100">
                                    <input
                                        type="text"
                                        value={row.pickupDate}
                                        onChange={(e) => setCoordinationRows(prev => prev.map(r => r.zoneId === row.zoneId ? { ...r, pickupDate: e.target.value } : r))}
                                        className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-400 rounded p-1.5 text-center text-[10px] text-slate-600 outline-none hover:bg-slate-50"
                                        placeholder="DD/MM/YY"
                                    />
                                </div>
                                <div className="p-2 border-r border-slate-100">
                                    <input
                                        type="text"
                                        value={row.returnDate}
                                        onChange={(e) => setCoordinationRows(prev => prev.map(r => r.zoneId === row.zoneId ? { ...r, returnDate: e.target.value } : r))}
                                        className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-400 rounded p-1.5 text-center text-[10px] text-slate-600 outline-none hover:bg-slate-50"
                                        placeholder="DD/MM/YY"
                                    />
                                </div>
                                <div className="p-2">
                                    <select
                                        value={row.checklistDone}
                                        onChange={(e) => setCoordinationRows(prev => prev.map(r => r.zoneId === row.zoneId ? { ...r, checklistDone: e.target.value } : r))}
                                        className={`w-full bg-transparent border-0 rounded p-1 text-[10px] font-bold outline-none cursor-pointer hover:bg-slate-50 ${row.checklistDone === 'ok' ? 'text-emerald-600' : row.checklistDone === 'pending' ? 'text-amber-500' : 'text-rose-500'}`}
                                    >
                                        <option value="">(ตรวจสอบ)</option>
                                        <option value="ok">✅ เรียบร้อย</option>
                                        <option value="pending">⏳ รอดำเนินการ</option>
                                        <option value="fail">❌ พบปัญหา</option>
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default CoordinationView;
