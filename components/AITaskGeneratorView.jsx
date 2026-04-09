import React, { useState, useEffect } from 'react';

const KEY_STORAGE = 'eflow_gemini_api_key';
const getChecklistKey = (pid) => `eflow_checklist_${pid || 'global'}`;

const DEFAULT_CATEGORIES = ['Venue', 'Catering', 'AV & Tech', 'Decoration', 'Marketing', 'Staff', 'Guest Management', 'Logistics', 'Budget', 'Day-Of'];

const PRIORITY_COLOR = { high: 'bg-red-100 text-red-600', medium: 'bg-amber-100 text-amber-600', low: 'bg-slate-100 text-slate-500' };
const PRIORITY_LABEL = { high: 'สำคัญมาก', medium: 'ปานกลาง', low: 'ต่ำ' };

const EXAMPLES = [
    'งานแต่งงาน 300 คน ที่โรงแรม 5 ดาว มีพิธีสงฆ์ตอนเช้า',
    'สัมมนาองค์กร 150 คน 2 วัน มี Workshop และ Team Building',
    'คอนเสิร์ตในร่ม 500 ที่นั่ง มีศิลปิน 3 คน',
    'งานวันเกิด Rooftop 80 คน มีบุฟเฟ่ต์และวง Live Music',
    'นิทรรศการสินค้า 3 วัน มี 20 Booth บูธ',
];

