import React, { useState, useEffect, useRef } from 'react';

const getKey = (pid) => `eflow_media_${pid || 'global'}`;
const load = (pid) => { try { return JSON.parse(localStorage.getItem(getKey(pid)) || '[]'); } catch { return []; } };
const save = (d, pid) => localStorage.setItem(getKey(pid), JSON.stringify(d));

const CATEGORIES = [
    { id: 'logo', label: 'โลโก้ & Brand', icon: 'fa-paintbrush', color: 'bg-purple-100 text-purple-600' },
    { id: 'floorplan', label: 'ผังสถานที่', icon: 'fa-border-all', color: 'bg-blue-100 text-blue-600' },
    { id: 'contract', label: 'สัญญา & เอกสาร', icon: 'fa-file-contract', color: 'bg-green-100 text-green-600' },
    { id: 'presentation', label: 'Slides & Presentation', icon: 'fa-display', color: 'bg-amber-100 text-amber-600' },
    { id: 'permit', label: 'ใบอนุญาต & Permit', icon: 'fa-stamp', color: 'bg-red-100 text-red-600' },
    { id: 'photo', label: 'รูปภาพ', icon: 'fa-image', color: 'bg-pink-100 text-pink-600' },
    { id: 'video', label: 'วิดีโอ', icon: 'fa-video', color: 'bg-indigo-100 text-indigo-600' },
    { id: 'other', label: 'อื่นๆ', icon: 'fa-folder', color: 'bg-slate-100 text-slate-500' },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

const isImageUrl = (url) => /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url) || url.startsWith('data:image');
const isImageDataUrl = (url) => url?.startsWith('data:image');

const DEFAULT_FORM = { name: '', category: 'other', url: '', note: '', type: 'url' };

