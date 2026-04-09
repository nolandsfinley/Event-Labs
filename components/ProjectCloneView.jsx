import React, { useState } from 'react';
import QRCode from 'qrcode';

// All module keys to clone
const MODULE_KEYS = [
    'checklist', 'budget', 'vendors', 'guests', 'equipment',
    'ros', 'contacts', 'sop', 'notes', 'catering',
    'budget_actual', 'vendor_scorecard', 'logistics', 'tickets',
    'multiday', 'media', 'regform', 'debrief',
];

const ProjectCloneView = ({ projectId, project, onBack, onCloneSuccess }) => {
    const [cloneName, setCloneName] = useState(`${project?.name || 'งาน'} (สำเนา)`);
    const [cloneDate, setCloneDate] = useState('');
    const [copyData, setCopyData] = useState({
        checklist: true, budget: true, vendors: true,
        equipment: false, guests: false, ros: false,
        contacts: true, sop: true, notes: false, catering: false,
        budget_actual: false, vendor_scorecard: false, logistics: false,
        tickets: false, multiday: false, media: true,
    });
    const [done, setDone] = useState(false);
    const [newId, setNewId] = useState(null);

    const LABELS = {
        checklist: 'Checklist', budget: 'งบประมาณ', vendors: 'Vendors',
        equipment: 'อุปกรณ์', guests: 'ผู้เข้าร่วม', ros: 'Run-of-Show',
        contacts: 'Contact Hub', sop: 'SOP Templates', notes: 'Event Notes',
        catering: 'Catering', budget_actual: 'Budget vs Actual',
        vendor_scorecard: 'Vendor Scorecard', logistics: 'Logistics',
        tickets: 'Tickets & QR', multiday: 'Multi-Day', media: 'Media Vault',
    };

    const executeClone = () => {
        if (!cloneName.trim()) return;
        const id = `layout-${Date.now()}`;

        // Clone selected module data
        MODULE_KEYS.forEach(key => {
            if (!copyData[key]) return;
            const src = localStorage.getItem(`eflow_${key}_${projectId}`);
            if (src) localStorage.setItem(`eflow_${key}_${id}`, src);
        });

        // Create new project object (apps reads from cloudLayouts state — we call back for this)
        const newProject = {
            ...project,
            id,
            name: cloneName,
            eventDate: cloneDate || project?.eventDate || '',
            updatedAt: Date.now(),
            clonedFrom: projectId,
        };

        if (onCloneSuccess) onCloneSuccess(newProject);
        setNewId(id);
        setDone(true);
    };

    if (done) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#f5f5f7]">
                <div className="bg-white rounded-2xl border border-slate-100 p-10 max-w-md w-full shadow-lg text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <i className="fa-solid fa-copy text-green-500 text-2xl" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">Clone สำเร็จ! 🎉</h3>
                    <p className="text-sm text-slate-500 mb-1">โปรเจกต์ใหม่: <span className="font-bold text-slate-700">{cloneName}</span></p>
                    <p className="text-xs text-slate-400 mb-6">ข้อมูลถูก Clone ไปยังโปรเจกต์ใหม่เรียบร้อย</p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={onBack} className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-700 transition">
                            ← กลับไปยัง Projects
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-[#f5f5f7]">
            <div className="bg-white border-b border-slate-100 px-8 py-5 flex items-center gap-4">
                <button onClick={onBack} className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-slate-200 transition">
                    <i className="fa-solid fa-arrow-left text-slate-600 text-xs" />
                </button>
                <div>
                    <h2 className="text-2xl font-black text-slate-800">🔄 Clone โปรเจกต์</h2>
                    <p className="text-sm text-slate-400 font-medium">Copy ข้อมูลจาก "{project?.name}" ไปยังโปรเจกต์ใหม่</p>
                </div>
            </div>

            <div className="p-6 max-w-2xl mx-auto space-y-5">
                {/* New project info */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <p className="text-sm font-black text-slate-700 mb-4">ข้อมูลโปรเจกต์ใหม่</p>
                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 block mb-1.5">ชื่องาน *</label>
                            <input value={cloneName} onChange={e => setCloneName(e.target.value)} autoFocus
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 block mb-1.5">วันงานใหม่ (optional)</label>
                            <input type="date" value={cloneDate} onChange={e => setCloneDate(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                        </div>
                    </div>
                </div>

                {/* Data to copy */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm font-black text-slate-700">เลือก Module ที่จะ Copy</p>
                        <div className="flex gap-2">
                            <button onClick={() => setCopyData(Object.fromEntries(Object.keys(copyData).map(k => [k, true])))} className="text-xs font-bold text-blue-600 hover:underline">ทั้งหมด</button>
                            <button onClick={() => setCopyData(Object.fromEntries(Object.keys(copyData).map(k => [k, false])))} className="text-xs font-bold text-slate-400 hover:underline">ล้าง</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.entries(LABELS).map(([key, label]) => (
                            <label key={key} className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer ${copyData[key] ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}>
                                <input type="checkbox" checked={!!copyData[key]} onChange={e => setCopyData(prev => ({ ...prev, [key]: e.target.checked }))}
                                    className="accent-blue-600 w-4 h-4" />
                                <span className="text-xs font-bold text-slate-700">{label}</span>
                            </label>
                        ))}
                    </div>
                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <p className="text-xs text-amber-700 font-bold">
                            <i className="fa-solid fa-triangle-exclamation mr-1" />
                            ข้อมูล Guests, Run-of-Show, Debrief มักจะแตกต่างกันแต่ละงาน แนะนำไม่ต้อง Copy
                        </p>
                    </div>
                </div>

                {/* Clone button */}
                <button onClick={executeClone} disabled={!cloneName.trim()}
                    className={`w-full py-4 font-black text-lg rounded-2xl transition flex items-center justify-center gap-3 shadow-sm ${cloneName.trim() ? 'bg-slate-900 text-white hover:bg-slate-700 hover:shadow-md' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                    <i className="fa-solid fa-copy" /> Clone โปรเจกต์
                </button>
            </div>
        </div>
    );
};

export default ProjectCloneView;
