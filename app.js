// Early check and graceful fallback
if (typeof React === 'undefined') {
    console.error("❌ CRITICAL: React is not loaded!");
    document.body.innerHTML = `
        <div style="padding: 40px; font-family: Arial; text-align: center; background: #fff3e0;">
            <h1 style="color: #d32f2f;">⚠️ Could not load application</h1>
            <p><strong>Reason:</strong> React library failed to load from CDN</p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; margin-bottom: 20px;">
                <strong>This might be due to:</strong><br/>
                ✓ Internet connection issue<br/>
                ✓ CDN is temporarily unavailable<br/>
                ✓ Browser privacy settings blocking scripts
            </p>
            <button onclick="location.reload()" style="padding: 10px 20px; background: #007aff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                🔄 Retry
            </button>
            <p style="margin-top: 20px; font-size: 12px; color: #999;">
                Check browser console (F12) for more details
            </p>
        </div>
    `;
    throw new Error("React not available");
}

const { useState, useMemo, useEffect, useRef } = React;

// --- Debug: Check all dependencies loaded ---
console.log("🔍 Checking dependencies:");
console.log("  React:", typeof React !== 'undefined' ? '✅' : '❌');
console.log("  ReactDOM:", typeof ReactDOM !== 'undefined' ? '✅' : '❌');
console.log("  firebase:", typeof firebase !== 'undefined' ? '✅' : '❌');

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyD7gfkCwqP-6GWjKokLGNQNiyRgnLmrwAk",
  authDomain: "eventlabs-3024a.firebaseapp.com",
  projectId: "eventlabs-3024a",
  storageBucket: "eventlabs-3024a.firebasestorage.app",
  messagingSenderId: "730304611688",
  appId: "1:730304611688:web:f8aa394f08cca565cec2dd",
  measurementId: "G-5J06X93GDV"
};

console.log("📋 Firebase Config:", firebaseConfig);

// Initialize Firebase - Declare auth/db outside try block so they're available globally
let auth, db;

try {
    if (!firebase.apps.length) {
        console.log("🔧 Initializing Firebase...");
        firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();
    db = firebase.firestore();
    console.log("✅ Firebase initialized successfully");
    console.log("  Auth:", typeof auth !== 'undefined' ? '✅' : '❌');
    console.log("  Firestore:", typeof db !== 'undefined' ? '✅' : '❌');
} catch (firebaseError) {
    console.error("❌ Firebase initialization failed:", firebaseError);
    console.error("Error details:", firebaseError.message);
    // Create mock auth object for graceful degradation
    auth = {
        onAuthStateChanged: (callback) => { callback(null); return () => {}; },
        signInWithEmailAndPassword: () => Promise.reject(new Error("Firebase not available")),
        createUserWithEmailAndPassword: () => Promise.reject(new Error("Firebase not available")),
        signOut: () => Promise.reject(new Error("Firebase not available")),
    };
    db = null;
}

// --- ค่าคงที่และการตั้งค่าพื้นฐาน ---
const UNIT_SCALE = 2; // 1cm = 2px สำหรับการแสดงผลบนหน้าจอ

const DEFAULT_ZONE_CONFIG = {
    chairWidth: 45,
    chairHeight: 45,
    rows: 5,
    columns: 5,
    spacingX: 10,
    spacingY: 60,
    color: 'blue',
    hiddenChairs: []
};

const ZONE_COLORS = {
    blue: { bg: 'bg-blue-500', border: 'border-blue-500', ring: 'ring-blue-500', text: 'text-blue-500' },
    emerald: { bg: 'bg-emerald-500', border: 'border-emerald-500', ring: 'ring-emerald-500', text: 'text-emerald-500' },
    rose: { bg: 'bg-rose-500', border: 'border-rose-500', ring: 'ring-rose-500', text: 'text-rose-500' },
    amber: { bg: 'bg-amber-500', border: 'border-amber-500', ring: 'ring-amber-500', text: 'text-amber-500' },
    purple: { bg: 'bg-purple-500', border: 'border-purple-500', ring: 'ring-purple-500', text: 'text-purple-500' },
};

const PRESET_ROWS = [0, 3, 5, 6, 8, 10, 12, 15, 18, 20];
const PRESET_COLUMNS = [0, 3, 5, 6, 8, 10, 12, 15, 18, 20];
const PRESET_SPACING_CM = [0, 5, 10, 15, 20, 25, 30, 40, 50, 60];
const PRESET_CHAIR_CM = [30, 35, 40, 45, 50, 55, 60, 65, 70, 80];

const formatPresetLabel = (n, suffix) => {
    if (suffix === 'cm') return `${n} ซม.`;
    if (suffix === 'm') return `${n} ม.`;
    if (suffix === 'rows') return `${n} แถว`;
    if (suffix === 'cols') return `${n} คอลัมน์`;
    if (suffix === 'buildings') return `${n} อาคาร`;
    if (suffix === 'floors') return `${n} ชั้น`;
    return String(n);
};

const PRESET_BUILDING_DIM_M = [8, 10, 12, 15, 18, 20, 24, 30, 36, 48];
const PRESET_BUILDING_COUNT = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15];

