import React from 'react';

const TemplateModal = ({ showTemplateModal, setShowTemplateModal, handleSelectTemplate }) => {
    if (!showTemplateModal) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowTemplateModal(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-8 flex flex-col max-h-[90vh] animate-[cardFadeIn_0.2s_ease-out]">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">เลือกเทมเพลตเริ่มต้น</h2>
                        <p className="text-sm text-slate-500 mt-1">เริ่มต้นโปรเจกต์ของคุณด้วยโครงสร้างที่เตรียมไว้ให้ หรือสร้างใหม่ตั้งแต่ต้น</p>
                    </div>
                    <button onClick={() => setShowTemplateModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-4 h-[65vh] scrollbar-hide">
                    {/* Basic Templates */}
                    <div className="col-span-full border-b border-slate-100 pb-2 mb-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">เทมเพลตพื้นฐาน</p>
                    </div>
                    
                    <div onClick={() => handleSelectTemplate('blank')} className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 rounded-xl p-5 cursor-pointer flex flex-col items-center justify-center text-center transition-all h-[180px] group">
                        <i className="fa-solid fa-plus text-3xl text-slate-400 group-hover:text-blue-500 mb-3 transition-colors"></i>
                        <h3 className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">ผังเปล่า (Blank Canvas)</h3>
                        <p className="text-xs text-slate-500 mt-1">เริ่มจากพื้นที่ว่างเปล่า</p>
                    </div>

                    <div onClick={() => handleSelectTemplate('concert')} className="border border-slate-200 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 rounded-xl p-5 cursor-pointer flex flex-col items-center text-center transition-all h-[180px] bg-gradient-to-b from-white to-slate-50 group relative overflow-hidden">
                        <div className="absolute top-0 w-full h-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <i className="fa-solid fa-guitar text-3xl text-indigo-500 mb-3"></i>
                        <h3 className="font-bold text-slate-700 leading-snug">งานคอนเสิร์ต / แสดงสด</h3>
                        <p className="text-xs text-slate-500 mt-1 px-2">เวทีใหญ่ และเก้าอี้ VIP</p>
                    </div>

                    <div onClick={() => handleSelectTemplate('gala')} className="border border-slate-200 hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/10 rounded-xl p-5 cursor-pointer flex flex-col items-center text-center transition-all h-[180px] bg-gradient-to-b from-white to-slate-50 group relative overflow-hidden">
                        <div className="absolute top-0 w-full h-1 bg-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <i className="fa-solid fa-glass-cheers text-3xl text-rose-500 mb-3"></i>
                        <h3 className="font-bold text-slate-700 leading-snug">งานจัดเลี้ยง (Gala)</h3>
                        <p className="text-xs text-slate-500 mt-1 px-2">เวทีพิธีกร และผังที่นั่งกว้าง</p>
                    </div>

                    <div onClick={() => handleSelectTemplate('expo')} className="border border-slate-200 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 rounded-xl p-5 cursor-pointer flex flex-col items-center text-center transition-all h-[180px] bg-gradient-to-b from-white to-slate-50 group relative overflow-hidden">
                        <div className="absolute top-0 w-full h-1 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <i className="fa-solid fa-store text-3xl text-emerald-500 mb-3"></i>
                        <h3 className="font-bold text-slate-700 leading-snug">งานแสดงสินค้า (Expo)</h3>
                        <p className="text-xs text-slate-500 mt-1 px-2">บล็อกแบ่งตัวบูธมาตรฐาน</p>
                    </div>

                    <div onClick={() => handleSelectTemplate('merit')} className="border border-slate-200 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/10 rounded-xl p-5 cursor-pointer flex flex-col items-center text-center transition-all h-[180px] bg-gradient-to-b from-white to-amber-50/30 group relative overflow-hidden">
                        <div className="absolute top-0 w-full h-1 bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <i className="fa-solid fa-hands-praying text-3xl text-amber-500 mb-3"></i>
                        <h3 className="font-bold text-slate-700 leading-snug">งานบุญ / พิธีสงฆ์</h3>
                        <p className="text-xs text-slate-500 mt-1 px-2">อาสนะสงฆ์ และโซนแขก</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemplateModal;
