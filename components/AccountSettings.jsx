import React, { useState, useEffect, useRef } from 'react';

// ---- Helpers ----
const formatThaiDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
};

const PLAN_LABELS = {
    free: { label: 'Free Plan', color: 'bg-slate-100 text-slate-600', icon: 'fa-circle-user' },
    rental: { label: 'Pro Rental', color: 'bg-blue-100 text-blue-700', icon: 'fa-rocket' },
    lifetime: { label: '👑 Pro Lifetime', color: 'bg-amber-100 text-amber-700', icon: 'fa-crown' },
};

const BILLING_HISTORY = [
    { id: 'INV-001', date: '2024-03-01', plan: 'Pro Rental 3 เดือน', amount: 1200, status: 'paid' },
    { id: 'INV-002', date: '2023-12-01', plan: 'Pro Rental 1 เดือน', amount: 490, status: 'paid' },
];

// ---- Sub-components ----
const SectionCard = ({ icon, title, children }) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-50">
            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                <i className={`fa-solid ${icon} text-blue-600 text-sm`}></i>
            </div>
            <h2 className="font-black text-slate-800 text-sm">{title}</h2>
        </div>
        <div className="px-6 py-5">{children}</div>
    </div>
);

const Field = ({ label, hint, children }) => (
    <div className="grid grid-cols-3 gap-4 items-start py-3.5 border-b border-slate-50 last:border-0">
        <div>
            <p className="text-xs font-bold text-slate-700">{label}</p>
            {hint && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
        </div>
        <div className="col-span-2">{children}</div>
    </div>
);

const Toggle = ({ checked, onChange }) => (
    <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}
    >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
);

