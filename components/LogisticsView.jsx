import React, { useState, useEffect } from 'react';

const getKey = (pid) => `eflow_logistics_${pid || 'global'}`;
const load = (pid) => { try { return JSON.parse(localStorage.getItem(getKey(pid)) || 'null') || defaultState(); } catch { return defaultState(); } };
const save = (d, pid) => localStorage.setItem(getKey(pid), JSON.stringify(d));

function defaultState() {
    return {
        venue_name: '', venue_address: '', google_maps_link: '',
        parking: { total: '', vip_reserved: '', public: '', accessible: '', note: '' },
        shuttle: [
            { id: '1', from: '', to: '', frequency: '', capacity: '', note: '', active: true }
        ],
        arrival_zones: [
            { id: '1', name: 'จุดรับ VIP', desc: '', time: '', note: '' },
        ],
        transport_info: '',
        emergency_access: '',
        parking_note: '',
        map_note: '',
    };
}

const LogisticsView = ({ projectId }) => {
    const [data, setData] = useState(() => load(projectId));
    useEffect(() => save(data, projectId), [data, projectId]);

    const setField = (path, val) => {
        setData(prev => {
            const clone = JSON.parse(JSON.stringify(prev));
            const keys = path.split('.');
            let cur = clone;
            for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
            cur[keys[keys.length - 1]] = val;
            return clone;
        });
    };

    const addShuttle = () => setData(p => ({
        ...p, shuttle: [...p.shuttle, { id: Date.now().toString(), from: '', to: '', frequency: '', capacity: '', note: '', active: true }]
    }));
    const removeShuttle = (id) => setData(p => ({ ...p, shuttle: p.shuttle.filter(s => s.id !== id) }));
    const updateShuttle = (id, field, val) => setData(p => ({ ...p, shuttle: p.shuttle.map(s => s.id === id ? { ...s, [field]: val } : s) }));

    const addZone = () => setData(p => ({
        ...p, arrival_zones: [...p.arrival_zones, { id: Date.now().toString(), name: '', desc: '', time: '', note: '' }]
    }));
    const removeZone = (id) => setData(p => ({ ...p, arrival_zones: p.arrival_zones.filter(z => z.id !== id) }));
    const updateZone = (id, field, val) => setData(p => ({ ...p, arrival_zones: p.arrival_zones.map(z => z.id === id ? { ...z, [field]: val } : z) }));

    const SectionTitle = ({ icon, title, sub }) => (
        <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
                <i className={`fa-solid ${icon} text-white text-sm`} />
            </div>
            <div>
                <p className="text-sm font-black text-slate-800">{title}</p>
                {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
            </div>
        </div>
    );

    const Input = ({ label, value, onChange, placeholder, type = 'text', wide = false }) => (
        <div className={wide ? 'col-span-2' : ''}>
            {label && <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase tracking-wider">{label}</label>}
            <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white transition" />
        </div>
    );

    const TextArea = ({ label, value, onChange, placeholder, rows = 3 }) => (
        <div>
            {label && <label className="text-[10px] font-black text-slate-400 block mb-1 uppercase tracking-wider">{label}</label>}
            <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none focus:border-blue-400 focus:bg-white transition" />
        </div>
    );

    return (
        <div className="flex-1 overflow-y-auto bg-[#f5f5f7]">
            <div className="bg-white border-b border-slate-100 px-8 py-5 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">🅿️ Parking & Logistics</h2>
                    <p className="text-sm text-slate-400 font-medium">จัดการการเดินทาง ที่จอดรถ และโลจิสติกส์งาน</p>
                </div>
                <a href={data.google_maps_link || '#'} target={data.google_maps_link ? '_blank' : '_self'} rel="noopener noreferrer"
                    className={`px-4 py-2 text-sm font-bold rounded-xl flex items-center gap-2 transition ${data.google_maps_link ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                    <i className="fa-solid fa-map-location-dot" /> เปิด Google Maps
                </a>
            </div>

            <div className="p-6 space-y-5">
                {/* Venue Info */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <SectionTitle icon="fa-building" title="ข้อมูลสถานที่" />
                    <div className="grid grid-cols-2 gap-3">
                        <Input label="ชื่อสถานที่" value={data.venue_name} onChange={v => setField('venue_name', v)} placeholder="เช่น IMPACT Arena เมืองทองธานี" />
                        <Input label="ลิงก์ Google Maps" value={data.google_maps_link} onChange={v => setField('google_maps_link', v)} placeholder="https://maps.google.com/..." />
                        <div className="col-span-2">
                            <TextArea label="ที่อยู่" value={data.venue_address} onChange={v => setField('venue_address', v)} placeholder="ที่อยู่เต็ม..." rows={2} />
                        </div>
                    </div>
                </div>

                {/* Parking */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <SectionTitle icon="fa-square-parking" title="ที่จอดรถ" sub="จำนวนและรายละเอียดที่จอดรถ" />
                    <div className="grid grid-cols-4 gap-3 mb-3">
                        {[
                            { label: 'ที่จอดรถรวม', key: 'total', icon: '🚗' },
                            { label: 'สำรอง VIP', key: 'vip_reserved', icon: '⭐' },
                            { label: 'ทั่วไป', key: 'public', icon: '🅿️' },
                            { label: 'ผู้พิการ', key: 'accessible', icon: '♿' },
                        ].map(f => (
                            <div key={f.key} className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                                <p className="text-2xl mb-1">{f.icon}</p>
                                <input type="number" min="0" value={data.parking[f.key]} onChange={e => setField(`parking.${f.key}`, e.target.value)}
                                    placeholder="0" className="w-full text-center text-2xl font-black bg-transparent outline-none text-slate-800 mb-1" />
                                <p className="text-[10px] text-slate-400 font-bold">{f.label}</p>
                            </div>
                        ))}
                    </div>
                    <TextArea label="หมายเหตุที่จอดรถ" value={data.parking.note} onChange={v => setField('parking.note', v)} placeholder="ข้อมูลเพิ่มเติม เช่น ค่าบัตรจอด, เวลาเปิด-ปิด..." rows={2} />
                </div>

                {/* Shuttle Routes */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <SectionTitle icon="fa-bus" title="รถรับ-ส่ง (Shuttle)" sub="เส้นทางรถรับส่งผู้เข้าร่วม" />
                        <button onClick={addShuttle} className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition flex items-center gap-1.5">
                            <i className="fa-solid fa-plus" /> เพิ่มเส้นทาง
                        </button>
                    </div>
                    <div className="space-y-3">
                        {data.shuttle.map((s, idx) => (
                            <div key={s.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-black text-slate-600">🚌 เส้นทางที่ {idx + 1}</p>
                                    <div className="flex items-center gap-2">
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input type="checkbox" checked={s.active} onChange={e => updateShuttle(s.id, 'active', e.target.checked)} className="accent-blue-600" />
                                            <span className="text-xs font-bold text-slate-500">ใช้งาน</span>
                                        </label>
                                        <button onClick={() => removeShuttle(s.id)} className="w-6 h-6 bg-red-50 text-red-400 rounded-lg flex items-center justify-center hover:bg-red-100 transition">
                                            <i className="fa-solid fa-times text-[10px]" />
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    <input value={s.from} onChange={e => updateShuttle(s.id, 'from', e.target.value)} placeholder="จุดต้นทาง" className="bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs outline-none" />
                                    <input value={s.to} onChange={e => updateShuttle(s.id, 'to', e.target.value)} placeholder="จุดปลายทาง" className="bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs outline-none" />
                                    <input value={s.frequency} onChange={e => updateShuttle(s.id, 'frequency', e.target.value)} placeholder="ความถี่ เช่น ทุก 15 นาที" className="bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs outline-none" />
                                    <input value={s.capacity} onChange={e => updateShuttle(s.id, 'capacity', e.target.value)} placeholder="ความจุ (คน)" type="number" className="bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs outline-none" />
                                    <input value={s.note} onChange={e => updateShuttle(s.id, 'note', e.target.value)} placeholder="หมายเหตุ" className="col-span-4 bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs outline-none" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Arrival / Drop-off Zones */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <SectionTitle icon="fa-location-dot" title="จุด Drop-Off / รับรถ" sub="จุดรับ-ส่งผู้เข้าร่วมแยกตามประเภท" />
                        <button onClick={addZone} className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition flex items-center gap-1.5">
                            <i className="fa-solid fa-plus" /> เพิ่มจุด
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {data.arrival_zones.map(z => (
                            <div key={z.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                <div className="flex justify-between mb-2">
                                    <input value={z.name} onChange={e => updateZone(z.id, 'name', e.target.value)} placeholder="ชื่อจุด เช่น จุด VIP" className="font-black text-sm bg-transparent outline-none text-slate-800 flex-1" />
                                    <button onClick={() => removeZone(z.id)} className="w-5 h-5 text-slate-300 hover:text-red-400 transition text-xs"><i className="fa-solid fa-times" /></button>
                                </div>
                                <input value={z.desc} onChange={e => updateZone(z.id, 'desc', e.target.value)} placeholder="ตำแหน่ง/รายละเอียด" className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none mb-2" />
                                <input value={z.time} onChange={e => updateZone(z.id, 'time', e.target.value)} placeholder="เวลาเปิด เช่น 07:30-09:00" className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none mb-2" />
                                <input value={z.note} onChange={e => updateZone(z.id, 'note', e.target.value)} placeholder="หมายเหตุ" className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Additional Info / Map */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <SectionTitle icon="fa-map" title="ผังสถานที่ & ข้อมูลเพิ่มเติม" />
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <TextArea label="วิธีเดินทาง (สาธารณะ)" value={data.transport_info} onChange={v => setField('transport_info', v)} placeholder="BTS, MRT, รถสองแถว, ท่าเรือ..." rows={3} />
                            <TextArea label="เส้นทางรถพยาบาล/ฉุกเฉิน" value={data.emergency_access} onChange={v => setField('emergency_access', v)} placeholder="ประตูฉุกเฉิน, ทางเข้า-ออก รถพยาบาล..." rows={3} />
                            <TextArea label="หมายเหตุพิเศษ" value={data.map_note} onChange={v => setField('map_note', v)} placeholder="ข้อมูลแผนผัง, สีโซน, เลขประตู..." rows={3} />
                        </div>
                        
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden group">
                            {data.map_image ? (
                                <>
                                    <img src={data.map_image} alt="Map" className="max-w-full max-h-full object-contain cursor-pointer" onClick={() => window.open(data.map_image, '_blank')} />
                                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                        <button onClick={() => setField('map_image', '')} className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700">
                                            <i className="fa-solid fa-trash-can" />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <i className="fa-solid fa-image text-2xl text-slate-300" />
                                    </div>
                                    <p className="text-sm font-black text-slate-500 mb-1">อัปโหลดรูปแผนผัง</p>
                                    <p className="text-[10px] text-slate-400 mb-4">รองรับ PNG, JPG (ขนาดไม่เกิน 1MB)</p>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        id="map-upload"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => setField('map_image', reader.result);
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                    <label htmlFor="map-upload" className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-800 transition shadow-sm">
                                        เลือกรูปภาพ
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogisticsView;
