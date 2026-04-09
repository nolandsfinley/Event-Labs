import React, { useState, useEffect, useCallback } from 'react';

const timeToMin = (t) => {
    if (!t) return 0;
    const [h, m] = (t || '00:00').split(':').map(Number);
    return h * 60 + m;
};

const formatTime = (date) => date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const formatDate = (date) => date.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const load = (key, def) => { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? def; } catch { return def; } };

const STATUS_COLORS = {
    ok: 'bg-green-100 text-green-700 border-green-200',
    issue: 'bg-amber-100 text-amber-700 border-amber-200',
    critical: 'bg-red-100 text-red-700 border-red-200',
};

const DayOfModeView = ({ projectId, project, onNavigate }) => {
    const [now, setNow] = useState(new Date());
    const [stationStatus, setStationStatus] = useState(() => load(`eflow_dayof_stations_${projectId}`, [
        { id: 's1', name: 'ลงทะเบียน', status: 'ok', note: '' },
        { id: 's2', name: 'เวที / AV', status: 'ok', note: '' },
        { id: 's3', name: 'อาหาร / Catering', status: 'ok', note: '' },
        { id: 's4', name: 'ที่จอดรถ', status: 'ok', note: '' },
        { id: 's5', name: 'รปภ. / Security', status: 'ok', note: '' },
        { id: 's6', name: 'ทีมแพทย์', status: 'ok', note: '' },
    ]));
    const [issueLog, setIssueLog] = useState(() => load(`eflow_dayof_issues_${projectId}`, []));
    const [newIssue, setNewIssue] = useState('');
    const [newStationName, setNewStationName] = useState('');
    const [showAddStation, setShowAddStation] = useState(false);

    // Load related module data
    const ros = load(`eflow_ros_${projectId}`, []);
    const contacts = load(`eflow_contacts_${projectId}`, []);
    const sops = load(`eflow_sop_${projectId}`, []);

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        localStorage.setItem(`eflow_dayof_stations_${projectId}`, JSON.stringify(stationStatus));
    }, [stationStatus, projectId]);

    useEffect(() => {
        localStorage.setItem(`eflow_dayof_issues_${projectId}`, JSON.stringify(issueLog));
    }, [issueLog, projectId]);

    const nowMin = now.getHours() * 60 + now.getMinutes();
    const sortedRos = [...ros].sort((a, b) => timeToMin(a.time) - timeToMin(b.time));
    const currentEvent = sortedRos.find(i => {
        const s = timeToMin(i.time);
        const e = s + (i.duration || 60);
        return nowMin >= s && nowMin < e;
    });
    const nextEvent = sortedRos.find(i => timeToMin(i.time) > nowMin);

    const priorityContacts = contacts.filter(c => c.priority || c.group === 'staff' || c.group === 'medical');

    const updateStation = (id, field, value) => {
        setStationStatus(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const addStation = () => {
        if (!newStationName.trim()) return;
        const next = { id: `s-${Date.now()}`, name: newStationName, status: 'ok', note: '' };
        setStationStatus(prev => [...prev, next]);
        setNewStationName(''); setShowAddStation(false);
    };

    const removeStation = (id) => setStationStatus(prev => prev.filter(s => s.id !== id));

    const logIssue = () => {
        if (!newIssue.trim()) return;
        setIssueLog(prev => [{ id: Date.now(), text: newIssue, time: now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }), resolved: false }, ...prev]);
        setNewIssue('');
    };

    const toggleResolve = (id) => setIssueLog(prev => prev.map(i => i.id === id ? { ...i, resolved: !i.resolved } : i));
    const clearResolved = () => setIssueLog(prev => prev.filter(i => !i.resolved));

    const openIssues = issueLog.filter(i => !i.resolved).length;
    const criticalStations = stationStatus.filter(s => s.status === 'critical').length;
    const issueStations = stationStatus.filter(s => s.status === 'issue').length;

    // Time to next event
    const nextCountdown = nextEvent ? timeToMin(nextEvent.time) - nowMin : null;
    const countdownDisplay = nextCountdown !== null
        ? nextCountdown <= 0 ? 'เริ่มแล้ว!' : `${Math.floor(nextCountdown / 60)}ชม. ${nextCountdown % 60}น.`
        : 'ไม่มีกำหนดการถัดไป';

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 text-white">
            {/* TOP BAR */}
            <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <p className="text-green-400 font-black text-xs tracking-widest uppercase">DAY-OF MODE · ACTIVE</p>
                    <span className="text-slate-500 text-xs">{project?.name || 'งาน'}</span>
                </div>
                <div className="flex gap-3 text-xs">
                    {criticalStations > 0 && <span className="bg-red-500/20 text-red-400 font-black px-3 py-1 rounded-full border border-red-500/30">{criticalStations} วิกฤต</span>}
                    {openIssues > 0 && <span className="bg-amber-500/20 text-amber-400 font-black px-3 py-1 rounded-full border border-amber-500/30">{openIssues} ปัญหา</span>}
                    <button onClick={() => onNavigate?.('dashboard')} className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full font-bold hover:bg-slate-600 transition">
                        <i className="fa-solid fa-compress text-[10px] mr-1" /> ออก
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
                {/* CLOCK + CURRENT EVENT */}
                <div className="grid grid-cols-3 gap-4 mb-5">
                    {/* Clock */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center">
                        <p className="text-5xl font-black tracking-tight text-white tabular-nums">
                            {now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{formatDate(now)}</p>
                        <p className="text-slate-600 text-[10px] mt-0.5">{now.getSeconds().toString().padStart(2, '0')}s</p>
                    </div>

                    {/* Current Event */}
                    <div className={`rounded-2xl p-5 border ${currentEvent ? 'bg-green-900/30 border-green-700/50' : 'bg-slate-900 border-slate-800'}`}>
                        <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-2">กำลังดำเนินการ</p>
                        {currentEvent ? (
                            <>
                                <p className="text-lg font-black text-green-300 leading-tight">{currentEvent.title}</p>
                                {currentEvent.owner && <p className="text-xs text-slate-400 mt-1"><i className="fa-solid fa-user text-[10px] mr-1" />{currentEvent.owner}</p>}
                                <div className="flex items-center gap-2 mt-2">
                                    <i className="fa-solid fa-circle fa-beat text-green-400 text-[8px]" />
                                    <p className="text-xs text-green-400 font-bold">{currentEvent.time} · {currentEvent.duration}น.</p>
                                </div>
                            </>
                        ) : (
                            <p className="text-slate-500 text-sm font-bold">ไม่มีกิจกรรม</p>
                        )}
                    </div>

                    {/* Next Event */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                        <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-2">ถัดไป</p>
                        {nextEvent ? (
                            <>
                                <p className="text-sm font-black text-slate-200 leading-tight">{nextEvent.title}</p>
                                <p className="text-xs text-slate-400 mt-1">{nextEvent.time}</p>
                                <div className="mt-2 flex items-center gap-1.5">
                                    <i className="fa-solid fa-clock text-amber-400 text-xs" />
                                    <p className="text-xs text-amber-400 font-black">{countdownDisplay}</p>
                                </div>
                            </>
                        ) : (
                            <p className="text-slate-500 text-sm font-bold">{countdownDisplay}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {/* LEFT: Station Status */}
                    <div className="col-span-2 space-y-4">
                        {/* Station Status Grid */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">สถานะ Station</p>
                                <div className="flex gap-2">
                                    <button onClick={() => setShowAddStation(v => !v)} className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1">
                                        <i className="fa-solid fa-plus" /> เพิ่ม
                                    </button>
                                </div>
                            </div>

                            {showAddStation && (
                                <div className="flex gap-2 mb-3">
                                    <input value={newStationName} onChange={e => setNewStationName(e.target.value)} placeholder="ชื่อ Station"
                                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none text-white" autoFocus />
                                    <button onClick={addStation} className="px-3 py-2 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 transition">+ เพิ่ม</button>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                {stationStatus.map(station => (
                                    <div key={station.id} className={`rounded-xl border p-3 ${station.status === 'ok' ? 'bg-green-900/20 border-green-700/30' : station.status === 'issue' ? 'bg-amber-900/20 border-amber-700/30' : 'bg-red-900/30 border-red-700/40'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${station.status === 'ok' ? 'bg-green-400' : station.status === 'issue' ? 'bg-amber-400' : 'bg-red-400 animate-pulse'}`} />
                                                <p className="text-xs font-black text-white">{station.name}</p>
                                            </div>
                                            <button onClick={() => removeStation(station.id)} className="text-slate-600 hover:text-red-400 text-[10px]">
                                                <i className="fa-solid fa-times" />
                                            </button>
                                        </div>
                                        <div className="flex gap-1.5 mb-2">
                                            {['ok', 'issue', 'critical'].map(s => (
                                                <button key={s} onClick={() => updateStation(station.id, 'status', s)}
                                                    className={`text-[9px] font-black px-2 py-0.5 rounded-full border transition ${station.status === s
                                                        ? s === 'ok' ? 'bg-green-500 text-white border-green-600' : s === 'issue' ? 'bg-amber-500 text-white border-amber-600' : 'bg-red-500 text-white border-red-600'
                                                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                                                        }`}>
                                                    {s === 'ok' ? '✓ ปกติ' : s === 'issue' ? '⚠ มีปัญหา' : '🔴 วิกฤต'}
                                                </button>
                                            ))}
                                        </div>
                                        <input value={station.note} onChange={e => updateStation(station.id, 'note', e.target.value)}
                                            placeholder="หมายเหตุ..." className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-[10px] text-slate-300 outline-none" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Issue Log */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Issue Log</p>
                                    {openIssues > 0 && <span className="text-[9px] bg-amber-500/20 text-amber-400 font-black px-2 py-0.5 rounded-full border border-amber-500/30">{openIssues} ค้างอยู่</span>}
                                </div>
                                {issueLog.some(i => i.resolved) && (
                                    <button onClick={clearResolved} className="text-[10px] font-bold text-slate-500 hover:text-red-400">ลบที่แก้แล้ว</button>
                                )}
                            </div>
                            <div className="flex gap-2 mb-3">
                                <input value={newIssue} onChange={e => setNewIssue(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && logIssue()}
                                    placeholder="บันทึกปัญหา... (Enter เพื่อบันทึก)"
                                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none text-white placeholder-slate-500 focus:border-red-500/50" />
                                <button onClick={logIssue} disabled={!newIssue.trim()} className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition disabled:opacity-30">
                                    <i className="fa-solid fa-triangle-exclamation mr-1" /> Log
                                </button>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {issueLog.length === 0 && <p className="text-slate-600 text-xs font-bold text-center py-4">ไม่มีปัญหา ✅</p>}
                                {issueLog.map(issue => (
                                    <div key={issue.id} className={`flex items-start gap-3 p-2.5 rounded-xl border transition ${issue.resolved ? 'bg-slate-800/30 border-slate-800 opacity-50' : 'bg-red-900/20 border-red-800/30'}`}>
                                        <button onClick={() => toggleResolve(issue.id)} className="shrink-0 mt-0.5">
                                            <i className={`fa-solid ${issue.resolved ? 'fa-circle-check text-green-500' : 'fa-triangle-exclamation text-red-400'} text-sm`} />
                                        </button>
                                        <p className={`flex-1 text-xs font-bold ${issue.resolved ? 'text-slate-500 line-through' : 'text-white'}`}>{issue.text}</p>
                                        <span className="text-[10px] text-slate-500 shrink-0">{issue.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Contacts + ROS Mini + SOPs */}
                    <div className="space-y-4">
                        {/* Emergency Contacts */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                            <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-3">ติดต่อด่วน</p>
                            {priorityContacts.length === 0 ? (
                                <div className="text-center py-4">
                                    <p className="text-slate-600 text-xs font-bold">เพิ่มผู้ติดต่อใน Contact Hub</p>
                                    <button onClick={() => onNavigate?.('contacts')} className="mt-2 text-xs text-blue-400 font-bold hover:underline">→ ไปที่ Contact Hub</button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {priorityContacts.slice(0, 6).map(c => (
                                        <div key={c.id} className="flex items-center gap-2 group">
                                            <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                                                <i className="fa-solid fa-user text-slate-400 text-xs" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-white truncate">{c.name}</p>
                                                <p className="text-[10px] text-slate-500 truncate">{c.role}</p>
                                            </div>
                                            <a href={`tel:${c.phone}`} className="w-7 h-7 bg-green-700/50 text-green-400 rounded-lg flex items-center justify-center hover:bg-green-600 transition shrink-0">
                                                <i className="fa-solid fa-phone text-[10px]" />
                                            </a>
                                        </div>
                                    ))}
                                    {priorityContacts.length > 6 && (
                                        <button onClick={() => onNavigate?.('contacts')} className="text-[10px] text-slate-500 font-bold hover:text-white w-full text-center pt-1">+{priorityContacts.length - 6} รายการอื่น</button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Timeline Mini */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                            <div className="flex justify-between items-center mb-3">
                                <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Timeline วันนี้</p>
                                <button onClick={() => onNavigate?.('runofshow')} className="text-[10px] text-blue-400 font-bold hover:underline">ดูทั้งหมด</button>
                            </div>
                            <div className="space-y-1.5 max-h-52 overflow-y-auto">
                                {sortedRos.length === 0 && <p className="text-slate-600 text-xs font-bold text-center py-3">ไม่มีกำหนดการ</p>}
                                {sortedRos.map(item => {
                                    const start = timeToMin(item.time);
                                    const end = start + (item.duration || 60);
                                    const isActive = nowMin >= start && nowMin < end;
                                    const isPast = nowMin >= end;
                                    return (
                                        <div key={item.id} className={`flex gap-2 items-start px-2 py-1.5 rounded-lg ${isActive ? 'bg-green-900/40' : isPast ? 'opacity-40' : ''}`}>
                                            <p className={`text-[10px] font-black shrink-0 w-10 ${isActive ? 'text-green-400' : 'text-slate-500'}`}>{item.time}</p>
                                            <p className={`text-[10px] font-bold leading-tight ${isActive ? 'text-green-300' : 'text-slate-300'}`}>{item.title}</p>
                                            {isActive && <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse mt-0.5" />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Active SOPs */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                            <div className="flex justify-between items-center mb-3">
                                <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">SOPs ฉุกเฉิน</p>
                                <button onClick={() => onNavigate?.('sop')} className="text-[10px] text-blue-400 font-bold hover:underline">ดูทั้งหมด</button>
                            </div>
                            {sops.length === 0 ? (
                                <p className="text-slate-600 text-xs font-bold text-center py-3">ไม่มี SOP</p>
                            ) : (
                                <div className="space-y-1.5">
                                    {sops.slice(0, 4).map(sop => (
                                        <div key={sop.id} className="flex items-center gap-2 px-2 py-1.5 bg-slate-800/50 rounded-lg">
                                            <i className="fa-solid fa-triangle-exclamation text-amber-400 text-[10px]" />
                                            <p className="text-[10px] text-slate-300 font-bold flex-1 truncate">{sop.title || sop.name}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DayOfModeView;
