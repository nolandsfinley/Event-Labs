import React, { useState, useEffect } from 'react';

const getKey = (pid) => `eflow_vendor_scorecard_${pid || 'global'}`;
const getVendorsKey = (pid) => `eflow_vendors_${pid || 'global'}`;
const load = (pid) => { try { return JSON.parse(localStorage.getItem(getKey(pid)) || '{}'); } catch { return {}; } };
const saveScores = (d, pid) => localStorage.setItem(getKey(pid), JSON.stringify(d));

const CRITERIA = [
    { key: 'quality', label: 'คุณภาพงาน', icon: 'fa-star' },
    { key: 'punctual', label: 'ตรงต่อเวลา', icon: 'fa-clock' },
    { key: 'communication', label: 'การสื่อสาร', icon: 'fa-comments' },
    { key: 'value', label: 'ความคุ้มค่า', icon: 'fa-sack-dollar' },
    { key: 'flexibility', label: 'ความยืดหยุ่น', icon: 'fa-sliders' },
];

const StarRating = ({ value = 0, onChange, size = 'md' }) => {
    const [hover, setHover] = useState(0);
    const sz = size === 'sm' ? 'text-sm' : 'text-xl';
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(n => (
                <button key={n}
                    onClick={() => onChange && onChange(n)}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    className={`${sz} transition ${(hover || value) >= n ? 'text-amber-400' : 'text-slate-200'} ${onChange ? 'hover:scale-110' : 'cursor-default'}`}>
                    <i className="fa-solid fa-star" />
                </button>
            ))}
        </div>
    );
};

const avg = (scores) => {
    const vals = CRITERIA.map(c => scores[c.key] || 0).filter(v => v > 0);
    if (!vals.length) return 0;
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
};

