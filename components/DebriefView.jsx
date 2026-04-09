import React, { useState, useEffect } from 'react';

const getKey = (pid) => `eflow_debrief_${pid || 'global'}`;
const load = (pid) => { try { return JSON.parse(localStorage.getItem(getKey(pid)) || 'null') || defaultState(); } catch { return defaultState(); } };
const save = (d, pid) => localStorage.setItem(getKey(pid), JSON.stringify(d));

function defaultState() {
    return {
        overall_rating: 0,
        attendee_count_actual: '',
        went_well: ['', '', ''],
        to_improve: ['', '', ''],
        lessons_learned: '',
        vendor_overall: '',
        venue_feedback: '',
        budget_final_note: '',
        next_time: '',
        would_repeat: null,
        highlights: '',
        status: 'in_progress',
    };
}

const StarRating = ({ value = 0, onChange }) => {
    const [h, setH] = useState(0);
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => onChange(n)} onMouseEnter={() => setH(n)} onMouseLeave={() => setH(0)}
                    className={`text-3xl transition hover:scale-110 ${(h || value) >= n ? 'text-amber-400' : 'text-slate-200'}`}>
                    <i className="fa-solid fa-star" />
                </button>
            ))}
        </div>
    );
};

const RATING_LABELS = { 1: 'แย่มาก', 2: 'พอใช้', 3: 'ปานกลาง', 4: 'ดี', 5: 'ยอดเยี่ยม!' };

