import React, { useState, useEffect } from 'react';

const getKey = (pid) => `eflow_sop_${pid || 'global'}`;
const load = (pid) => { try { return JSON.parse(localStorage.getItem(getKey(pid)) || 'null') || defaultSOPs(); } catch { return defaultSOPs(); } };
const save = (d, pid) => localStorage.setItem(getKey(pid), JSON.stringify(d));

function defaultSOPs() {
    return [
        {
            id: 'fire', icon: '🔥', title: 'เหตุเพลิงไหม้', color: 'bg-red-50 border-red-200', badge: 'bg-red-500',
            steps: ['แจ้งเตือนผ่านไมโครโฟน: "ขอให้ผู้เข้าร่วมทุกท่านอพยพออกจากอาคารทันที"','ติดต่อทีมความปลอดภัยและแจ้งตำแหน่งจุดไฟ','โทรแจ้ง 199 (ดับเพลิง) ทันที','นำผู้เข้าร่วมไปยังจุดรวมพลที่กำหนดไว้','ห้ามใช้ลิฟต์ ใช้บันไดหนีไฟเท่านั้น','ตรวจสอบ headcount และรายงานสถานการณ์']
        },
        {
            id: 'medical', icon: '🚑', title: 'ผู้เข้าร่วมหมดสติ / บาดเจ็บ', color: 'bg-rose-50 border-rose-200', badge: 'bg-rose-500',
            steps: ['โทรแจ้งทีมการแพทย์ประจำงานทันที','โทร 1669 (EMS) ถ้าอาการรุนแรง','ให้ผู้เข้าร่วมรอบข้าง เว้นพื้นที่ออก','อย่าย้ายผู้บาดเจ็บถ้าไม่แน่ใจ (กระดูกหัก/คอ)','ออกอากาศขอแพทย์หรือพยาบาลในงานช่วย','บันทึกเวลาและชื่อผู้บาดเจ็บสำหรับรายงาน']
        },
        {
            id: 'power', icon: '⚡', title: 'ไฟฟ้าดับ', color: 'bg-amber-50 border-amber-200', badge: 'bg-amber-500',
            steps: ['แจ้ง MC ให้หยุดการดำเนินรายการชั่วคราว','ติดต่อทีมเทคนิค/AV ทันที','ติดต่อผู้จัดการสถานที่เพื่อหาสาเหตุ','แจ้งผู้เข้าร่วมให้รอสักครู่ผ่านไมโครโฟน (ถ้า mic ยังใช้ได้)','เปิดไฟฉุกเฉินหรือไฟโทรศัพท์ระหว่างรอ','ประเมินว่าจะรอซ่อมหรือปรับแผนงาน']
        },
        {
            id: 'speaker', icon: '🎤', title: 'วิทยากร/แขกรับเชิญมาไม่ทัน', color: 'bg-purple-50 border-purple-200', badge: 'bg-purple-500',
            steps: ['โทรหาวิทยากรทันที เช็กสถานการณ์','ติดต่อ MC แจ้งว่าต้องยืดช่วง Break หรือ Q&A','เตรียม backup content: VDO, สไลด์เก่า, หรือ panel discussion','แจ้งผู้เข้าร่วมอย่างนุ่มนวล: "เราจะขยายเวลาพักเล็กน้อย"','ถ้าวิทยากรมาไม่ได้เลย แจ้งผู้จัดพิจารณา skip หรือ reschedule session','บันทึก incident สำหรับ Post-Event Debrief']
        },
        {
            id: 'crowd', icon: '🚶', title: 'ฝูงชนมากเกินคาด / คิวยาว', color: 'bg-blue-50 border-blue-200', badge: 'bg-blue-500',
            steps: ['เปิดจุดลงทะเบียนเพิ่ม (ถ้าเป็นไปได้)','ส่ง staff เพิ่มไปจัดระเบียบแถว','ประกาศขอให้ผู้เข้าร่วมเข้าแถวอย่างเป็นระเบียบ','ใช้ระบบ Queue numbering ถ้ามี','แจ้งทีมความปลอดภัยเฝ้าระวัง','พิจารณาเลื่อนเวลาเริ่มหรือขยาย venue']
        },
        {
            id: 'av', icon: '📺', title: 'ระบบ AV ล้มเหลว (เสียง/ภาพ)', color: 'bg-slate-50 border-slate-200', badge: 'bg-slate-500',
            steps: ['แจ้งทีมเทคนิค AV ทันที','ให้ MC ยืดเวลาหรือเปิด Break ระหว่างซ่อม','ตรวจสอบสายเคเบิลและ connection ทุกจุด','ถ้าใช้เวลา >10 นาที ปรับเป็น Q&A หรือ networking','บันทึกปัญหาเพื่อ debrief กับ vendor ภายหลัง']
        },
    ];
}