const MediaVaultView = ({ projectId }) => {
    const [assets, setAssets] = useState(() => load(projectId));
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(DEFAULT_FORM);
    const [editId, setEditId] = useState(null);
    const [filterCat, setFilterCat] = useState('all');
    const [view, setView] = useState('grid'); // grid | list
    const [search, setSearch] = useState('');
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef();

    useEffect(() => save(assets, projectId), [assets, projectId]);

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert('ไฟล์ใหญ่เกิน 2MB ครับ กรุณาใช้ URL แทน');
            return;
        }
        setUploading(true);
        const reader = new FileReader();
        reader.onload = (ev) => {
            setForm(f => ({
                ...f,
                url: ev.target.result,
                name: f.name || file.name.replace(/\.[^.]+$/, ''),
                type: 'file',
                fileType: file.type,
                fileName: file.name,
                fileSize: file.size,
            }));
            setUploading(false);
        };
        reader.readAsDataURL(file);
    };

    const submit = () => {
        if (!form.name.trim()) return;
        const entry = { ...form };
        if (editId) {
            setAssets(p => p.map(a => a.id === editId ? { ...a, ...entry } : a));
            setEditId(null);
        } else {
            setAssets(p => [...p, { id: Date.now().toString(), addedAt: new Date().toISOString(), ...entry }]);
        }
        setForm(DEFAULT_FORM);
        setShowForm(false);
    };

    const remove = (id) => { if (confirm('ลบไฟล์นี้?')) setAssets(p => p.filter(a => a.id !== id)); };
    const startEdit = (a) => { setForm({ name: a.name, category: a.category, url: a.url, note: a.note || '', type: a.type || 'url', fileType: a.fileType, fileName: a.fileName }); setEditId(a.id); setShowForm(true); };

    const filtered = assets
        .filter(a => filterCat === 'all' || a.category === filterCat)
        .filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || (a.note || '').toLowerCase().includes(search.toLowerCase()));

    const catCounts = assets.reduce((acc, a) => { acc[a.category] = (acc[a.category] || 0) + 1; return acc; }, {});

    const AssetCard = ({ asset }) => {
        const cat = CAT_MAP[asset.category] || CAT_MAP['other'];
        const isImg = isImageUrl(asset.url);
        return (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition group">
                {/* Thumbnail */}
                <div className="h-36 bg-slate-50 flex items-center justify-center relative overflow-hidden">
                    {isImg ? (
                        <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                    ) : (
                        <div className={`w-14 h-14 rounded-2xl ${cat.color.replace('text-', 'bg-').split(' ')[0]} bg-opacity-20 flex items-center justify-center`}>
                            <i className={`fa-solid ${cat.icon} ${cat.color.split(' ')[1]} text-2xl`} />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button onClick={() => setPreview(asset)} className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                            <i className="fa-solid fa-expand text-slate-700 text-xs" />
                        </button>
                        {asset.url && !isImageDataUrl(asset.url) && (
                            <a href={asset.url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                                <i className="fa-solid fa-arrow-up-right-from-square text-slate-700 text-xs" />
                            </a>
                        )}
                        {isImageDataUrl(asset.url) && (
                            <a href={asset.url} download={asset.fileName || asset.name} className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                                <i className="fa-solid fa-download text-slate-700 text-xs" />
                            </a>
                        )}
                    </div>
                </div>
                {/* Info */}
                <div className="p-3">
                    <p className="text-xs font-black text-slate-800 truncate">{asset.name}</p>
                    <div className="flex items-center justify-between mt-1">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${cat.color}`}>{cat.label}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => startEdit(asset)} className="w-5 h-5 bg-blue-50 text-blue-500 rounded flex items-center justify-center text-[9px]">
                                <i className="fa-solid fa-pen" />
                            </button>
                            <button onClick={() => remove(asset.id)} className="w-5 h-5 bg-red-50 text-red-400 rounded flex items-center justify-center text-[9px]">
                                <i className="fa-solid fa-trash" />
                            </button>
                        </div>
                    </div>
                    {asset.note && <p className="text-[10px] text-slate-400 mt-1 truncate">{asset.note}</p>}
                </div>
            </div>
        );
    };

    const AssetRow = ({ asset }) => {
        const cat = CAT_MAP[asset.category] || CAT_MAP['other'];
        return (
            <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-50 hover:bg-slate-50/50 group">
                <div className={`w-8 h-8 rounded-lg ${cat.color.split(' ')[0]} bg-opacity-30 flex items-center justify-center shrink-0`}>
                    {isImageUrl(asset.url) ? (
                        <img src={asset.url} alt="" className="w-8 h-8 rounded-lg object-cover" onError={() => { }} />
                    ) : (
                        <i className={`fa-solid ${cat.icon} ${cat.color.split(' ')[1]} text-xs`} />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-800">{asset.name}</p>
                    {asset.note && <p className="text-[10px] text-slate-400">{asset.note}</p>}
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${cat.color}`}>{cat.label}</span>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition shrink-0">
                    {asset.url && !isImageDataUrl(asset.url) && (
                        <a href={asset.url} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-blue-50 text-blue-500 rounded-lg text-[10px] font-bold flex items-center gap-1">
                            <i className="fa-solid fa-arrow-up-right-from-square text-[9px]" /> เปิด
                        </a>
                    )}
                    {isImageDataUrl(asset.url) && (
                        <a href={asset.url} download={asset.fileName || asset.name} className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-bold flex items-center gap-1">
                            <i className="fa-solid fa-download text-[9px]" /> โหลด
                        </a>
                    )}
                    <button onClick={() => startEdit(asset)} className="w-6 h-6 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center"><i className="fa-solid fa-pen text-[9px]" /></button>
                    <button onClick={() => remove(asset.id)} className="w-6 h-6 bg-red-50 text-red-400 rounded-lg flex items-center justify-center"><i className="fa-solid fa-trash text-[9px]" /></button>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 overflow-hidden bg-[#f5f5f7] flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-8 py-5 flex flex-wrap justify-between items-center gap-3 shrink-0">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">📸 Media & Asset Vault</h2>
                    <p className="text-sm text-slate-400 font-medium">{assets.length} ไฟล์ · จัดเก็บ URL และไฟล์ขนาดเล็ก (≤ 2MB)</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-300 text-xs" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหา..." className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none w-40" />
                    </div>
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                        <button onClick={() => setView('grid')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${view === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'}`}>
                            <i className="fa-solid fa-grid-2 text-slate-600 text-xs" />
                        </button>
                        <button onClick={() => setView('list')} className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${view === 'list' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'}`}>
                            <i className="fa-solid fa-list text-slate-600 text-xs" />
                        </button>
                    </div>
                    <button onClick={() => { setEditId(null); setForm(DEFAULT_FORM); setShowForm(v => !v); }}
                        className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition flex items-center gap-2">
                        <i className="fa-solid fa-plus" /> เพิ่มไฟล์
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar categories */}
                <div className="w-48 border-r border-slate-100 bg-white overflow-y-auto shrink-0 py-3">
                    <button onClick={() => setFilterCat('all')} className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition ${filterCat === 'all' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                        <i className="fa-solid fa-layer-group w-4 text-center" />
                        <span className="flex-1">ทั้งหมด</span>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full font-black">{assets.length}</span>
                    </button>
                    {CATEGORIES.map(cat => (
                        <button key={cat.id} onClick={() => setFilterCat(cat.id)} className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition ${filterCat === cat.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                            <i className={`fa-solid ${cat.icon} w-4 text-center text-[11px] ${cat.color.split(' ')[1]}`} />
                            <span className="flex-1 text-left leading-tight">{cat.label}</span>
                            {catCounts[cat.id] > 0 && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full font-black">{catCounts[cat.id]}</span>}
                        </button>
                    ))}
                </div>

                {/* Main content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Add/Edit Form */}
                    {showForm && (
                        <div className="bg-blue-50 border-b border-blue-100 p-5">
                            <h4 className="text-sm font-black text-blue-800 mb-4">{editId ? 'แก้ไขไฟล์' : '+ เพิ่มไฟล์ใหม่'}</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="ชื่อไฟล์ *" autoFocus className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none">
                                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                </select>
                                <div className="col-span-2">
                                    <div className="flex gap-2 mb-2">
                                        <button onClick={() => setForm(f => ({ ...f, type: 'url' }))} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${form.type === 'url' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                            🔗 URL / Link
                                        </button>
                                        <button onClick={() => { setForm(f => ({ ...f, type: 'file' })); fileRef.current?.click(); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${form.type === 'file' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                            📁 อัปโหลด (≤2MB)
                                        </button>
                                        <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" />
                                        {uploading && <span className="text-xs text-blue-500 font-bold flex items-center gap-1"><i className="fa-solid fa-spinner fa-spin" /> กำลังโหลด...</span>}
                                    </div>
                                    {form.type === 'url' ? (
                                        <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                                    ) : form.url ? (
                                        <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
                                            <i className="fa-solid fa-check-circle text-green-500" />
                                            <span className="text-xs text-green-700 font-bold">{form.fileName || 'ไฟล์อัปโหลดแล้ว'}</span>
                                            <button onClick={() => setForm(f => ({ ...f, url: '', fileName: '' }))} className="ml-auto text-slate-400 hover:text-red-400"><i className="fa-solid fa-times text-xs" /></button>
                                        </div>
                                    ) : (
                                        <button onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-slate-200 rounded-xl py-4 text-sm text-slate-400 font-bold hover:border-blue-300 hover:text-blue-500 transition flex items-center justify-center gap-2">
                                            <i className="fa-solid fa-cloud-arrow-up" /> คลิกเพื่อเลือกไฟล์ (≤2MB)
                                        </button>
                                    )}
                                </div>
                                <div className="col-span-2">
                                    <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="หมายเหตุ (optional)" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none" />
                                </div>
                            </div>
                            {form.url && isImageUrl(form.url) && (
                                <div className="mt-3">
                                    <p className="text-[10px] text-slate-400 mb-1">Preview:</p>
                                    <img src={form.url} alt="preview" className="max-h-24 rounded-xl object-cover" onError={() => { }} />
                                </div>
                            )}
                            <div className="flex gap-2 mt-3">
                                <button onClick={submit} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition">{editId ? 'บันทึก' : '+ เพิ่ม'}</button>
                                <button onClick={() => { setShowForm(false); setEditId(null); }} className="px-5 py-2.5 bg-white border text-sm font-bold rounded-xl hover:bg-slate-50 transition">ยกเลิก</button>
                            </div>
                        </div>
                    )}

                    {filtered.length === 0 ? (
                        <div className="text-center py-20">
                            <i className="fa-solid fa-photo-film text-slate-200 text-5xl mb-4 block" />
                            <p className="text-slate-400 font-bold text-lg mb-1">ยังไม่มีไฟล์ในหมวดนี้</p>
                            <button onClick={() => setShowForm(true)} className="mt-3 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-700 transition">+ เพิ่มไฟล์แรก</button>
                        </div>
                    ) : view === 'grid' ? (
                        <div className="p-5 grid grid-cols-3 xl:grid-cols-4 gap-4">
                            {filtered.map(a => <AssetCard key={a.id} asset={a} />)}
                        </div>
                    ) : (
                        <div className="bg-white m-5 rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                            <div className="grid grid-cols-[32px_1fr_120px_200px_120px] gap-4 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                                {['', 'ชื่อไฟล์', 'หมวด', 'หมายเหตุ', ''].map((h, i) => (
                                    <p key={i} className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{h}</p>
                                ))}
                            </div>
                            {filtered.map(a => <AssetRow key={a.id} asset={a} />)}
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Modal */}
            {preview && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6" onClick={() => setPreview(null)}>
                    <div className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                        {isImageUrl(preview.url) ? (
                            <img src={preview.url} alt={preview.name} className="w-full max-h-96 object-contain bg-slate-100" />
                        ) : (
                            <div className="h-48 bg-slate-50 flex items-center justify-center">
                                <div className={`w-20 h-20 rounded-2xl ${(CAT_MAP[preview.category]?.color || '').split(' ')[0]} bg-opacity-20 flex items-center justify-center`}>
                                    <i className={`fa-solid ${CAT_MAP[preview.category]?.icon || 'fa-file'} text-4xl ${(CAT_MAP[preview.category]?.color || '').split(' ')[1]}`} />
                                </div>
                            </div>
                        )}
                        <div className="p-5">
                            <h3 className="text-lg font-black text-slate-800">{preview.name}</h3>
                            <p className="text-sm text-slate-400 mt-1">{preview.note}</p>
                            <div className="flex gap-2 mt-4">
                                {preview.url && !isImageDataUrl(preview.url) && (
                                    <a href={preview.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition flex items-center gap-2">
                                        <i className="fa-solid fa-arrow-up-right-from-square" /> เปิด URL
                                    </a>
                                )}
                                {isImageDataUrl(preview.url) && (
                                    <a href={preview.url} download={preview.fileName || preview.name} className="px-4 py-2 bg-green-600 text-white font-bold text-sm rounded-xl hover:bg-green-700 transition flex items-center gap-2">
                                        <i className="fa-solid fa-download" /> Download
                                    </a>
                                )}
                                <button onClick={() => setPreview(null)} className="px-4 py-2 bg-slate-100 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-200 transition">ปิด</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaVaultView;