const SaveBtn = ({ onClick, saved, loading }) => (
    <button
        onClick={onClick}
        disabled={loading}
        className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${saved ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
    >
        {loading ? <i className="fa-solid fa-spinner fa-spin mr-1"></i> : saved ? <i className="fa-solid fa-check mr-1"></i> : null}
        {saved ? 'บันทึกแล้ว' : loading ? 'กำลังบันทึก...' : 'บันทึก'}
    </button>
);

// ---- Main Component ----
const AccountSettings = ({ currentUser, userPlan = { plan: 'free' }, setShowUpgradeModal }) => {
    const { plan, expiry } = userPlan;
    const planInfo = PLAN_LABELS[plan] || PLAN_LABELS.free;

    // Tab state
    const [activeSection, setActiveSection] = useState('profile');

    // Profile
    const [displayName, setDisplayName] = useState(currentUser?.email?.split('@')[0] || '');
    const [phone, setPhone] = useState('');
    const [avatarColor, setAvatarColor] = useState('#3b82f6');
    const [profileSaved, setProfileSaved] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);

    // Organization
    const [orgName, setOrgName] = useState('');
    const [orgTagline, setOrgTagline] = useState('');
    const [orgAddress, setOrgAddress] = useState('');
    const [orgSaved, setOrgSaved] = useState(false);

    // Notifications
    const [notifs, setNotifs] = useState({
        overdueAlert: true,
        ddayReminder: true,
        vendorFollowup: false,
        budgetWarning: true,
        weeklyReport: false,
    });

    // Preferences
    const [currency, setCurrency] = useState('THB');
    const [language, setLanguage] = useState('th');
    const [theme, setTheme] = useState('light');
    const [prefSaved, setPrefSaved] = useState(false);

    // Security
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteInput, setDeleteInput] = useState('');

    // Load from localStorage
    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('eflow_account_settings') || '{}');
        if (saved.displayName) setDisplayName(saved.displayName);
        if (saved.phone) setPhone(saved.phone);
        if (saved.avatarColor) setAvatarColor(saved.avatarColor);
        if (saved.orgName) setOrgName(saved.orgName);
        if (saved.orgTagline) setOrgTagline(saved.orgTagline);
        if (saved.orgAddress) setOrgAddress(saved.orgAddress);
        if (saved.notifs) setNotifs(prev => ({ ...prev, ...saved.notifs }));
        if (saved.currency) setCurrency(saved.currency);
        if (saved.language) setLanguage(saved.language);
        if (saved.theme) setTheme(saved.theme);
    }, []);

    const persist = (patch) => {
        const existing = JSON.parse(localStorage.getItem('eflow_account_settings') || '{}');
        localStorage.setItem('eflow_account_settings', JSON.stringify({ ...existing, ...patch }));
    };

    const saveProfile = () => {
        setProfileLoading(true);
        setTimeout(() => {
            persist({ displayName, phone, avatarColor });
            setProfileLoading(false);
            setProfileSaved(true);
            setTimeout(() => setProfileSaved(false), 2000);
        }, 600);
    };

    const saveOrg = () => {
        persist({ orgName, orgTagline, orgAddress });
        setOrgSaved(true);
        setTimeout(() => setOrgSaved(false), 2000);
    };

    const saveNotifs = (key, val) => {
        const next = { ...notifs, [key]: val };
        setNotifs(next);
        persist({ notifs: next });
    };

    const savePrefs = () => {
        persist({ currency, language, theme });
        setPrefSaved(true);
        setTimeout(() => setPrefSaved(false), 2000);
    };

    const exportAllData = () => {
        const data = {
            exportDate: new Date().toISOString(),
            account: JSON.parse(localStorage.getItem('eflow_account_settings') || '{}'),
            checklist: JSON.parse(localStorage.getItem('eflow_checklist') || '[]'),
            budget: JSON.parse(localStorage.getItem('eflow_budget') || '[]'),
            vendors: JSON.parse(localStorage.getItem('eflow_vendors') || '[]'),
            guests: JSON.parse(localStorage.getItem('eflow_guests') || '[]'),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'eflow_backup.json'; a.click();
        URL.revokeObjectURL(url);
    };

    const clearAllData = () => {
        ['eflow_checklist','eflow_budget','eflow_vendors','eflow_guests','eflow_account_settings'].forEach(k => localStorage.removeItem(k));
        window.location.reload();
    };

    // Sidebar nav
    const SECTIONS = [
        { id: 'profile', icon: 'fa-circle-user', label: 'โปรไฟล์' },
        { id: 'subscription', icon: 'fa-rocket', label: 'Subscription' },
        { id: 'security', icon: 'fa-shield-halved', label: 'ความปลอดภัย' },
        { id: 'organization', icon: 'fa-building', label: 'ข้อมูลองค์กร' },
        { id: 'notifications', icon: 'fa-bell', label: 'การแจ้งเตือน' },
        { id: 'preferences', icon: 'fa-sliders', label: 'การตั้งค่า' },
        { id: 'billing', icon: 'fa-receipt', label: 'ประวัติการชำระ' },
        { id: 'data', icon: 'fa-database', label: 'ข้อมูล & Backup' },
    ];

    const AVATAR_COLORS = ['#3b82f6','#8b5cf6','#ec4899','#10b981','#f59e0b','#ef4444','#64748b','#0ea5e9'];

    return (
        <div className="flex flex-1 h-screen overflow-hidden bg-[#f5f5f7]">
            {/* Settings Sidebar */}
            <div className="w-52 bg-white border-r border-slate-100 flex flex-col py-6 px-3 shrink-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-3">การตั้งค่า</p>
                <nav className="space-y-0.5">
                    {SECTIONS.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setActiveSection(s.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left ${
                                activeSection === s.id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <i className={`fa-solid ${s.icon} w-3.5 text-center`}></i>
                            {s.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto px-8 py-8">
                <div className="max-w-2xl mx-auto space-y-5">

                    {/* ===== PROFILE ===== */}
                    {activeSection === 'profile' && (
                        <SectionCard icon="fa-circle-user" title="โปรไฟล์ผู้ใช้">
                            {/* Avatar */}
                            <div className="flex items-center gap-4 mb-6 pb-5 border-b border-slate-50">
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-md" style={{ backgroundColor: avatarColor }}>
                                    {displayName?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-700 mb-2">สีรูปโปรไฟล์</p>
                                    <div className="flex gap-1.5">
                                        {AVATAR_COLORS.map(c => (
                                            <button key={c} onClick={() => setAvatarColor(c)}
                                                className={`w-6 h-6 rounded-full transition-all ${avatarColor === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <Field label="ชื่อที่แสดง" hint="จะแสดงในแอป">
                                <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                    placeholder="ชื่อของคุณ" />
                            </Field>
                            <Field label="อีเมล" hint="จากบัญชี Google">
                                <input value={currentUser?.email || ''} readOnly
                                    className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs text-slate-400 cursor-not-allowed" />
                            </Field>
                            <Field label="เบอร์โทร">
                                <input value={phone} onChange={e => setPhone(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                    placeholder="0XX-XXX-XXXX" />
                            </Field>

                            <div className="mt-4 flex justify-end">
                                <SaveBtn onClick={saveProfile} saved={profileSaved} loading={profileLoading} />
                            </div>
                        </SectionCard>
                    )}

                    {/* ===== SUBSCRIPTION ===== */}
                    {activeSection === 'subscription' && (
                        <SectionCard icon="fa-rocket" title="Subscription">
                            {/* Plan Badge */}
                            <div className={`p-4 rounded-xl mb-5 flex items-center gap-4 ${
                                plan === 'lifetime' ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200' :
                                plan === 'rental' ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200' :
                                'bg-slate-50 border border-slate-200'
                            }`}>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                    plan === 'lifetime' ? 'bg-amber-100' :
                                    plan === 'rental' ? 'bg-blue-100' : 'bg-slate-100'
                                }`}>
                                    <i className={`fa-solid ${planInfo.icon} text-xl ${
                                        plan === 'lifetime' ? 'text-amber-500' :
                                        plan === 'rental' ? 'text-blue-600' : 'text-slate-400'
                                    }`}></i>
                                </div>
                                <div>
                                    <p className="font-black text-slate-800">{planInfo.label}</p>
                                    {plan === 'rental' && expiry && (
                                        <p className="text-xs text-slate-500 mt-0.5">หมดอายุ: {formatThaiDate(expiry)}</p>
                                    )}
                                    {plan === 'lifetime' && (
                                        <p className="text-xs text-amber-600 mt-0.5">ใช้งานได้ตลอดชีพ ✨</p>
                                    )}
                                    {plan === 'free' && (
                                        <p className="text-xs text-slate-400 mt-0.5">ฟีเจอร์จำกัด</p>
                                    )}
                                </div>
                                {plan !== 'lifetime' && (
                                    <button onClick={() => setShowUpgradeModal(true)}
                                        className="ml-auto px-4 py-2 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition">
                                        {plan === 'free' ? 'Upgrade' : 'ต่ออายุ'}
                                    </button>
                                )}
                            </div>

                            {/* Feature Comparison */}
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">ฟีเจอร์แผนของคุณ</p>
                            {[
                                { name: 'ผังงาน (Floor Plan)', free: true, pro: true },
                                { name: 'Master Checklist', free: false, pro: true },
                                { name: 'งบประมาณ', free: false, pro: true },
                                { name: 'Vendors & Suppliers', free: false, pro: true },
                                { name: 'ผู้เข้าร่วม (Guest List)', free: false, pro: true },
                                { name: 'Export PDF/CSV', free: false, pro: true },
                                { name: 'Cloud Sync', free: false, pro: true },
                            ].map(f => (
                                <div key={f.name} className="flex items-center justify-between py-2 border-b border-slate-50">
                                    <span className="text-xs text-slate-700">{f.name}</span>
                                    {(plan === 'free' ? f.free : f.pro)
                                        ? <i className="fa-solid fa-circle-check text-green-500 text-sm"></i>
                                        : <i className="fa-solid fa-lock text-slate-300 text-sm"></i>
                                    }
                                </div>
                            ))}
                        </SectionCard>
                    )}

                    {/* ===== SECURITY ===== */}
                    {activeSection === 'security' && (
                        <>
                            <SectionCard icon="fa-shield-halved" title="ความปลอดภัย">
                                <Field label="วิธีเข้าสู่ระบบ" hint="บัญชีที่เชื่อมต่อ">
                                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                                        <i className="fa-brands fa-google text-sm text-red-500"></i>
                                        <span className="text-xs text-slate-700 font-medium">Google Account</span>
                                        <span className="ml-auto text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">เชื่อมต่อแล้ว</span>
                                    </div>
                                </Field>
                                <Field label="อีเมล" hint="จาก Google Account">
                                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                                        <span className="text-xs text-slate-400">{currentUser?.email || '—'}</span>
                                    </div>
                                </Field>
                                <Field label="Session ปัจจุบัน" hint="เข้าสู่ระบบอยู่">
                                    <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                                        <i className="fa-solid fa-circle text-green-500 text-[8px]"></i>
                                        <span className="text-xs text-green-700 font-medium">Active — อุปกรณ์นี้</span>
                                    </div>
                                </Field>
                            </SectionCard>

                            <SectionCard icon="fa-triangle-exclamation" title="โซนอันตราย">
                                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <i className="fa-solid fa-trash text-red-500 mt-0.5"></i>
                                        <div className="flex-1">
                                            <p className="text-xs font-black text-red-700 mb-1">ลบบัญชีถาวร</p>
                                            <p className="text-[11px] text-red-500 leading-relaxed mb-3">การดำเนินการนี้ไม่สามารถยกเลิกได้ ข้อมูลทั้งหมดจะถูกลบถาวร</p>
                                            {!showDeleteConfirm ? (
                                                <button onClick={() => setShowDeleteConfirm(true)}
                                                    className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-black rounded-lg hover:bg-red-200 transition">
                                                    ลบบัญชี
                                                </button>
                                            ) : (
                                                <div className="space-y-2">
                                                    <p className="text-[11px] text-red-600 font-bold">พิมพ์ "DELETE" เพื่อยืนยัน:</p>
                                                    <input value={deleteInput} onChange={e => setDeleteInput(e.target.value)}
                                                        className="w-full bg-white border border-red-300 rounded-lg px-3 py-1.5 text-xs outline-none"
                                                        placeholder="DELETE" />
                                                    <div className="flex gap-2">
                                                        <button
                                                            disabled={deleteInput !== 'DELETE'}
                                                            className="px-3 py-1.5 bg-red-600 text-white text-xs font-black rounded-lg disabled:opacity-40 hover:bg-red-700 transition">
                                                            ยืนยันการลบ
                                                        </button>
                                                        <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                                                            className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-black rounded-lg hover:bg-slate-200 transition">
                                                            ยกเลิก
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>
                        </>
                    )}

                    {/* ===== ORGANIZATION ===== */}
                    {activeSection === 'organization' && (
                        <SectionCard icon="fa-building" title="ข้อมูลองค์กร / แบรนด์">
                            <p className="text-[11px] text-slate-400 mb-4">ข้อมูลนี้จะปรากฏในรายงาน, Export, และเอกสารที่ส่งให้ Vendor / ผู้เข้าร่วม</p>
                            <Field label="ชื่อองค์กร / บริษัท">
                                <input value={orgName} onChange={e => setOrgName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                    placeholder="เช่น บริษัท อีเวนท์เลิศ จำกัด" />
                            </Field>
                            <Field label="Tagline / คำโปรย">
                                <input value={orgTagline} onChange={e => setOrgTagline(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                    placeholder="เช่น จัดงานครบวงจร ดูแลทุกรายละเอียด" />
                            </Field>
                            <Field label="ที่อยู่" hint="ใช้ในเอกสาร">
                                <textarea value={orgAddress} onChange={e => setOrgAddress(e.target.value)}
                                    rows={3}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
                                    placeholder="ที่อยู่ / เลขที่ / จังหวัด / รหัสไปรษณีย์" />
                            </Field>
                            <div className="mt-4 flex justify-end">
                                <SaveBtn onClick={saveOrg} saved={orgSaved} loading={false} />
                            </div>
                        </SectionCard>
                    )}

                    {/* ===== NOTIFICATIONS ===== */}
                    {activeSection === 'notifications' && (
                        <SectionCard icon="fa-bell" title="การแจ้งเตือน">
                            <p className="text-[11px] text-slate-400 mb-4">เลือกว่าต้องการรับการแจ้งเตือนรูปแบบใดบ้าง</p>
                            {[
                                { key: 'overdueAlert', label: 'งานเกินกำหนด', desc: 'แจ้งเตือนเมื่อมีรายการ Checklist เกิน Due Date' },
                                { key: 'ddayReminder', label: 'D-Day Reminder', desc: 'เตือนล่วงหน้า 7, 3, 1 วันก่อนวันงาน' },
                                { key: 'vendorFollowup', label: 'ติดตาม Vendor', desc: 'เตือนให้ follow up Vendor ที่ยังไม่ตอบกลับ' },
                                { key: 'budgetWarning', label: 'งบประมาณเกิน', desc: 'แจ้งเมื่อรายจ่ายใกล้เกินงบที่ตั้งไว้' },
                                { key: 'weeklyReport', label: 'รายงานรายสัปดาห์', desc: 'สรุปความคืบหน้างานทุกวันจันทร์' },
                            ].map(n => (
                                <div key={n.key} className="flex items-center justify-between py-3.5 border-b border-slate-50">
                                    <div>
                                        <p className="text-xs font-bold text-slate-700">{n.label}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">{n.desc}</p>
                                    </div>
                                    <Toggle checked={notifs[n.key]} onChange={val => saveNotifs(n.key, val)} />
                                </div>
                            ))}
                        </SectionCard>
                    )}

                    {/* ===== PREFERENCES ===== */}
                    {activeSection === 'preferences' && (
                        <SectionCard icon="fa-sliders" title="การตั้งค่าทั่วไป">
                            <Field label="ภาษา" hint="ภาษาหลักของแอป">
                                <select value={language} onChange={e => setLanguage(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-400">
                                    <option value="th">🇹🇭 ภาษาไทย</option>
                                    <option value="en">🇺🇸 English</option>
                                </select>
                            </Field>
                            <Field label="สกุลเงิน" hint="แสดงในงบประมาณ">
                                <select value={currency} onChange={e => setCurrency(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-400">
                                    <option value="THB">฿ บาทไทย (THB)</option>
                                    <option value="USD">$ ดอลลาร์ (USD)</option>
                                    <option value="EUR">€ ยูโร (EUR)</option>
                                    <option value="JPY">¥ เยน (JPY)</option>
                                </select>
                            </Field>
                            <Field label="ธีม" hint="สีของแอปพลิเคชัน">
                                <div className="flex gap-2">
                                    {[
                                        { val: 'light', icon: 'fa-sun', label: 'Light' },
                                        { val: 'dark', icon: 'fa-moon', label: 'Dark' },
                                        { val: 'system', icon: 'fa-circle-half-stroke', label: 'System' },
                                    ].map(t => (
                                        <button key={t.val} onClick={() => setTheme(t.val)}
                                            className={`flex-1 py-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${
                                                theme === t.val ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300'
                                            }`}>
                                            <i className={`fa-solid ${t.icon}`}></i>
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </Field>
                            <div className="mt-4 flex justify-end">
                                <SaveBtn onClick={savePrefs} saved={prefSaved} loading={false} />
                            </div>
                        </SectionCard>
                    )}

                    {/* ===== BILLING ===== */}
                    {activeSection === 'billing' && (
                        <SectionCard icon="fa-receipt" title="ประวัติการชำระเงิน">
                            {BILLING_HISTORY.length === 0 ? (
                                <div className="text-center py-10">
                                    <i className="fa-solid fa-receipt text-4xl text-slate-200 mb-2"></i>
                                    <p className="text-sm text-slate-400">ยังไม่มีประวัติการชำระเงิน</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {BILLING_HISTORY.map(b => (
                                        <div key={b.id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                            <div>
                                                <p className="text-xs font-bold text-slate-700">{b.plan}</p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">{formatThaiDate(b.date)} · {b.id}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-slate-800">฿{b.amount.toLocaleString()}</p>
                                                <span className="text-[9px] bg-green-100 text-green-700 font-black px-1.5 py-0.5 rounded-full uppercase">ชำระแล้ว</span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const text = `ใบเสร็จ ${b.id}\nวันที่: ${formatThaiDate(b.date)}\nแผน: ${b.plan}\nจำนวน: ฿${b.amount.toLocaleString()}\nสถานะ: ชำระแล้ว`;
                                                    const blob = new Blob([text], { type: 'text/plain' });
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement('a'); a.href = url; a.download = `${b.id}.txt`; a.click();
                                                }}
                                                className="ml-3 p-2 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition">
                                                <i className="fa-solid fa-download text-xs"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {plan === 'rental' && (
                                <div className="mt-4 p-3.5 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-black text-orange-700">ต้องการยกเลิก Subscription?</p>
                                        <p className="text-[10px] text-orange-500 mt-0.5">จะยังใช้งานได้จนหมดอายุปัจจุบัน</p>
                                    </div>
                                    <button className="px-3 py-1.5 bg-orange-100 text-orange-700 text-xs font-black rounded-lg hover:bg-orange-200 transition">
                                        ยกเลิก Sub
                                    </button>
                                </div>
                            )}
                        </SectionCard>
                    )}

                    {/* ===== DATA & BACKUP ===== */}
                    {activeSection === 'data' && (
                        <>
                            <SectionCard icon="fa-download" title="Export ข้อมูล">
                                <p className="text-[11px] text-slate-400 mb-4">ดาวน์โหลดข้อมูลทั้งหมดของคุณเป็นไฟล์ JSON สำหรับสำรองข้อมูล</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={exportAllData}
                                        className="flex items-center gap-2.5 p-4 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition group">
                                        <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition">
                                            <i className="fa-solid fa-file-export text-blue-600"></i>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-black text-blue-700">Export ทั้งหมด</p>
                                            <p className="text-[10px] text-blue-500">JSON Backup</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            const data = JSON.parse(localStorage.getItem('eflow_guests') || '[]');
                                            const csv = ['ชื่อ,อีเมล,โทรศัพท์,ประเภท,สถานะ',
                                                ...data.map(g => `${g.name},${g.email||''},${g.phone||''},${g.type||''},${g.status||''}`)
                                            ].join('\n');
                                            const blob = new Blob(['\ufeff'+csv], { type: 'text/csv;charset=utf-8' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a'); a.href = url; a.download = 'guests.csv'; a.click();
                                        }}
                                        className="flex items-center gap-2.5 p-4 bg-green-50 border border-green-100 rounded-xl hover:bg-green-100 transition group">
                                        <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition">
                                            <i className="fa-solid fa-file-csv text-green-600"></i>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-black text-green-700">Guest List CSV</p>
                                            <p className="text-[10px] text-green-500">สำหรับ Excel</p>
                                        </div>
                                    </button>
                                </div>
                            </SectionCard>

                            <SectionCard icon="fa-trash-can" title="ล้างข้อมูล">
                                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <i className="fa-solid fa-triangle-exclamation text-red-500 mt-0.5"></i>
                                        <div>
                                            <p className="text-xs font-black text-red-700 mb-1">ล้างข้อมูลทั้งหมด</p>
                                            <p className="text-[11px] text-red-500 leading-relaxed mb-3">
                                                จะลบ Checklist, งบประมาณ, Vendor, ผู้เข้าร่วม และการตั้งค่าทั้งหมด ไม่สามารถกู้คืนได้
                                            </p>
                                            <button onClick={clearAllData}
                                                className="px-3 py-1.5 bg-red-500 text-white text-xs font-black rounded-lg hover:bg-red-600 transition">
                                                ล้างข้อมูลทั้งหมด
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
};

export default AccountSettings;
