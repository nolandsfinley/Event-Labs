import React from 'react';

const UpgradeModalUI = ({ onUpgrade, onClose, paymentStatus }) => {
    if (paymentStatus === 'checking' || paymentStatus === 'success') {
        return (
            <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"></div>
                <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-md p-10 text-center animate-fade-in border border-white/20">
                    {paymentStatus === 'checking' ? (
                        <div className="space-y-8 py-4">
                            <div className="relative w-24 h-24 mx-auto">
                                <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <i className="fa-solid fa-hourglass-half text-blue-600 text-3xl animate-pulse"></i>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2">กำลังตรวจสอบยอดเงินโอน</h3>
                                <p className="text-slate-500 font-bold">กรุณารอสักครู่ ระบบกำลังสื่อสารกับธนาคาร...</p>
                            </div>
                            <div className="space-y-3 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                <div className="flex justify-between text-xs font-bold text-slate-400">
                                    <span>TRANSACTION ID</span>
                                    <span>STAT-2024-X99</span>
                                </div>
                                <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 w-1/2 animate-progress-flow"></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 py-4">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto ring-8 ring-green-50">
                                <i className="fa-solid fa-check text-green-600 text-4xl animate-bounce-short"></i>
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-slate-900">ปลดล็อกสำเร็จ!</h3>
                                <p className="text-slate-500 font-bold mt-2">ขอบคุณที่ร่วมเป็นส่วนหนึ่งของ Eflow Pro</p>
                            </div>
                            <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between">
                                <span className="text-sm font-bold opacity-80">Plan Active</span>
                                <span className="text-xs font-black px-3 py-1 bg-white/10 rounded-full">Lifetime Access</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-1 animate-[cardFadeIn_0.3s_ease-out] overflow-hidden">
                <div className="bg-gradient-to-br from-indigo-700 via-blue-700 to-blue-800 p-8 text-white relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white/80 transition shadow-inner">
                        <i className="fa-solid fa-xmark"></i>
                    </button>

                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400 text-amber-950 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-amber-300 shadow-lg shadow-amber-400/20">
                        <i className="fa-solid fa-crown"></i> Premium Access
                    </div>
                    <h2 className="text-4xl font-black tracking-tight mb-2 leading-none">Upgrade to <span className="opacity-90">Eflow Pro</span></h2>
                    <p className="text-blue-100/80 font-medium text-sm">ปลดล็อกขีดจำกัดสูงสุดของการจัดวางแผนผังอีเวนต์</p>
                </div>

                <div className="p-8 space-y-8">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 ring-1 ring-slate-100 shadow-sm">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monthly Plan</p>
                            <h3 className="text-3xl font-black text-slate-900 leading-none">฿299<span className="text-sm font-bold text-slate-300">/mo</span></h3>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full border border-blue-100">Recommended</span>
                        </div>
                    </div>

                    <ul className="space-y-4">
                        {[
                            { icon: "fa-infinity", title: "สร้างโปรเจกต์ได้ไม่จำกัด", desc: "จากเดิมจำกัดเพียง 2 โปรเจกต์" },
                            { icon: "fa-cloud-arrow-up", title: "Cloud Real-time Sync", desc: "บันทึกข้อมูลและแก้ไขงานได้ทุกเครื่อง" },
                            { icon: "fa-file-export", title: "ส่งออกไฟล์ความละเอียดสูง", desc: "พิมพ์และนำออกเป็น PDF พื้นที่ขนาดใหญ่" },
                            { icon: "fa-rocket", title: "เครื่องมือ Advanced 3D Assets", desc: "เตรียมพบกับโมเดล 3D และของตกแต่งใหม่ๆ" }
                        ].map((item, idx) => (
                            <li key={idx} className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100 text-blue-600">
                                    <i className={`fa-solid ${item.icon} text-xs`}></i>
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-800 leading-snug">{item.title}</p>
                                    <p className="text-[11px] text-slate-500 font-bold">{item.desc}</p>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <button
                        onClick={onUpgrade}
                        className="w-full py-4 bg-slate-900 border-b-4 border-slate-950 text-white rounded-2xl font-black tracking-tight hover:bg-slate-800 active:translate-y-0.5 active:border-b-0 transition-all flex items-center justify-center gap-3 shadow-xl"
                    >
                        <i className="fa-solid fa-credit-card"></i>
                        ยืนยันการชำระเงิน
                    </button>

                    <p className="text-center text-[10px] text-slate-400 font-bold flex items-center justify-center gap-2">
                        <i className="fa-solid fa-shield-halved"></i>
                        การชำระเงินปลอดภัย 100% · ยกเลิกได้ตลอดเวลา
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UpgradeModalUI;