const VendorScorecardView = ({ projectId }) => {
    const [vendors, setVendors] = useState([]);
    const [scores, setScores] = useState(() => load(projectId));
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [comment, setComment] = useState('');
    const [recommend, setRecommend] = useState(null); // 'yes' | 'no' | 'maybe'
    const [filterScore, setFilterScore] = useState('all');

    useEffect(() => {
        try {
            const v = JSON.parse(localStorage.getItem(getVendorsKey(projectId)) || '[]');
            setVendors(v);
            if (v.length > 0 && !selectedVendor) setSelectedVendor(v[0].id);
        } catch { }
    }, [projectId]);

    useEffect(() => saveScores(scores, projectId), [scores, projectId]);

    const setScore = (vendorId, criterion, val) => {
        setScores(prev => ({
            ...prev,
            [vendorId]: { ...(prev[vendorId] || {}), [criterion]: val }
        }));
    };

    const saveComment = (vendorId) => {
        setScores(prev => ({
            ...prev,
            [vendorId]: { ...(prev[vendorId] || {}), comment, recommend }
        }));
    };

    useEffect(() => {
        if (selectedVendor && scores[selectedVendor]) {
            setComment(scores[selectedVendor].comment || '');
            setRecommend(scores[selectedVendor].recommend || null);
        } else {
            setComment('');
            setRecommend(null);
        }
    }, [selectedVendor, scores]);

    const getAvg = (vid) => avg(scores[vid] || {});

    const filteredVendors = vendors.filter(v => {
        if (filterScore === 'rated') return parseFloat(getAvg(v.id)) > 0;
        if (filterScore === 'unrated') return parseFloat(getAvg(v.id)) === 0;
        if (filterScore === 'top') return parseFloat(getAvg(v.id)) >= 4;
        return true;
    });

    const selVendor = vendors.find(v => v.id === selectedVendor);
    const selScores = scores[selectedVendor] || {};

    const overallAvg = (
        vendors.reduce((s, v) => s + parseFloat(getAvg(v.id)), 0) / (vendors.filter(v => parseFloat(getAvg(v.id)) > 0).length || 1)
    ).toFixed(1);

    if (vendors.length === 0) {
        return (
            <div className="flex-1 overflow-y-auto bg-[#f5f5f7]">
                <div className="bg-white border-b border-slate-100 px-8 py-5">
                    <h2 className="text-2xl font-black text-slate-800">🏆 Vendor Scorecard</h2>
                </div>
                <div className="text-center py-24">
                    <i className="fa-solid fa-handshake text-slate-200 text-5xl mb-4 block" />
                    <p className="text-slate-400 font-bold text-lg mb-2">ยังไม่มี Vendor ในโปรเจกต์นี้</p>
                    <p className="text-slate-300 text-sm">เพิ่ม Vendor ใน "Vendors" ก่อน แล้วค่อยมา Rate ที่นี่</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-hidden bg-[#f5f5f7] flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-8 py-5 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">🏆 Vendor Scorecard</h2>
                    <p className="text-sm text-slate-400 font-medium">
                        {vendors.filter(v => parseFloat(getAvg(v.id)) > 0).length}/{vendors.length} Vendor ที่ Rate แล้ว ·
                        คะแนนเฉลี่ย <span className="text-amber-500 font-black">{overallAvg}</span>/5
                    </p>
                </div>
                <div className="flex gap-2">
                    {['all', 'rated', 'unrated', 'top'].map(f => (
                        <button key={f} onClick={() => setFilterScore(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${filterScore === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                            {f === 'all' ? 'ทั้งหมด' : f === 'rated' ? 'Rate แล้ว' : f === 'unrated' ? 'ยังไม่ Rate' : '⭐ Top (4+)'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Vendor List */}
                <div className="w-64 border-r border-slate-100 bg-white overflow-y-auto shrink-0">
                    <div className="p-3 space-y-1">
                        {filteredVendors.map(v => {
                            const a = parseFloat(getAvg(v.id));
                            const rec = scores[v.id]?.recommend;
                            return (
                                <button key={v.id} onClick={() => setSelectedVendor(v.id)}
                                    className={`w-full text-left px-3 py-3 rounded-xl transition ${selectedVendor === v.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'}`}>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-black text-slate-800 truncate flex-1 mr-2">{v.name}</p>
                                        {rec === 'yes' && <span className="text-green-500 text-[10px]">👍</span>}
                                        {rec === 'no' && <span className="text-red-400 text-[10px]">👎</span>}
                                    </div>
                                    <p className="text-[10px] text-slate-400">{v.category || v.type || '—'}</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        {a > 0 ? (
                                            <>
                                                <i className="fa-solid fa-star text-amber-400 text-[10px]" />
                                                <span className="text-xs font-black text-amber-500">{a}</span>
                                            </>
                                        ) : <span className="text-[10px] text-slate-300">ยังไม่ Rate</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Score Detail */}
                {selVendor ? (
                    <div className="flex-1 overflow-y-auto p-6 space-y-5">
                        {/* Vendor Header */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800">{selVendor.name}</h3>
                                    <p className="text-sm text-slate-400 mt-0.5">{selVendor.category || selVendor.type || 'ไม่ระบุประเภท'}</p>
                                    {selVendor.contact && <p className="text-xs text-slate-400 mt-1"><i className="fa-solid fa-phone mr-1" />{selVendor.contact}</p>}
                                </div>
                                <div className="text-center">
                                    <p className="text-4xl font-black text-amber-500">{getAvg(selVendor.id)}</p>
                                    <StarRating value={Math.round(parseFloat(getAvg(selVendor.id)))} size="sm" />
                                    <p className="text-[10px] text-slate-400 mt-1">คะแนนเฉลี่ย</p>
                                </div>
                            </div>
                        </div>

                        {/* Criteria Scoring */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">ให้คะแนนตามเกณฑ์</p>
                            <div className="space-y-4">
                                {CRITERIA.map(c => (
                                    <div key={c.key} className="flex items-center gap-4">
                                        <div className="w-32 flex items-center gap-2">
                                            <i className={`fa-solid ${c.icon} text-slate-400 text-sm w-4`} />
                                            <p className="text-xs font-bold text-slate-600">{c.label}</p>
                                        </div>
                                        <StarRating
                                            value={selScores[c.key] || 0}
                                            onChange={val => setScore(selVendor.id, c.key, val)}
                                        />
                                        <span className={`text-sm font-black w-6 ${selScores[c.key] >= 4 ? 'text-amber-500' : selScores[c.key] >= 3 ? 'text-slate-600' : selScores[c.key] > 0 ? 'text-red-400' : 'text-slate-200'}`}>
                                            {selScores[c.key] || '—'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recommendation */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">แนะนำใช้งานครั้งต่อไป?</p>
                            <div className="flex gap-3 mb-4">
                                {[
                                    { val: 'yes', icon: 'fa-thumbs-up', label: 'แนะนำ', color: 'bg-green-500' },
                                    { val: 'maybe', icon: 'fa-hand', label: 'กลางๆ', color: 'bg-amber-400' },
                                    { val: 'no', icon: 'fa-thumbs-down', label: 'ไม่แนะนำ', color: 'bg-red-500' },
                                ].map(r => (
                                    <button key={r.val} onClick={() => setRecommend(r.val)}
                                        className={`flex-1 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition ${recommend === r.val ? `${r.color} text-white shadow-md` : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                        <i className={`fa-solid ${r.icon}`} />
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                placeholder="ความคิดเห็น / จุดเด่น / จุดที่ต้องปรับปรุง..."
                                rows={4}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none resize-none focus:border-blue-400 leading-relaxed"
                            />
                            <button onClick={() => saveComment(selVendor.id)}
                                className="mt-3 w-full py-2.5 bg-slate-900 text-white font-black text-sm rounded-xl hover:bg-slate-700 transition">
                                💾 บันทึกคะแนน & ความคิดเห็น
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-300">
                        <p className="font-bold">เลือก Vendor จากรายการ</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VendorScorecardView;
