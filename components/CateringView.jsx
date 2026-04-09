import React, { useState, useEffect, useMemo } from 'react';

const getKey = (pid) => `eflow_catering_${pid || 'global'}`;
const load = (pid) => { try { return JSON.parse(localStorage.getItem(getKey(pid)) || 'null') || defaultState(); } catch { return defaultState(); } };
const save = (d, pid) => localStorage.setItem(getKey(pid), JSON.stringify(d));

function defaultState() {
    return {
        guestCount: 100,
        meals: [
            { id: '1', type: 'breakfast', label: 'อาหารเช้า', enabled: false, ratePerHead: 150, special: { vegan: 5, halal: 10, allergy: 2 } },
            { id: '2', type: 'lunch', label: 'อาหารเดี๋ยว', enabled: true, ratePerHead: 350, special: { vegan: 5, halal: 10, allergy: 2 } },
            { id: '3', type: 'dinner', label: 'อาหารค่ำ/งานเลี้ยง', enabled: false, ratePerHead: 600, special: { vegan: 5, halal: 10, allergy: 2 } },
            { id: '4', type: 'snack', label: 'Coffee Break / ของว่าง', enabled: true, ratePerHead: 80, special: { vegan: 5, halal: 0, allergy: 0 } },
            { id: '5', type: 'snack2', label: 'Coffee Break (บ่าย)', enabled: false, ratePerHead: 80, special: { vegan: 5, halal: 0, allergy: 0 } },
        ],
        dietary: { vegan: 5, halal: 10, allergy: 3 },
        buffer: 10,
        notes: '',
    };
}

const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '☕', snack2: '🍵' };