const AITaskGeneratorView = ({ projectId, project }) => {
    const [apiKey, setApiKey] = useState(() => localStorage.getItem(KEY_STORAGE) || '');
    const [showKey, setShowKey] = useState(false);
    const [keySaved, setKeySaved] = useState(!!localStorage.getItem(KEY_STORAGE));
    const [loading, setLoading] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [eventDate, setEventDate] = useState(project?.eventDate || '');
    const [generated, setGenerated] = useState([]);
    const [selected, setSelected] = useState(new Set());
    const [error, setError] = useState('');
    const [imported, setImported] = useState(false);
    const [tab, setTab] = useState('generate'); // generate | history

    const saveKey = () => {
        localStorage.setItem(KEY_STORAGE, apiKey);
        setKeySaved(true);
        setShowKey(false);
    };

    const daysFromEvent = (daysBeforeEvent) => {
        if (!eventDate || !daysBeforeEvent) return null;
        const d = new Date(eventDate);
        d.setDate(d.getDate() - daysBeforeEvent);
        return d.toISOString().split('T')[0];
    };

    const generate = async () => {
        if (!apiKey.trim()) { setError('กรุณาใส่ Gemini API Key ก่อนครับ'); return; }
        if (!prompt.trim()) { setError('กรุณาอธิบายงานของคุณก่อนครับ'); return; }
        setLoading(true);
        setError('');
        setGenerated([]);
        setSelected(new Set());
        setImported(false);

        const today = new Date().toLocaleDateString('th-TH');
        const eDate = eventDate ? new Date(eventDate).toLocaleDateString('th-TH') : 'ไม่ระบุ';
        const systemPrompt = `คุณเป็น Event Coordinator ผู้เชี่ยวชาญที่มีประสบการณ์สูง
        
งาน: ${prompt}
วันงาน: ${eDate}
วันนี้: ${today}

สร้าง Checklist สำหรับงานนี้ 25-35 รายการ โดย:
1. ครอบคลุมทุกด้าน: สถานที่, อาหาร, AV, การตกแต่ง, Staff, ผู้เข้าร่วม, ประชาสัมพันธ์, โลจิสติกส์, และวันงาน
2. เรียงตามความสำคัญและเวลาที่ควรทำ (กี่วันก่อนงาน)
3. ตอบกลับเป็น JSON array ตามรูปแบบนี้เท่านั้น ห้ามมี markdown หรือข้อความอื่น:

[
  {
    "title": "ชื่องาน (ภาษาไทย)",
    "category": "หมวดหมู่จาก: Venue/Catering/AV & Tech/Decoration/Marketing/Staff/Guest Management/Logistics/Budget/Day-Of",
    "daysBeforeEvent": 90,
    "priority": "high/medium/low",
    "note": "รายละเอียดเพิ่มเติม (optional)"
  }
]`;

        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: systemPrompt }] }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error?.message || `API Error: ${res.status}`);
            }

            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

            // Extract JSON from response
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error('AI ตอบกลับในรูปแบบที่ไม่ถูกต้อง ลองใหม่อีกครั้ง');

            const tasks = JSON.parse(jsonMatch[0]);
            if (!Array.isArray(tasks)) throw new Error('ข้อมูลที่ได้รับไม่ถูกต้อง');

            const enriched = tasks.map((t, i) => ({
                ...t,
                id: `ai-${Date.now()}-${i}`,
                dueDate: daysFromEvent(t.daysBeforeEvent),
                done: false,
                category: DEFAULT_CATEGORIES.includes(t.category) ? t.category : 'Day-Of',
            }));

            setGenerated(enriched);
            setSelected(new Set(enriched.map(t => t.id)));

        } catch (e) {
            setError(e.message || 'เกิดข้อผิดพลาด กรุณาตรวจสอบ API Key หรือลองใหม่');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (id) => setSelected(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });

    const importToChecklist = () => {
        const existing = JSON.parse(localStorage.getItem(getChecklistKey(projectId)) || '[]');
        const toAdd = generated.filter(t => selected.has(t.id)).map(t => ({
            id: `cl-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            title: t.title,
            category: t.category,
            dueDate: t.dueDate || '',
            priority: t.priority || 'medium',
            note: t.note || '',
            done: false,
            createdAt: new Date().toISOString(),
            source: 'ai',
        }));
        localStorage.setItem(getChecklistKey(projectId), JSON.stringify([...existing, ...toAdd]));
        setImported(true);
    };

    const byCategory = generated.reduce((acc, t) => {
        const cat = t.category || 'อื่นๆ';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(t);
        return acc;
    }, {});

    return (
        <div className="flex-1 overflow-y-auto bg-[#f5f5f7]">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-8 py-5 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                        🤖 AI Task Generator
                        <span className="text-xs bg-purple-100 text-purple-600 font-black px-2 py-1 rounded-full">Powered by Gemini</span>
                    </h2>
                    <p className="text-sm text-slate-400 font-medium">บอก AI แค่ประเภทงาน — Checklist ครบถ้วนจะ Generate ให้อัตโนมัติ</p>
                </div>
            </div>

            <div className="p-6 space-y-5 max-w-5xl mx-auto">
                {/* API Key Setup */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${keySaved && apiKey ? 'bg-green-500' : 'bg-red-400'}`} />
                            <p className="text-sm font-black text-slate-700">Gemini API Key</p>
                            {keySaved && apiKey && <span className="text-[10px] text-green-600 font-black bg-green-50 px-2 py-0.5 rounded-full">✓ พร้อมใช้งาน</span>}
                        </div>
                        <button onClick={() => setShowKey(v => !v)} className="text-xs font-bold text-blue-600 hover:text-blue-800">
                            {showKey ? 'ซ่อน' : 'แก้ไข API Key'}
                        </button>
                    </div>

                    {showKey && (
                        <div className="space-y-3">
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                                <p className="font-black mb-1">วิธีรับ API Key:</p>
                                <p>1. ไปที่ <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline font-bold">aistudio.google.com/apikey</a></p>
                                <p>2. กด "Create API Key" → เลือก Project</p>
                                <p>3. Copy Key แล้ว Paste ด้านล่าง (ฟรีสำหรับการใช้งานทั่วไป)</p>
                            </div>
                            <div className="flex gap-2">
                                <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
                                    placeholder="AIza..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono outline-none focus:border-blue-400" />
                                <button onClick={saveKey} className="px-4 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition">บันทึก</button>
                            </div>
                        </div>
                    )}

                    {!showKey && !keySaved && (
                        <p className="text-xs text-red-500 font-bold">⚠️ กรุณาใส่ API Key ก่อนใช้งาน</p>
                    )}
                </div>

                {/* Prompt Input */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <p className="text-sm font-black text-slate-700 mb-3">อธิบายงานของคุณ</p>
                    <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="เช่น งานแต่งงาน 300 คน ที่โรงแรม 5 ดาว มีพิธีสงฆ์ตอนเช้า ดินเนอร์กาล่า เต้นรำ และโชว์พิเศษ..."
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none resize-none focus:border-purple-400 focus:bg-white transition leading-relaxed"
                    />

                    <div className="flex gap-2 mt-2 flex-wrap">
                        <p className="text-[10px] font-black text-slate-400 self-center">ตัวอย่าง:</p>
                        {EXAMPLES.map(ex => (
                            <button key={ex} onClick={() => setPrompt(ex)}
                                className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100 transition max-w-40 text-left leading-tight">
                                {ex.slice(0, 30)}...
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-3 mt-4 items-end">
                        <div className="flex-1">
                            <label className="text-[10px] font-black text-slate-400 block mb-1">วันงาน (สำหรับคำนวณ Due Date)</label>
                            <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-400" />
                        </div>
                        <button onClick={generate} disabled={loading || !apiKey}
                            className={`px-8 py-2.5 font-black text-sm rounded-xl flex items-center gap-3 transition shadow-sm ${loading || !apiKey ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-md'}`}>
                            {loading ? (
                                <><i className="fa-solid fa-spinner fa-spin" /> กำลัง Generate...</>
                            ) : (
                                <><i className="fa-solid fa-wand-magic-sparkles" /> สร้าง Checklist</>
                            )}
                        </button>
                    </div>

                    {error && (
                        <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-bold">
                            <i className="fa-solid fa-circle-exclamation mr-2" />{error}
                        </div>
                    )}
                </div>

                {/* Generated Tasks */}
                {generated.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        {/* Import bar */}
                        <div className="px-5 py-3 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <p className="text-sm font-black text-purple-800">
                                    {generated.length} รายการ — เลือก {selected.size} รายการ
                                </p>
                                <button onClick={() => setSelected(new Set(generated.map(t => t.id)))} className="text-xs text-purple-600 font-bold hover:underline">เลือกทั้งหมด</button>
                                <button onClick={() => setSelected(new Set())} className="text-xs text-slate-400 font-bold hover:underline">ล้าง</button>
                            </div>
                            <div className="flex gap-2">
                                {imported && <span className="text-xs text-green-600 font-black flex items-center gap-1"><i className="fa-solid fa-check-circle" /> Import แล้ว!</span>}
                                <button onClick={importToChecklist} disabled={selected.size === 0 || imported}
                                    className={`px-5 py-2 font-black text-sm rounded-xl transition flex items-center gap-2 ${selected.size === 0 || imported ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>
                                    <i className="fa-solid fa-list-check" />
                                    Import → Checklist ({selected.size})
                                </button>
                            </div>
                        </div>

                        {/* Tasks grouped by category */}
                        <div className="divide-y divide-slate-50">
                            {Object.entries(byCategory).map(([cat, tasks]) => (
                                <div key={cat}>
                                    <div className="px-5 py-2 bg-slate-50 flex items-center gap-2">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{cat}</p>
                                        <span className="text-[9px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full font-black">{tasks.length}</span>
                                    </div>
                                    {tasks.map(task => (
                                        <div key={task.id} className={`flex items-start gap-4 px-5 py-3 hover:bg-slate-50/50 cursor-pointer ${selected.has(task.id) ? '' : 'opacity-50'}`}
                                            onClick={() => toggleSelect(task.id)}>
                                            <input type="checkbox" checked={selected.has(task.id)} onChange={() => toggleSelect(task.id)} className="accent-purple-600 mt-0.5 w-4 h-4" onClick={e => e.stopPropagation()} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-800">{task.title}</p>
                                                {task.note && <p className="text-xs text-slate-400 mt-0.5">{task.note}</p>}
                                                <p className="text-[10px] text-slate-300 mt-0.5">
                                                    {task.daysBeforeEvent ? `${task.daysBeforeEvent} วันก่อนงาน` : ''}
                                                    {task.dueDate ? ` · Due ${new Date(task.dueDate).toLocaleDateString('th-TH')}` : ''}
                                                </p>
                                            </div>
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${PRIORITY_COLOR[task.priority] || PRIORITY_COLOR.medium}`}>
                                                {PRIORITY_LABEL[task.priority]}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AITaskGeneratorView;
