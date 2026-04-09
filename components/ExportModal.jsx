import React from 'react';

const ExportModal = ({ 
    showExportModal, 
    closeExportModal, 
    exportMode, 
    setExportMode, 
    handleExportPDF 
}) => {
    if (!showExportModal) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4 no-print">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">🎨 นำออก PDF</h2>
                    <button type="button" onClick={closeExportModal} className="text-slate-400 hover:text-slate-600 text-xl">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div className="space-y-3 mb-6">
                    <label className="flex items-center p-3 border-2 border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition" onClick={() => setExportMode('all')}>
                        <input 
                            type="radio" 
                            name="exportMode" 
                            checked={exportMode === 'all'} 
                            onChange={() => setExportMode('all')} 
                            className="w-4 h-4" 
                        />
                        <div className="ml-3">
                            <div className="font-medium text-sm">📄 ทั้งหน้ากระดาษ</div>
                            <div className="text-[10px] text-slate-500">บันทึกทั้ง Layout ตามที่เห็นในจอ</div>
                        </div>
                    </label>

                    <label className="flex items-center p-3 border-2 border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition" onClick={() => setExportMode('zones')}>
                        <input 
                            type="radio" 
                            name="exportMode" 
                            checked={exportMode === 'zones'} 
                            onChange={() => setExportMode('zones')} 
                            className="w-4 h-4" 
                        />
                        <div className="ml-3">
                            <div className="font-medium text-sm">🧩 แยกตามโซน</div>
                            <div className="text-[10px] text-slate-500">บันทึกแยกหน้าอัตโนมัติ (1 โซนต่อ 1 หน้า)</div>
                        </div>
                    </label>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={closeExportModal} 
                        className="flex-1 py-2.5 rounded-lg border border-slate-200 font-bold text-sm text-slate-600 hover:bg-slate-50"
                    >
                        ยกเลิก
                    </button>
                    <button 
                        onClick={handleExportPDF} 
                        className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200"
                    >
                        เริ่มการนำออก
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