const CateringView = ({ projectId }) => {
    const [data, setData] = useState(() => load(projectId));
    useEffect(() => save(data, projectId), [data, projectId]);

    const set = (path, val) => {
        setData(prev => {
            const clone = JSON.parse(JSON.stringify(prev));
            const parts = path.split('.');
            let obj = clone;
            for (let i = 0; i < parts.length - 1; i++) {
                if (parts[i].startsWith('[')) { const idx = parseInt(parts[i].slice(1, -1)); obj = obj[idx]; }
                else obj = obj[parts[i]];
            }
            obj[parts[parts.length - 1]] = val;
            return clone;
        });
    };

    const setMeal = (idx, field, val) => {
        setData(prev => {
            const meals = [...prev.meals];
            meals[idx] = { ...meals[idx], [field]: val };
            return { ...prev, meals };
        });
    };

    const setMealSpecial = (idx, field, val) => {
        setData(prev => {
            const meals = [...prev.meals];
            meals[idx] = { ...meals[idx], special: { ...meals[idx].special, [field]: Number(val) || 0 } };
            return { ...prev, meals };
        });
    };

    const totalGuests = data.guestCount;
    const bufferAdd = Math.ceil(totalGuests * (data.buffer / 100));
    const effectiveGuests = totalGuests + bufferAdd;

    const summary = useMemo(() => {
        return data.meals.filter(m => m.enabled).map(m => {
            const veganCount = Math.ceil((data.dietary.vegan / 100) * effectiveGuests);
            const halalCount = Math.ceil((data.dietary.halal / 100) * effectiveGuests);
            const allergyCount = Math.ceil((data.dietary.allergy / 100) * effectiveGuests);
            const total = m.ratePerHead * effectiveGuests;
            return { ...m, effectiveGuests, veganCount, halalCount, allergyCount, total };
        });
    }, [data, effectiveGuests]);

    const grandTotal = summary.reduce((s, m) => s + m.total, 0);

    return (
        <div className="flex-1 overflow-y-auto bg-[#f5f5f7]">
            <div className="bg-white border-b border-slate-100 px-8 py-5">
                <h2 className="text-2xl font-black text-slate-800">🍽️ Catering Calculator</h2>
                <p className="text-sm text-slate-400 font-medium">คำนวณปริมาณอาหารและงบประมาณสำหรับงาน</p>
            </div>

            <div className="p-6 grid grid-cols-3 gap-5">
                {/* Left — Settings */}
                <div className="col-span-1 space-y-4">
                    {/* Guest Count */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-5">
                        <h3 className="text-sm font-black text-slate-700 mb-4">⚙️ ตั้งค่า</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-[11px] font-black text-slate-400 block mb-1">จำนวนผู้เข้าร่วม (คน)</label>
                                <input type="number" value={data.guestCount} onChange={e => set('guestCount', Number(e.target.value) || 0)} min="1"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-lg font-black outline-none focus:border-blue-400 text-slate-800" />
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-slate-400 block mb-1">Buffer เผื่อไว้ (%)</label>
                                <div className="flex items-center gap-2">
                                    <input type="range" min="0" max="30" step="5" value={data.buffer} onChange={e => set('buffer', Number(e.target.value))} className="flex-1 accent-blue-600" />
                                    <span className="text-sm font-black text-blue-600 w-10 text-right">+{data.buffer}%</span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">เตรียมสำหรับ {effectiveGuests} คน (+{bufferAdd})</p>
                            </div>
                        </div>
                    </div>

                    {/* Dietary */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-5">
                        <h3 className="text-sm font-black text-slate-700 mb-4">🥗 ความต้องการพิเศษ (%)</h3>
                        <div className="space-y-3">
                            {[
                                { key: 'vegan', label: 'Vegan / มังสวิรัติ', icon: '🌿', color: 'accent-green-500' },
                                { key: 'halal', label: 'Halal', icon: '☪️', color: 'accent-emerald-600' },
                                { key: 'allergy', label: 'แพ้อาหาร (Allergy)', icon: '⚠️', color: 'accent-amber-500' },
                            ].map(d => {
                                const count = Math.ceil((data.dietary[d.key] / 100) * effectiveGuests);
                                return (
                                    <div key={d.key}>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-[11px] font-black text-slate-400">{d.icon} {d.label}</label>
                                            <span className="text-xs font-black text-slate-600">~{count} คน</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="range" min="0" max="50" step="1" value={data.dietary[d.key]}
                                                onChange={e => setData(prev => ({ ...prev, dietary: { ...prev.dietary, [d.key]: Number(e.target.value) } }))}
                                                className={`flex-1 ${d.color}`} />
                                            <span className="text-xs font-black text-slate-500 w-8 text-right">{data.dietary[d.key]}%</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 p-5">
                        <label className="text-[11px] font-black text-slate-400 block mb-2">หมายเหตุ</label>
                        <textarea value={data.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="ข้อมูลเพิ่มเติม..." className="w-full bg-slate-50 rounded-xl px-3 py-2 text-sm outline-none resize-none border border-slate-200 focus:border-blue-300" />
                    </div>
                </div>

                {/* Right — Meals */}
                <div className="col-span-2 space-y-4">
                    {data.meals.map((meal, idx) => (
                        <div key={meal.id} className={`rounded-2xl border transition ${meal.enabled ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-dashed border-slate-200 opacity-60'}`}>
                            <div className="px-5 py-4 flex items-center gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={meal.enabled} onChange={e => setMeal(idx, 'enabled', e.target.checked)} className="w-4 h-4 accent-blue-600" />
                                    <span className="text-xl">{MEAL_ICONS[meal.type] || '🍴'}</span>
                                    <span className="font-black text-slate-800">{meal.label}</span>
                                </label>
                                {meal.enabled && (
                                    <div className="flex items-center gap-2 ml-auto">
                                        <label className="text-[10px] font-black text-slate-400">ราคา/หัว (฿)</label>
                                        <input type="number" value={meal.ratePerHead} onChange={e => setMeal(idx, 'ratePerHead', Number(e.target.value) || 0)} min="0"
                                            className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-black outline-none text-right" />
                                    </div>
                                )}
                            </div>
                            {meal.enabled && (
                                <div className="px-5 pb-4 grid grid-cols-4 gap-3 border-t border-slate-100 pt-4">
                                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                                        <p className="text-2xl font-black text-blue-700">{effectiveGuests}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">รวม (+ buffer)</p>
                                    </div>
                                    <div className="bg-green-50 rounded-xl p-3 text-center">
                                        <p className="text-2xl font-black text-green-600">{Math.ceil((data.dietary.vegan / 100) * effectiveGuests)}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">🌿 Vegan</p>
                                    </div>
                                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                                        <p className="text-2xl font-black text-emerald-600">{Math.ceil((data.dietary.halal / 100) * effectiveGuests)}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">☪️ Halal</p>
                                    </div>
                                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                                        <p className="text-xl font-black text-amber-600">฿{(meal.ratePerHead * effectiveGuests).toLocaleString()}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">ค่าใช้จ่ายรวม</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Grand Total */}
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white flex items-center justify-between">
                        <div>
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">งบประมาณ Catering รวม</p>
                            <p className="text-4xl font-black mt-1">฿{grandTotal.toLocaleString()}</p>
                            <p className="text-sm text-slate-400 mt-1">สำหรับ {effectiveGuests} คน · {summary.length} มื้อ</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-400 font-bold">เฉลี่ยต่อคน</p>
                            <p className="text-3xl font-black text-blue-400">฿{effectiveGuests > 0 ? Math.round(grandTotal / effectiveGuests).toLocaleString() : 0}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CateringView;