const DebriefView = ({ projectId }) => {
    const [data, setData] = useState(() => load(projectId));
    const [saved, setSaved] = useState(false);
    useEffect(() => { save(data, projectId); setSaved(false); }, [data, projectId]);

    const set = (field, val) => setData(p => ({ ...p, [field]: val }));

    const setListItem = (field, idx, val) => {
        setData(p => {
            const arr = [...(p[field] || [])];
            arr[idx] = val;
            return { ...p, [field]: arr };
        });
    };

    const addListItem = (field) => setData(p => ({ ...p, [field]: [...(p[field] || []), ''] }));
    const removeListItem = (field, idx) => setData(p => ({ ...p, [field]: (p[field] || []).filter((_, i) => i !== idx) }));

    const handleSave = () => { save(data, projectId); setSaved(true); setTimeout(() => setSaved(false), 2000); };

    const isComplete = data.overall_rating > 0 && data.went_well.some(s => s.trim()) && data.to_improve.some(s => s.trim());

    const TextArea = ({ label, value, onChange, placeholder, rows = 3, icon }) => (
        <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                {icon && <i className={`fa-solid ${icon} text-slate-300`} />}{label}
            </label>
            <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none resize-none focus:border-blue-400 focus:bg-white transition leading-relaxed" />
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto bg-[#f5f5f7]">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-8 py-5 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">📝 Post-Event Debrief</h2>
                    <p className="text-sm text-slate-400 font-medium">บันทึกบทเรียน สิ่งที่ดี และข้อปรับปรุงหลังจบงาน</p>
                </div>
                <div className="flex items-center gap-3">
                    <select value={data.status} onChange={e => set('status', e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none">
                        <option value="in_progress">🟡 กำลังบันทึก</option>
                        <option value="done">✅ เสร็จแล้ว</option>
                        <option value="archived">📦 Archive</option>
                    </select>
                    <button onClick={handleSave}
                        className={`px-5 py-2 text-sm font-black rounded-xl transition flex items-center gap-2 ${saved ? 'bg-green-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-700'}`}>
                        <i className={`fa-solid ${saved ? 'fa-check' : 'fa-floppy-disk'}`} />
                        {saved ? 'บันทึกแล้ว!' : 'บันทึก'}
                    </button>
                </div>
            </div>

            <div className="p-6 grid grid-cols-3 gap-5">
                {/* LEFT COL */}
                <div className="col-span-2 space-y-5">
                    {/* Overall Rating */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm text-center">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">ภาพรวมงาน</p>
                        <StarRating value={data.overall_rating} onChange={v => set('overall_rating', v)} />
                        {data.overall_rating > 0 && (
                            <p className={`text-lg font-black mt-3 ${data.overall_rating >= 4 ? 'text-amber-500' : data.overall_rating >= 3 ? 'text-slate-600' : 'text-red-500'}`}>
                                {RATING_LABELS[data.overall_rating]}
                            </p>
                        )}
                    </div>

                    {/* Went Well */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-black text-green-700 flex items-center gap-2">
                                <i className="fa-solid fa-circle-check text-green-500" />
                                สิ่งที่ทำได้ดี / ประทับใจ
                            </p>
                            <button onClick={() => addListItem('went_well')} className="text-[11px] text-green-600 font-bold hover:text-green-800 flex items-center gap-1">
                                <i className="fa-solid fa-plus text-[9px]" /> เพิ่ม
                            </button>
                        </div>
                        <div className="space-y-2">
                            {data.went_well.map((item, idx) => (
                                <div key={idx} className="flex gap-2 items-center group">
                                    <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">{idx + 1}</span>
                                    <input value={item} onChange={e => setListItem('went_well', idx, e.target.value)}
                                        placeholder={`ข้อที่ ${idx + 1}...`}
                                        className="flex-1 bg-green-50 border border-green-100 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-300 transition" />
                                    {data.went_well.length > 1 && (
                                        <button onClick={() => removeListItem('went_well', idx)} className="w-6 h-6 text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-xs">
                                            <i className="fa-solid fa-times" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* To Improve */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-black text-orange-700 flex items-center gap-2">
                                <i className="fa-solid fa-triangle-exclamation text-orange-400" />
                                สิ่งที่ต้องปรับปรุงครั้งต่อไป
                            </p>
                            <button onClick={() => addListItem('to_improve')} className="text-[11px] text-orange-600 font-bold hover:text-orange-800 flex items-center gap-1">
                                <i className="fa-solid fa-plus text-[9px]" /> เพิ่ม
                            </button>
                        </div>
                        <div className="space-y-2">
                            {data.to_improve.map((item, idx) => (
                                <div key={idx} className="flex gap-2 items-center group">
                                    <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">{idx + 1}</span>
                                    <input value={item} onChange={e => setListItem('to_improve', idx, e.target.value)}
                                        placeholder={`ข้อที่ ${idx + 1}...`}
                                        className="flex-1 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-300 transition" />
                                    {data.to_improve.length > 1 && (
                                        <button onClick={() => removeListItem('to_improve', idx)} className="w-6 h-6 text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-xs">
                                            <i className="fa-solid fa-times" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Lessons Learned */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
                        <TextArea label="Lessons Learned — บทเรียนที่ได้" icon="fa-lightbulb"
                            value={data.lessons_learned} onChange={v => set('lessons_learned', v)}
                            placeholder="สิ่งที่ได้เรียนรู้จากงานนี้ ที่สามารถนำไปใช้ในงานต่อๆ ไป..." rows={4} />
                        <TextArea label="สำหรับงานครั้งต่อไป ควรทำอะไรแตกต่างออกไป?" icon="fa-arrow-right"
                            value={data.next_time} onChange={v => set('next_time', v)}
                            placeholder="ไอเดียและแผนการปรับปรุง..." rows={3} />
                    </div>
                </div>

                {/* RIGHT COL */}
                <div className="space-y-5">
                    {/* Quick Stats */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">สถิติงาน</p>
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-black text-slate-400">ผู้เข้าร่วมจริง (คน)</label>
                                <input type="number" value={data.attendee_count_actual} onChange={e => set('attendee_count_actual', e.target.value)}
                                    placeholder="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xl font-black outline-none text-center mt-1" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 mb-2">จัดงานนี้อีกครั้งไหม?</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {[['yes', '👍 ใช่', 'bg-green-500'], ['maybe', '🤔 พิจารณา', 'bg-amber-400'], ['no', '👎 ไม่', 'bg-red-500']].map(([v, l, c]) => (
                                        <button key={v} onClick={() => set('would_repeat', v)}
                                            className={`py-2 rounded-xl text-xs font-black transition ${data.would_repeat === v ? `${c} text-white shadow-sm` : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{l}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feedback by Area */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Feedback รายด้าน</p>
                        <TextArea label="Vendor โดยรวม" value={data.vendor_overall} onChange={v => set('vendor_overall', v)} placeholder="Vendor ทำงานได้ดีแค่ไหน?" rows={2} />
                        <TextArea label="สถานที่" value={data.venue_feedback} onChange={v => set('venue_feedback', v)} placeholder="สถานที่เหมาะสม, ปัญหาที่พบ..." rows={2} />
                        <TextArea label="งบประมาณ (Final)" value={data.budget_final_note} onChange={v => set('budget_final_note', v)} placeholder="สรุปงบ, เกิน/ขาด, เหตุผล..." rows={2} />
                    </div>

                    {/* Highlights */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                        <TextArea label="🌟 Highlight ประทับใจ" value={data.highlights} onChange={v => set('highlights', v)} placeholder="ช่วงเวลาที่ดีที่สุด, feedback จากผู้เข้าร่วม..." rows={4} />
                    </div>

                    {/* Completion */}
                    {isComplete && (
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                            <i className="fa-solid fa-check-circle text-green-500 text-2xl mb-2 block" />
                            <p className="text-sm font-black text-green-700">Debrief ครบถ้วนแล้ว!</p>
                            <p className="text-xs text-green-500 mt-1">บันทึกข้อมูลสำหรับอ้างอิงครั้งต่อไป</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DebriefView;