const SOPView = ({ projectId }) => {
    const [sops, setSops] = useState(() => load(projectId));
    const [active, setActive] = useState(null); // activated SOP id
    const [addMode, setAddMode] = useState(false);
    const [form, setForm] = useState({ icon: '⚠️', title: '', color: 'bg-slate-50 border-slate-200', badge: 'bg-slate-500', steps: [''] });
    const [dayMode, setDayMode] = useState(false);

    useEffect(() => save(sops, projectId), [sops, projectId]);

    const activateSOP = (id) => setActive(prev => prev === id ? null : id);

    const addStep = () => setForm(f => ({ ...f, steps: [...f.steps, ''] }));
    const updateStep = (i, val) => setForm(f => ({ ...f, steps: f.steps.map((s, idx) => idx === i ? val : s) }));
    const removeStep = (i) => setForm(f => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }));

    const submitNew = () => {
        if (!form.title.trim()) return;
        setSops(p => [...p, { id: Date.now().toString(), ...form, steps: form.steps.filter(s => s.trim()) }]);
        setForm({ icon: '⚠️', title: '', color: 'bg-slate-50 border-slate-200', badge: 'bg-slate-500', steps: [''] });
        setAddMode(false);
    };

    const removeSOP = (id) => { if (window.confirm('ลบ SOP นี้?')) setSops(p => p.filter(s => s.id !== id)); };

    return (
        <div className="flex-1 overflow-y-auto bg-[#f5f5f7]">
            {/* Header */}
            <div className={`border-b px-8 py-5 flex flex-wrap justify-between items-center gap-3 ${dayMode ? 'bg-red-950 border-red-900' : 'bg-white border-slate-100'}`}>
                <div>
                    <h2 className={`text-2xl font-black ${dayMode ? 'text-white' : 'text-slate-800'}`}>🚨 SOP ฉุกเฉิน</h2>
                    <p className={`text-sm font-medium ${dayMode ? 'text-red-300' : 'text-slate-400'}`}>
                        {sops.length} แผนรับมือ · {active ? <span className="text-red-600 font-black">กำลัง ACTIVE อยู่!</span> : 'ไม่มีสถานการณ์ฉุกเฉิน'}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setDayMode(v => !v)}
                        className={`px-4 py-2 text-sm font-black rounded-xl transition flex items-center gap-2 ${dayMode ? 'bg-yellow-400 text-slate-900 hover:bg-yellow-300' : 'bg-slate-900 text-white hover:bg-slate-700'}`}>
                        <i className={`fa-solid ${dayMode ? 'fa-sun' : 'fa-tower-broadcast'}`} />
                        {dayMode ? 'ปิด Day-Of Mode' : 'Day-Of Mode'}
                    </button>
                    {!dayMode && (
                        <button onClick={() => setAddMode(v => !v)}
                            className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition flex items-center gap-2">
                            <i className="fa-solid fa-plus" /> เพิ่ม SOP
                        </button>
                    )}
                </div>
            </div>

            {/* Active SOP Banner */}
            {active && (
                <div className="bg-red-600 px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                        <p className="text-white font-black text-lg">
                            {sops.find(s => s.id === active)?.icon} {sops.find(s => s.id === active)?.title} — กำลังดำเนินการ
                        </p>
                    </div>
                    <button onClick={() => setActive(null)} className="px-4 py-1.5 bg-white text-red-600 font-black text-sm rounded-lg hover:bg-red-50 transition">
                        ✅ สถานการณ์คลี่คลายแล้ว
                    </button>
                </div>
            )}

            {/* Add Form */}
            {addMode && (
                <div className="bg-red-50 border-b border-red-100 px-8 py-5">
                    <h4 className="text-sm font-black text-red-800 mb-4">สร้าง SOP ใหม่</h4>
                    <div className="grid grid-cols-4 gap-3 mb-3">
                        <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="Emoji" className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none text-center text-2xl" />
                        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="ชื่อสถานการณ์ *" autoFocus className="col-span-3 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-400" />
                    </div>
                    <div className="space-y-2 mb-3">
                        <p className="text-xs font-black text-slate-500">ขั้นตอนการรับมือ:</p>
                        {form.steps.map((step, i) => (
                            <div key={i} className="flex gap-2">
                                <span className="w-6 h-8 flex items-center justify-center text-xs font-black text-slate-400">{i + 1}.</span>
                                <input value={step} onChange={e => updateStep(i, e.target.value)} placeholder={`ขั้นตอนที่ ${i + 1}`}
                                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400" />
                                <button onClick={() => removeStep(i)} className="w-8 h-8 bg-red-50 text-red-400 rounded-lg text-xs hover:bg-red-100 transition flex items-center justify-center">
                                    <i className="fa-solid fa-times" />
                                </button>
                            </div>
                        ))}
                        <button onClick={addStep} className="text-xs font-bold text-red-500 hover:text-red-700 transition flex items-center gap-1">
                            <i className="fa-solid fa-plus text-[9px]" /> เพิ่มขั้นตอน
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={submitNew} className="px-6 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition">บันทึก SOP</button>
                        <button onClick={() => setAddMode(false)} className="px-6 py-2.5 bg-white border text-sm font-bold rounded-xl hover:bg-slate-50 transition">ยกเลิก</button>
                    </div>
                </div>
            )}

            {/* SOP Cards */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {sops.map(sop => {
                    const isActive = active === sop.id;
                    return (
                        <div key={sop.id} className={`rounded-2xl border-2 overflow-hidden shadow-sm transition ${isActive ? 'border-red-500 shadow-red-200 shadow-lg' : sop.color}`}>
                            {/* Card Header */}
                            <div className={`px-5 py-4 flex items-center justify-between ${isActive ? 'bg-red-600' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{sop.icon}</span>
                                    <div>
                                        <p className={`font-black text-lg ${isActive ? 'text-white' : 'text-slate-800'}`}>{sop.title}</p>
                                        <p className={`text-xs font-bold ${isActive ? 'text-red-200' : 'text-slate-400'}`}>{sop.steps.length} ขั้นตอน</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!dayMode && (
                                        <button onClick={() => removeSOP(sop.id)} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs transition ${isActive ? 'bg-red-700 text-red-200 hover:bg-red-800' : 'bg-white/60 text-slate-400 hover:bg-red-50 hover:text-red-500'}`}>
                                            <i className="fa-solid fa-trash" />
                                        </button>
                                    )}
                                    <button onClick={() => activateSOP(sop.id)}
                                        className={`px-4 py-2 text-sm font-black rounded-xl transition ${isActive ? 'bg-white text-red-600 hover:bg-red-50' : 'bg-red-600 text-white hover:bg-red-700'}`}>
                                        {isActive ? '✅ คลี่คลายแล้ว' : '🚨 ACTIVATE'}
                                    </button>
                                </div>
                            </div>
                            {/* Steps */}
                            <div className="px-5 pb-5 pt-3 space-y-2">
                                {sop.steps.map((step, i) => (
                                    <div key={i} className={`flex gap-3 items-start p-2.5 rounded-xl ${isActive ? 'bg-red-50 border border-red-100' : 'bg-white/60'}`}>
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${isActive ? 'bg-red-600 text-white' : `${sop.badge} text-white`}`}>{i + 1}</span>
                                        <p className={`text-sm font-medium leading-snug ${isActive ? 'text-red-900 font-bold' : 'text-slate-700'}`}>{step}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SOPView;
