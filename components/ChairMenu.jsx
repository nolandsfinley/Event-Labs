import React from 'react';

const ChairMenu = ({ chairMenu, zones, chairLabelFromKey, restoreChairAtMenu, openRenameFromChairMenu, hideChairAtMenu, chairImages, onChairImageSelected, setChairMenu }) => {
    if (!chairMenu) return null;
    
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[205] no-print p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">ตำแหน่ง {chairLabelFromKey(chairMenu.chairKey)}</h2>
                    <p className="text-sm text-slate-500 mt-1">{zones.find((z) => z.id === chairMenu.zoneId)?.name}</p>
                </div>
                {chairMenu.isHidden ? (
                    <button type="button" onClick={restoreChairAtMenu} className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700">
                        คืนที่นั่ง (กู้คืน object)
                    </button>
                ) : (
                    <div className="space-y-2">
                        <button type="button" onClick={openRenameFromChairMenu} className="w-full py-3 rounded-xl bg-[#007aff] text-white font-bold hover:bg-[#005bb5]">
                            เปลี่ยนชื่อ / ชื่อแขก
                        </button>
                        <button type="button" onClick={hideChairAtMenu} className="w-full py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600">
                            ซ่อนที่นั่ง (ลบชั่วคราว)
                        </button>
                        <label className="block w-full py-3 rounded-xl bg-slate-100 text-slate-900 font-bold text-center cursor-pointer hover:bg-slate-200">
                            {chairImages[chairMenu.zoneId]?.[chairMenu.chairKey] ? "เปลี่ยนรูปประกอบ" : "เพิ่มรูปภาพประกอบ"}
                            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onChairImageSelected} />
                        </label>
                        {chairImages[chairMenu.zoneId]?.[chairMenu.chairKey] ? (
                            <div className="rounded-xl border border-slate-200 overflow-hidden max-h-40">
                                <img src={chairImages[chairMenu.zoneId][chairMenu.chairKey]} alt="preview" className="w-full object-contain max-h-40 bg-slate-50" />
                            </div>
                        ) : null}
                    </div>
                )}
                <button type="button" onClick={() => setChairMenu(null)} className="w-full py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl">
                    ปิด
                </button>
            </div>
        </div>
    );
};

export default ChairMenu;
