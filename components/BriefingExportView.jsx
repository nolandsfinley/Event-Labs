import React, { useState, useMemo, useRef } from 'react';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
const fmt = (n) => `฿${(n || 0).toLocaleString()}`;

const BriefingExportView = ({ projectId, project }) => {
    const [sections, setSections] = useState({
        header: true, runofshow: true, contacts: true, vendors: true,
        guests: true, budget: true, equipment: true, sop: true, catering: true, logistics: true,
    });
    const printRef = useRef();

    // ── Load all data from localStorage ──
    const ros = useMemo(() => { try { return JSON.parse(localStorage.getItem(`eflow_ros_${projectId}`) || '[]'); } catch { return []; } }, [projectId]);
    const contacts = useMemo(() => { try { return JSON.parse(localStorage.getItem(`eflow_contacts_${projectId}`) || '[]'); } catch { return []; } }, [projectId]);
    const vendors = useMemo(() => { try { return JSON.parse(localStorage.getItem(`eflow_vendors_${projectId}`) || '[]'); } catch { return []; } }, [projectId]);
    const guests = useMemo(() => { try { return JSON.parse(localStorage.getItem(`eflow_guests_${projectId}`) || '[]'); } catch { return []; } }, [projectId]);
    const budget = useMemo(() => { try { return JSON.parse(localStorage.getItem(`eflow_budget_${projectId}`) || '[]'); } catch { return []; } }, [projectId]);
    const equipment = useMemo(() => { try { return JSON.parse(localStorage.getItem(`eflow_equipment_${projectId}`) || '[]'); } catch { return []; } }, [projectId]);
    const sops = useMemo(() => { try { return JSON.parse(localStorage.getItem(`eflow_sop_${projectId}`) || '[]'); } catch { return []; } }, [projectId]);
    const catering = useMemo(() => { try { return JSON.parse(localStorage.getItem(`eflow_catering_${projectId}`) || 'null') || {}; } catch { return {}; } }, [projectId]);
    const logistics = useMemo(() => { try { return JSON.parse(localStorage.getItem(`eflow_logistics_${projectId}`) || 'null') || {}; } catch { return {}; } }, [projectId]);

    const sortedRos = [...ros].sort((a, b) => {
        const at = a.time?.split(':').map(Number); const bt = b.time?.split(':').map(Number);
        if (!at || !bt) return 0;
        return (at[0] * 60 + at[1]) - (bt[0] * 60 + bt[1]);
    });

    const totalExpense = budget.filter(i => i.type === 'expense').reduce((s, i) => s + i.amount, 0);
    const totalIncome = budget.filter(i => i.type === 'income').reduce((s, i) => s + i.amount, 0);
    const confirmedGuests = guests.filter(g => g.status === 'confirmed' || g.status === 'checkedin').length;

    const handlePrint = () => {
        const printContent = printRef.current?.innerHTML;
        const w = window.open('', '_blank', 'width=900,height=700');
        w.document.write(`
            <html><head>
            <meta charset="UTF-8">
            <title>Briefing — ${project?.name || 'Event'}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&family=Noto+Sans+Thai:wght@400;600;700;800&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: 'Sarabun', 'Noto Sans Thai', sans-serif; font-size: 13px; color: #1e293b; background: white; padding: 24px; }
                h1 { font-size: 22px; font-weight: 800; }
                h2 { font-size: 15px; font-weight: 800; margin: 20px 0 8px; padding: 6px 12px; background: #1e293b; color: white; border-radius: 6px; }
                h3 { font-size: 13px; font-weight: 700; color: #475569; margin: 10px 0 4px; }
                table { width: 100%; border-collapse: collapse; margin: 8px 0; }
                th { background: #f1f5f9; text-align: left; padding: 6px 10px; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
                td { padding: 6px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
                .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 800; }
                .badge-green { background: #dcfce7; color: #166534; }
                .badge-amber { background: #fef3c7; color: #92400e; }
                .badge-red { background: #fee2e2; color: #991b1b; }
                .badge-blue { background: #dbeafe; color: #1d4ed8; }
                .header-box { border: 2px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
                .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 8px 0; }
                .stat-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; }
                .stat-val { font-size: 20px; font-weight: 800; }
                .stat-label { font-size: 10px; color: #94a3b8; }
                .sop-step { display: flex; gap: 8px; align-items: flex-start; padding: 4px 0; }
                .sop-num { width: 20px; height: 20px; border-radius: 50%; background: #1e293b; color: white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; flex-shrink: 0; }
                .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: right; }
                @media print {
                    body { padding: 12px; }
                    h2 { break-before: auto; }
                    table { page-break-inside: auto; }
                    tr { page-break-inside: avoid; }
                }
            </style>
            </head><body>${printContent}<div class="footer">สร้างโดย Eflow Event OS · ${new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div></body></html>
        `);
        w.document.close();
        w.focus();
        setTimeout(() => { w.print(); }, 500);
    };

    const SectionToggle = ({ key2, label }) => (
        <label className="flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-slate-50">
            <input type="checkbox" checked={sections[key2]} onChange={e => setSections(p => ({ ...p, [key2]: e.target.checked }))} className="accent-blue-600 w-3.5 h-3.5" />
            <span className="text-xs font-bold text-slate-600">{label}</span>
        </label>
    );

    return (
        <div className="flex-1 overflow-hidden bg-[#f5f5f7] flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-8 py-5 flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">📤 Briefing Export</h2>
                    <p className="text-sm text-slate-400">สร้างเอกสาร Briefing สำหรับทีม Staff — พิมพ์หรือ Save เป็น PDF</p>
                </div>
                <button onClick={handlePrint}
                    className="px-6 py-2.5 bg-blue-600 text-white font-black text-sm rounded-xl hover:bg-blue-700 transition flex items-center gap-2 shadow-sm hover:shadow-md">
                    <i className="fa-solid fa-print" /> พิมพ์ / Export PDF
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Settings */}
                <div className="w-52 border-r border-slate-100 bg-white overflow-y-auto shrink-0 p-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">เลือกหัวข้อ</p>
                    <div className="space-y-0.5">
                        <SectionToggle key2="header" label="ข้อมูลงาน" />
                        <SectionToggle key2="runofshow" label="Run-of-Show" />
                        <SectionToggle key2="contacts" label="Contact Hub" />
                        <SectionToggle key2="vendors" label="Vendors" />
                        <SectionToggle key2="guests" label="ผู้เข้าร่วม" />
                        <SectionToggle key2="budget" label="งบประมาณ" />
                        <SectionToggle key2="equipment" label="อุปกรณ์" />
                        <SectionToggle key2="sop" label="SOP ฉุกเฉิน" />
                        <SectionToggle key2="catering" label="Catering" />
                        <SectionToggle key2="logistics" label="Parking & Logistics" />
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <button onClick={() => setSections(Object.fromEntries(Object.keys(sections).map(k => [k, true])))}
                            className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-lg mb-2">เลือกทั้งหมด</button>
                        <button onClick={() => setSections(Object.fromEntries(Object.keys(sections).map(k => [k, false])))}
                            className="w-full py-2 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg">ล้างทั้งหมด</button>
                    </div>
                </div>

                {/* Preview */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-200">
                    <div ref={printRef} className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden p-8 space-y-4 text-sm">

                        {/* Event Header */}
                        {sections.header && (
                            <div className="border-2 border-slate-200 rounded-xl p-5">
                                <h1 className="text-2xl font-black text-slate-900 mb-1">{project?.name || 'ชื่องาน'}</h1>
                                <p className="text-slate-500 font-medium">{fmtDate(project?.eventDate)}{project?.venue && ` · ${project.venue}`}</p>
                                <div className="grid grid-cols-4 gap-3 mt-4">
                                    {[
                                        { l: 'ผู้เข้าร่วม', v: `${guests.length} คน` },
                                        { l: 'Vendors', v: `${vendors.length} ราย` },
                                        { l: 'งบประมาณ', v: fmt(totalIncome || totalExpense) },
                                        { l: 'กำหนดการ', v: `${ros.length} ช่วง` },
                                    ].map(s => (
                                        <div key={s.l} className="bg-slate-50 rounded-xl p-3 text-center">
                                            <p className="text-lg font-black text-slate-800">{s.v}</p>
                                            <p className="text-[10px] text-slate-400 font-bold">{s.l}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Run of Show */}
                        {sections.runofshow && sortedRos.length > 0 && (
                            <div>
                                <h2 className="text-sm font-black bg-slate-900 text-white px-4 py-2 rounded-xl mb-3">🎬 Run-of-Show</h2>
                                <table className="w-full text-xs">
                                    <thead><tr className="bg-slate-50"><th className="px-3 py-2 text-left w-20">เวลา</th><th className="px-3 py-2 text-left">กิจกรรม</th><th className="px-3 py-2 text-left w-24">ผู้รับผิดชอบ</th><th className="px-3 py-2 text-left w-16">นาที</th></tr></thead>
                                    <tbody>
                                        {sortedRos.map(r => (
                                            <tr key={r.id} className="border-b border-slate-50">
                                                <td className="px-3 py-2 font-black">{r.time}</td>
                                                <td className="px-3 py-2 font-bold">{r.title}{r.note && <span className="text-slate-400 font-normal"> — {r.note}</span>}</td>
                                                <td className="px-3 py-2 text-slate-500">{r.owner || '—'}</td>
                                                <td className="px-3 py-2 text-slate-500">{r.duration}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Contacts */}
                        {sections.contacts && contacts.length > 0 && (
                            <div>
                                <h2 className="text-sm font-black bg-slate-900 text-white px-4 py-2 rounded-xl mb-3">📞 เบอร์ติดต่อฉุกเฉิน</h2>
                                <table className="w-full text-xs">
                                    <thead><tr className="bg-slate-50"><th className="px-3 py-2 text-left">ชื่อ</th><th className="px-3 py-2 text-left">หน้าที่</th><th className="px-3 py-2 text-left">เบอร์โทร</th><th className="px-3 py-2 text-left">กลุ่ม</th></tr></thead>
                                    <tbody>
                                        {contacts.sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0)).map(c => (
                                            <tr key={c.id} className="border-b border-slate-50">
                                                <td className="px-3 py-2 font-bold">{c.priority && '⭐ '}{c.name}</td>
                                                <td className="px-3 py-2 text-slate-500">{c.role}</td>
                                                <td className="px-3 py-2 font-black text-blue-700">{c.phone}{c.phone2 && ` / ${c.phone2}`}</td>
                                                <td className="px-3 py-2 text-slate-400">{c.group}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Vendors */}
                        {sections.vendors && vendors.length > 0 && (
                            <div>
                                <h2 className="text-sm font-black bg-slate-900 text-white px-4 py-2 rounded-xl mb-3">🤝 Vendors</h2>
                                <table className="w-full text-xs">
                                    <thead><tr className="bg-slate-50"><th className="px-3 py-2 text-left">Vendor</th><th className="px-3 py-2 text-left">ประเภท</th><th className="px-3 py-2 text-left">ติดต่อ</th><th className="px-3 py-2 text-left">สถานะ</th></tr></thead>
                                    <tbody>
                                        {vendors.map(v => (
                                            <tr key={v.id} className="border-b border-slate-50">
                                                <td className="px-3 py-2 font-bold">{v.name}</td>
                                                <td className="px-3 py-2 text-slate-500">{v.category || v.type || '—'}</td>
                                                <td className="px-3 py-2">{v.contact || v.phone || '—'}</td>
                                                <td className="px-3 py-2"><span className={`badge ${v.status === 'confirmed' ? 'badge-green' : v.status === 'pending' ? 'badge-amber' : 'badge-blue'}`}>{v.status || '—'}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Budget */}
                        {sections.budget && budget.length > 0 && (
                            <div>
                                <h2 className="text-sm font-black bg-slate-900 text-white px-4 py-2 rounded-xl mb-3">💰 งบประมาณ</h2>
                                <div className="grid grid-cols-3 gap-3 mb-3 text-center">
                                    <div className="bg-green-50 rounded-xl p-3"><p className="text-lg font-black text-green-700">{fmt(totalIncome)}</p><p className="text-[10px] text-slate-400">รายรับ</p></div>
                                    <div className="bg-red-50 rounded-xl p-3"><p className="text-lg font-black text-red-700">{fmt(totalExpense)}</p><p className="text-[10px] text-slate-400">รายจ่าย</p></div>
                                    <div className={`rounded-xl p-3 ${totalIncome - totalExpense >= 0 ? 'bg-blue-50' : 'bg-amber-50'}`}><p className={`text-lg font-black ${totalIncome - totalExpense >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>{fmt(totalIncome - totalExpense)}</p><p className="text-[10px] text-slate-400">คงเหลือ</p></div>
                                </div>
                            </div>
                        )}

                        {/* SOP */}
                        {sections.sop && sops.length > 0 && (
                            <div>
                                <h2 className="text-sm font-black bg-red-700 text-white px-4 py-2 rounded-xl mb-3">🚨 แผนรับมือฉุกเฉิน (SOP)</h2>
                                <div className="space-y-4">
                                    {sops.map(sop => (
                                        <div key={sop.id} className="border border-slate-200 rounded-xl p-4">
                                            <p className="font-black text-slate-800 mb-2">{sop.icon} {sop.title}</p>
                                            {sop.steps.map((step, i) => (
                                                <div key={i} className="flex gap-2 items-start py-1">
                                                    <span className="w-4 h-4 rounded-full bg-slate-800 text-white flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">{i + 1}</span>
                                                    <p className="text-xs text-slate-700">{step}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Equipment */}
                        {sections.equipment && equipment.length > 0 && (
                            <div>
                                <h2 className="text-sm font-black bg-slate-900 text-white px-4 py-2 rounded-xl mb-3">📦 อุปกรณ์ & วัสดุ</h2>
                                <table className="w-full text-xs">
                                    <thead><tr className="bg-slate-50"><th className="px-3 py-2 text-left">รายการ</th><th className="px-3 py-2 text-left">จำนวน</th><th className="px-3 py-2 text-left">ผู้รับผิดชอบ</th><th className="px-3 py-2 text-left">สถานะ</th></tr></thead>
                                    <tbody>
                                        {equipment.map(e => (
                                            <tr key={e.id} className="border-b border-slate-50">
                                                <td className="px-3 py-2 font-bold">{e.name}</td>
                                                <td className="px-3 py-2">{e.quantity} {e.unit || ''}</td>
                                                <td className="px-3 py-2 text-slate-500">{e.owner || '—'}</td>
                                                <td className="px-3 py-2"><span className={`badge ${e.status === 'arrived' || e.status === 'confirmed' ? 'badge-green' : e.status === 'missing' ? 'badge-red' : 'badge-amber'}`}>{e.status || '—'}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Logistics */}
                        {sections.logistics && (logistics.venue_name || logistics.parking?.total) && (
                            <div>
                                <h2 className="text-sm font-black bg-slate-900 text-white px-4 py-2 rounded-xl mb-3">🅿️ Parking & Logistics</h2>
                                {logistics.venue_name && <p className="text-xs font-bold mb-2">📍 {logistics.venue_name} — {logistics.venue_address}</p>}
                                {logistics.parking?.total && (
                                    <div className="grid grid-cols-4 gap-2 mb-2">
                                        {[['รวม', logistics.parking.total], ['VIP', logistics.parking.vip_reserved], ['ทั่วไป', logistics.parking.public], ['ผู้พิการ', logistics.parking.accessible]].map(([l, v]) => (
                                            <div key={l} className="bg-slate-50 rounded-xl p-2 text-center">
                                                <p className="text-base font-black">{v || 0}</p>
                                                <p className="text-[9px] text-slate-400">{l}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {logistics.transport_info && <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3">{logistics.transport_info}</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BriefingExportView;