const BuildingMetricControl = ({ title, field, min, max, presets, presetSuffix, buildingProfile, setBuildingProfile, cardClass }) => {
    const val = Math.max(min, Math.min(max, Number(buildingProfile[field]) || 0));
    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(String(val));
    const [presetOpen, setPresetOpen] = useState(false);
    const presetRef = useRef(null);

    useEffect(() => {
        if (!editing) setText(String(val));
    }, [val, editing]);

    useEffect(() => {
        if (!presetOpen) return;
        const close = (e) => {
            if (presetRef.current && !presetRef.current.contains(e.target)) setPresetOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [presetOpen]);

    const setClamped = (n) => {
        let num = typeof n === 'number' ? n : parseInt(String(n).replace(/[^\d-]/g, ''), 10);
        if (Number.isNaN(num)) num = min;
        num = Math.round(num);
        num = Math.max(min, Math.min(max, num));
        setBuildingProfile((p) => ({ ...p, [field]: num }));
    };

    return (
        <div className={`rounded-xl border-2 border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 p-3 space-y-2 ${cardClass || ''}`}>
            <p className="text-center text-sm font-black text-slate-700 leading-tight">{title}</p>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
                <button type="button" onClick={() => setClamped(val - 1)} className="w-10 h-10 shrink-0 bg-white rounded-full text-lg font-black border-2 border-slate-300 shadow-sm">−</button>
                <input
                    type="text"
                    inputMode="numeric"
                    value={editing ? text : String(val)}
                    onFocus={() => {
                        setEditing(true);
                        setText(String(val));
                    }}
                    onChange={(e) => setText(e.target.value)}
                    onBlur={() => {
                        setEditing(false);
                        const n = parseInt(text, 10);
                        if (Number.isNaN(n)) setClamped(val);
                        else setClamped(n);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                    className="w-[4.5rem] text-center text-xl font-black text-slate-800 bg-white border-2 border-slate-200 rounded-lg py-2"
                />
                <div className="relative shrink-0" ref={presetRef}>
                    <button
                        type="button"
                        onClick={() => setPresetOpen((o) => !o)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border-2 border-slate-300 text-slate-600"
                        aria-label="เลือกค่า"
                    >
                        <i className="fa-solid fa-caret-down" />
                    </button>
                    {presetOpen ? (
                        <ul className="absolute right-0 top-full mt-1 z-[100] bg-white border rounded-lg shadow-xl py-1 min-w-[5.5rem] max-h-48 overflow-y-auto">
                            {presets.map((p) => (
                                <li key={`b-${field}-${p}`}>
                                    <button
                                        type="button"
                                        className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                                        onClick={() => {
                                            setClamped(p);
                                            setPresetOpen(false);
                                        }}
                                    >
                                        {formatPresetLabel(p, presetSuffix)}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>
                <button type="button" onClick={() => setClamped(val + 1)} className="w-10 h-10 shrink-0 bg-white rounded-full text-lg font-black border-2 border-slate-300 shadow-sm">+</button>
            </div>
            <input type="range" min={min} max={max} value={val} onChange={(e) => setClamped(e.target.value)} className="w-full h-2 cursor-pointer accent-slate-600" />
        </div>
    );
};

const SidebarCollapsible = ({ title, icon, defaultOpen = true, children }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white/60 shadow-sm">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-[11px] font-bold text-slate-700 hover:bg-slate-50/90 transition leading-snug"
            >
                <span className="flex items-center gap-2 min-w-0">
                    {icon ? <span className="shrink-0 opacity-70">{icon}</span> : null}
                    <span className="text-left">{title}</span>
                </span>
                <i className={`fa-solid fa-chevron-down text-slate-400 text-[10px] shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>
            {open ? <div className="px-3 pb-3 pt-0 space-y-3 border-t border-slate-100">{children}</div> : null}
        </div>
    );
};

const ZoneDimensionControl = ({
    title,
    field,
    min,
    max,
    presets,
    presetSuffix,
    activeZone,
    activeZoneId,
    setZones,
    cardGradient,
    cardBorder,
    accentText,
    btnBorder,
    rangeAccent,
}) => {
    const val = Math.max(min, Math.min(max, Number(activeZone[field]) || 0));
    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(String(val));
    const [presetOpen, setPresetOpen] = useState(false);
    const presetRef = useRef(null);

    useEffect(() => {
        if (!editing) setText(String(val));
    }, [val, editing]);

    useEffect(() => {
        if (!presetOpen) return;
        const close = (e) => {
            if (presetRef.current && !presetRef.current.contains(e.target)) setPresetOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [presetOpen]);

    const setClamped = (n) => {
        let num = typeof n === 'number' ? n : parseInt(String(n).replace(/[^\d-]/g, ''), 10);
        if (Number.isNaN(num)) num = min;
        num = Math.round(num);
        num = Math.max(min, Math.min(max, num));
        setZones((prev) => prev.map((z) => (z.id === activeZoneId ? { ...z, [field]: num } : z)));
    };

    return (
        <div className={`bg-gradient-to-r ${cardGradient} border-2 ${cardBorder} rounded-xl p-3 sm:p-3.5 space-y-2 relative`}>
            <p className={`text-center text-sm font-black leading-tight ${accentText}`}>{title}</p>
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                <button
                    type="button"
                    onClick={() => setClamped(val - 1)}
                    className={`w-10 h-10 sm:w-11 sm:h-11 shrink-0 bg-white rounded-full text-lg font-black shadow-md hover:shadow-lg hover:scale-105 transition active:scale-95 flex items-center justify-center border-2 ${btnBorder}`}
                >
                    −
                </button>
                <input
                    type="text"
                    inputMode="numeric"
                    value={editing ? text : String(val)}
                    onFocus={() => {
                        setEditing(true);
                        setText(String(val));
                    }}
                    onChange={(e) => setText(e.target.value)}
                    onBlur={() => {
                        setEditing(false);
                        const n = parseInt(text, 10);
                        if (Number.isNaN(n)) setClamped(val);
                        else setClamped(n);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') e.target.blur();
                    }}
                    className={`w-[4.5rem] sm:flex-1 sm:min-w-[3.5rem] text-center text-xl sm:text-2xl font-black ${accentText} bg-white/90 border-2 border-white/80 rounded-lg py-2 px-1 shadow-inner`}
                />
                <div className="relative shrink-0 flex flex-col items-center" ref={presetRef}>
                    <button
                        type="button"
                        onClick={() => setPresetOpen((o) => !o)}
                        className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-white/90 border-2 ${btnBorder} shadow-sm hover:bg-white text-slate-600`}
                        aria-expanded={presetOpen}
                        aria-label="เลือกค่าที่ตั้งไว้"
                    >
                        <i className="fa-solid fa-caret-down text-lg" />
                    </button>
                    {presetOpen ? (
                        <ul className="absolute right-0 top-full mt-1 z-[100] bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[6.5rem] max-h-52 overflow-y-auto">
                            {presets.map((p) => (
                                <li key={`${field}-${p}`}>
                                    <button
                                        type="button"
                                        className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                        onClick={() => {
                                            setClamped(p);
                                            setPresetOpen(false);
                                        }}
                                    >
                                        {formatPresetLabel(p, presetSuffix)}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>
                <button
                    type="button"
                    onClick={() => setClamped(val + 1)}
                    className={`w-10 h-10 sm:w-11 sm:h-11 shrink-0 bg-white rounded-full text-lg font-black shadow-md hover:shadow-lg hover:scale-105 transition active:scale-95 flex items-center justify-center border-2 ${btnBorder}`}
                >
                    +
                </button>
            </div>
            <input
                type="range"
                name={field}
                min={min}
                max={max}
                value={val}
                onChange={(e) => setClamped(e.target.value)}
                className={`w-full h-3 cursor-pointer ${rangeAccent}`}
            />
        </div>
    );
};

// --- ระบบฟิสิกส์ (Physics Helpers) ---
const getBounds = (z, overrideX = z.x, overrideY = z.y) => {
    const w = (z.columns || 0) > 0 ? (z.columns * z.chairWidth) + ((z.columns - 1) * z.spacingX) : 0;
    const h = (z.rows || 0) > 0 ? (z.rows * z.chairHeight) + ((z.rows - 1) * z.spacingY) : 0;
    return { left: overrideX, right: overrideX + w, top: overrideY, bottom: overrideY + h, width: w, height: h };
};

const isColliding = (b1, b2) => {
    const buffer = 0.1; // ลด buffer เพื่อให้ไถลชนขอบได้ลื่นขึ้น
    return b1.left < b2.right - buffer && b1.right > b2.left + buffer && b1.top < b2.bottom - buffer && b1.bottom > b2.top + buffer;
};

// --- เริ่มต้นคอมโพเนนต์หลัก (App Component) ---
const App = () => {
    console.log("🎬 App component is rendering...");
    
    const [currentView, setCurrentView] = useState('home'); 
    const [activeTab, setActiveTab] = useState('floorplan'); 
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isPro, setIsPro] = useState(true); // ปลดล็อกให้ใช้ฟรีสำหรับเวอร์ชัน Local
    const [activeMode, setActiveMode] = useState('edit_chair'); 
    const [zoom, setZoom] = useState(0.7);
    
    const [currentLayoutId, setCurrentLayoutId] = useState(null);
    const [layoutName, setLayoutName] = useState('โปรเจกต์ใหม่');
    const [zones, setZones] = useState([{ id: 'zone-1', name: 'โซนหลัก', ...DEFAULT_ZONE_CONFIG, x: 0, y: 0 }]);
    const [activeZoneId, setActiveZoneId] = useState('zone-1');
    
    const [savedLayouts, setSavedLayouts] = useState([]);
    const [message, setMessage] = useState({ text: '', type: '' });
    
    const [pan, setPan] = useState({ x: 100, y: 100 });
    const [dragContext, setDragContext] = useState(null);
    const [guestNames, setGuestNames] = useState({}); // { zoneId: { chairKey: "Guest Name" } }
    const [editingChair, setEditingChair] = useState(null); // { zoneId, chairKey }
    const [guestNameInput, setGuestNameInput] = useState('');
    const [swappingChair, setSwappingChair] = useState(null); // { zoneId, chairKey } for chair being dragged
    
    // Auth & Cloud States
    const [currentUser, setCurrentUser] = useState(null);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [cloudLayouts, setCloudLayouts] = useState([]);
    
    // Animation states
    const [isAnimating, setIsAnimating] = useState(false);
    const [animationDirection, setAnimationDirection] = useState('enter'); // 'enter' or 'exit'
    
    // Export states
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportMode, setExportMode] = useState('all'); // 'all' or 'area'
    const [isSelectingArea, setIsSelectingArea] = useState(false);
    const [selectionStart, setSelectionStart] = useState(null);
    const [exportArea, setExportArea] = useState(null); // { x, y, width, height }
    const exportDragActiveRef = useRef(false);

    const [buildingProfile, setBuildingProfile] = useState({
        buildingCount: 1,
        floorCount: 1,
        widthM: 20,
        lengthM: 30,
        heightM: 12,
    });
    const [chairImages, setChairImages] = useState({}); // { [zoneId]: { [chairKey]: dataUrl } }
    const [chairMenu, setChairMenu] = useState(null); // { zoneId, row, col, chairKey, isHidden }
    const [coordinationRows, setCoordinationRows] = useState([]);
    const [docsStore, setDocsStore] = useState({ initial: [], coordination: [], return: [] });
    const [docPreview, setDocPreview] = useState(null); // { url, name, mime, scale, panX, panY }
    const [scanCropModal, setScanCropModal] = useState(null); // { src, category, crop: {l,t,r,b} 0-40% trim }

    // 1. Load layouts from Cloud only (localStorage removed)
    useEffect(() => {
        // Layouts are loaded from Firebase in the Auth effect below
        // No local storage - cloud only
    }, []);

    // 2. Firebase Auth State Listener
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                setCurrentUser(user);
                // Load cloud layouts
                try {
                    const querySnapshot = await db.collection('users').doc(user.uid).collection('layouts').get();
                    const layouts = [];
                    querySnapshot.forEach((doc) => {
                        layouts.push({ id: doc.id, ...doc.data() });
                    });
                    setCloudLayouts(layouts);
                } catch (e) {
                    console.error("Error loading cloud layouts", e);
                    setCloudLayouts([]);
                }
            } else {
                setCurrentUser(null);
                setCloudLayouts([]);
            }
        });
        return () => unsubscribe();
    }, []);

    // 3. คำนวณสถิติของผังงานทั้งหมด
    const stats = useMemo(() => {
        let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0, totalChairs = 0;
        zones.forEach(z => {
            const b = getBounds(z);
            if (b.width > 0 && b.height > 0) {
                if (b.left < minX) minX = b.left;
                if (b.top < minY) minY = b.top;
                if (b.right > maxX) maxX = b.right;
                if (b.bottom > maxY) maxY = b.bottom;
            }
            totalChairs += ((z.rows || 0) * (z.columns || 0)) - (z.hiddenChairs ? z.hiddenChairs.length : 0);
        });
        
        if (minX === Infinity) { minX = 0; minY = 0; }
        const globalWidth = maxX > minX ? maxX - minX : 0;
        const globalHeight = maxY > minY ? maxY - minY : 0;

        return { 
            globalMinX: minX, globalMinY: minY, globalWidth, globalHeight,
            totalWidthM: (globalWidth / 100).toFixed(2), 
            totalHeightM: (globalHeight / 100).toFixed(2), 
            actualChairs: totalChairs, 
            areaSqM: ((globalWidth * globalHeight) / 10000).toFixed(2) 
        };
    }, [zones]);

    const activeZone = useMemo(() => zones.find(z => z.id === activeZoneId) || zones[0], [zones, activeZoneId]);
    const filteredLayouts = useMemo(() => savedLayouts.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase())), [savedLayouts, searchQuery]);

    const showToast = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const cancelExportSelection = () => {
        exportDragActiveRef.current = false;
        setIsSelectingArea(false);
        setExportArea(null);
        setSelectionStart(null);
        showToast("ยกเลิกการเลือกพื้นที่แล้ว");
    };

    const closeExportModal = () => {
        exportDragActiveRef.current = false;
        setShowExportModal(false);
        setExportMode("all");
        setIsSelectingArea(false);
        setExportArea(null);
        setSelectionStart(null);
    };

    const exportCoordinationCSV = () => {
        const headers = [
            "โซน",
            "จำนวน object",
            "หน่วยงานที่รับผิดชอบ",
            "ติดต่อที่หน่วยงาน",
            "ผู้ประสานงานหลัก",
            "หมายเหตุ",
            "เช็คลิสต์",
            "วันที่บันทึก",
            "วันที่ไปรับ object",
            "วันที่นำคืน object",
        ];
        const keys = [
            "zoneName",
            "objectCount",
            "responsibleOrg",
            "contactAtOrg",
            "coordinator",
            "notes",
            "checklistDone",
            "dateNote",
            "pickupDate",
            "returnDate",
        ];
        const esc = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
        const lines = [headers.map(esc).join(",")].concat(
            coordinationRows.map((r) => keys.map((k) => esc(r[k])).join(","))
        );
        const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${layoutName || "export"}-ประสานงาน.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
        showToast("ดาวน์โหลด CSV แล้ว");
    };

    const addDocFile = (category, file) => {
        if (!file) return;
        const ok = file.type === "application/pdf" || file.type === "image/jpeg" || file.type === "image/png";
        if (!ok) {
            showToast("รองรับเฉพาะ PDF / JPEG / PNG", "error");
            return;
        }
        const url = URL.createObjectURL(file);
        const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setDocsStore((prev) => ({
            ...prev,
            [category]: [...(prev[category] || []), { id, name: file.name, mime: file.type, url, createdAt: Date.now() }],
        }));
        showToast("อัปโหลดแล้ว");
    };

    const removeDoc = (category, id) => {
        setDocsStore((prev) => {
            const list = prev[category] || [];
            const doc = list.find((d) => d.id === id);
            if (doc && doc.url && String(doc.url).startsWith("blob:")) URL.revokeObjectURL(doc.url);
            return { ...prev, [category]: list.filter((d) => d.id !== id) };
        });
    };

    const applyScanCrop = () => {
        if (!scanCropModal) return;
        const { src, category, crop } = scanCropModal;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const l = (crop.l / 100) * img.width;
            const t = (crop.t / 100) * img.height;
            const w = img.width - ((crop.l + crop.r) / 100) * img.width;
            const h = img.height - ((crop.t + crop.b) / 100) * img.height;
            const c = document.createElement("canvas");
            c.width = Math.max(1, Math.round(w));
            c.height = Math.max(1, Math.round(h));
            const ctx = c.getContext("2d");
            ctx.drawImage(img, l, t, w, h, 0, 0, c.width, c.height);
            const dataUrl = c.toDataURL("image/jpeg", 0.92);
            const id = `scan-${Date.now()}`;
            setDocsStore((prev) => ({
                ...prev,
                [category]: [...(prev[category] || []), { id, name: "สแกน-A4.jpg", mime: "image/jpeg", url: dataUrl, createdAt: Date.now() }],
            }));
            URL.revokeObjectURL(src);
            setScanCropModal(null);
            showToast("ครอปและบันทึกแล้ว");
        };
        img.src = src;
    };

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape" && isSelectingArea) {
                e.preventDefault();
                exportDragActiveRef.current = false;
                setIsSelectingArea(false);
                setExportArea(null);
                setSelectionStart(null);
                setMessage({ text: "ยกเลิกการเลือกพื้นที่แล้ว", type: "success" });
                setTimeout(() => setMessage({ text: "", type: "" }), 2500);
                return;
            }
            if (e.key === "Escape" && docPreview) {
                e.preventDefault();
                setDocPreview(null);
                return;
            }
            if (e.key === "Escape" && scanCropModal) {
                e.preventDefault();
                if (scanCropModal.src && String(scanCropModal.src).startsWith("blob:")) URL.revokeObjectURL(scanCropModal.src);
                setScanCropModal(null);
                return;
            }
            if (e.key === "Escape" && chairMenu) {
                e.preventDefault();
                setChairMenu(null);
                return;
            }
            if (currentView !== "editor" || activeTab !== "floorplan") return;
            const tag = e.target && e.target.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target && e.target.isContentEditable)) return;
            if (chairMenu || editingChair || showExportModal || scanCropModal || docPreview) return;
            if (e.code === "KeyM") {
                e.preventDefault();
                setActiveMode("move_zone");
            } else if (e.code === "KeyR") {
                e.preventDefault();
                setActiveMode("edit_chair");
            }
        };
        window.addEventListener("keydown", onKey, true);
        return () => window.removeEventListener("keydown", onKey, true);
    }, [isSelectingArea, currentView, activeTab, chairMenu, editingChair, showExportModal, scanCropModal, docPreview]);

    useEffect(() => {
        setCoordinationRows((prev) =>
            zones.map((z) => {
                const total = (z.rows || 0) * (z.columns || 0);
                const hidden = z.hiddenChairs?.length || 0;
                const count = Math.max(0, total - hidden);
                const ex = prev.find((r) => r.zoneId === z.id);
                if (ex) {
                    return { ...ex, zoneName: z.name, objectCount: count };
                }
                return {
                    zoneId: z.id,
                    zoneName: z.name,
                    objectCount: count,
                    responsibleOrg: "",
                    contactAtOrg: "",
                    coordinator: "",
                    notes: "",
                    checklistDone: "",
                    dateNote: "",
                    pickupDate: "",
                    returnDate: "",
                };
            })
        );
    }, [zones]);

    const floorPlanDoc = useMemo(() => {
        let body = `โครงการ: ${layoutName}\n\n`;
        body += `— อาคารและพื้นที่ (กำหนดในแถบข้าง) —\n`;
        body += `จำนวนอาคาร: ${buildingProfile.buildingCount}\n`;
        body += `จำนวนชั้น: ${buildingProfile.floorCount}\n`;
        body += `ขนาดอาคารโดยประมาณ: กว้าง ${buildingProfile.widthM} × ยาว ${buildingProfile.lengthM} × สูง ${buildingProfile.heightM} ม.\n\n`;
        body += `— สรุปผังบนแคนวาส —\n`;
        body += `จำนวน object ที่แสดง: ${stats.actualChairs}\n`;
        body += `พื้นที่ครอบคลุมผัง (ประมาณ): ${stats.areaSqM} ม²\n\n`;
        body += `— รายละเอียดแต่ละโซน —\n`;
        zones.forEach((z) => {
            const labels = [];
            for (let ri = 0; ri < (z.rows || 0); ri++) {
                for (let ci = 0; ci < (z.columns || 0); ci++) {
                    const k = `${ri}-${ci}`;
                    if (z.hiddenChairs?.includes(k)) continue;
                    const nm = guestNames[z.id]?.[k];
                    labels.push(nm ? `${String.fromCharCode(65 + ri)}${ci + 1}:${nm}` : `${String.fromCharCode(65 + ri)}${ci + 1}`);
                }
            }
            const vis = Math.max(0, (z.rows || 0) * (z.columns || 0) - (z.hiddenChairs?.length || 0));
            body += `\n• ${z.name} — แถว×คอลัมน์ ${z.rows}×${z.columns} — object ที่แสดง ${vis}\n`;
            body += `  รายการ: ${labels.slice(0, 100).join(", ")}${labels.length > 100 ? " …" : ""}\n`;
        });
        return body;
    }, [zones, layoutName, buildingProfile, stats, guestNames]);

    // --- Export Functions ---
    const handleExportClick = () => {
        setShowExportModal(true);
        setExportMode('all');
        setIsSelectingArea(false);
        setExportArea(null);
    };

    const handleExportAll = async () => {
        setShowExportModal(false);
        setExportMode('all');
        setIsSelectingArea(false);
        setExportArea(null);
        setSelectionStart(null);
        setTimeout(() => window.print(), 100);
        showToast("กำลังเตรียม export ทั้งหมด...");
    };

    const handleStartAreaSelection = () => {
        setIsSelectingArea(true);
        setExportArea(null);
        setSelectionStart(null);
        exportDragActiveRef.current = false;
        showToast("ลากบนผังเพื่อเลือกพื้นที่ — กด Esc ยกเลิก");
    };

    const handleExportAreaStart = (e) => {
        if (!isSelectingArea) return;
        const mainEl = e.currentTarget;
        const startX = e.clientX;
        const startY = e.clientY;
        exportDragActiveRef.current = true;
        setSelectionStart({ x: startX, y: startY });
        setExportArea({ x: startX, y: startY, width: 0, height: 0 });

        const onMove = (ev) => {
            if (!exportDragActiveRef.current) return;
            const x = Math.min(startX, ev.clientX);
            const y = Math.min(startY, ev.clientY);
            const width = Math.abs(ev.clientX - startX);
            const height = Math.abs(ev.clientY - startY);
            setExportArea({ x, y, width, height });
        };

        const onUp = (ev) => {
            exportDragActiveRef.current = false;
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onUp);
            try {
                if (mainEl && ev.pointerId != null) mainEl.releasePointerCapture(ev.pointerId);
            } catch (err) {
                console.warn("releasePointerCapture", err);
            }
        };

        try {
            if (e.pointerId != null) mainEl.setPointerCapture(e.pointerId);
        } catch (err) {
            console.warn("setPointerCapture", err);
        }
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
    };

    const handleExportAreaMove = () => {};

    const handleExportAreaEnd = () => {};

    const handleConfirmExportArea = async () => {
        if (!exportArea || exportArea.width < 50 || exportArea.height < 50) {
            showToast("กรุณาเลือกพื้นที่ที่ใหญ่กว่านี้", "error");
            return;
        }
        setShowExportModal(false);
        setExportMode('all');
        setIsSelectingArea(false);
        setExportArea(null);
        setSelectionStart(null);
        
        // Trigger print with selected area
        setTimeout(() => window.print(), 100);
        showToast("กำลังเตรียม export ส่วนที่เลือก...");
    };

    // --- Firebase Authentication Functions ---
    const handleSignUp = async () => {
        if (!loginEmail || !loginPassword) {
            showToast("กรุณากรอก Email และ Password", "error");
            return;
        }
        if (loginPassword.length < 6) {
            showToast("Password ต้องมีอย่างน้อย 6 ตัวอักษร", "error");
            return;
        }
        setIsLoading(true);
        try {
            console.log("📝 Attempting signup with:", loginEmail);
            const result = await auth.createUserWithEmailAndPassword(loginEmail, loginPassword);
            console.log("✅ Signup SUCCESS:", result.user.email);
            setLoginEmail('');
            setLoginPassword('');
            showToast("สมัครสมาชิกสำเร็จ!");
        } catch (error) {
            console.error("❌ Signup ERROR:", error.code, error.message);
            const messages = {
                'auth/email-already-in-use': 'Email นี้ลงทะเบียนแล้ว',
                'auth/invalid-email': 'Email ไม่ถูกต้อง',
                'auth/weak-password': 'Password อ่อนเกินไป (ต้องอย่างน้อย 6 ตัวอักษร)',
                'auth/operation-not-allowed': 'ไม่สามารถสมัครได้ ติดต่อผู้ดูแล'
            };
            showToast(messages[error.code] || error.message || "เกิดข้อผิดพลาด", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!loginEmail || !loginPassword) {
            showToast("กรุณากรอก Email และ Password", "error");
            return;
        }
        setIsLoading(true);
        try {
            console.log("🔐 Attempting login with:", loginEmail);
            const result = await auth.signInWithEmailAndPassword(loginEmail, loginPassword);
            console.log("✅ Login SUCCESS:", result.user.email);
            setLoginEmail('');
            setLoginPassword('');
            showToast("เข้าสู่ระบบสำเร็จ!");
        } catch (error) {
            console.error("❌ Login ERROR:", error.code, error.message);
            const messages = {
                'auth/user-not-found': 'ไม่พบบัญชีผู้ใช้นี้ ลองสมัครสมาชิกใหม่',
                'auth/wrong-password': 'Password ไม่ถูกต้อง',
                'auth/invalid-email': 'Email ไม่ถูกต้อง',
                'auth/user-disabled': 'บัญชีปิดการใช้งานแล้ว',
                'auth/too-many-requests': 'ลองใหม่อีกครั้งในภายหลัง'
            };
            showToast(messages[error.code] || error.message || "เกิดข้อผิดพลาด", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            console.log("🔓 Attempting Google Sign-In...");
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await auth.signInWithPopup(provider);
            console.log("✅ Google Sign-In SUCCESS:", result.user.email);
            showToast("เข้าสู่ระบบด้วย Google สำเร็จ!");
        } catch (error) {
            console.error("❌ Google Sign-In ERROR:", error.code, error.message);
            const messages = {
                'auth/popup-blocked': 'Pop-up ถูกบล็อก โปรดเปิดอนุญาต pop-up บนเบราว์เซอร์',
                'auth/popup-closed-by-user': 'คุณปิด login window',
                'auth/unauthorized-domain': 'Domain นี้ยังไม่ได้ authorize ใน Firebase Console',
                'auth/operation-not-allowed': 'Google Sign-In ยังไม่เปิดใช้งาน ใน Firebase Console',
                'auth/invalid-client-id': 'Firebase config ไม่ถูกต้อง',
            };
            const displayMsg = messages[error.code] || `Google Sign-In ผิดพลาด: ${error.message}`;
            showToast(displayMsg, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await auth.signOut();
            showToast("ออกจากระบบสำเร็จ");
        } catch (error) {
            showToast(error.message || "เกิดข้อผิดพลาด", "error");
        }
    };

    // ฟังก์ชันช่วยสำหรับการออก Project ด้วยอนิเมชัน
    const goToHome = () => {
        setIsAnimating(true);
        setAnimationDirection('exit');
        setTimeout(() => {
            setCurrentView('home');
            setIsAnimating(false);
        }, 500);
    };

    // --- ฟังก์ชันจัดการระบบ ---
    const handleSaveToCloud = async () => {
        // Cloud only - must be logged in
        if (!currentUser) {
            showToast("กรุณาเข้าสู่ระบบก่อนบันทึกข้อมูล 🔐", "error");
            goToHome();
            return;
        }
        
        try {
            const layoutData = {
                id: currentLayoutId || `layout-${Date.now()}`,
                name: layoutName,
                zones: zones,
                guestNames: guestNames,
                buildingProfile,
                chairImages,
                coordinationRows,
                updatedAt: Date.now(),
            };

            // Save to Firebase only
            await db.collection('users').doc(currentUser.uid).collection('layouts').doc(layoutData.id).set(layoutData);
            
            // Update local state
            setSavedLayouts(prev => {
                const index = prev.findIndex(l => l.id === layoutData.id);
                if (index > -1) {
                    const updated = [...prev];
                    updated[index] = layoutData;
                    return updated;
                } else {
                    return [...prev, layoutData];
                }
            });
            
            if (!currentLayoutId) {
                setCurrentLayoutId(layoutData.id);
            }
            
            showToast("บันทึกลงคลาวด์เรียบร้อยแล้ว ☁️");
        } catch (e) {
            console.error("Save error:", e);
            showToast("บันทึกไม่สำเร็จ กรุณาลองใหม่", "error");
        }
    };

    const loadLayout = (l) => {
        setIsAnimating(true);
        setAnimationDirection('enter');
        setTimeout(() => {
            setZones(l.zones || []);
            setGuestNames(l.guestNames || {});
            setBuildingProfile(l.buildingProfile || { buildingCount: 1, floorCount: 1, widthM: 20, lengthM: 30, heightM: 12 });
            setChairImages(l.chairImages || {});
            setCoordinationRows(l.coordinationRows || []);
            setLayoutName(l.name); 
            setCurrentLayoutId(l.id); 
            if(l.zones && l.zones.length > 0) setActiveZoneId(l.zones[0].id);
            setPan({ x: 100, y: 100 }); 
            setZoom(0.7); 
            setCurrentView('editor');
            setIsAnimating(false);
        }, 50);
    };

    const handleCreateNew = () => {
        setIsAnimating(true);
        setAnimationDirection('enter');
        setTimeout(() => {
            setCurrentLayoutId(null); 
            setLayoutName('โปรเจกต์ใหม่');
            setZones([{ id: 'zone-1', name: 'โซนหลัก', ...DEFAULT_ZONE_CONFIG, rows: 0, columns: 0, x: 0, y: 0 }]);
            setActiveZoneId('zone-1');
            setGuestNames({});
            setBuildingProfile({ buildingCount: 1, floorCount: 1, widthM: 20, lengthM: 30, heightM: 12 });
            setChairImages({});
            setCoordinationRows([]);
            setDocsStore({ initial: [], coordination: [], return: [] });
            setPan({ x: 100, y: 100 }); 
            setZoom(0.7); 
            setCurrentView('editor');
            setIsAnimating(false);
        }, 50);
    };

    const deleteLayout = async (e, id) => {
        e.stopPropagation();
        
        if (!currentUser) {
            showToast("กรุณาเข้าสู่ระบบก่อนลบโปรเจกต์ 🔐", "error");
            return;
        }
        
        if (window.confirm("คุณต้องการลบโปรเจกต์นี้ออกจากคลาวด์ใช่หรือไม่? (ไม่สามารถกู้คืนได้)")) {
            try {
                await db.collection('users').doc(currentUser.uid).collection('layouts').doc(id).delete();
                const newLayouts = savedLayouts.filter(l => l.id !== id);
                setSavedLayouts(newLayouts);
                if (currentLayoutId === id) handleCreateNew();
                showToast("ลบข้อมูลออกจากคลาวด์เรียบร้อยแล้วค่ะ");
            } catch (e) {
                console.error("Delete error:", e);
                showToast("ลบข้อมูลไม่สำเร็จ กรุณาลองใหม่", "error");
            }
        }
    };

    // --- ฟังก์ชันจัดการโซนและเก้าอี้ ---
    const handleZoneColorChange = (colorKey) => {
        setZones(prev => prev.map(z => z.id === activeZoneId ? { ...z, color: colorKey } : z));
    };

    const addNewZone = () => {
        const newId = `zone-${Date.now()}`;
        const newZoneProps = { ...DEFAULT_ZONE_CONFIG, id: newId, name: `โซนใหม่ ${zones.length + 1}`, color: Object.keys(ZONE_COLORS)[zones.length % 5] };
        
        let targetX = 0, targetY = 0, foundSpot = false;
        const step = 20; 
        for (let row = 0; row < 50; row++) {
            for (let col = 0; col < 50; col++) {
                targetX = col * step; targetY = row * step;
                const testBounds = getBounds(newZoneProps, targetX, targetY);
                if (!zones.some(z => isColliding(testBounds, getBounds(z)))) { foundSpot = true; break; }
            }
            if (foundSpot) break;
        }

        setZones(prev => [...prev, { ...newZoneProps, x: targetX, y: targetY }]);
        setActiveZoneId(newId);
        showToast("เพิ่มโซนใหม่สำเร็จค่ะ");
    };

    const deleteActiveZone = () => {
        if (zones.length <= 1) { showToast("ต้องมีอย่างน้อย 1 โซน", "error"); return; }
        if (window.confirm(`ต้องการลบ ${activeZone.name} ใช่หรือไม่?`)) {
            const newZones = zones.filter(z => z.id !== activeZoneId);
            setZones(newZones);
            setActiveZoneId(newZones[0].id);
            showToast("ลบโซนเรียบร้อยแล้วค่ะ");
        }
    };

    const chairLabelFromKey = (chairKey) => {
        const [r, c] = chairKey.split("-").map((x) => parseInt(x, 10));
        if (Number.isNaN(r) || Number.isNaN(c)) return chairKey;
        return `${String.fromCharCode(65 + r)}${c + 1}`;
    };

    const handleChairClick = (zoneId, row, col) => {
        if (activeMode !== "edit_chair") return;
        const key = `${row}-${col}`;
        const zone = zones.find((z) => z.id === zoneId);
        const isHidden = zone?.hiddenChairs?.includes(key);
        setChairMenu({ zoneId, row, col, chairKey: key, isHidden });
    };

    const hideChairAtMenu = () => {
        if (!chairMenu || chairMenu.isHidden) return;
        const { zoneId, chairKey } = chairMenu;
        setZones((prev) =>
            prev.map((z) =>
                z.id === zoneId ? { ...z, hiddenChairs: [...(z.hiddenChairs || []), chairKey] } : z
            )
        );
        setChairMenu(null);
        showToast("ซ่อนที่นั่งแล้ว — คลิกช่องเดิมเพื่อคืน");
    };

    const restoreChairAtMenu = () => {
        if (!chairMenu || !chairMenu.isHidden) return;
        const { zoneId, chairKey } = chairMenu;
        setZones((prev) =>
            prev.map((z) =>
                z.id === zoneId
                    ? { ...z, hiddenChairs: (z.hiddenChairs || []).filter((k) => k !== chairKey) }
                    : z
            )
        );
        setChairMenu(null);
        showToast("คืนที่นั่งแล้ว");
    };

    const openRenameFromChairMenu = () => {
        if (!chairMenu) return;
        const { zoneId, chairKey } = chairMenu;
        const currentGuestName = guestNames[zoneId]?.[chairKey] || "";
        setEditingChair({ zoneId, chairKey });
        setGuestNameInput(currentGuestName);
        setChairMenu(null);
    };

    const onChairImageSelected = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file || !chairMenu) return;
        if (!file.type.startsWith("image/")) {
            showToast("โปรดเลือกไฟล์รูปภาพ", "error");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result;
            const { zoneId, chairKey } = chairMenu;
            setChairImages((prev) => ({
                ...prev,
                [zoneId]: { ...(prev[zoneId] || {}), [chairKey]: dataUrl },
            }));
            showToast("บันทึกรูปประกอบตำแหน่งแล้ว");
            setChairMenu(null);
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const handleSaveGuestName = () => {
        if (!editingChair) return;
        const { zoneId, chairKey } = editingChair;
        
        setGuestNames(prev => ({
            ...prev,
            [zoneId]: { ...prev[zoneId], [chairKey]: guestNameInput }
        }));
        
        setEditingChair(null);
        setGuestNameInput('');
        showToast("บันทึกชื่อแขกเรียบร้อยแล้ว");
    };

    const handleSwapChairs = (fromZoneId, fromChairKey, toZoneId, toChairKey) => {
        if (fromZoneId !== toZoneId) return; // Only swap within same zone
        
        // Swap guest names
        const fromGuest = guestNames[fromZoneId]?.[fromChairKey] || '';
        const toGuest = guestNames[toZoneId]?.[toChairKey] || '';
        
        setGuestNames(prev => ({
            ...prev,
            [fromZoneId]: {
                ...prev[fromZoneId],
                [fromChairKey]: toGuest,
                [toChairKey]: fromGuest
            }
        }));
        
        setSwappingChair(null);
        showToast("สลับตำแหน่งเก้าอี้เรียบร้อยแล้ว");
    };

    // --- ระบบฟิสิกส์การลาก (Pointer Physics) ---
    const handlePointerDown = (e) => {
        if (isSelectingArea) return; // Disable pan when selecting export area
        if (e.target.closest('.no-pan')) return;
        if (e.target.closest('.chair-element') && activeMode === 'edit_chair') return;

        const dragHandle = e.target.closest('.zone-draggable');
        if (dragHandle && activeMode === 'move_zone') {
            const zoneId = dragHandle.getAttribute('data-zone-id');
            setDragContext({ type: 'zone', zoneId, lastX: e.clientX, lastY: e.clientY });
            setActiveZoneId(zoneId);
            e.target.setPointerCapture(e.pointerId);
            return;
        }
        setDragContext({ type: 'pan', lastX: e.clientX, lastY: e.clientY });
        e.target.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!dragContext) return;
        const deltaX = e.clientX - dragContext.lastX;
        const deltaY = e.clientY - dragContext.lastY;

        if (dragContext.type === 'pan') {
            setPan(p => ({ x: p.x + deltaX, y: p.y + deltaY }));
            setDragContext(prev => ({ ...prev, lastX: e.clientX, lastY: e.clientY }));
        } else if (dragContext.type === 'zone') {
            const moveX = deltaX / zoom / (UNIT_SCALE / 2);
            const moveY = deltaY / zoom / (UNIT_SCALE / 2);
            
            setZones(prev => {
                const zIndex = prev.findIndex(z => z.id === dragContext.zoneId);
                if (zIndex === -1) return prev;
                const z = prev[zIndex];
                const others = prev.filter(oz => oz.id !== z.id);
                
                let nextX = Math.max(0, z.x + moveX);
                let nextY = Math.max(0, z.y + moveY);
                
                // ตรวจสอบว่าตำแหน่งปัจจุบันชนกับ zone อื่นหรือไม่
                const currentlyColliding = others.some(oz => isColliding(getBounds(z), getBounds(oz)));
                
                if (currentlyColliding) {
                    // ถ้ากำลังชนกันอยู่ ให้อนุญาตเลื่อนออกจากการชนกัน
                    // ตรวจสอบว่าการเลื่อนไปทำให้ห่างออกได้หรือไม่
                    const wouldCollideX = others.some(oz => isColliding(getBounds(z, nextX, z.y), getBounds(oz)));
                    const wouldCollideY = others.some(oz => isColliding(getBounds(z, z.x, nextY), getBounds(oz)));
                    const wouldCollideXY = others.some(oz => isColliding(getBounds(z, nextX, nextY), getBounds(oz)));
                    
                    // ถ้า X ใหม่ช่วยให้ห่างออก ให้ปรับตำแหน่ง X
                    if (wouldCollideX) nextX = z.x;
                    // ถ้า Y ใหม่ช่วยให้ห่างออก ให้ปรับตำแหน่ง Y
                    if (wouldCollideY) nextY = z.y;
                } else {
                    // ถ้าไม่ชนกัน ให้ป้องกันการเลื่อนเข้าชนกัน (เหมือนเดิม)
                    if (others.some(oz => isColliding(getBounds(z, nextX, z.y), getBounds(oz)))) nextX = z.x;
                    if (others.some(oz => isColliding(getBounds(z, nextX, nextY), getBounds(oz)))) nextY = z.y;
                }

                const newZones = [...prev];
                newZones[zIndex] = { ...z, x: nextX, y: nextY };
                return newZones;
            });
            setDragContext(prev => ({ ...prev, lastX: e.clientX, lastY: e.clientY }));
        }
    };

    const handlePointerUp = (e) => {
        if (dragContext) {
            e.target.releasePointerCapture(e.pointerId);
            setDragContext(null);
        }
    };

    // --- การจัดการ Zoom ด้วยลูกกลิ้งเมาส์ (Wheel Zoom) ---
    const handleWheel = (e) => {
        if (e.target.closest('.no-pan')) return;
        if (!e.ctrlKey && !e.metaKey) return; // ต้องกด Ctrl หรือ Cmd พร้อมกัน
        
        e.preventDefault();
        const zoomDirection = e.deltaY > 0 ? -1 : 1; // Scroll up = zoom in, down = zoom out
        const zoomStep = 0.1;
        const newZoom = Math.max(0.2, Math.min(2, zoom + (zoomDirection * zoomStep)));
        setZoom(newZoom);
    };

    // --- การจัดการ Trackpad Pinch ของ Mac (Gesture) ---
    const handleGestureChange = (e) => {
        e.preventDefault();
        const newZoom = Math.max(0.2, Math.min(2, zoom * e.scale));
        setZoom(newZoom);
    };

    // --- การแสดงผลเส้นไกด์ (Smart Guides) ---
    const renderSmartGuides = () => {
        const az = zones.find(z => z.id === activeZoneId);
        if (!az) return null;
        const aB = getBounds(az);
        if (aB.width === 0 || aB.height === 0) return null;
        let lines = [];
        zones.forEach(oz => {
            if (oz.id === activeZoneId) return;
            const oB = getBounds(oz);
            if (oB.width === 0 || oB.height === 0) return;
            const oT = Math.max(aB.top, oB.top), oBtm = Math.min(aB.bottom, oB.bottom), oL = Math.max(aB.left, oB.left), oR = Math.min(aB.right, oB.right);
            
            if (oT < oBtm) {
                const cY = (oT + oBtm) / 2;
                if (oB.right <= aB.left) lines.push({ x: oB.right, y: cY, w: aB.left - oB.right, h: 0, v: Math.round(aB.left - oB.right) });
                if (oB.left >= aB.right) lines.push({ x: aB.right, y: cY, w: oB.left - aB.right, h: 0, v: Math.round(oB.left - aB.right) });
            }
            if (oL < oR) {
                const cX = (oL + oR) / 2;
                if (oB.bottom <= aB.top) lines.push({ x: cX, y: oB.bottom, w: 0, h: aB.top - oB.bottom, v: Math.round(aB.top - oB.bottom) });
                if (oB.top >= aB.bottom) lines.push({ x: cX, y: aB.bottom, w: 0, h: oB.top - aB.bottom, v: Math.round(oB.top - aB.bottom) });
            }
        });

        return lines.map((l, i) => (
            <div key={`guide-${i}`} className="absolute pointer-events-none z-40 bg-[#ef4444] flex items-center justify-center opacity-80" style={{ left: l.x * (UNIT_SCALE / 2), top: l.y * (UNIT_SCALE / 2), width: l.h === 0 ? l.w * (UNIT_SCALE / 2) : 1.5, height: l.h === 0 ? 1.5 : l.h * (UNIT_SCALE / 2) }}>
                <div className="absolute bg-[#ef4444] rounded-full" style={{ width: 4, height: 4, left: l.h===0 ? -2 : -1.25, top: l.h===0 ? -1.25 : -2 }}></div>
                <div className="absolute bg-[#ef4444] rounded-full" style={{ width: 4, height: 4, right: l.h===0 ? -2 : -1.25, bottom: l.h===0 ? -1.25 : -2 }}></div>
                <div className="absolute bg-[#ef4444] text-white px-1.5 py-0.5 rounded shadow-sm text-[8px] font-bold whitespace-nowrap">{l.v} ซม.</div>
            </div>
        ));
    };

    // ==========================================
    // โครงสร้างหน้า UI หลัก (JSX)
    // ==========================================
    
    // หน้า Library (Home)
    if (currentView === 'home') {
        const homeViewClass = isAnimating && animationDirection === 'exit' ? 'view-exit-animation' : '';
        return (
            <div className={`flex w-full min-h-screen bg-white font-sans text-slate-900 overflow-hidden select-none ${homeViewClass}`}>
                {message.text && (
                    <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-lg transition-all duration-300 font-medium text-white flex items-center gap-2 ${message.type === 'error' ? 'bg-red-500' : 'bg-slate-800'}`}>
                        <i className="fa-solid fa-check"></i> {message.text}
                    </div>
                )}
                <aside className="w-64 bg-[#f5f5f7] border-r border-[#d1d1d6] h-full flex flex-col z-20 shrink-0 p-6">
                    <div className="flex items-center gap-2 mb-8 font-bold text-lg"><i className="fa-solid fa-book-open text-[#007aff]"></i> Visual Events (Local)</div>
                    <div className="relative mb-6">
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-[#8e8e93]"></i>
                        <input type="text" placeholder="ค้นหาโปรเจกต์..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#e3e3e8] hover:bg-[#d1d1d6] focus:bg-white border-transparent focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/20 rounded-md py-1.5 pl-9 pr-3 text-sm outline-none transition-all" />
                    </div>
                    <button className="w-full flex items-center gap-2 px-3 py-2 bg-[#007aff] text-white rounded-md text-sm font-medium shadow-sm"><i className="fa-solid fa-grip"></i> แฟ้มงานทั้งหมด</button>
                    <div className="mt-auto pt-4 border-t border-[#d1d1d6]">
                        {currentUser ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"><i className="fa-solid fa-cloud text-blue-500"></i></div>
                                    <div className="text-xs">
                                        <div className="font-bold truncate">{currentUser.email}</div>
                                        <div className="text-[10px] text-slate-500">connected ☁️</div>
                                    </div>
                                </div>
                                <button onClick={handleLogout} className="w-full text-red-500 hover:bg-red-50 px-2 py-1.5 rounded text-xs font-medium"><i className="fa-solid fa-sign-out"></i> ออกจากระบบ</button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} placeholder="email@example.com" className="w-full bg-slate-100 border rounded-md px-2 py-1 text-xs outline-none focus:border-blue-400" />
                                <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} placeholder="Password" className="w-full bg-slate-100 border rounded-md px-2 py-1 text-xs outline-none focus:border-blue-400" />
                                <button onClick={handleLogin} disabled={isLoading} className="w-full bg-blue-500 hover:bg-blue-600 text-white px-2 py-1.5 rounded text-xs font-medium disabled:opacity-50"><i className="fa-solid fa-sign-in"></i> {isLoading ? '⏳ กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</button>
                                <button onClick={handleSignUp} disabled={isLoading} className="w-full bg-green-500 hover:bg-green-600 text-white px-2 py-1.5 rounded text-xs font-medium disabled:opacity-50"><i className="fa-solid fa-user-plus"></i> {isLoading ? '⏳ กำลังสมัคร...' : 'สมัครสมาชิก'}</button>
                                
                                <div className="flex items-center gap-2 my-1">
                                    <div className="flex-1 bg-slate-300 h-px" />
                                    <span className="text-[10px] text-slate-400 font-medium">หรือ</span>
                                    <div className="flex-1 bg-slate-300 h-px" />
                                </div>
                                
                                <button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-2 py-1.5 rounded text-xs font-medium disabled:opacity-50 flex items-center justify-center gap-1.5 transition" title="ต้องเปิดใช้ Google Sign-In ใน Firebase Console ก่อน"><i className="fa-brands fa-google text-red-500"></i> <span>Google (setup required)</span></button>
                            </div>
                        )}
                    </div>
                </aside>
                <main className="flex-1 p-10 pt-16 overflow-y-auto bg-slate-50/50">
                    <div className="flex justify-between items-center mb-10">
                        <div className="flex gap-4 items-center">
                            <h1 className="text-4xl font-bold text-[#1c1c1e]">แฟ้มงาน</h1>
                            {currentUser && <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">☁️ Cloud Sync</span>}
                        </div>
                    </div>

                    {!currentUser && (
                        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                            <div className="font-bold text-blue-900 mb-2">🔐 ต้องเข้าสู่ระบบเพื่อบันทึกโปรเจกต์</div>
                            <p className="text-blue-800">ข้อมูลจะบันทึกบนคลาวด์เท่านั้น กรุณาเข้าสู่ระบบด้านล่างเพื่อเริ่มใช้งาน</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
                        <div onClick={handleCreateNew} className="project-card aspect-[3/4] border-2 border-dashed border-[#d1d1d6] bg-white hover:bg-[#e3e3e8] rounded-xl flex flex-col items-center justify-center text-[#8e8e93] hover:text-[#3a3a3c] cursor-pointer transition hover:scale-105">
                            <i className="fa-solid fa-circle-plus text-4xl mb-2"></i>
                            <span className="text-sm font-semibold">สร้างงานใหม่</span>
                        </div>
                        {cloudLayouts.map(l => {
                            let tSeats = 0; let hCount = 0;
                            if (l.zones) l.zones.forEach(z => { tSeats += (z.rows || 0) * (z.columns || 0); hCount += z.hiddenChairs ? z.hiddenChairs.length : 0; });
                            const dateStr = new Date(l.updatedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
                            
                            return (
                                <div key={l.id} className="group cursor-pointer project-card-enter">
                                    <div onClick={() => loadLayout(l)} className="project-card aspect-[3/4] bg-gradient-to-br from-slate-50 to-slate-200 rounded-r-xl rounded-l-sm shadow-md hover:shadow-xl hover:-translate-y-1 transition-all relative border overflow-hidden hover:scale-105">
                                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-black/5 border-r border-white/20 z-10" />
                                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-white via-white/90 to-transparent pt-12">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-2"><i className="fa-solid fa-border-all text-[#007aff]"></i></div>
                                            <p className="text-2xl font-bold leading-none text-slate-800">{tSeats - hCount}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">ที่นั่ง</p>
                                        </div>
                                        <button onClick={(e) => deleteLayout(e, l.id)} className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 text-red-500 hover:bg-white shadow z-20 transition">
                                            <i className="fa-solid fa-trash-can"></i>
                                        </button>
                                    </div>
                                    <div className="px-1 mt-3"><p className="font-semibold text-sm truncate text-slate-800">{l.name}</p><p className="text-[11px] text-slate-500">อัปเดต: {dateStr}</p></div>
                                </div>
                            );
                        })}
                    </div>
                </main>
            </div>
        );
    }

    // หน้า Editor หลัก
    const editorViewClass = isAnimating && animationDirection === 'enter' ? 'view-enter-animation' : '';
    return (
        <div className={`flex flex-col w-full min-h-screen bg-[#f2f2f7] font-sans text-slate-900 overflow-hidden ${editorViewClass}`}>
            {message.text && <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-2.5 rounded-full shadow-lg transition-all duration-300 font-medium text-sm text-white flex items-center gap-2 ${message.type === 'error' ? 'bg-red-500' : 'bg-slate-800'}`}><i className="fa-solid fa-check"></i> {message.text}</div>}

            {/* Navbar ด้านบน */}
            <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex justify-between items-center z-30 shadow-sm relative no-pan">
                <div className="flex items-center gap-4">
                    <button onClick={goToHome} className="flex items-center gap-1.5 text-[#007aff] hover:bg-[#007aff]/10 px-2 py-1.5 rounded-md transition text-sm font-medium"><i className="fa-solid fa-chevron-left"></i> แฟ้มงาน</button>
                    <div className="h-5 w-px bg-slate-300 mx-1" />
                    {activeTab === 'floorplan' && <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-1.5 rounded-md transition-colors ${isSidebarOpen ? 'bg-slate-100 text-[#007aff]' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}><i className="fa-solid fa-bars"></i></button>}
                    <input type="text" value={layoutName} onChange={(e) => setLayoutName(e.target.value)} className="bg-transparent font-bold text-sm focus:outline-none w-48 text-slate-800" />
                </div>
                
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center bg-[#f2f2f7] p-1 rounded-xl border border-slate-200/50 max-w-[calc(100vw-200px)] overflow-x-auto">
                    {[
                        { id: "floorplan", icon: "fa-border-all", label: "ผังงาน" },
                        { id: "meetings", icon: "fa-message", label: "การประชุม" },
                        { id: "schedule", icon: "fa-table", label: "ประสานงาน" },
                        { id: "documents", icon: "fa-folder-open", label: "คลังเอกสาร" },
                    ].map((t) => (
                        <button key={t.id} type="button" onClick={() => setActiveTab(t.id)} className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase transition-all flex items-center gap-1.5 tracking-wider ${activeTab === t.id ? "bg-white shadow-sm text-[#007aff]" : "text-slate-500 hover:text-slate-700"}`}>
                            <i className={`fa-solid ${t.icon}`}></i>
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-[#f2f2f7] p-1 rounded-lg">
                        <button onClick={handleExportClick} className="text-slate-600 hover:bg-white hover:shadow-sm p-1.5 rounded-md transition px-3 flex items-center gap-1.5 text-xs font-medium border-r border-slate-300"><i className="fa-solid fa-download"></i> <span className="hidden md:inline">นำออก PDF</span></button>
                        <button onClick={handleSaveToCloud} className={`hover:bg-white hover:shadow-sm p-1.5 rounded-md transition px-3 flex items-center gap-1.5 text-xs font-bold ${currentUser ? 'text-blue-600' : 'text-red-600'}`}><i className={`fa-solid ${currentUser ? 'fa-cloud' : 'fa-lock-open'}`}></i> <span className="hidden md:inline">{currentUser ? 'บันทึก ☁️' : '⚠️ ต้องเข้าสู่ระบบ'}</span></button>
                    </div>
                </div>
            </header>

            {/* Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4 no-print">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">🎨 นำออก PDF</h2>
                            <button type="button" onClick={closeExportModal} className="text-slate-400 hover:text-slate-600 text-xl"><i className="fa-solid fa-xmark"></i></button>
                        </div>

                        <div className="space-y-3 mb-6">
                            <label className="flex items-center p-3 border-2 border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition" onClick={() => setExportMode('all')}>
                                <input type="radio" name="exportMode" checked={exportMode === 'all'} onChange={() => setExportMode('all')} className="w-4 h-4" />
                                <div className="ml-3">
                                    <div className="font-medium text-sm">📄 ทั้งหน้ากระดาษ</div>
                                    <div className="text-xs text-slate-500">ทุกพื้นที่ที่มีผัง</div>
                                </div>
                            </label>
                            
                            <label className="flex items-center p-3 border-2 border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition" onClick={() => setExportMode('area')}>
                                <input type="radio" name="exportMode" checked={exportMode === 'area'} onChange={() => setExportMode('area')} className="w-4 h-4" />
                                <div className="ml-3">
                                    <div className="font-medium text-sm">✂️ เลือกพื้นที่เอง</div>
                                    <div className="text-xs text-slate-500">ลากสร้าง selection box บนผัง</div>
                                </div>
                            </label>
                        </div>

                        {exportMode === 'area' && !isSelectingArea && (
                            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                                <i className="fa-solid fa-circle-info mr-2"></i>
                                คลิก "เริ่มเลือก" แล้วลากที่แผ่นผังเพื่อเลือกพื้นที่ที่ต้องการ
                            </div>
                        )}

                        {exportMode === 'area' && isSelectingArea && exportArea && (
                            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-900">
                                <i className="fa-solid fa-check-circle mr-2"></i>
                                ขนาดที่เลือก: {Math.round(exportArea.width)} × {Math.round(exportArea.height)} px — กด <kbd className="px-1 bg-white rounded border">Esc</kbd> เพื่อยกเลิกการลาก
                            </div>
                        )}

                        <div className="flex gap-2 justify-end">
                            <button type="button" onClick={closeExportModal} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition">ยกเลิก</button>
                            
                            {exportMode === 'all' ? (
                                <button onClick={handleExportAll} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center gap-2">
                                    <i className="fa-solid fa-download"></i> นำออก PDF
                                </button>
                            ) : (
                                !isSelectingArea ? (
                                    <button onClick={handleStartAreaSelection} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center gap-2">
                                        <i className="fa-solid fa-crosshairs"></i> เริ่มเลือก
                                    </button>
                                ) : (
                                    <button onClick={handleConfirmExportArea} disabled={!exportArea || exportArea.width < 50 || exportArea.height < 50} className="px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                        <i className="fa-solid fa-check"></i> Export
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* พื้นที่การทำงาน */}
            <div className="flex flex-1 overflow-hidden relative w-full touch-none">
                
                {/* Tab: Floorplan */}
                {activeTab === 'floorplan' && (
                    <React.Fragment>
                        {/* Sidebar เครื่องมือ */}
                        <aside className={`no-pan bg-white/80 backdrop-blur-xl border-r p-4 overflow-y-auto z-20 flex flex-col gap-5 shrink-0 transition-all duration-300 ease-in-out max-w-[min(380px,calc(100vw-12px))] ${isSidebarOpen ? 'w-[380px]' : 'w-0 -ml-[380px] overflow-hidden'}`}>
                            <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200/60">
                                <button type="button" onClick={() => setActiveMode('edit_chair')} className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-lg flex flex-col sm:flex-row justify-center items-center gap-0.5 sm:gap-1.5 transition ${activeMode === 'edit_chair' ? 'bg-white shadow-sm text-[#007aff]' : 'text-slate-500'}`}><span className="flex items-center gap-1"><i className="fa-solid fa-eraser"></i> ลบ/เพิ่ม</span><span className="text-[9px] font-semibold opacity-70">R</span></button>
                                <button type="button" onClick={() => setActiveMode('move_zone')} className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-lg flex flex-col sm:flex-row justify-center items-center gap-0.5 sm:gap-1.5 transition ${activeMode === 'move_zone' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}><span className="flex items-center gap-1"><i className="fa-solid fa-arrows-up-down-left-right"></i> ย้ายโซน</span><span className="text-[9px] font-semibold opacity-70">M</span></button>
                            </div>
                            <div className="space-y-2.5">
                                <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <i className="fa-solid fa-grip"></i> โซน (Zones) 
                                    <button className="ml-auto text-[#007aff] hover:bg-blue-50 p-1 rounded" onClick={addNewZone}><i className="fa-solid fa-plus"></i></button>
                                </div>
                                {zones.map(z => (
                                    <div key={z.id} onClick={() => setActiveZoneId(z.id)} className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex justify-between items-center cursor-pointer transition ${activeZoneId === z.id ? 'bg-white border-slate-300 shadow-sm' : 'bg-[#f2f2f7] border-transparent text-slate-500 hover:bg-[#e3e3e8]'}`}>
                                        <div className="flex items-center gap-2.5 truncate"><div className={`w-2.5 h-2.5 rounded-full ${ZONE_COLORS[z.color].bg}`} /> {z.name}</div> 
                                        {activeZoneId === z.id && zones.length > 1 && <i className="fa-solid fa-trash-can text-slate-400 hover:text-red-500 p-1" onClick={(e) => deleteActiveZone()}></i>}
                                    </div>
                                ))}
                            </div>

                            {activeZone && (
                                <div className="space-y-3 pt-4 border-t border-slate-200/60">
                                    <SidebarCollapsible title="รูปลักษณ์โซน" icon={<i className="fa-solid fa-palette text-blue-500" />}>
                                        <div className="px-3 py-3 bg-blue-50 rounded-xl border border-blue-200 text-center">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">กำลังปรับแต่ง</p>
                                            <p className="text-sm font-bold text-blue-600">{activeZone.name}</p>
                                        </div>
                                        <div className="flex gap-2 justify-center flex-wrap">
                                            {Object.keys(ZONE_COLORS).map((c) => (
                                                <button
                                                    key={c}
                                                    type="button"
                                                    onClick={() => handleZoneColorChange(c)}
                                                    className={`w-10 h-10 rounded-full ${ZONE_COLORS[c].bg} transition transform hover:scale-110 ${activeZone.color === c ? `ring-4 ring-offset-2 ${ZONE_COLORS[c].ring}` : 'opacity-60 hover:opacity-100 shadow-md'}`}
                                                />
                                            ))}
                                        </div>
                                    </SidebarCollapsible>

                                    <SidebarCollapsible title="โซนจำนวน (แถว / คอลัมน์)" icon={<i className="fa-solid fa-hashtag text-blue-500" />} defaultOpen>
                                        <ZoneDimensionControl
                                            title="📏 แถว (ถัดเข้า)"
                                            field="rows"
                                            min={0}
                                            max={100}
                                            presets={PRESET_ROWS}
                                            presetSuffix="rows"
                                            activeZone={activeZone}
                                            activeZoneId={activeZoneId}
                                            setZones={setZones}
                                            cardGradient="from-blue-50 to-blue-100"
                                            cardBorder="border-blue-200"
                                            accentText="text-blue-600"
                                            btnBorder="border-blue-300"
                                            rangeAccent="accent-blue-500"
                                        />
                                        <ZoneDimensionControl
                                            title="↔️ คอลัมน์ (กว้าง)"
                                            field="columns"
                                            min={0}
                                            max={100}
                                            presets={PRESET_COLUMNS}
                                            presetSuffix="cols"
                                            activeZone={activeZone}
                                            activeZoneId={activeZoneId}
                                            setZones={setZones}
                                            cardGradient="from-emerald-50 to-emerald-100"
                                            cardBorder="border-emerald-200"
                                            accentText="text-emerald-600"
                                            btnBorder="border-emerald-300"
                                            rangeAccent="accent-emerald-500"
                                        />
                                    </SidebarCollapsible>

                                    <SidebarCollapsible title="โซนระยะห่าง (ซม.)" icon={<i className="fa-solid fa-arrows-left-right text-purple-500" />} defaultOpen>
                                        <ZoneDimensionControl
                                            title="← → ห่างแนวนอน (ซม.)"
                                            field="spacingX"
                                            min={0}
                                            max={100}
                                            presets={PRESET_SPACING_CM}
                                            presetSuffix="cm"
                                            activeZone={activeZone}
                                            activeZoneId={activeZoneId}
                                            setZones={setZones}
                                            cardGradient="from-purple-50 to-purple-100"
                                            cardBorder="border-purple-200"
                                            accentText="text-purple-600"
                                            btnBorder="border-purple-300"
                                            rangeAccent="accent-purple-500"
                                        />
                                        <ZoneDimensionControl
                                            title="↑ ↓ ห่างแนวตั้ง (ซม.)"
                                            field="spacingY"
                                            min={0}
                                            max={100}
                                            presets={PRESET_SPACING_CM}
                                            presetSuffix="cm"
                                            activeZone={activeZone}
                                            activeZoneId={activeZoneId}
                                            setZones={setZones}
                                            cardGradient="from-purple-50 to-purple-100"
                                            cardBorder="border-purple-200"
                                            accentText="text-purple-600"
                                            btnBorder="border-purple-300"
                                            rangeAccent="accent-purple-500"
                                        />
                                    </SidebarCollapsible>

                                    <SidebarCollapsible title="โซนขนาด — เก้าอี้ (ซม.)" icon={<i className="fa-solid fa-chair text-rose-500" />} defaultOpen>
                                        <ZoneDimensionControl
                                            title="📐 ความกว้างเก้าอี้ (ซม.)"
                                            field="chairWidth"
                                            min={5}
                                            max={100}
                                            presets={PRESET_CHAIR_CM}
                                            presetSuffix="cm"
                                            activeZone={activeZone}
                                            activeZoneId={activeZoneId}
                                            setZones={setZones}
                                            cardGradient="from-rose-50 to-rose-100"
                                            cardBorder="border-rose-200"
                                            accentText="text-rose-600"
                                            btnBorder="border-rose-300"
                                            rangeAccent="accent-rose-500"
                                        />
                                        <ZoneDimensionControl
                                            title="📐 ความยาวเก้าอี้ (ซม.)"
                                            field="chairHeight"
                                            min={5}
                                            max={100}
                                            presets={PRESET_CHAIR_CM}
                                            presetSuffix="cm"
                                            activeZone={activeZone}
                                            activeZoneId={activeZoneId}
                                            setZones={setZones}
                                            cardGradient="from-rose-50 to-rose-100"
                                            cardBorder="border-rose-200"
                                            accentText="text-rose-600"
                                            btnBorder="border-rose-300"
                                            rangeAccent="accent-rose-500"
                                        />
                                    </SidebarCollapsible>

                                    <SidebarCollapsible title="โซนพื้นที่อาคาร (กำหนด)" icon={<i className="fa-solid fa-building text-amber-600" />} defaultOpen={false}>
                                        <p className="text-[10px] text-slate-500 leading-relaxed px-1">ใช้สำหรับสรุปและส่งต่อข้อมูลไปหน้าประชุม/ประสานงาน (ค่าจริงบนผังยังอิงจากโซนบนแคนวาส)</p>
                                        <BuildingMetricControl title="จำนวนอาคาร (ที่กำหนด)" field="buildingCount" min={1} max={50} presets={PRESET_BUILDING_COUNT} presetSuffix="buildings" buildingProfile={buildingProfile} setBuildingProfile={setBuildingProfile} />
                                        <BuildingMetricControl title="จำนวนชั้น (ที่กำหนด)" field="floorCount" min={1} max={80} presets={PRESET_BUILDING_COUNT} presetSuffix="floors" buildingProfile={buildingProfile} setBuildingProfile={setBuildingProfile} />
                                        <BuildingMetricControl title="ความกว้างอาคาร (ม.)" field="widthM" min={1} max={200} presets={PRESET_BUILDING_DIM_M} presetSuffix="m" buildingProfile={buildingProfile} setBuildingProfile={setBuildingProfile} />
                                        <BuildingMetricControl title="ความยาวอาคาร (ม.)" field="lengthM" min={1} max={200} presets={PRESET_BUILDING_DIM_M} presetSuffix="m" buildingProfile={buildingProfile} setBuildingProfile={setBuildingProfile} />
                                        <BuildingMetricControl title="ความสูงอาคาร (ม.)" field="heightM" min={1} max={120} presets={PRESET_BUILDING_DIM_M} presetSuffix="m" buildingProfile={buildingProfile} setBuildingProfile={setBuildingProfile} />
                                    </SidebarCollapsible>
                                </div>
                            )}
                            <div className="mt-auto bg-slate-900 rounded-2xl p-4 text-white shadow-xl shrink-0 space-y-3">
                                <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">สรุปโครงการ</h3>
                                <div className="grid grid-cols-2 gap-3 text-[11px]">
                                    <div><p className="text-slate-500 mb-0.5">อาคาร (กำหนด)</p><p className="text-lg font-bold">{buildingProfile.buildingCount}</p></div>
                                    <div><p className="text-slate-500 mb-0.5">ชั้น (กำหนด)</p><p className="text-lg font-bold">{buildingProfile.floorCount}</p></div>
                                    <div><p className="text-slate-500 mb-0.5">โซนบนผัง</p><p className="text-lg font-bold">{zones.length}</p></div>
                                    <div><p className="text-slate-500 mb-0.5">Object แสดง</p><p className="text-lg font-bold">{stats.actualChairs}</p></div>
                                    <div className="col-span-2"><p className="text-slate-500 mb-0.5">พื้นที่ผัง (ประมาณ)</p><p className="text-lg font-bold">{stats.areaSqM} <span className="text-xs font-normal">m²</span></p></div>
                                </div>
                                <div className="border-t border-slate-700 pt-2 max-h-36 overflow-y-auto text-[10px] leading-snug space-y-2">
                                    {zones.map((z) => {
                                        const vis = Math.max(0, (z.rows || 0) * (z.columns || 0) - (z.hiddenChairs?.length || 0));
                                        const labels = [];
                                        for (let ri = 0; ri < (z.rows || 0); ri++) {
                                            for (let ci = 0; ci < (z.columns || 0); ci++) {
                                                const k = `${ri}-${ci}`;
                                                if (z.hiddenChairs?.includes(k)) continue;
                                                labels.push(`${String.fromCharCode(65 + ri)}${ci + 1}`);
                                            }
                                        }
                                        return (
                                            <div key={z.id} className="text-slate-300">
                                                <span className="font-bold text-white">{z.name}</span>
                                                <span className="text-slate-500"> · object {vis}</span>
                                                <div className="text-slate-400 mt-0.5 break-words">{labels.slice(0, 40).join(", ")}{labels.length > 40 ? " …" : ""}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </aside>

                        {/* แผ่น Canvas หลัก */}
                        <main 
                            className={`flex-1 relative overflow-hidden bg-transparent select-none z-0 ${isSelectingArea ? 'cursor-crosshair' : (dragContext ? 'cursor-grabbing' : 'cursor-grab')}`} 
                            onPointerDown={(e) => {
                                if (isSelectingArea) {
                                    handleExportAreaStart(e);
                                } else {
                                    handlePointerDown(e);
                                }
                            }} 
                            onPointerMove={(e) => {
                                if (isSelectingArea) {
                                    handleExportAreaMove(e);
                                } else {
                                    handlePointerMove(e);
                                }
                            }} 
                            onPointerUp={(e) => {
                                if (isSelectingArea) {
                                    handleExportAreaEnd(e);
                                } else {
                                    handlePointerUp(e);
                                }
                            }} 
                            onPointerLeave={(e) => {
                                if (isSelectingArea) return;
                                handlePointerUp(e);
                            }} 
                            onWheel={!isSelectingArea ? handleWheel : undefined} 
                            onGestureChange={!isSelectingArea ? handleGestureChange : undefined}
                        >
                            <div className="absolute inset-0 bg-dot-grid pointer-events-none opacity-50" style={{ backgroundSize: `${24 * zoom}px ${24 * zoom}px`, backgroundPosition: `${pan.x}px ${pan.y}px` }} />

                            {/* Selection Box for Export */}
                            {isSelectingArea && exportArea && (
                                <div className="fixed pointer-events-none z-50 border-2 border-dashed border-blue-500 bg-blue-500/10 shadow-md" 
                                    style={{ 
                                        left: `${exportArea.x}px`, 
                                        top: `${exportArea.y}px`, 
                                        width: `${exportArea.width}px`, 
                                        height: `${exportArea.height}px` 
                                    }} 
                                >
                                    <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-br font-bold">
                                        {Math.round(exportArea.width)} × {Math.round(exportArea.height)} px
                                    </div>
                                </div>
                            )}

                            {stats.actualChairs === 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-0">
                                </div>
                            )}

                            <div className="no-pan fixed bottom-8 right-8 flex items-center bg-white/90 backdrop-blur-xl rounded-full shadow-lg border border-slate-200/60 p-1 z-50 no-print">
                                <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.2))} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full transition text-slate-600"><i className="fa-solid fa-minus"></i></button>
                                <span className="w-12 text-center text-[11px] font-bold text-slate-700">{Math.round(zoom * 100)}%</span>
                                <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full transition text-slate-600"><i className="fa-solid fa-plus"></i></button>
                            </div>

                            <div className="no-pan fixed top-20 left-[50%] -translate-x-1/2 flex items-center bg-white/90 backdrop-blur-xl rounded-full shadow-lg border border-slate-200/60 px-4 py-2 z-50 no-print pointer-events-none">
                                {isSelectingArea ? (
                                    <span className="text-xs font-bold text-blue-600 flex items-center gap-2"><i className="fa-solid fa-crosshairs"></i> ลากเพื่อเลือกพื้นที่ export · กด Esc ยกเลิก</span>
                                ) : activeMode === 'edit_chair' ? (
                                    <span className="text-xs font-bold text-[#007aff] flex items-center gap-2"><i className="fa-solid fa-eraser"></i> คลิก object เมนูจัดการ · ลากสลับตำแหน่ง · คีย์ลัด <kbd className="px-1 bg-white/80 rounded text-[10px]">R</kbd></span>
                                ) : (
                                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-2"><i className="fa-solid fa-arrows-up-down-left-right"></i> ลากป้ายชื่อโซนเพื่อย้าย · คีย์ลัด <kbd className="px-1 bg-white/80 rounded text-[10px]">M</kbd></span>
                                )}
                            </div>

                            <div className="absolute transform-gpu origin-top-left" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transition: dragContext ? 'none' : 'transform 0.1s ease-out' }}>
                                {/* เส้นขอบเขตรวม */}
                                {stats.globalWidth > 0 && stats.globalHeight > 0 && (
                                    <div className="absolute pointer-events-none opacity-40 z-0" style={{ left: stats.globalMinX * (UNIT_SCALE/2), top: stats.globalMinY * (UNIT_SCALE/2), width: stats.globalWidth * (UNIT_SCALE/2), height: stats.globalHeight * (UNIT_SCALE/2) }}>
                                        <div className="absolute -top-10 left-0 right-0 h-px bg-slate-500 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-slate-500 rounded-full absolute left-0" /><div className="w-1.5 h-1.5 bg-slate-500 rounded-full absolute right-0" /><span className="bg-[#f2f2f7] px-2 text-[10px] font-bold text-slate-600">กว้าง {stats.totalWidthM} ม.</span></div>
                                        <div className="absolute -left-10 top-0 bottom-0 w-px bg-slate-500 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-slate-500 rounded-full absolute top-0" /><div className="w-1.5 h-1.5 bg-slate-500 rounded-full absolute bottom-0" /><span className="bg-[#f2f2f7] px-2 py-0.5 text-[10px] font-bold text-slate-600 origin-center -rotate-90 whitespace-nowrap">ยาว {stats.totalHeightM} ม.</span></div>
                                    </div>
                                )}

                                {renderSmartGuides()}

                                {zones.map(zone => {
                                    const b = getBounds(zone);
                                    if (b.width === 0 || b.height === 0) return null;
                                    const isZoneActive = activeZoneId === zone.id;
                                    const isDraggingThis = dragContext?.zoneId === zone.id;
                                    const cInfo = ZONE_COLORS[zone.color] || ZONE_COLORS.blue;

                                    return (
                                        <div key={zone.id} className={`absolute transition-all ${isDraggingThis ? 'duration-0 z-50' : 'duration-200 z-10'} ${isZoneActive ? `ring-4 ring-offset-8 ${cInfo.ring}/20 rounded` : ''}`} style={{ left: zone.x * (UNIT_SCALE/2), top: zone.y * (UNIT_SCALE/2), width: b.width * (UNIT_SCALE/2), height: b.height * (UNIT_SCALE/2) }}>
                                            <div data-zone-id={zone.id} className={`zone-draggable absolute -top-8 left-0 px-3 py-1 rounded shadow-sm text-[9px] font-bold whitespace-nowrap cursor-grab active:cursor-grabbing flex items-center gap-1 ${isZoneActive ? `${cInfo.bg} text-white` : 'bg-white/90 text-slate-600 border border-slate-200 hover:border-slate-400'}`}>
                                                <i className="fa-solid fa-arrows-up-down-left-right opacity-70 pointer-events-none"></i> <span className="pointer-events-none">{zone.name}</span>
                                            </div>

                                            <div className="relative w-full h-full">
                                                {Array.from({ length: zone.rows || 0 }).map((_, ri) => (
                                                    <div key={ri} className="flex pointer-events-none" style={{ marginBottom: ri === (zone.rows - 1) ? 0 : (zone.spacingY||0) * (UNIT_SCALE/2) }}>
                                                        {Array.from({ length: zone.columns || 0 }).map((_, ci) => {
                                                            const chairKey = `${ri}-${ci}`;
                                                            const isH = zone.hiddenChairs?.includes(chairKey);
                                                            const guestName = guestNames[zone.id]?.[chairKey] || '';
                                                            const chairImg = chairImages[zone.id]?.[chairKey];
                                                            return (
                                                                <div 
                                                                    key={ci} 
                                                                    draggable={activeMode === 'edit_chair' && !isH}
                                                                    onDragStart={(e) => {
                                                                        if (isH) e.preventDefault();
                                                                        setSwappingChair({ zoneId: zone.id, chairKey });
                                                                        e.dataTransfer.effectAllowed = "move";
                                                                    }}
                                                                    onDragOver={(e) => {
                                                                        e.preventDefault();
                                                                        e.dataTransfer.dropEffect = "move";
                                                                    }}
                                                                    onDrop={(e) => {
                                                                        e.stopPropagation();
                                                                        if (swappingChair && swappingChair.chairKey !== chairKey) {
                                                                            handleSwapChairs(swappingChair.zoneId, swappingChair.chairKey, zone.id, chairKey);
                                                                        }
                                                                    }}
                                                                    onClick={(e) => { e.stopPropagation(); setActiveZoneId(zone.id); handleChairClick(zone.id, ri, ci); }} 
                                                                    className={`chair-element relative flex-shrink-0 border-2 rounded-[6px] transition-all pointer-events-auto ${activeMode==='edit_chair'?'cursor-grab active:cursor-grabbing':''} ${isH ? 'opacity-10 bg-transparent border-dashed border-slate-300' : `bg-white shadow-sm ${isZoneActive ? cInfo.border : 'border-slate-300'} hover:border-slate-800`}`} 
                                                                    style={{ width: (zone.chairWidth||0) * (UNIT_SCALE/2), height: (zone.chairHeight||0) * (UNIT_SCALE/2), marginRight: ci === (zone.columns - 1) ? 0 : (zone.spacingX||0) * (UNIT_SCALE/2) }}>
                                                                    {!isH && (
                                                                        <div className="relative flex flex-col items-center justify-center h-full w-full text-center px-0.5 overflow-hidden rounded-[4px]">
                                                                            {chairImg ? (
                                                                                <img src={chairImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" />
                                                                            ) : null}
                                                                            {chairImg ? <span className="absolute top-0 right-0 text-[6px] bg-black/40 text-white px-0.5 rounded-bl">📷</span> : null}
                                                                            <div className="relative z-[1] flex flex-col items-center justify-center w-full h-full">
                                                                                {guestName ? (
                                                                                    <span className="text-[4px] font-bold text-slate-800 leading-tight truncate drop-shadow-sm">{guestName}</span>
                                                                                ) : (
                                                                                    <span className="text-[5px] font-medium text-slate-600 drop-shadow-sm">{String.fromCharCode(65 + ri)}{ci + 1}</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </main>
                    </React.Fragment>
                )}

                {/* Tab: Meetings — เอกสารแนวตั้งจากผัง (อัปเดตอัตโนมัติ) */}
                {activeTab === "meetings" && (
                    <main className="flex-1 bg-[#e8e8ed] p-4 sm:p-8 overflow-y-auto">
                        <div className="max-w-3xl mx-auto space-y-4">
                            <div className="flex flex-wrap justify-between items-end gap-3">
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">เอกสารจากผังงาน</h2>
                                    <p className="text-sm text-slate-500 mt-1">อัปเดตอัตโนมัติเมื่อแก้ผัง — รูปแบบคล้ายเอกสารแนวตั้ง (คัดลอกไป Word / Google Docs ได้)</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(floorPlanDoc).then(() => showToast("คัดลอกเอกสารแล้ว")).catch(() => showToast("คัดลอกไม่สำเร็จ", "error"));
                                    }}
                                    className="px-4 py-2 bg-[#007aff] text-white font-bold rounded-xl shadow-sm hover:bg-[#005bb5] text-sm"
                                >
                                    <i className="fa-solid fa-copy mr-2"></i>คัดลอกทั้งหมด
                                </button>
                            </div>
                            <div className="bg-white min-h-[60vh] rounded-sm shadow-lg border border-slate-200/80 px-8 sm:px-14 py-10 sm:py-14">
                                <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800 leading-relaxed">{floorPlanDoc}</pre>
                            </div>
                        </div>
                    </main>
                )}

                {/* Tab: Schedule — ตารางประสานงาน + ส่งออก CSV */}
                {activeTab === "schedule" && (
                    <main className="flex-1 bg-[#f2f2f7] p-4 sm:p-6 overflow-auto">
                        <div className="max-w-[100rem] mx-auto space-y-4">
                            <div className="flex flex-wrap justify-between items-end gap-3">
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">ตารางประสานงาน</h2>
                                    <p className="text-sm text-slate-500 mt-1">ข้อมูลดึงจากโซนบนผัง — แก้ไขได้ที่นี่ · ส่งออกเป็น CSV เปิดใน Excel / Google Sheets</p>
                                </div>
                                <button type="button" onClick={exportCoordinationCSV} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-sm hover:bg-emerald-700 text-sm">
                                    <i className="fa-solid fa-file-export mr-2"></i>ดาวน์โหลด CSV
                                </button>
                            </div>
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                                <table className="min-w-[1100px] w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-600 font-bold border-b">
                                        <tr>
                                            <th className="p-2 w-28">โซน</th>
                                            <th className="p-2 w-16">Object</th>
                                            <th className="p-2 w-36">หน่วยงาน</th>
                                            <th className="p-2 w-36">ติดต่อที่</th>
                                            <th className="p-2 w-36">ผู้ประสาน</th>
                                            <th className="p-2 w-40">หมายเหตุ</th>
                                            <th className="p-2 w-32">เช็คลิสต์</th>
                                            <th className="p-2 w-28">วันที่บันทึก</th>
                                            <th className="p-2 w-28">วันรับ</th>
                                            <th className="p-2 w-28">วันคืน</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {coordinationRows.map((row) => (
                                            <tr key={row.zoneId} className="border-b border-slate-100 hover:bg-slate-50/80">
                                                <td className="p-2 font-semibold text-slate-800">{row.zoneName}</td>
                                                <td className="p-2 text-center font-mono">{row.objectCount}</td>
                                                {["responsibleOrg", "contactAtOrg", "coordinator", "notes", "checklistDone", "dateNote", "pickupDate", "returnDate"].map((k) => (
                                                    <td key={k} className="p-1">
                                                        <input
                                                            type="text"
                                                            value={row[k] || ""}
                                                            onChange={(e) => {
                                                                const v = e.target.value;
                                                                setCoordinationRows((prev) => prev.map((r) => (r.zoneId === row.zoneId ? { ...r, [k]: v } : r)));
                                                            }}
                                                            className="w-full min-w-0 border border-slate-200 rounded px-2 py-1.5 text-xs"
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {coordinationRows.length === 0 ? <p className="p-8 text-center text-slate-500 text-sm">ยังไม่มีโซนในผัง</p> : null}
                            </div>
                        </div>
                    </main>
                )}

                {/* Tab: Documents */}
                {activeTab === "documents" && (
                    <main className="flex-1 bg-[#f2f2f7] p-4 sm:p-8 overflow-y-auto">
                        <div className="max-w-5xl mx-auto space-y-6">
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">คลังเก็บเอกสาร</h2>
                                <p className="text-sm text-slate-500 mt-1">อัปโหลด JPEG / PNG / PDF · สแกนแล้วครอปขอบเอกสารแนว A4 (ครอปสี่เหลี่ยม) · ตัวอย่าง: ซูมล้อเมาส์ / ลากดูในกรอบ</p>
                            </div>
                            {[
                                { key: "initial", title: "1. หนังสือต้นเรื่อง" },
                                { key: "coordination", title: "2. เอกสารประสานงาน" },
                                { key: "return", title: "3. เอกสารคืนของ" },
                            ].map((sec) => (
                                <div key={sec.key} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <h3 className="font-bold text-slate-800">{sec.title}</h3>
                                        <div className="flex flex-wrap gap-2">
                                            <label className="px-3 py-2 bg-[#007aff] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-[#005bb5]">
                                                อัปโหลด
                                                <input type="file" accept=".pdf,.png,.jpg,.jpeg,image/png,image/jpeg,application/pdf" className="hidden" onChange={(e) => addDocFile(sec.key, e.target.files?.[0])} />
                                            </label>
                                            <label className="px-3 py-2 bg-slate-700 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-800">
                                                สแกน / ภาพ
                                                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
                                                    const f = e.target.files?.[0];
                                                    if (!f) return;
                                                    const url = URL.createObjectURL(f);
                                                    setScanCropModal({ src: url, category: sec.key, crop: { l: 5, t: 5, r: 5, b: 5 } });
                                                    e.target.value = "";
                                                }} />
                                            </label>
                                        </div>
                                    </div>
                                    <ul className="space-y-2">
                                        {(docsStore[sec.key] || []).map((d) => (
                                            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 text-sm border border-slate-100 rounded-lg px-3 py-2 bg-slate-50/80">
                                                <span className="truncate font-medium text-slate-700">{d.name}</span>
                                                <div className="flex gap-2 shrink-0">
                                                    <button type="button" onClick={() => setDocPreview({ url: d.url, name: d.name, mime: d.mime, zoom: 1 })} className="text-[#007aff] text-xs font-bold hover:underline">Preview</button>
                                                    <button type="button" onClick={() => removeDoc(sec.key, d.id)} className="text-red-500 text-xs font-bold hover:underline">ลบ</button>
                                                    <div draggable onDragStart={(ev) => { ev.dataTransfer.setData("text/plain", d.url); ev.dataTransfer.setData("text/uri-list", d.url); }} className="text-xs font-bold text-slate-500 cursor-grab active:cursor-grabbing px-2 py-0.5 border border-dashed border-slate-300 rounded" title="ลากไปวางในแอปอื่น (เช่น Line บนเดสก์ท็อป)">
                                                        ลากส่ง
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </main>
                )}
            </div>

            {/* เมนูจัดการ object (โหมด ลบ/เพิ่ม) */}
            {chairMenu && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[205] no-print p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">ตำแหน่ง {chairLabelFromKey(chairMenu.chairKey)}</h2>
                            <p className="text-sm text-slate-500 mt-1">{zones.find((z) => z.id === chairMenu.zoneId)?.name}</p>
                        </div>
                        {chairMenu.isHidden ? (
                            <button type="button" onClick={restoreChairAtMenu} className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700">
                                คืนที่นั่ง (กู้คืน object)
                            </button>
                        ) : (
                            <div className="space-y-2">
                                <button type="button" onClick={openRenameFromChairMenu} className="w-full py-3 rounded-xl bg-[#007aff] text-white font-bold hover:bg-[#005bb5]">
                                    เปลี่ยนชื่อ / ชื่อแขก
                                </button>
                                <button type="button" onClick={hideChairAtMenu} className="w-full py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600">
                                    ซ่อนที่นั่ง (ลบชั่วคราว)
                                </button>
                                <label className="block w-full py-3 rounded-xl bg-slate-100 text-slate-900 font-bold text-center cursor-pointer hover:bg-slate-200">
                                    {chairImages[chairMenu.zoneId]?.[chairMenu.chairKey] ? "เปลี่ยนรูปประกอบ" : "เพิ่มรูปภาพประกอบ"}
                                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onChairImageSelected} />
                                </label>
                                {chairImages[chairMenu.zoneId]?.[chairMenu.chairKey] ? (
                                    <div className="rounded-xl border border-slate-200 overflow-hidden max-h-40">
                                        <img src={chairImages[chairMenu.zoneId][chairMenu.chairKey]} alt="preview" className="w-full object-contain max-h-40 bg-slate-50" />
                                    </div>
                                ) : null}
                            </div>
                        )}
                        <button type="button" onClick={() => setChairMenu(null)} className="w-full py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl">
                            ปิด
                        </button>
                    </div>
                </div>
            )}

            {/* ครอปภาพสแกนแนว A4 (ตัดขอบ %) */}
            {scanCropModal && (
                <div className="fixed inset-0 bg-black/60 z-[210] flex items-center justify-center p-4 no-print">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="font-bold text-lg text-slate-900">ครอปเอกสาร (สี่เหลี่ยม)</h3>
                        <p className="text-xs text-slate-500">ปรับตัดขอบซ้าย/บน/ขวา/ล่างเป็นเปอร์เซ็นต์ของภาพ — เหมาะกับภาพถ่ายเอกสารแนวตั้ง A4</p>
                        <img src={scanCropModal.src} alt="" className="w-full max-h-48 object-contain bg-slate-100 rounded-lg border" />
                        {["l", "t", "r", "b"].map((edge) => (
                            <label key={edge} className="flex items-center gap-2 text-xs">
                                <span className="w-24 font-bold text-slate-600">{edge === "l" ? "ซ้าย" : edge === "t" ? "บน" : edge === "r" ? "ขวา" : "ล่าง"}</span>
                                <input
                                    type="range"
                                    min={0}
                                    max={40}
                                    value={scanCropModal.crop[edge]}
                                    onChange={(e) =>
                                        setScanCropModal((m) =>
                                            m ? { ...m, crop: { ...m.crop, [edge]: Number(e.target.value) } } : m
                                        )
                                    }
                                    className="flex-1"
                                />
                                <span>{scanCropModal.crop[edge]}%</span>
                            </label>
                        ))}
                        <div className="flex gap-2 justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    URL.revokeObjectURL(scanCropModal.src);
                                    setScanCropModal(null);
                                }}
                                className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg"
                            >
                                ยกเลิก
                            </button>
                            <button type="button" onClick={applyScanCrop} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700">
                                ใช้งาน & บันทึก
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview เอกสาร — ซูมล้อ / ลากเลื่อน */}
            {docPreview && (
                <div
                    className="fixed inset-0 bg-black/70 z-[220] flex flex-col no-print"
                    onWheel={(e) => {
                        e.preventDefault();
                        setDocPreview((p) =>
                            p ? { ...p, zoom: Math.min(5, Math.max(0.25, p.zoom + (e.deltaY > 0 ? -0.15 : 0.15))) } : p
                        );
                    }}
                >
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white shrink-0">
                        <span className="text-sm font-bold truncate pr-4">{docPreview.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                            <button type="button" onClick={() => setDocPreview((p) => (p ? { ...p, zoom: Math.min(5, p.zoom + 0.25) } : p))} className="px-2 py-1 bg-slate-700 rounded text-xs font-bold">
                                +
                            </button>
                            <button type="button" onClick={() => setDocPreview((p) => (p ? { ...p, zoom: Math.max(0.25, p.zoom - 0.25) } : p))} className="px-2 py-1 bg-slate-700 rounded text-xs font-bold">
                                −
                            </button>
                            <div
                                draggable
                                onDragStart={(ev) => {
                                    ev.dataTransfer.setData("text/plain", docPreview.url);
                                    ev.dataTransfer.setData("text/uri-list", docPreview.url);
                                }}
                                className="px-2 py-1 border border-dashed border-white/50 rounded text-xs cursor-grab"
                            >
                                ลากส่ง
                            </div>
                            <button type="button" onClick={() => setDocPreview(null)} className="px-3 py-1 bg-red-600 rounded text-xs font-bold">
                                ปิด
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto p-4 flex justify-center items-start">
                        <div className="doc-preview-inner origin-top transition-transform duration-100" style={{ transform: `scale(${docPreview.zoom})` }}>
                            {docPreview.mime === "application/pdf" ? (
                                <iframe title="pdf" src={docPreview.url} className="w-[min(90vw,800px)] h-[min(80vh,1000px)] bg-white rounded shadow-2xl border-0" />
                            ) : (
                                <img src={docPreview.url} alt="" className="max-w-[min(90vw,900px)] w-auto h-auto rounded shadow-2xl" draggable={false} />
                            )}
                        </div>
                    </div>
                    <p className="text-center text-[10px] text-slate-400 py-2 shrink-0">ล้อเมาส์: ซูม · เลื่อนด้วยแถบเลื่อนในกรอบ</p>
                </div>
            )}

            {/* Modal for editing guest names */}
            {editingChair && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] no-print">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">พิมพ์ชื่อแขก</h2>
                            <p className="text-sm text-slate-500">เก้าอี้ {String.fromCharCode(65 + parseInt(editingChair.chairKey.split('-')[0]))}{parseInt(editingChair.chairKey.split('-')[1]) + 1}</p>
                        </div>
                        
                        <input 
                            type="text" 
                            value={guestNameInput} 
                            onChange={(e) => setGuestNameInput(e.target.value)}
                            placeholder="ชื่อแขก"
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-lg px-4 py-3 text-lg font-medium outline-none focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/20"
                            autoFocus
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') handleSaveGuestName();
                            }}
                        />
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={() => {
                                    setEditingChair(null);
                                    setGuestNameInput('');
                                }}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-2.5 px-4 rounded-lg transition"
                            >
                                ยกเลิก
                            </button>
                            <button 
                                onClick={handleSaveGuestName}
                                className="flex-1 bg-[#007aff] hover:bg-[#005bb5] text-white font-bold py-2.5 px-4 rounded-lg transition"
                            >
                                บันทึก
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Render App
try {
    console.log("🚀 Starting React render...");
    const rootElement = document.getElementById('root');
    if (!rootElement) {
        throw new Error("❌ Root element not found! Check id='root' in HTML");
    }
    
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
    console.log("✅ React rendered successfully!");
} catch (error) {
    console.error("❌ CRITICAL ERROR during render:", error);
    document.body.innerHTML = `
        <div style="padding: 20px; font-family: Arial; color: #d32f2f;">
            <h1>⚠️ Application Error</h1>
            <p><strong>Error:</strong> ${error.message}</p>
            <p><strong>Stack:</strong> <code style="background: #f0f0f0; padding: 10px; display: block; margin-top: 10px; overflow-x: auto;">${error.stack}</code></p>
            <p style="margin-top: 15px; color: #666;">
                <strong>Debug Info:</strong><br/>
                - React: ${typeof React !== 'undefined' ? '✅ Loaded' : '❌ NOT loaded'}<br/>
                - Firebase: ${typeof firebase !== 'undefined' ? '✅ Loaded' : '❌ NOT loaded'}<br/>
                - DOM Root: ${document.getElementById('root') ? '✅ Found' : '❌ NOT found'}<br/>
            </p>
            <button onclick="location.reload()" style="padding: 10px 20px; background: #007aff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 15px;">
                Refresh Page
            </button>
        </div>
    `;
}

// Global error handlers
window.addEventListener('error', (event) => {
    console.error("🔴 Uncaught JavaScript Error:", event.error);
    console.error("📍 Location:", event.filename, "line", event.lineno, "column", event.colno);
    console.error("Message:", event.message);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error("🔴 Unhandled Promise Rejection:", event.reason);
    if (event.reason && typeof event.reason === 'object') {
        if (event.reason.message) console.error("Error message:", event.reason.message);
        if (event.reason.stack) console.error("Stack:", event.reason.stack);
    }
});