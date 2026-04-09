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
        onAuthStateChanged: (callback) => { callback(null); return () => { }; },
        signInWithEmailAndPassword: () => Promise.reject(new Error("Firebase not available")),
        createUserWithEmailAndPassword: () => Promise.reject(new Error("Firebase not available")),
        signOut: () => Promise.reject(new Error("Firebase not available")),
    };
    db = null;
}

// --- ค่าคงที่และการตั้งค่าพื้นฐาน ---
const UNIT_SCALE = 2; // 1cm = 2px สำหรับการแสดงผลบนหน้าจอ

const DEFAULT_ZONE_CONFIG = {
    type: 'seating',
    chairWidth: 40,
    chairHeight: 40,
    rows: 0,
    columns: 0,
    spacingX: 10,
    spacingY: 10,
    width: 0,
    height: 0,
    color: 'blue',
    rotation: 0,
    hiddenChairs: [],
    image: '',
};

const ROTATION_PRESETS = [0, 45, 90, 135, 180, 225, 270, 315];

const ZONE_COLORS = {
    blue: { bg: 'bg-blue-500', border: 'border-blue-500', ring: 'ring-blue-500', text: 'text-blue-500' },
    emerald: { bg: 'bg-emerald-500', border: 'border-emerald-500', ring: 'ring-emerald-500', text: 'text-emerald-500' },
    rose: { bg: 'bg-rose-500', border: 'border-rose-500', ring: 'ring-rose-500', text: 'text-rose-500' },
    amber: { bg: 'bg-amber-500', border: 'border-amber-500', ring: 'ring-amber-500', text: 'text-amber-500' },
    purple: { bg: 'bg-purple-500', border: 'border-purple-500', ring: 'ring-purple-500', text: 'text-purple-500' },
    indigo: { bg: 'bg-indigo-500', border: 'border-indigo-500', ring: 'ring-indigo-500', text: 'text-indigo-500' },
    sky: { bg: 'bg-sky-500', border: 'border-sky-500', ring: 'ring-sky-500', text: 'text-sky-500' },
    slate: { bg: 'bg-slate-600', border: 'border-slate-600', ring: 'ring-slate-600', text: 'text-slate-600' },
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

const PRESET_BUILDING_DIM_M = [0, 8, 10, 12, 15, 18, 20, 24, 30, 36, 48];
const PRESET_BUILDING_COUNT = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 15];

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
        <div className={`rounded-xl border border-slate-200/60 bg-white/40 p-2.5 space-y-2 transition-all hover:bg-white/60 ${cardClass || ''}`}>
            <div className="flex items-center justify-between gap-2 px-0.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{title}</p>
                <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => setClamped(val - 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
                        <i className="fa-solid fa-minus text-[8px]"></i>
                    </button>
                    <div className="relative">
                        <input
                            type="text"
                            inputMode="numeric"
                            value={editing ? text : String(val)}
                            onFocus={() => { setEditing(true); setText(String(val)); }}
                            onChange={(e) => setText(e.target.value)}
                            onBlur={() => { setEditing(false); const n = parseInt(text, 10); if (Number.isNaN(n)) setClamped(val); else setClamped(n); }}
                            className="w-10 text-center text-xs font-black text-indigo-600 bg-indigo-50/50 rounded-lg py-1 border-none outline-none focus:ring-1 focus:ring-indigo-300"
                        />
                        <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-slate-100 border border-white text-[6px] font-black text-slate-400">
                            {presetSuffix === 'm' ? 'm' : '#'}
                        </span>
                    </div>
                    <button type="button" onClick={() => setClamped(val + 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
                        <i className="fa-solid fa-plus text-[8px]"></i>
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <input type="range" min={min} max={max} value={val} onChange={(e) => setClamped(e.target.value)} className="flex-1 h-1 bg-slate-100 rounded-full cursor-pointer accent-indigo-500 hover:accent-indigo-600 transition-all" />
                <div className="relative shrink-0" ref={presetRef}>
                    <button
                        type="button"
                        onClick={() => setPresetOpen((o) => !o)}
                        className="p-1 px-1.5 flex items-center justify-center rounded-lg bg-slate-100/80 border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <i className="fa-solid fa-list-ul text-[8px]" />
                    </button>
                    {presetOpen && (
                        <ul className="absolute right-0 bottom-full mb-2 z-[100] bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-2xl py-1 min-w-[7rem] max-h-48 overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
                            {presets.map((p) => (
                                <li key={`b-${field}-${p}`}>
                                    <button
                                        type="button"
                                        className="w-full text-left px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                        onClick={() => { setClamped(p); setPresetOpen(false); }}
                                    >
                                        {formatPresetLabel(p, presetSuffix)}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

const SidebarCollapsible = ({ title, icon, defaultOpen = true, children }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-slate-200/50 rounded-xl overflow-hidden bg-white/40 shadow-sm transition-all hover:bg-white/60">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-white/20 transition-colors"
            >
                <span className="flex items-center gap-2 min-w-0">
                    {icon ? <span className="shrink-0 text-slate-400">{icon}</span> : null}
                    <span className="truncate">{title}</span>
                </span>
                <i className={`fa-solid fa-chevron-down text-slate-300 text-[8px] shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
            </button>
            {open ? (
                <div className="px-2.5 pb-2.5 pt-0.5 space-y-2.5 border-t border-slate-100/50 animate-in fade-in slide-in-from-top-1 duration-200">
                    {children}
                </div>
            ) : null}
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
    if (!activeZone) return null;

    const val = Math.max(min, Math.min(max, Number(activeZone?.[field] || 0)));
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
        <div className={`rounded-xl border border-slate-200/50 bg-white/40 p-2.5 space-y-2 transition-all hover:bg-white/60 relative`}>
            <div className="flex items-center justify-between gap-2 px-0.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">{title}</p>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setClamped(val - 1)}
                        className={`w-6 h-6 flex items-center justify-center bg-white rounded-lg border border-slate-200 text-slate-400 hover:${accentText} hover:border-current transition-all shadow-sm active:scale-90`}
                    >
                        <i className="fa-solid fa-minus text-[8px]"></i>
                    </button>
                    <div className="relative group">
                        <input
                            type="text"
                            inputMode="numeric"
                            value={editing ? text : String(val)}
                            onFocus={() => { setEditing(true); setText(String(val)); }}
                            onChange={(e) => setText(e.target.value)}
                            onBlur={() => { setEditing(false); const n = parseInt(text, 10); if (Number.isNaN(n)) setClamped(val); else setClamped(n); }}
                            className={`w-10 text-center text-xs font-black ${accentText} bg-slate-50 rounded-lg py-1 border-none outline-none focus:ring-1 focus:ring-current transition-all`}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => setClamped(val + 1)}
                        className={`w-6 h-6 flex items-center justify-center bg-white rounded-lg border border-slate-200 text-slate-400 hover:${accentText} hover:border-current transition-all shadow-sm active:scale-90`}
                    >
                        <i className="fa-solid fa-plus text-[8px]"></i>
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={val}
                    onChange={(e) => setClamped(e.target.value)}
                    className={`flex-1 h-1 bg-slate-100 rounded-full cursor-pointer ${rangeAccent} transition-all`}
                />
                <div className="relative shrink-0" ref={presetRef}>
                    <button
                        type="button"
                        onClick={() => setPresetOpen((o) => !o)}
                        className="p-1 px-1.5 flex items-center justify-center rounded-lg bg-slate-100/80 border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <i className="fa-solid fa-list-ul text-[8px]" />
                    </button>
                    {presetOpen && (
                        <ul className="absolute right-0 bottom-full mb-2 z-[100] bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-2xl py-1 min-w-[7rem] max-h-48 overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
                            {presets.map((p) => (
                                <li key={`zd-${field}-${p}`}>
                                    <button
                                        type="button"
                                        className="w-full text-left px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:${accentText} transition-colors"
                                        onClick={() => { setClamped(p); setPresetOpen(false); }}
                                    >
                                        {formatPresetLabel(p, presetSuffix)}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- ระบบฟิสิกส์ (Physics Helpers) ---
const getBounds = (z, overrideX = (z?.x || 0), overrideY = (z?.y || 0)) => {
    if (!z) return { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };

    let w = 0, h = 0;
    try {
        if (z.type === 'stage' || z.type === 'booth' || z.type === 'table') {
            w = Number(z.width) || 200;
            h = Number(z.height) || 100;
        } else {
            const cols = Number(z.columns) || 0;
            const rows = Number(z.rows) || 0;
            const cW = Number(z.chairWidth) || 0;
            const cH = Number(z.chairHeight) || 0;
            const sX = Number(z.spacingX) || 0;
            const sY = Number(z.spacingY) || 0;

            w = cols > 0 ? (cols * cW) + ((cols - 1) * sX) : 0;
            h = rows > 0 ? (rows * cH) + ((rows - 1) * sY) : 0;
        }
    } catch (e) {
        console.error("Bounds calculation error", e);
    }

    // ป้องกันค่า NaN หรือ Infinity
    w = isFinite(w) ? Math.max(0, w) : 0;
    h = isFinite(h) ? Math.max(0, h) : 0;
    const x = isFinite(overrideX) ? overrideX : 0;
    const y = isFinite(overrideY) ? overrideY : 0;

    return { left: x, right: x + w, top: y, bottom: y + h, width: w, height: h };
};

const isColliding = (b1, b2) => {
    if (!b1 || !b2) return false;
    const buffer = 0.1;
    return b1.left < (b2.right - buffer) &&
        b1.right > (b2.left + buffer) &&
        b1.top < (b2.bottom - buffer) &&
        b1.bottom > (b2.top + buffer);
};

// --- เริ่มต้นคอมโพเนนต์หลัก (App Component) ---
const App = () => {
    console.log("🎬 App component is rendering...");

    const [currentView, setCurrentView] = useState('landing');
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [activeTab, setActiveTab] = useState('floorplan');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isPro, setIsPro] = useState(true); // ปลดล็อกให้ใช้ฟรีสำหรับเวอร์ชัน Local
    const [activeMode, setActiveMode] = useState('edit_chair');
    const [zoom, setZoom] = useState(1.0);
    const targetZoomRef = useRef(1.0);
    const zoomAnimRef = useRef(null);
    const targetPanRef = useRef({ x: 0, y: 0 });
    const panAnimRef = useRef(null);

    const [currentLayoutId, setCurrentLayoutId] = useState(null);
    const [layoutName, setLayoutName] = useState('โปรเจกต์ใหม่');
    const [zones, setZones] = useState([{ id: 'zone-1', name: 'โซนหลัก', ...DEFAULT_ZONE_CONFIG, x: 0, y: 0 }]);
    const [activeZoneId, setActiveZoneId] = useState('zone-1');

    const [savedLayouts, setSavedLayouts] = useState([]);
    const [message, setMessage] = useState({ text: '', type: '' });

    const [pan, setPan] = useState({ x: 0, y: 0 });
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

    // --- Paper Configuration ---
    const PAPER_SIZES = {
        infinite: { name: 'พื้นที่อิสระ (Infinite)', width: 0, height: 0, unit: 'px' },
        a4_v: { name: 'A4 แนวตั้ง', width: 210, height: 297, unit: 'mm' },
        a4_h: { name: 'A4 แนวนอน', width: 297, height: 210, unit: 'mm' },
        a3_v: { name: 'A3 แนวตั้ง', width: 297, height: 420, unit: 'mm' },
        a3_h: { name: 'A3 แนวนอน', width: 420, height: 297, unit: 'mm' },
        fullhd: { name: 'Full HD (1920x1080)', width: 1920, height: 1080, unit: 'px' },
    };

    const [paperConfig, setPaperConfig] = useState({
        type: 'infinite',
        width: 0,
        height: 0,
        unit: 'px'
    });
    const [chairImages, setChairImages] = useState({}); // { [zoneId]: { [chairKey]: dataUrl } }
    const [chairMenu, setChairMenu] = useState(null); // { zoneId, row, col, chairKey, isHidden }
    const [coordinationRows, setCoordinationRows] = useState([]);
    const [docsStore, setDocsStore] = useState({ initial: [], coordination: [], return: [] });
    const [docPreview, setDocPreview] = useState(null); // { url, name, mime, scale, panX, panY }
    const [scanCropModal, setScanCropModal] = useState(null); // { src, category, crop: {l,t,r,b} 0-40% trim }

    // --- Drawing & Feature States (Newly Added) ---
    const [drawings, setDrawings] = useState([]);
    const [currentStroke, setCurrentStroke] = useState(null);
    const canvasRef = useRef(null);
    const lastPointRef = useRef(null);
    const [drawingColor, setDrawingColor] = useState('#ff3b30');
    const [drawingWidth, setDrawingWidth] = useState(4);
    const [isDrawing, setIsDrawing] = useState(false);
    const isDrawingRef = useRef(false);
    const currentStrokeRef = useRef(null);
    const drawingOverlayRef = useRef(null);
    const activeModeRef = useRef('move_zone');
    const drawingColorRef = useRef('#ff3b30');
    const drawingWidthRef = useRef(4);
    const panRef = useRef({ x: 0, y: 0 });
    const zoomRef = useRef(1);
    const drawingsRef = useRef([]);
    const [redoStack, setRedoStack] = useState([]); // Redo stack for drawings
    const [lastUndoTimestamp, setLastUndoTimestamp] = useState(0); // For undo logic throttling


    // Moveable & Collapsible Note Pin
    const [notePinPos, setNotePinPos] = useState({ x: null, y: null });
    const [isNotePinCollapsed, setIsNotePinCollapsed] = useState(false);
    const [isNotePinDocked, setIsNotePinDocked] = useState(false);
    const [isNotePinDragging, setIsNotePinDragging] = useState(false);
    const notePinOffset = useRef({ x: 0, y: 0 });

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

    // --- Keep refs in sync with state ---
    useEffect(() => { activeModeRef.current = activeMode; }, [activeMode]);
    useEffect(() => { drawingColorRef.current = drawingColor; }, [drawingColor]);
    useEffect(() => { drawingWidthRef.current = drawingWidth; }, [drawingWidth]);
    useEffect(() => { panRef.current = pan; }, [pan]);
    useEffect(() => { zoomRef.current = zoom; }, [zoom]);
    useEffect(() => { drawingsRef.current = drawings; }, [drawings]);

    // --- Canvas Drawing Renderer ---
    const renderCanvas = React.useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const drawStroke = (stroke) => {
            if (!stroke || stroke.points.length < 2) return;
            ctx.strokeStyle = stroke.color;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalAlpha = stroke.opacity || 1;
            for (let i = 0; i < stroke.points.length - 1; i++) {
                const p1 = stroke.points[i];
                const p2 = stroke.points[i + 1];
                const thickness = stroke.tool === 'highlighter' ? stroke.width : stroke.width * (0.5 + p2.p * 1.5);
                ctx.lineWidth = thickness;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        };
        drawingsRef.current.forEach(drawStroke);
        if (currentStrokeRef.current) drawStroke(currentStrokeRef.current);
    }, []);

    useEffect(() => { renderCanvas(); }, [drawings, currentStroke, renderCanvas]);

    // --- Native DOM Drawing Event Listeners (bypass React) ---
    useEffect(() => {
        const overlay = drawingOverlayRef.current;
        if (!overlay) return;

        const onDown = (e) => {
            const mode = activeModeRef.current;
            if (mode !== 'pen' && mode !== 'highlighter') return;
            e.preventDefault();
            e.stopPropagation();
            const p = panRef.current;
            const z = zoomRef.current;
            const canvasX = (e.clientX - p.x) / z;
            const canvasY = (e.clientY - p.y) / z;
            const pressure = (e.pressure && e.pressure > 0) ? e.pressure : 0.5;
            const newStroke = {
                points: [{ x: canvasX, y: canvasY, p: pressure }],
                color: drawingColorRef.current,
                width: mode === 'highlighter' ? drawingWidthRef.current * 3 : drawingWidthRef.current,
                opacity: mode === 'highlighter' ? 0.35 : 1,
                tool: mode
            };
            currentStrokeRef.current = newStroke;
            isDrawingRef.current = true;
            lastPointRef.current = { x: canvasX, y: canvasY, p: pressure };
            try { overlay.setPointerCapture(e.pointerId); } catch (err) { }
            renderCanvas();
        };

        const onMove = (e) => {
            if (!isDrawingRef.current || !currentStrokeRef.current) return;
            e.preventDefault();
            const p = panRef.current;
            const z = zoomRef.current;
            const canvasX = (e.clientX - p.x) / z;
            const canvasY = (e.clientY - p.y) / z;
            const pressure = (e.pressure && e.pressure > 0) ? e.pressure : 0.5;
            const last = lastPointRef.current;
            const dist = last ? Math.sqrt((canvasX - last.x) ** 2 + (canvasY - last.y) ** 2) : 0;
            if (dist > 1.2) {
                const newPoint = { x: canvasX, y: canvasY, p: pressure };
                currentStrokeRef.current = {
                    ...currentStrokeRef.current,
                    points: [...currentStrokeRef.current.points, newPoint]
                };
                lastPointRef.current = newPoint;
                renderCanvas();
            }
        };

        const onUp = (e) => {
            if (!isDrawingRef.current || !currentStrokeRef.current) return;
            e.preventDefault();
            const finishedStroke = currentStrokeRef.current;
            currentStrokeRef.current = null;
            isDrawingRef.current = false;
            lastPointRef.current = null;
            try { overlay.releasePointerCapture(e.pointerId); } catch (err) { }
            setDrawings(prev => [...prev, finishedStroke]);
            setRedoStack([]);
            setCurrentStroke(null);
            setIsDrawing(false);
            renderCanvas();
        };

        overlay.addEventListener('pointerdown', onDown);
        overlay.addEventListener('pointermove', onMove);
        overlay.addEventListener('pointerup', onUp);
        overlay.addEventListener('pointerleave', onUp);
        overlay.addEventListener('pointercancel', onUp);

        return () => {
            overlay.removeEventListener('pointerdown', onDown);
            overlay.removeEventListener('pointermove', onMove);
            overlay.removeEventListener('pointerup', onUp);
            overlay.removeEventListener('pointerleave', onUp);
            overlay.removeEventListener('pointercancel', onUp);
        };
    }, [renderCanvas]);

    // Update canvas size to match window
    useEffect(() => {
        const updateCanvasSize = () => {
            if (canvasRef.current) {
                // ให้ canvas มีขนาดใหญ่เพียงพอสำหรับการวาดที่เลื่อนไปมา (หรือคลุมทั้งหน้าจอ)
                // ในที่นี้เราใช้ค่าสูงสุดที่จะเป็นไปได้ หรือปรับขนาดตาม window
                canvasRef.current.width = 10000; // Large enough for workspace
                canvasRef.current.height = 10000;
            }
        };
        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
        return () => window.removeEventListener('resize', updateCanvasSize);
    }, []);

    // 2.5 Undo/Redo logic for drawings
    const undoDrawing = () => {
        if (drawings.length === 0) return;
        const newDrawings = [...drawings];
        const lastStroke = newDrawings.pop();
        setDrawings(newDrawings);
        setRedoStack(prev => [lastStroke, ...prev]);
        setLastUndoTimestamp(Date.now());
        showToast("เลิกทำการวาดเสร็จแล้ว (Undo)", "info");
    };

    const redoDrawing = () => {
        if (redoStack.length === 0) return;
        const [nextStroke, ...rest] = redoStack;
        setDrawings(prev => [...prev, nextStroke]);
        setRedoStack(rest);
        setLastUndoTimestamp(Date.now());
        showToast("ทำซ้ำการวาดที่ยกเลิกไป (Redo)", "info");
    };


    // 3. คำนวณสถิติของผังงานทั้งหมด
    const stats = useMemo(() => {
        let minX = 0, minY = 0, maxX = 0, maxY = 0, totalChairs = 0;
        let hasValidZone = false;

        zones.forEach(z => {
            const b = getBounds(z);
            if (b.width > 0 && b.height > 0) {
                if (!hasValidZone) {
                    minX = b.left; minY = b.top; maxX = b.right; maxY = b.bottom;
                    hasValidZone = true;
                } else {
                    if (b.left < minX) minX = b.left;
                    if (b.top < minY) minY = b.top;
                    if (b.right > maxX) maxX = b.right;
                    if (b.bottom > maxY) maxY = b.bottom;
                }
            }
            totalChairs += (Number(z.rows || 0) * Number(z.columns || 0)) - (z.hiddenChairs ? z.hiddenChairs.length : 0);
        });

        const globalWidth = maxX > minX ? maxX - minX : 0;
        const globalHeight = maxY > minY ? maxY - minY : 0;

        // ฟังก์ชันช่วยจัดการความปลอดภัยของเลขทศนิยม
        const safeFixed = (num, digits = 2) => {
            return (isFinite(num) && !isNaN(num)) ? Number(num).toFixed(digits) : (0).toFixed(digits);
        };

        return {
            globalMinX: minX, globalMinY: minY, globalWidth, globalHeight,
            totalWidthM: safeFixed(globalWidth / 100),
            totalHeightM: safeFixed(globalHeight / 100),
            actualChairs: isFinite(totalChairs) ? Math.max(0, totalChairs) : 0,
            areaSqM: safeFixed((globalWidth * globalHeight) / 10000),
            drawnItemsCount: drawings.length,
            noteCount: guestNames ? Object.values(guestNames).reduce((acc, zone) => acc + Object.keys(zone).length, 0) : 0,
            zoneBreakdown: {
                seating: zones.filter(z => !z.type || z.type === 'seating').length,
                stage: zones.filter(z => z.type === 'stage').length,
                booth: zones.filter(z => z.type === 'booth').length,
            }
        };
    }, [zones, drawings, guestNames]);



    const activeZone = useMemo(() => {
        const found = zones.find(z => z.id === activeZoneId);
        // Fallback: ถ้าหา ID ไม่เจอ (เช่น ตอนสร้างใหม่หรือลบออก) ให้เอาโซนแรกแทน ถ้าไม่มีโซนเลยให้ใช้ Default เสมอ
        return found || zones[0] || { id: 'default', name: 'ไม่มีโซน', ...DEFAULT_ZONE_CONFIG };
    }, [zones, activeZoneId]);
    const filteredLayouts = useMemo(() => savedLayouts.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase())), [savedLayouts, searchQuery]);

    const showToast = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    // โค้ดสำหรับเซฟงานลง Firebase
    const saveProject = async () => {
        if (!db) {
            showToast("ไม่ได้เชื่อมต่อฐานข้อมูล", "error");
            return;
        }
        try {
            const workspaceData = {
                name: layoutName,
                zones: zones,
                drawings: drawings,
                buildingProfile: buildingProfile,
                guestNames: guestNames,
                chairImages: chairImages,
                coordinationRows: coordinationRows,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            await db.collection('workspaces').doc('main-workspace').set(workspaceData);
            showToast("บันทึกงานลงฐานข้อมูลสำเร็จ! 💾");
        } catch (error) {
            console.error("Save error:", error);
            showToast("บันทึกไม่สำเร็จ: " + error.message, "error");
        }
    };

    // โค้ดสำหรับดึงงานกลับมาวาดใหม่
    const loadProject = async () => {
        if (!db) return;
        try {
            const doc = await db.collection('workspaces').doc('main-workspace').get();
            if (doc.exists) {
                const data = doc.data();
                setZones(data.zones || []);
                setDrawings(data.drawings || []);
                setLayoutName(data.name || 'โปรเจกต์ใหม่');
                setBuildingProfile(data.buildingProfile || { buildingCount: 1, floorCount: 1, widthM: 20, lengthM: 30, heightM: 12 });
                setGuestNames(data.guestNames || {});
                setChairImages(data.chairImages || {});
                setCoordinationRows(data.coordinationRows || []);
                showToast("โหลดโปรเจกต์สำเร็จ! 📂");
            } else {
                showToast("ยังไม่มีข้อมูลที่บันทึกไว้", "error");
            }
        } catch (error) {
            console.error("Load error:", error);
            showToast("โหลดข้อมูลไม่สำเร็จ: " + error.message, "error");
        }
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
            } else if (e.code === "KeyP") {
                e.preventDefault();
                setActiveMode("pen");
            } else if (e.code === "KeyH") {
                e.preventDefault();
                setActiveMode("highlighter");
            } else if ((e.metaKey || e.ctrlKey) && e.code === "KeyZ") {
                e.preventDefault();
                if (e.shiftKey) {
                    redoDrawing();
                } else {
                    undoDrawing();
                }
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

        // Reset zoom for consistent export quality
        const originalZoom = zoom;
        const originalPan = { ...pan };

        // Set fixed zoom for printing
        setZoom(1.0);
        setPan({ x: 50, y: 50 });

        setTimeout(() => {
            window.print();
            // Restore after printing
            setZoom(originalZoom);
            setPan(originalPan);
        }, 300);

        showToast("กำลังส่งออกเป็น PDF (กรุณาเลือก Save as PDF ในหน้าต่างพิมพ์) 📄");
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

    const handleExportAreaMove = () => { };

    const handleExportAreaEnd = () => { };

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
        if (loginEmail === 'test' && loginPassword === 'test') {
            setCurrentUser({ email: 'test@eventlabs.com', uid: 'test-user-123' });
            setCurrentView('home');
            showToast("Bypass Login Success!");
            return;
        }

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
                drawings: drawings,
                guestNames: guestNames,
                buildingProfile: buildingProfile,
                updatedAt: Date.now(),
            };

            // Save to Firebase
            await db.collection('users').doc(currentUser.uid).collection('layouts').doc(layoutData.id).set(layoutData);

            // Update local state for the dashboard list
            setCloudLayouts(prev => {
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

            showToast("บันทึกลงคลาวด์เรียบร้อยแล้ว (Cloud Sync) ☁️");
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
            setDrawings(l.drawings || []);
            setGuestNames(l.guestNames || {});
            setBuildingProfile(l.buildingProfile || { buildingCount: 1, floorCount: 1, widthM: 20, lengthM: 30, heightM: 12 });
            setChairImages(l.chairImages || {});
            setCoordinationRows(l.coordinationRows || []);
            setLayoutName(l.name);
            setCurrentLayoutId(l.id);
            if (l.zones && l.zones.length > 0) setActiveZoneId(l.zones[0].id);
            setPan({ x: 100, y: 100 });
            setZoom(0.7);
            setCurrentView('editor');
            setIsAnimating(false);
        }, 50);
    };

    const handleCreateNew = () => {
        setBuildingProfile({ buildingCount: 0, floorCount: 0, widthM: 0, lengthM: 0, heightM: 0 });
        setShowTemplateModal(true);
    };

    const handleSelectTemplate = (templateId) => {
        setShowTemplateModal(false);
        setIsAnimating(true);
        setAnimationDirection('enter');

        setTimeout(() => {
            setCurrentLayoutId(null);
            setChairImages({});
            setDrawings([]);
            setRedoStack([]);
            setCoordinationRows([]);
            setGuestNames({});

            setPan({ x: 0, y: 0 });
            setZoom(1.0);
            targetZoomRef.current = 1.0;
            targetPanRef.current = { x: 0, y: 0 };

            if (templateId === 'blank') {
                setLayoutName('โปรเจกต์ใหม่');
                setZones([]);
                setActiveZoneId(null);
            } else if (templateId === 'concert') {
                setLayoutName('ผังงานแสดง / คอนเสิร์ต');
                setZones([
                    { id: 'stage-1', type: 'stage', name: 'Main Stage', x: 250, y: 100, width: 800, height: 300, color: 'indigo', rotation: 0 },
                    { id: 'zone-l', type: 'seating', name: 'VIP Left', ...DEFAULT_ZONE_CONFIG, x: 250, y: 550, rows: 12, columns: 10, color: 'blue', rotation: 0 },
                    { id: 'zone-r', type: 'seating', name: 'VIP Right', ...DEFAULT_ZONE_CONFIG, x: 600, y: 550, rows: 12, columns: 10, color: 'purple', rotation: 0 }
                ]);
                setActiveZoneId('stage-1');
            } else if (templateId === 'gala') {
                setLayoutName('งานจัดเลี้ยง / Gala');
                setZones([
                    { id: 'stage-1', type: 'stage', name: 'เวทีพิธีกร', x: 400, y: 100, width: 400, height: 150, color: 'rose', rotation: 0 },
                    { id: 'zone-center', type: 'seating', name: 'โซนที่นั่ง', ...DEFAULT_ZONE_CONFIG, x: 300, y: 350, rows: 6, columns: 10, spacingX: 20, spacingY: 80, color: 'amber' }
                ]);
                setActiveZoneId('stage-1');
            } else if (templateId === 'expo') {
                setLayoutName('งานแสดงสินค้า (Expo)');
                setZones([
                    { id: 'booth-1', type: 'stage', name: 'Booth A1-A5', x: 200, y: 100, width: 500, height: 150, color: 'emerald', rotation: 0 },
                    { id: 'booth-2', type: 'stage', name: 'Booth B1-B5', x: 200, y: 400, width: 500, height: 150, color: 'emerald', rotation: 0 }
                ]);
                setActiveZoneId('booth-1');
            } else if (templateId === 'merit') {
                setLayoutName('งานบุญ / พิธีสงฆ์');
                setZones([
                    { id: 'monk-stage', type: 'stage', name: 'อาสนะสงฆ์', x: 200, y: 100, width: 700, height: 120, color: 'amber', rotation: 0 },
                    { id: 'guest-zone', type: 'seating', name: 'ที่นั่งแขกผู้มีเกียรติ', ...DEFAULT_ZONE_CONFIG, x: 250, y: 300, rows: 8, columns: 15, spacingX: 10, spacingY: 50, color: 'sky' }
                ]);
                setActiveZoneId('monk-stage');
            } else {
                // Default handling for other templates
                setLayoutName(`Template: ${templateId}`);
                setZones([
                    { id: 'auto-stage', type: 'stage', name: 'เวทีหลัก', x: 200, y: 100, width: 600, height: 200, color: 'blue' }
                ]);
                setActiveZoneId('auto-stage');
            }

            setCurrentView('editor');
            setIsAnimating(false);
            showToast(`เปิดเทมเพลต ${templateId} สำเร็จ`);
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

    const addNewZone = (type = 'seating') => {
        const newId = `zone-${Date.now()}`;
        const defaultProps = type === 'stage'
            ? { ...DEFAULT_ZONE_CONFIG, type: 'stage', width: 400, height: 200, name: `เวที ${zones.filter(z => z.type === 'stage').length + 1}` }
            : type === 'booth'
                ? { ...DEFAULT_ZONE_CONFIG, type: 'booth', width: 200, height: 200, name: `บูธ ${zones.filter(z => z.type === 'booth').length + 1}` }
                : { ...DEFAULT_ZONE_CONFIG, type: 'seating', name: `โซนที่นั่ง ${zones.filter(z => !z.type || z.type === 'seating').length + 1}` };

        const newZoneProps = { ...defaultProps, id: newId, color: Object.keys(ZONE_COLORS)[zones.length % 5] || 'blue' };

        let targetX = 0, targetY = 0, foundSpot = false;
        const step = 40; // เพิ่ม step ให้ใหญ่ขึ้นเพื่อลดจำนวนรอบการคำนวณ

        // จำกัดการค้นหาเหลือเพียง 10x10 รอบเพื่อป้องกันเครื่องค้าง
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 15; col++) {
                const testX = col * step;
                const testY = row * step;

                try {
                    const testBounds = getBounds(newZoneProps, testX, testY);
                    if (!zones.some(z => {
                        const zb = getBounds(z);
                        if (!zb || zb.width === 0 || zb.height === 0) return false;
                        return isColliding(testBounds, zb);
                    })) {
                        targetX = testX;
                        targetY = testY;
                        foundSpot = true;
                        break;
                    }
                } catch (e) {
                    console.error("Collision check error:", e);
                }
            }
            if (foundSpot) break;
        }

        // ถ้าหาที่ว่างไม่ได้ ให้วางต่อท้ายโซนสุดท้ายที่ตำแหน่งเยื้องๆ กัน
        if (!foundSpot && zones.length > 0) {
            const lastZone = zones[zones.length - 1];
            targetX = (lastZone.x || 0) + 50;
            targetY = (lastZone.y || 0) + 50;
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

    const DRAWING_COLORS = ['#ff3b30', '#34c759', '#007aff', '#ffcc00', '#000000'];
    const PRESET_GRADIENTS = [
        { name: 'Sky', value: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)' },
        { name: 'Forest', value: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
        { name: 'Berry', value: 'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)' },
        { name: 'Slate', value: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)' },
        { name: 'Gold', value: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }
    ];

    // --- ระบบฟิสิกส์การลาก (Pointer Physics) ---
    const handlePointerDown = (e) => {
        if (isSelectingArea) return; // Disable pan when selecting export area
        if (e.target.closest('.no-pan')) return;

        // --- Note Pin Dragging ---
        const pinHeader = e.target.closest('.note-pin-header');
        if (pinHeader && !isNotePinDocked) {
            const currentX = notePinPos.x ?? (window.innerWidth - 320);
            const currentY = notePinPos.y ?? 100;
            notePinOffset.current = {
                x: e.clientX - currentX,
                y: e.clientY - currentY
            };
            setNotePinPos({ x: currentX, y: currentY });
            setIsNotePinDragging(true);
            e.target.setPointerCapture(e.pointerId);
            return;
        }

        if (e.target.closest('.chair-element') && activeMode === 'edit_chair') return;

        // --- Drawing Mode handled by native overlay listeners ---
        if (activeMode === 'pen' || activeMode === 'highlighter') {
            return; // Drawing is handled by the overlay's native DOM listeners
        }

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
        // --- Note Pin Dragging ---
        if (isNotePinDragging) {
            setNotePinPos({
                x: e.clientX - notePinOffset.current.x,
                y: e.clientY - notePinOffset.current.y
            });
            return;
        }

        // --- Drawing Mode handled by overlay ---
        if (isDrawingRef.current) return;

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
        if (isNotePinDragging) {
            setIsNotePinDragging(false);
            e.target.releasePointerCapture(e.pointerId);
            return;
        }
        // Drawing handled by overlay
        if (isDrawingRef.current) return;
        if (dragContext) {
            e.target.releasePointerCapture(e.pointerId);
            setDragContext(null);
        }
    };

    // --- Smooth Zoom/Pan System (macOS Freeform-like) ---
    const currentZoomRef = useRef(zoom);
    const currentPanRef = useRef(pan);
    currentZoomRef.current = zoom;
    currentPanRef.current = pan;

    const smoothZoomTo = (newZoom, pivotX, pivotY) => {
        const clampedZoom = Math.max(0.15, Math.min(3, newZoom));
        targetZoomRef.current = clampedZoom;

        // Calculate pan offset to zoom toward the cursor/pivot point
        const curZoom = currentZoomRef.current;
        const curPan = currentPanRef.current;
        const zoomRatio = clampedZoom / curZoom;
        targetPanRef.current = {
            x: pivotX - (pivotX - curPan.x) * zoomRatio,
            y: pivotY - (pivotY - curPan.y) * zoomRatio
        };

        if (!zoomAnimRef.current) {
            const animate = () => {
                let done = true;
                setZoom(prev => {
                    const diff = targetZoomRef.current - prev;
                    if (Math.abs(diff) < 0.001) return targetZoomRef.current;
                    done = false;
                    return prev + diff * 0.25;
                });
                setPan(prev => {
                    const dx = targetPanRef.current.x - prev.x;
                    const dy = targetPanRef.current.y - prev.y;
                    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return targetPanRef.current;
                    done = false;
                    return { x: prev.x + dx * 0.25, y: prev.y + dy * 0.25 };
                });
                if (!done) {
                    zoomAnimRef.current = requestAnimationFrame(animate);
                } else {
                    zoomAnimRef.current = null;
                }
            };
            zoomAnimRef.current = requestAnimationFrame(animate);
        }
    };

    const zoomReset = () => {
        targetZoomRef.current = 1.0;
        targetPanRef.current = { x: 0, y: 0 };
        if (zoomAnimRef.current) cancelAnimationFrame(zoomAnimRef.current);
        zoomAnimRef.current = null;
        // Animate smoothly to 100%
        const animateReset = () => {
            let done = true;
            setZoom(prev => {
                const diff = 1.0 - prev;
                if (Math.abs(diff) < 0.002) return 1.0;
                done = false;
                return prev + diff * 0.2;
            });
            setPan(prev => {
                const dx = 0 - prev.x;
                const dy = 0 - prev.y;
                if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return { x: 0, y: 0 };
                done = false;
                return { x: prev.x + dx * 0.2, y: prev.y + dy * 0.2 };
            });
            if (!done) {
                zoomAnimRef.current = requestAnimationFrame(animateReset);
            } else {
                zoomAnimRef.current = null;
            }
        };
        zoomAnimRef.current = requestAnimationFrame(animateReset);
    };

    const handleWheel = (e) => {
        if (e.target.closest('.no-pan')) return;
        e.preventDefault();

        // Detect if this is a trackpad pinch (Ctrl key is synthetically added by browser)
        const isTrackpadPinch = e.ctrlKey && Math.abs(e.deltaY) < 50;
        const isMouseWheel = !e.ctrlKey && !e.metaKey;
        const isCmdScroll = e.metaKey || (e.ctrlKey && !isTrackpadPinch);

        if (isTrackpadPinch || isCmdScroll) {
            // --- Pinch-to-zoom or Cmd+scroll for zoom ---
            const sensitivity = isTrackpadPinch ? 0.008 : 0.003;
            const delta = -e.deltaY * sensitivity;
            const newZoom = zoom * (1 + delta);
            smoothZoomTo(newZoom, e.clientX, e.clientY);
        } else if (isMouseWheel) {
            // --- Two-finger scroll for pan (trackpad) ---
            const sensitivity = 1.0;
            setPan(p => ({
                x: p.x - e.deltaX * sensitivity,
                y: p.y - e.deltaY * sensitivity
            }));
        }
    };

    // --- Trackpad Pinch Gesture (Safari/macOS native) ---
    const handleGestureChange = (e) => {
        e.preventDefault();
        const newZoom = zoom * e.scale;
        smoothZoomTo(newZoom, window.innerWidth / 2, window.innerHeight / 2);
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
                <div className="absolute bg-[#ef4444] rounded-full" style={{ width: 4, height: 4, left: l.h === 0 ? -2 : -1.25, top: l.h === 0 ? -1.25 : -2 }}></div>
                <div className="absolute bg-[#ef4444] rounded-full" style={{ width: 4, height: 4, right: l.h === 0 ? -2 : -1.25, bottom: l.h === 0 ? -1.25 : -2 }}></div>
                <div className="absolute bg-[#ef4444] text-white px-1.5 py-0.5 rounded shadow-sm text-[8px] font-bold whitespace-nowrap">{l.v} ซม.</div>
            </div>
        ));
    };

    // ==========================================
    // โครงสร้างหน้า UI หลัก (JSX)
    // ==========================================

    // หน้าจอ Landing Page (บังคับให้เข้าสู่ระบบ)
    if (currentView === 'landing') {
        return (
            <div className="flex w-full min-h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden select-none relative">
                {message.text && (
                    <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-lg transition-all duration-300 font-medium text-white flex items-center gap-2 ${message.type === 'error' ? 'bg-red-500' : 'bg-slate-800'}`}>
                        <i className="fa-solid fa-circle-exclamation"></i> {message.text}
                    </div>
                )}

                {/* Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[150px]"></div>
                    <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-cyan-400/15 blur-[100px]"></div>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row w-full h-full">
                    {/* Left Side: Branding / Intro */}
                    <div className="flex-1 flex flex-col justify-center items-start px-12 md:px-24">
                        <div className="mb-6 flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-xl shadow-blue-600/30">
                            <i className="fa-solid fa-layer-group text-3xl text-white"></i>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
                            ออกแบบผังงานอย่างมืออาชีพ <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">ด้วย Event Labs.</span>
                        </h1>
                        <p className="text-lg text-slate-600 mb-10 max-w-lg leading-relaxed">
                            แพลตฟอร์มการวาดและจัดการพื้นที่งานอีเวนต์ ปรับมุมหมุนโซน 360 องศา วางตำแหน่งเก้าอี้ พร้อมซิงก์ข้อมูลขึ้นคลาวด์แบบเรียลไทม์
                        </p>
                        <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
                            <div className="flex items-center gap-2"><i className="fa-solid fa-check-circle text-green-500"></i> Smart Zoom & Pan</div>
                            <div className="flex items-center gap-2"><i className="fa-solid fa-check-circle text-green-500"></i> 360° Zone Rotation</div>
                            <div className="flex items-center gap-2"><i className="fa-solid fa-check-circle text-green-500"></i> Local & Cloud Sync</div>
                        </div>
                    </div>

                    {/* Right Side: Login Form */}
                    <div className="w-full md:w-[480px] flex items-center justify-center p-8 bg-white/60 backdrop-blur-3xl border-l border-white/50 shadow-2xl">
                        <div className="w-full max-w-[340px] space-y-6">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-slate-800">เข้าสู่ระบบ</h2>
                                <p className="text-sm text-slate-500 mt-1">กรุณาเข้าสู่ระบบเพื่อเข้าใช้งานแอปพลิเคชัน</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 ml-1">Email</label>
                                    <div className="relative">
                                        <i className="fa-regular fa-envelope absolute left-3 top-3 text-slate-400"></i>
                                        <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} placeholder="your@email.com" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 pl-10 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 ml-1">Password</label>
                                    <div className="relative">
                                        <i className="fa-solid fa-lock absolute left-3 top-3 text-slate-400"></i>
                                        <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} placeholder="••••••••" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 pl-10 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button onClick={handleLogin} disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl text-sm font-bold disabled:opacity-50 shadow-sm shadow-blue-600/20 transition-all active:scale-[0.98]"><i className="fa-solid fa-sign-in mr-2"></i> {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</button>
                                </div>

                                <div className="text-center pt-2">
                                    <button onClick={handleSignUp} disabled={isLoading} className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">ยังไม่มีบัญชี? สมัครสมาชิก</button>
                                </div>

                                <div className="flex items-center gap-3 my-6">
                                    <div className="flex-1 bg-slate-200 h-px" />
                                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">หรือใช้งานด้วย</span>
                                    <div className="flex-1 bg-slate-200 h-px" />
                                </div>

                                <button onClick={handleGoogleSignIn} disabled={isLoading} className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold shadow-sm flex items-center justify-center gap-2.5 transition active:scale-[0.98]"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" /> <span>Google Account</span></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // หน้า Library (Home)
    if (currentView === 'home') {
        const homeViewClass = isAnimating && animationDirection === 'exit' ? 'view-exit-animation' : '';
        return (
            <div className={`flex w-full min-h-screen bg-white font-sans text-slate-900 overflow-hidden select-none ${homeViewClass}`}>
                {/* Template Selection Modal */}
                {showTemplateModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowTemplateModal(false)}></div>
                        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-8 flex flex-col max-h-[90vh] animate-[cardFadeIn_0.2s_ease-out]">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">เลือกเทมเพลตเริ่มต้น</h2>
                                    <p className="text-sm text-slate-500 mt-1">เริ่มต้นโปรเจกต์ของคุณด้วยโครงสร้างที่เตรียมไว้ให้ หรือสร้างใหม่ตั้งแต่ต้น</p>
                                </div>
                                <button onClick={() => setShowTemplateModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition">
                                    <i className="fa-solid fa-xmark"></i>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-4 h-[65vh] scrollbar-hide">
                                {/* Basic Templates */}
                                <div className="col-span-full border-b border-slate-100 pb-2 mb-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">เทมเพลตพื้นฐาน</p>
                                </div>
                                <div onClick={() => handleSelectTemplate('blank')} className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 rounded-xl p-5 cursor-pointer flex flex-col items-center justify-center text-center transition-all h-[180px] group">
                                    <i className="fa-solid fa-plus text-3xl text-slate-400 group-hover:text-blue-500 mb-3 transition-colors"></i>
                                    <h3 className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">ผังเปล่า (Blank Canvas)</h3>
                                    <p className="text-xs text-slate-500 mt-1">เริ่มจากพื้นที่ว่างเปล่า</p>
                                </div>
                                <div onClick={() => handleSelectTemplate('concert')} className="border border-slate-200 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 rounded-xl p-5 cursor-pointer flex flex-col items-center text-center transition-all h-[180px] bg-gradient-to-b from-white to-slate-50 group relative overflow-hidden">
                                    <div className="absolute top-0 w-full h-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <i className="fa-solid fa-guitar text-3xl text-indigo-500 mb-3"></i>
                                    <h3 className="font-bold text-slate-700 leading-snug">งานคอนเสิร์ต / แสดงสด</h3>
                                    <p className="text-xs text-slate-500 mt-1 px-2">เวทีใหญ่ และเก้าอี้ VIP</p>
                                </div>
                                <div onClick={() => handleSelectTemplate('gala')} className="border border-slate-200 hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/10 rounded-xl p-5 cursor-pointer flex flex-col items-center text-center transition-all h-[180px] bg-gradient-to-b from-white to-slate-50 group relative overflow-hidden">
                                    <div className="absolute top-0 w-full h-1 bg-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <i className="fa-solid fa-glass-cheers text-3xl text-rose-500 mb-3"></i>
                                    <h3 className="font-bold text-slate-700 leading-snug">งานจัดเลี้ยง (Gala)</h3>
                                    <p className="text-xs text-slate-500 mt-1 px-2">เวทีพิธีกร และผังที่นั่งกว้าง</p>
                                </div>
                                <div onClick={() => handleSelectTemplate('expo')} className="border border-slate-200 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 rounded-xl p-5 cursor-pointer flex flex-col items-center text-center transition-all h-[180px] bg-gradient-to-b from-white to-slate-50 group relative overflow-hidden">
                                    <div className="absolute top-0 w-full h-1 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <i className="fa-solid fa-store text-3xl text-emerald-500 mb-3"></i>
                                    <h3 className="font-bold text-slate-700 leading-snug">งานแสดงสินค้า (Expo)</h3>
                                    <p className="text-xs text-slate-500 mt-1 px-2">บล็อกแบ่งตัวบูธมาตรฐาน</p>
                                </div>
                                <div onClick={() => handleSelectTemplate('merit')} className="border border-slate-200 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/10 rounded-xl p-5 cursor-pointer flex flex-col items-center text-center transition-all h-[180px] bg-gradient-to-b from-white to-amber-50/30 group relative overflow-hidden">
                                    <div className="absolute top-0 w-full h-1 bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <i className="fa-solid fa-hands-praying text-3xl text-amber-500 mb-3"></i>
                                    <h3 className="font-bold text-slate-700 leading-snug">งานบุญ / พิธีสงฆ์</h3>
                                    <p className="text-xs text-slate-500 mt-1 px-2">อาสนะสงฆ์ และโซนแขก</p>
                                </div>

                                {/* World Class Events */}
                                <div className="col-span-full border-b border-slate-100 pb-2 mb-2 mt-4">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">อีเวนต์ระดับโลก (World Class)</p>
                                </div>

                                <div className="col-span-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                    {[
                                        { id: 'tomorrowland', icon: 'fa-bolt', color: 'bg-purple-500', name: 'Tomorrowland', desc: 'EDM Mainstage' },
                                        { id: 'tedtalk', icon: 'fa-microphone', color: 'bg-rose-600', name: 'TED Talk', desc: 'Conference' },
                                        { id: 'fifafinal', icon: 'fa-trophy', color: 'bg-emerald-600', name: 'FIFA Final', desc: 'Stadium Ceremony' },
                                        { id: 'metgala', icon: 'fa-heart', color: 'bg-indigo-600', name: 'Met Gala', desc: 'Red Carpet' },
                                        { id: 'ces', icon: 'fa-microchip', color: 'bg-blue-600', name: 'CES Expo', desc: 'Tech Exhibition' },
                                        { id: 'coachella', icon: 'fa-sun', color: 'bg-amber-600', name: 'Coachella', desc: 'Outdoor Music' },
                                        { id: 'oscars', icon: 'fa-star', color: 'bg-amber-500', name: 'The Oscars', desc: 'Awards Night' },
                                        { id: 'olympics', icon: 'fa-fire', color: 'bg-cyan-600', name: 'Olympic Open', desc: 'Grand Parade' },
                                        { id: 'cannes', icon: 'fa-film', color: 'bg-indigo-700', name: 'Cannes Fest', desc: 'Film Premiere' },
                                        { id: 'artbasel', icon: 'fa-palette', color: 'bg-slate-700', name: 'Art Basel', desc: 'Art Gallery' },
                                        { id: 'un-general', icon: 'fa-landmark', color: 'bg-blue-500', name: 'UN Assembly', desc: 'Global Summit' },
                                        { id: 'rio-carnival', icon: 'fa-music', color: 'bg-amber-400', name: 'Rio Carnival', desc: 'Sambadrome' },
                                        { id: 'monaco-gp', icon: 'fa-flag-checkered', color: 'bg-red-600', name: 'Monaco GP', desc: 'F1 Track' },
                                        { id: 'tokyo-game-show', icon: 'fa-gamepad', color: 'bg-slate-800', name: 'Tokyo Game', desc: 'Gaming Expo' },
                                        { id: 'nobel', icon: 'fa-medal', color: 'bg-yellow-600', name: 'Nobel Pri', desc: 'Ceremony' },
                                        { id: 'comiccon', icon: 'fa-mask', color: 'bg-blue-800', name: 'Comic-Con', desc: 'Hall H Panel' },
                                        { id: 'burningman', icon: 'fa-fire-alt', color: 'bg-orange-600', name: 'Burning Man', desc: 'Playa Layout' },
                                        { id: 'superbowl', icon: 'fa-football-ball', color: 'bg-indigo-900', name: 'Super Bowl', desc: 'Halftime Show' },
                                        { id: 'wimbledon', icon: 'fa-tennis-ball', color: 'bg-green-700', name: 'Wimbledon', desc: 'Centre Court' },
                                        { id: 'ny-countdown', icon: 'fa-clock', color: 'bg-blue-900', name: 'NY Countdown', desc: 'Times Square' }
                                    ].map(ev => (
                                        <div key={ev.id} onClick={() => handleSelectTemplate(ev.id)} className="border border-slate-200 hover:border-slate-400 hover:shadow-md rounded-xl p-3 cursor-pointer flex flex-col items-center text-center transition-all bg-white group relative overflow-hidden">
                                            <div className={`absolute top-0 w-full h-1 ${ev.color} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                                            <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-50 group-hover:bg-slate-100 mb-2 transition-colors">
                                                <i className={`fa-solid ${ev.icon} text-base text-slate-700 group-hover:scale-110 transition-transform`}></i>
                                            </div>
                                            <h3 className="font-bold text-[9px] text-slate-800 leading-tight truncate w-full">{ev.name}</h3>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 bg-white border border-slate-200 p-2.5 rounded-lg shadow-sm">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0"><i className="fa-solid fa-user text-blue-500"></i></div>
                                <div className="text-xs overflow-hidden">
                                    <div className="font-bold text-slate-800 truncate">{currentUser?.email || 'User'}</div>
                                    <div className="text-[10px] text-green-600 font-medium flex items-center gap-1"><i className="fa-solid fa-cloud"></i> Syncing to Cloud</div>
                                </div>
                            </div>
                            <button onClick={handleLogout} className="w-full text-slate-600 flex justify-between items-center bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 px-3 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">
                                <span>ออกจากระบบ</span>
                                <i className="fa-solid fa-sign-out"></i>
                            </button>
                        </div>
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
                        <button onClick={loadProject} className="text-emerald-600 hover:bg-white hover:shadow-sm p-1.5 rounded-md transition px-3 flex items-center gap-1.5 text-xs font-bold border-r border-slate-300"><i className="fa-solid fa-folder-open"></i> <span className="hidden md:inline">โหลดงาน</span></button>
                        <button onClick={saveProject} className="text-blue-600 hover:bg-white hover:shadow-sm p-1.5 rounded-md transition px-3 flex items-center gap-1.5 text-xs font-bold border-r border-slate-300"><i className="fa-solid fa-save"></i> <span className="hidden md:inline">เซฟงาน</span></button>
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
                        <aside className={`no-pan bg-white/80 backdrop-blur-xl border-r p-5 overflow-y-auto z-20 flex flex-col gap-6 shrink-0 transition-all duration-300 ease-in-out max-w-[min(380px,calc(100vw-12px))] ${isSidebarOpen ? 'w-[380px]' : 'w-0 -ml-[380px] overflow-hidden'}`}>
                            <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner border border-slate-200/60 overflow-x-auto thin-scrollbar shrink-0">
                                {[
                                    { id: 'edit_chair', icon: 'fa-eraser', label: 'ลบ/เพิ่ม', key: 'R', color: 'text-[#007aff]' },
                                    { id: 'move_zone', icon: 'fa-arrows-up-down-left-right', label: 'ย้ายโซน', key: 'M', color: 'text-emerald-600' },
                                    { id: 'pen', icon: 'fa-pen-nib', label: 'ปากกา', key: 'P', color: 'text-rose-500' },
                                    { id: 'highlighter', icon: 'fa-highlighter', label: 'ไฮไลท์', key: 'H', color: 'text-amber-500' }
                                ].map(m => (
                                    <button key={m.id} type="button" onClick={() => setActiveMode(m.id)} className={`flex-1 min-w-[75px] py-2.5 text-[10px] sm:text-xs font-bold rounded-xl flex flex-col justify-center items-center gap-1 transition-all ${activeMode === m.id ? 'bg-white shadow-md ' + m.color : 'text-slate-500 hover:bg-white/60'}`}>
                                        <i className={`fa-solid ${m.icon} text-sm`}></i>
                                        <span>{m.label}</span>
                                        <span className="text-[8px] font-black opacity-40">{m.key}</span>
                                    </button>
                                ))}
                            </div>

                            {(activeMode === 'pen' || activeMode === 'highlighter') && (
                                <div className="p-4 bg-white shadow-lg shadow-indigo-100/50 rounded-2xl border border-indigo-200 space-y-4 animate-[cardFadeIn_0.3s_ease-out]">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-rose-500/10 rounded-lg flex items-center justify-center">
                                                <i className={`fa-solid ${activeMode === 'pen' ? 'fa-pen-nib text-rose-500' : 'fa-highlighter text-amber-500'} text-[10px]`}></i>
                                            </div>
                                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{activeMode === 'pen' ? 'หัวปากกา' : 'หัวไฮไลท์'}</h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={undoDrawing}
                                                disabled={drawings.length === 0}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-sm"
                                                title="เลิกทำ (Cmd+Z)"
                                            >
                                                <i className="fa-solid fa-rotate-left text-[10px]"></i>
                                            </button>
                                            <button
                                                onClick={redoDrawing}
                                                disabled={redoStack.length === 0}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-sm"
                                                title="ทำซ้ำ (Cmd+Shift+Z)"
                                            >
                                                <i className="fa-solid fa-rotate-right text-[10px]"></i>
                                            </button>
                                            <button onClick={() => { if (window.confirm('ล้างภาพวาดทั้งหมดใช่หรือไม่?')) setDrawings([]) }} className="text-[10px] font-bold text-red-500 hover:text-red-600 transition flex items-center gap-1.5 ml-1"><i className="fa-solid fa-trash-can"></i> ล้าง</button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-1">เลือกสีที่ต้องการ</p>
                                        <div className="flex flex-wrap gap-2.5 px-0.5">
                                            {DRAWING_COLORS.map(c => (
                                                <button key={c} onClick={() => setDrawingColor(c)} className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${drawingColor === c ? 'border-slate-800 scale-110 shadow-md' : 'border-transparent shadow-sm'}`} style={{ backgroundColor: c }} />
                                            ))}
                                            <div className="relative group">
                                                <input type="color" value={drawingColor} onChange={(e) => setDrawingColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
                                                <div className="w-8 h-8 rounded-full border-2 border-slate-200 shadow-sm flex items-center justify-center bg-gradient-to-tr from-rose-400 via-emerald-400 to-blue-400 hover:scale-110 transition-transform">
                                                    <i className="fa-solid fa-plus text-white text-[10px]"></i>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-1">
                                        <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1">
                                            <span>ความหนาเส้น</span>
                                            <span className="text-slate-600">{drawingWidth} px</span>
                                        </div>
                                        <input type="range" min={1} max={50} value={drawingWidth} onChange={(e) => setDrawingWidth(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800" />
                                    </div>

                                    <div className="p-3 bg-indigo-50 border border-indigo-100/50 rounded-xl">
                                        <p className="text-[9px] font-medium text-indigo-700 leading-snug"><i className="fa-solid fa-info-circle mr-1 opacity-70"></i> <b>เคล็ดลับ:</b> ลากเมาส์บนพื้นหลังเพื่อวาดภาพได้อิสระ และสามารถใช้ Cmd+Z เพื่อ Undo ได้</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2.5">
                                <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    <span className="flex items-center gap-1.5"><i className="fa-solid fa-grip"></i> โซน (Zones)</span>
                                    <div className="flex gap-1 ml-auto shrink-0">
                                        <button className="text-[#007aff] hover:bg-blue-50 w-7 h-7 flex items-center justify-center rounded border border-transparent hover:border-blue-100 transition shadow-sm bg-white" onClick={() => addNewZone('seating')} title="เพิ่มโซนที่นั่ง"><i className="fa-solid fa-chair"></i></button>
                                        <button className="text-emerald-600 hover:bg-emerald-50 w-7 h-7 flex items-center justify-center rounded border border-transparent hover:border-emerald-100 transition shadow-sm bg-white" onClick={() => addNewZone('stage')} title="เพิ่มเวที"><i className="fa-solid fa-layer-group"></i></button>
                                        <button className="text-amber-600 hover:bg-amber-50 w-7 h-7 flex items-center justify-center rounded border border-transparent hover:border-amber-100 transition shadow-sm bg-white" onClick={() => addNewZone('booth')} title="เพิ่มบูธ/พาร์ทิชัน"><i className="fa-solid fa-store"></i></button>
                                    </div>
                                </div>
                                {zones.map(z => (
                                    <div key={z.id} onClick={() => setActiveZoneId(z.id)} className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex justify-between items-center cursor-pointer transition ${activeZoneId === z.id ? 'bg-white border-slate-300 shadow-sm' : 'bg-[#f2f2f7] border-transparent text-slate-500 hover:bg-[#e3e3e8]'}`}>
                                        <div className="flex items-center gap-2.5 truncate"><div className={`w-2.5 h-2.5 rounded-full ${ZONE_COLORS[z.color].bg}`} /> {z.name}</div>
                                        {activeZoneId === z.id && zones.length > 1 && <i className="fa-solid fa-trash-can text-slate-400 hover:text-red-500 p-1" onClick={(e) => deleteActiveZone()}></i>}
                                    </div>
                                ))}

                                {isNotePinDocked && (
                                    <div className="mt-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 space-y-3 animate-[fadeIn_0.3s_ease-out]">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest pl-2 border-l-2 border-indigo-500">Project Summary</span>
                                            <button onClick={() => setIsNotePinDocked(false)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white text-indigo-400 hover:text-indigo-600 shadow-sm transition" title="ลอยพินโน้ต (Undock)">
                                                <i className="fa-solid fa-up-right-from-square text-[9px]"></i>
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100/30 shadow-sm">
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-1">โซน (Zones)</p>
                                                <p className="text-xl font-black text-slate-800 leading-none">{zones.length}</p>
                                            </div>
                                            <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100/30 shadow-sm">
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-1">วัตถุ (Objects)</p>
                                                <p className="text-xl font-black text-indigo-600 font-mono leading-none">{stats.actualChairs}</p>
                                            </div>
                                        </div>
                                        <div className="bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl text-white shadow-xl shadow-slate-200 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-indigo-500/20 transition-colors" />
                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between mb-2.5">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-2 border-l-2 border-indigo-500">Summary Space</p>
                                                    {drawings.length > 0 && <span className="text-[8px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded-full border border-rose-500/30 animate-pulse">Drawing ON</span>}
                                                </div>
                                                <div className="flex items-baseline gap-1.5">
                                                    <p className="text-2xl font-black tracking-tight">{stats.areaSqM.toLocaleString()}</p>
                                                    <p className="text-xs font-medium text-slate-400">ม²</p>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 text-[9px] font-medium text-slate-400">
                                                    <span className="flex items-center gap-1"><i className="fa-solid fa-arrows-left-right text-[8px] opacity-70" /> {stats.totalWidthM} ม.</span>
                                                    <span className="text-slate-700">×</span>
                                                    <span className="flex items-center gap-1"><i className="fa-solid fa-arrows-up-down text-[8px] opacity-70" /> {stats.totalHeightM} ม.</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {activeZone && (activeMode !== 'pen' && activeMode !== 'highlighter') && (
                                <div className="space-y-3 pt-4 border-t border-slate-200/60">
                                    <SidebarCollapsible title="รูปลักษณ์และข้อมูล" icon={<i className="fa-solid fa-palette text-blue-500" />}>
                                        <div className="space-y-4 px-1 py-1">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">ชื่อเรียก / ป้ายกำกับ</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={activeZone.name}
                                                        onChange={(e) => setZones(prev => prev.map(z => z.id === activeZoneId ? { ...z, name: e.target.value } : z))}
                                                        className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition shadow-sm"
                                                        placeholder="ระบุชื่อโซน..."
                                                    />
                                                    <i className="fa-solid fa-pen-to-square absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                                </div>
                                            </div>

                                            {activeZone.type !== 'seating' && (
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">รูปภาพพื้นหลัง (URL)</label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={activeZone.image || ''}
                                                            onChange={(e) => setZones(prev => prev.map(z => z.id === activeZoneId ? { ...z, image: e.target.value } : z))}
                                                            className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition shadow-sm"
                                                            placeholder="https://example.com/image.png"
                                                        />
                                                        <i className="fa-solid fa-image absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between ml-1 mb-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">สีและเฉดสีโซน</label>
                                                </div>

                                                {/* Preset Colors */}
                                                <div className="flex flex-wrap gap-2.5 px-1">
                                                    {Object.entries(ZONE_COLORS).map(([k, v]) => (
                                                        <button
                                                            key={k}
                                                            onClick={() => setZones(prev => prev.map(z => z.id === activeZoneId ? { ...z, color: k, customColor: null, gradient: null } : z))}
                                                            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${activeZone.color === k && !activeZone.customColor && !activeZone.gradient ? 'border-slate-800 scale-110 shadow-md' : 'border-transparent shadow-sm'} ${v.bg}`}
                                                        />
                                                    ))}

                                                    {/* Custom Color Picker */}
                                                    <div className="relative group">
                                                        <input
                                                            type="color"
                                                            value={activeZone.customColor || '#3b82f6'}
                                                            onChange={(e) => setZones(prev => prev.map(z => z.id === activeZoneId ? { ...z, customColor: e.target.value, gradient: null } : z))}
                                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                                        />
                                                        <div className={`w-6 h-6 rounded-full border-2 border-slate-200 shadow-sm flex items-center justify-center bg-gradient-to-tr from-rose-400 via-emerald-400 to-blue-400 hover:scale-110 transition-transform ${activeZone.customColor ? 'border-slate-800 scale-110 ring-2 ring-blue-100/50' : ''}`}>
                                                            <i className="fa-solid fa-plus text-white text-[8px]"></i>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Preset Gradients */}
                                                <div className="space-y-1.5 pt-2">
                                                    <label className="text-[9px] font-bold text-slate-400 uppercase ml-1 opacity-60">ไล่เฉดสี (Gradients)</label>
                                                    <div className="flex flex-wrap gap-2.5 px-1">
                                                        {PRESET_GRADIENTS.map(g => (
                                                            <button
                                                                key={g.name}
                                                                onClick={() => setZones(prev => prev.map(z => z.id === activeZoneId ? { ...z, gradient: g.value, customColor: null } : z))}
                                                                className={`w-10 h-5 rounded-md border-2 transition-transform hover:scale-110 ${activeZone.gradient === g.value ? 'border-slate-800 scale-110 shadow-md' : 'border-transparent shadow-sm'}`}
                                                                style={{ background: g.value }}
                                                                title={g.name}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </SidebarCollapsible>

                                    <SidebarCollapsible title="หมุนโซน (องศา)" icon={<i className="fa-solid fa-rotate text-cyan-500" />} defaultOpen={false}>
                                        {(() => {
                                            const rot = activeZone.rotation || 0;
                                            const setRot = (deg) => {
                                                let d = Number(deg);
                                                if (Number.isNaN(d)) d = 0;
                                                d = ((d % 360) + 360) % 360;
                                                d = Math.round(d);
                                                setZones(prev => prev.map(z => z.id === activeZoneId ? { ...z, rotation: d } : z));
                                            };
                                            const dialSize = 130;
                                            const dialR = dialSize / 2;
                                            const needleLen = dialR - 14;
                                            const radians = (rot - 90) * (Math.PI / 180);
                                            const nx = dialR + needleLen * Math.cos(radians);
                                            const ny = dialR + needleLen * Math.sin(radians);
                                            const handleDialClick = (e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const cx = rect.left + rect.width / 2;
                                                const cy = rect.top + rect.height / 2;
                                                const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI) + 90;
                                                setRot(Math.round(((angle % 360) + 360) % 360));
                                            };
                                            return (
                                                <div className="space-y-3">
                                                    {/* Circular Dial */}
                                                    <div className="flex justify-center">
                                                        <div
                                                            className="relative cursor-crosshair select-none"
                                                            style={{ width: dialSize, height: dialSize }}
                                                            onClick={handleDialClick}
                                                            onPointerDown={(e) => {
                                                                e.currentTarget.setPointerCapture(e.pointerId);
                                                            }}
                                                            onPointerMove={(e) => {
                                                                if (e.buttons !== 1) return;
                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                const cx = rect.left + rect.width / 2;
                                                                const cy = rect.top + rect.height / 2;
                                                                const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI) + 90;
                                                                setRot(Math.round(((angle % 360) + 360) % 360));
                                                            }}
                                                        >
                                                            {/* Outer ring */}
                                                            <div className="absolute inset-0 rounded-full border-[3px] border-cyan-200 bg-gradient-to-br from-slate-50 to-cyan-50 shadow-inner" />
                                                            {/* Tick marks */}
                                                            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => {
                                                                const major = a % 90 === 0;
                                                                const r1 = dialR - (major ? 12 : 8);
                                                                const r2 = dialR - 3;
                                                                const rad = (a - 90) * (Math.PI / 180);
                                                                return (
                                                                    <line
                                                                        key={a}
                                                                        x1={dialR + r1 * Math.cos(rad)}
                                                                        y1={dialR + r1 * Math.sin(rad)}
                                                                        x2={dialR + r2 * Math.cos(rad)}
                                                                        y2={dialR + r2 * Math.sin(rad)}
                                                                        stroke={major ? '#0891b2' : '#94a3b8'}
                                                                        strokeWidth={major ? 2 : 1}
                                                                        style={{ position: 'absolute', pointerEvents: 'none' }}
                                                                    />
                                                                );
                                                            })}
                                                            {/* SVG overlay for ticks + needle */}
                                                            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${dialSize} ${dialSize}`}>
                                                                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => {
                                                                    const major = a % 90 === 0;
                                                                    const r1 = dialR - (major ? 14 : 9);
                                                                    const r2 = dialR - 3;
                                                                    const rad = (a - 90) * (Math.PI / 180);
                                                                    return (
                                                                        <line
                                                                            key={`t-${a}`}
                                                                            x1={dialR + r1 * Math.cos(rad)}
                                                                            y1={dialR + r1 * Math.sin(rad)}
                                                                            x2={dialR + r2 * Math.cos(rad)}
                                                                            y2={dialR + r2 * Math.sin(rad)}
                                                                            stroke={major ? '#0891b2' : '#cbd5e1'}
                                                                            strokeWidth={major ? 2.5 : 1}
                                                                            strokeLinecap="round"
                                                                        />
                                                                    );
                                                                })}
                                                                {/* Cardinal labels */}
                                                                {[{ a: 0, label: '0°' }, { a: 90, label: '90°' }, { a: 180, label: '180°' }, { a: 270, label: '270°' }].map(({ a, label }) => {
                                                                    const lr = dialR - 24;
                                                                    const rad = (a - 90) * (Math.PI / 180);
                                                                    return (
                                                                        <text key={`l-${a}`} x={dialR + lr * Math.cos(rad)} y={dialR + lr * Math.sin(rad)} textAnchor="middle" dominantBaseline="central" className="text-[8px] font-bold fill-slate-400 select-none">
                                                                            {label}
                                                                        </text>
                                                                    );
                                                                })}
                                                                {/* Needle */}
                                                                <line x1={dialR} y1={dialR} x2={nx} y2={ny} stroke="#0891b2" strokeWidth="2.5" strokeLinecap="round" />
                                                                {/* Center dot */}
                                                                <circle cx={dialR} cy={dialR} r="4" fill="#0891b2" />
                                                                <circle cx={dialR} cy={dialR} r="2" fill="white" />
                                                                {/* Tip dot */}
                                                                <circle cx={nx} cy={ny} r="5" fill="#06b6d4" stroke="white" strokeWidth="2" />
                                                            </svg>
                                                            {/* Center label */}
                                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                <span className="text-lg font-black text-cyan-700 bg-white/80 rounded-full px-2 py-0.5 shadow-sm">{rot}°</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Input + Slider */}
                                                    <div className="bg-gradient-to-r from-cyan-50 to-cyan-100 border-2 border-cyan-200 rounded-xl p-3 space-y-2">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button type="button" onClick={() => setRot(rot - 1)} className="w-9 h-9 shrink-0 bg-white rounded-full text-sm font-black border-2 border-cyan-300 shadow-sm hover:shadow-md hover:scale-105 transition active:scale-95">−</button>
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                value={String(rot)}
                                                                onChange={(e) => {
                                                                    const v = e.target.value.replace(/[^\d]/g, '');
                                                                    if (v === '') return;
                                                                    setRot(parseInt(v, 10));
                                                                }}
                                                                onBlur={(e) => setRot(parseInt(e.target.value, 10) || 0)}
                                                                onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                                                                className="w-16 text-center text-xl font-black text-cyan-700 bg-white/90 border-2 border-white/80 rounded-lg py-1.5 shadow-inner"
                                                            />
                                                            <span className="text-sm font-bold text-cyan-500">°</span>
                                                            <button type="button" onClick={() => setRot(rot + 1)} className="w-9 h-9 shrink-0 bg-white rounded-full text-sm font-black border-2 border-cyan-300 shadow-sm hover:shadow-md hover:scale-105 transition active:scale-95">+</button>
                                                        </div>
                                                        <input type="range" min={0} max={359} value={rot} onChange={(e) => setRot(Number(e.target.value))} className="w-full h-2 cursor-pointer accent-cyan-500" />
                                                    </div>

                                                    {/* Quick presets */}
                                                    <div className="flex flex-wrap gap-1.5 justify-center">
                                                        {ROTATION_PRESETS.map((p) => (
                                                            <button
                                                                key={`rp-${p}`}
                                                                type="button"
                                                                onClick={() => setRot(p)}
                                                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition border ${rot === p ? 'bg-cyan-500 text-white border-cyan-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-300 hover:bg-cyan-50'}`}
                                                            >
                                                                {p}°
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Reset button */}
                                                    {rot !== 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setRot(0)}
                                                            className="w-full py-2 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition flex items-center justify-center gap-1.5"
                                                        >
                                                            <i className="fa-solid fa-undo" /> รีเซ็ตเป็น 0°
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </SidebarCollapsible>

                                    {(!activeZone.type || activeZone.type === 'seating') ? (
                                        <>
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
                                        </>
                                    ) : (
                                        <SidebarCollapsible title="ขนาด (ซม.)" icon={<i className="fa-solid fa-expand text-blue-500" />} defaultOpen>
                                            <ZoneDimensionControl
                                                title="↔️ ความกว้าง (ซม.)"
                                                field="width"
                                                min={10}
                                                max={3000}
                                                presets={[100, 200, 500, 1000]}
                                                presetSuffix="cm"
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
                                                title="↑ ↓ ความยาว (ซม.)"
                                                field="height"
                                                min={10}
                                                max={3000}
                                                presets={[100, 200, 500, 1000]}
                                                presetSuffix="cm"
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
                                    )}

                                    <SidebarCollapsible title="พื้นที่อาคารและข้อกำหนด" icon={<i className="fa-solid fa-building text-amber-600" />} defaultOpen={false}>
                                        <p className="text-[10px] text-slate-500 leading-relaxed px-1">ใช้สำหรับสรุปความต้องการพื้นที่อาคาร (ถ้ามี)</p>
                                        <BuildingMetricControl title="จำนวนอาคาร" field="buildingCount" min={0} max={50} presets={PRESET_BUILDING_COUNT} presetSuffix="buildings" buildingProfile={buildingProfile} setBuildingProfile={setBuildingProfile} />
                                        <BuildingMetricControl title="จำนวนชั้น" field="floorCount" min={0} max={80} presets={PRESET_BUILDING_COUNT} presetSuffix="floors" buildingProfile={buildingProfile} setBuildingProfile={setBuildingProfile} />
                                        <BuildingMetricControl title="ความกว้างอาคาร (ม.)" field="widthM" min={0} max={200} presets={PRESET_BUILDING_DIM_M} presetSuffix="m" buildingProfile={buildingProfile} setBuildingProfile={setBuildingProfile} />
                                        <BuildingMetricControl title="ความยาวอาคาร (ม.)" field="lengthM" min={0} max={200} presets={PRESET_BUILDING_DIM_M} presetSuffix="m" buildingProfile={buildingProfile} setBuildingProfile={setBuildingProfile} />
                                        <BuildingMetricControl title="ความสูงอาคาร (ม.)" field="heightM" min={0} max={120} presets={PRESET_BUILDING_DIM_M} presetSuffix="m" buildingProfile={buildingProfile} setBuildingProfile={setBuildingProfile} />
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
                            className={`flex-1 relative overflow-hidden bg-white select-none z-0 ${isSelectingArea ? 'cursor-crosshair' :
                                    activeMode === 'pen' ? 'cursor-[url(https://img.icons8.com/material-rounded/24/000000/pen-range.png)_0_24,_auto]' :
                                        activeMode === 'highlighter' ? 'cursor-[url(https://img.icons8.com/material-rounded/24/000000/highlighter.png)_0_24,_auto]' :
                                            dragContext ? 'cursor-grabbing' : 'cursor-grab'
                                }`}
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
                            {/* CSS for Print Optimization */}
                            <style>{`
                                @media print {
                                    @page { size: landscape; margin: 0; }
                                    .no-print, aside, header, footer, .no-pan { display: none !important; }
                                    main { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; height: 100% !important; background: white !important; overflow: visible !important; }
                                    .freeform-dot-grid { display: none !important; }
                                    .drawing-canvas { opacity: 1 !important; z-index: 20 !important; }
                                }
                            `}</style>

                            {/* Drawing Overlay - captures pointer events for pen/highlighter */}
                            <div
                                ref={drawingOverlayRef}
                                className="absolute inset-0 z-[25] no-print"
                                style={{
                                    pointerEvents: (activeMode === 'pen' || activeMode === 'highlighter') ? 'auto' : 'none',
                                    cursor: 'crosshair',
                                    touchAction: 'none'
                                }}
                            />

                            <div className="absolute inset-0 freeform-dot-grid pointer-events-none" style={{ backgroundSize: `${20 * zoom}px ${20 * zoom}px`, backgroundPosition: `${pan.x}px ${pan.y}px`, opacity: Math.min(0.35, 0.15 + zoom * 0.15) }} />

                            {/* --- แผ่นกระดาษ (Physical Paper Sheet) --- */}
                            {paperConfig.type !== 'infinite' && (() => {
                                const scaleFactor = paperConfig.unit === 'mm' ? (UNIT_SCALE / 10) : 1;
                                const pWidth = paperConfig.width * scaleFactor;
                                const pHeight = paperConfig.height * scaleFactor;

                                return (
                                    <div
                                        className="absolute bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] pointer-events-none z-0 transition-all duration-300"
                                        style={{
                                            left: 0,
                                            top: 0,
                                            width: pWidth,
                                            height: pHeight,
                                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                                            transformOrigin: '0 0'
                                        }}
                                    >
                                        {/* ขอบกระดาษและเงาซ้อนเพื่อให้ดูเป็นแผ่น */}
                                        <div className="absolute inset-0 border border-slate-200" />

                                        {/* Watermark หรือ Label บอกขนาดกระดาษ */}
                                        <div className="absolute -top-6 left-0 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <i className="fa-solid fa-file-lines"></i>
                                            {PAPER_SIZES[paperConfig.type]?.name || 'Custom'} ({paperConfig.width}x{paperConfig.height} {paperConfig.unit})
                                        </div>
                                    </div>
                                );
                            })()}

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

                            <div className="no-pan fixed bottom-6 right-6 flex items-center bg-white/95 backdrop-blur-2xl rounded-2xl shadow-lg shadow-black/5 border border-slate-200/50 p-1.5 gap-0.5 z-50 no-print">
                                <button onClick={() => { targetZoomRef.current = Math.max(zoom - 0.1, 0.15); smoothZoomTo(targetZoomRef.current, window.innerWidth / 2, window.innerHeight / 2); }} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-all text-slate-500 hover:text-slate-700 active:scale-90 text-xs"><i className="fa-solid fa-minus"></i></button>
                                <button onClick={zoomReset} className="w-14 text-center text-[11px] font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-lg py-1 transition-all cursor-pointer">{Math.round(zoom * 100)}%</button>
                                <button onClick={() => { targetZoomRef.current = Math.min(zoom + 0.1, 3); smoothZoomTo(targetZoomRef.current, window.innerWidth / 2, window.innerHeight / 2); }} className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-all text-slate-500 hover:text-slate-700 active:scale-90 text-xs"><i className="fa-solid fa-plus"></i></button>
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
                                {/* เส้นขอบเขตอาคาร (Building Outline) */}
                                {buildingProfile.widthM > 0 && buildingProfile.lengthM > 0 && (() => {
                                    const bWidthPx = buildingProfile.widthM * 100 * (UNIT_SCALE / 2);
                                    const bLengthPx = buildingProfile.lengthM * 100 * (UNIT_SCALE / 2);
                                    const buildingGap = 60; // px gap between buildings
                                    const buildings = [];
                                    for (let bi = 0; bi < (buildingProfile.buildingCount || 1); bi++) {
                                        const offsetX = bi * (bWidthPx + buildingGap);
                                        buildings.push(
                                            <div key={`bldg-${bi}`} className="absolute pointer-events-none z-[1]" style={{ left: offsetX, top: 0, width: bWidthPx, height: bLengthPx }}>
                                                {/* กรอบอาคาร */}
                                                <div className="absolute inset-0 border-2 border-dashed border-amber-400/60 rounded-md" />
                                                {/* พื้นหลังอ่อนๆ */}
                                                <div className="absolute inset-0 bg-amber-50/15 rounded-md" />

                                                {/* ป้ายชื่ออาคาร */}
                                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-amber-100/90 backdrop-blur-sm border border-amber-300/80 rounded-full px-3 py-0.5 shadow-sm whitespace-nowrap">
                                                    <i className="fa-solid fa-building text-amber-600 text-[8px]" />
                                                    <span className="text-[9px] font-bold text-amber-700">
                                                        {buildingProfile.buildingCount > 1 ? `อาคาร ${bi + 1}` : 'อาคาร'}
                                                    </span>
                                                    {buildingProfile.floorCount > 1 && (
                                                        <span className="text-[8px] font-semibold text-amber-500">({buildingProfile.floorCount} ชั้น)</span>
                                                    )}
                                                </div>

                                                {/* เส้นวัดด้านบน — ความกว้าง */}
                                                <div className="absolute -top-3 left-0 right-0 flex items-center justify-center">
                                                    <div className="absolute left-0 right-0 top-1/2 h-px bg-amber-400/70" />
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-amber-500 rounded-full" />
                                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-amber-500 rounded-full" />
                                                    <span className="relative bg-[#f2f2f7] px-1.5 text-[8px] font-bold text-amber-600 whitespace-nowrap z-[1]">
                                                        {buildingProfile.widthM} ม.
                                                    </span>
                                                </div>

                                                {/* เส้นวัดด้านซ้าย — ความยาว */}
                                                <div className="absolute -left-3 top-0 bottom-0 flex flex-col items-center justify-center">
                                                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-amber-400/70" />
                                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-500 rounded-full" />
                                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-500 rounded-full" />
                                                    <span className="relative bg-[#f2f2f7] px-1 py-0.5 text-[8px] font-bold text-amber-600 -rotate-90 whitespace-nowrap z-[1]">
                                                        {buildingProfile.lengthM} ม.
                                                    </span>
                                                </div>

                                                {/* มุมทั้ง 4 */}
                                                <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-400 rounded-tl-sm" />
                                                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-400 rounded-tr-sm" />
                                                <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-400 rounded-bl-sm" />
                                                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-400 rounded-br-sm" />

                                                {/* ป้ายพื้นที่ตรงกลาง */}
                                                <div className="absolute inset-0 flex items-end justify-end p-2 pointer-events-none">
                                                    <div className="bg-white/80 backdrop-blur-sm border border-amber-200/80 rounded-lg px-2 py-1 shadow-sm">
                                                        <p className="text-[7px] font-bold text-amber-500 uppercase tracking-wider leading-none">พื้นที่</p>
                                                        <p className="text-[10px] font-black text-amber-700 leading-tight">{(buildingProfile.widthM * buildingProfile.lengthM).toLocaleString()} ม²</p>
                                                        {buildingProfile.heightM > 0 && (
                                                            <p className="text-[7px] font-semibold text-amber-400 leading-tight">สูง {buildingProfile.heightM} ม.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return buildings;
                                })()}

                                {/* เส้นขอบเขตรวม */}
                                {stats.globalWidth > 0 && stats.globalHeight > 0 && (
                                    <div className="absolute pointer-events-none opacity-40 z-0" style={{ left: stats.globalMinX * (UNIT_SCALE / 2), top: stats.globalMinY * (UNIT_SCALE / 2), width: stats.globalWidth * (UNIT_SCALE / 2), height: stats.globalHeight * (UNIT_SCALE / 2) }}>
                                        <div className="absolute -top-10 left-0 right-0 h-px bg-slate-500 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-slate-500 rounded-full absolute left-0" /><div className="w-1.5 h-1.5 bg-slate-500 rounded-full absolute right-0" /><span className="bg-[#f2f2f7] px-2 text-[10px] font-bold text-slate-600">กว้าง {stats.totalWidthM} ม.</span></div>
                                        <div className="absolute -left-10 top-0 bottom-0 w-px bg-slate-500 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-slate-500 rounded-full absolute top-0" /><div className="w-1.5 h-1.5 bg-slate-500 rounded-full absolute bottom-0" /><span className="bg-[#f2f2f7] px-2 py-0.5 text-[10px] font-bold text-slate-600 origin-center -rotate-90 whitespace-nowrap">ยาว {stats.totalHeightM} ม.</span></div>
                                    </div>
                                )}

                                {renderSmartGuides()}

                                {/* --- Drawing Layer (Pen & Highlighter) --- */}
                                <canvas
                                    ref={canvasRef}
                                    className="absolute pointer-events-none z-[15]"
                                    style={{
                                        left: 0,
                                        top: 0,
                                        width: '10000px',
                                        height: '10000px',
                                        imageRendering: 'pixelated'
                                    }}
                                />

                                {zones.map(zone => {
                                    if (!zone) return null;
                                    const b = getBounds(zone);
                                    const isZoneActive = activeZoneId === zone.id;

                                    // Safety check for zone bounds to avoid zero-size rendering issues
                                    if (b.width <= 0 && b.height <= 0 && !isZoneActive) return null;

                                    const isDraggingThis = dragContext?.zoneId === zone.id;

                                    // Safety fallback for colors
                                    const cInfo = (ZONE_COLORS && zone.color && ZONE_COLORS[zone.color])
                                        ? ZONE_COLORS[zone.color]
                                        : (ZONE_COLORS?.blue || { bg: 'bg-blue-500', border: 'border-blue-500', ring: 'ring-blue-500', text: 'text-blue-500' });

                                    const zoneRotation = zone.rotation || 0;

                                    const visualWidth = Math.max(10, b.width) * (UNIT_SCALE / 2);
                                    const visualHeight = Math.max(10, b.height) * (UNIT_SCALE / 2);

                                    // Custom color or gradient support
                                    const customBackground = zone.gradient || zone.customColor || null;

                                    return (
                                        <div key={zone.id} className={`absolute transition-all ${isDraggingThis ? 'duration-0 z-10' : 'duration-200 z-10'} ${isZoneActive ? `ring-4 ring-offset-8 ${cInfo?.ring || 'ring-blue-500'}/20 rounded` : ''}`} style={{ left: (zone.x || 0) * (UNIT_SCALE / 2), top: (zone.y || 0) * (UNIT_SCALE / 2), width: visualWidth, height: visualHeight, transform: `rotate(${zoneRotation}deg)`, transformOrigin: 'center center' }}>
                                            <div data-zone-id={zone.id} className={`zone-draggable absolute -top-8 left-0 px-3 py-1 rounded shadow-sm text-[9px] font-bold whitespace-nowrap cursor-grab active:cursor-grabbing flex items-center gap-1 ${isZoneActive ? (customBackground ? 'bg-slate-800 text-white' : `${cInfo?.bg || 'bg-blue-500'} text-white`) : 'bg-white/90 text-slate-600 border border-slate-200 hover:border-slate-400'}`} style={{ transform: `rotate(${-zoneRotation}deg)`, transformOrigin: 'left center' }}>
                                                <i className="fa-solid fa-arrows-up-down-left-right opacity-70 pointer-events-none"></i> <span className="pointer-events-none">{zone.name || 'โซนไม่มีชื่อ'}</span>
                                                {zoneRotation !== 0 && <span className="pointer-events-none opacity-60 text-[7px]"> {zoneRotation}°</span>}
                                            </div>

                                            {zone.type === 'stage' || zone.type === 'booth' ? (
                                                <div className={`w-full h-full relative border-4 border-black/20 shadow-inner flex flex-col items-center justify-center overflow-hidden ${zone.type === 'stage' ? 'rounded-md' : 'rounded-sm'} ${!customBackground ? (cInfo?.bg || 'bg-blue-500') : ''}`}
                                                    style={{ background: customBackground, backgroundImage: zone.image ? `url(${zone.image})` : (customBackground || undefined), backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                                    {!zone.image && (
                                                        <>
                                                            <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMSIvPjxwYXRoIGQ9Ik0wIDRMMCAwTDEgME0wIDRaIiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAuMiIvPjwvc3ZnPg==')]"></div>
                                                            <i className={`fa-solid ${zone.type === 'stage' ? 'fa-layer-group' : 'fa-store'} text-white/30 text-4xl mb-2 pointer-events-none drop-shadow-md`}></i>
                                                            <span className="text-white/60 font-black text-sm tracking-widest uppercase pointer-events-none drop-shadow-md mix-blend-overlay">{zone.name || (zone.type === 'stage' ? 'STAGE' : 'BOOTH')}</span>
                                                        </>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="relative w-full h-full">
                                                    {Array.from({ length: zone.rows || 0 }).map((_, ri) => (
                                                        <div key={ri} className="flex pointer-events-none" style={{ marginBottom: ri === (zone.rows - 1) ? 0 : (zone.spacingY || 0) * (UNIT_SCALE / 2) }}>
                                                            {Array.from({ length: zone.columns || 0 }).map((_, ci) => {
                                                                const chairKey = `${ri}-${ci}`;
                                                                const isH = zone.hiddenChairs?.includes(chairKey);
                                                                const guestName = guestNames?.[zone.id]?.[chairKey] || '';
                                                                const chairImg = chairImages?.[zone.id]?.[chairKey];
                                                                return (
                                                                    <div
                                                                        key={ci}
                                                                        onClick={(e) => { e.stopPropagation(); setActiveZoneId(zone.id); handleChairClick(zone.id, ri, ci); }}
                                                                        className={`chair-element relative flex-shrink-0 border-2 rounded-[6px] transition-all pointer-events-auto ${activeMode === 'edit_chair' ? 'cursor-grab active:cursor-grabbing' : ''} ${isH ? 'opacity-10 bg-transparent border-dashed border-slate-300' : `bg-white shadow-sm ${isZoneActive ? (cInfo?.border || 'border-blue-500') : 'border-slate-300'} hover:border-slate-800`}`}
                                                                        style={{ width: (zone.chairWidth || 0) * (UNIT_SCALE / 2), height: (zone.chairHeight || 0) * (UNIT_SCALE / 2), marginRight: ci === (zone.columns - 1) ? 0 : (zone.spacingX || 0) * (UNIT_SCALE / 2) }}>
                                                                        {!isH && (
                                                                            <div className="relative flex flex-col items-center justify-center h-full w-full text-center px-0.5 overflow-hidden rounded-[4px]">
                                                                                {chairImg && <img src={chairImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" />}
                                                                                <div className="relative z-[1] flex flex-col items-center justify-center w-full h-full">
                                                                                    {guestName ? (
                                                                                        <span className="text-[4px] font-bold text-slate-800 leading-tight truncate">{guestName}</span>
                                                                                    ) : (
                                                                                        <span className="text-[5px] font-medium text-slate-600">{String.fromCharCode(65 + ri)}{ci + 1}</span>
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
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </main>

                        {/* Project Info Note Pin (Moveable & Collapsible) */}
                        <div
                            className={`fixed z-[40] pointer-events-none select-none transition-all duration-500 ease-in-out ${isNotePinDocked ? 'opacity-0 translate-x-20 pointer-events-none scale-0' : 'opacity-100 translate-x-0'}`}
                            style={{
                                left: (notePinPos.x !== null && notePinPos.x !== undefined) ? notePinPos.x : 'auto',
                                right: (notePinPos.x !== null && notePinPos.x !== undefined) ? 'auto' : '2rem',
                                top: (notePinPos.y !== null && notePinPos.y !== undefined) ? notePinPos.y : '6rem',
                                width: isNotePinCollapsed ? '180px' : '288px'
                            }}
                        >
                            <div className={`bg-white/95 backdrop-blur-2xl border-2 border-slate-200/80 rounded-[2rem] shadow-2xl pointer-events-auto shadow-slate-200/50 flex flex-col overflow-hidden transition-all duration-300 ${isNotePinDragging ? 'scale-[1.02] shadow-indigo-200/50 opacity-90 cursor-grabbing' : 'animate-[cardFadeIn_0.4s_ease-out]'}`}>
                                <div className="note-pin-header flex items-center justify-between border-b border-slate-100/50 p-4 pb-3 cursor-grab active:cursor-grabbing bg-slate-50/30">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200/80">
                                            <i className="fa-solid fa-thumbtack text-white text-[10px]" />
                                        </div>
                                        <div className={isNotePinCollapsed ? 'hidden sm:block' : ''}>
                                            <h3 className="text-xs font-black text-slate-800 leading-tight truncate w-32">{layoutName}</h3>
                                            <p className="text-[9px] font-bold text-slate-400 opacity-60 uppercase tracking-widest mt-0.5">Project Note</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setIsNotePinDocked(true)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-200/50 text-slate-400 hover:text-slate-600 transition" title="ย้ายไปแถบเครื่องมือ">
                                            <i className="fa-solid fa-right-from-bracket text-[10px]" />
                                        </button>
                                        <button onClick={() => setIsNotePinCollapsed(!isNotePinCollapsed)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-200/50 text-slate-400 transition">
                                            <i className={`fa-solid ${isNotePinCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'} text-[9px]`} />
                                        </button>
                                    </div>
                                </div>

                                <div className={`p-5 pt-4 space-y-4 transition-all duration-300 ${isNotePinCollapsed ? 'h-0 opacity-0 overflow-hidden p-0' : 'h-auto opacity-100'}`}>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-slate-200/50 shadow-sm group hover:bg-white transition-colors">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                <i className="fa-solid fa-chart-pie text-blue-500" /> วัตถุ (S/St/B)
                                            </p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-lg font-black text-blue-600" title="ที่นั่ง">{stats.zoneBreakdown.seating}</span>
                                                <span className="text-[10px] text-slate-300">/</span>
                                                <span className="text-lg font-black text-indigo-600" title="เวที">{stats.zoneBreakdown.stage}</span>
                                                <span className="text-[10px] text-slate-300">/</span>
                                                <span className="text-lg font-black text-emerald-600" title="บูธ">{stats.zoneBreakdown.booth}</span>
                                            </div>
                                        </div>
                                        <div className="bg-indigo-50/50 backdrop-blur-md rounded-2xl p-4 border border-indigo-100/50 shadow-sm group hover:bg-indigo-50 transition-colors">
                                            <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5 font-mono flex items-center gap-1.5">
                                                <i className="fa-solid fa-cubes text-indigo-500" /> รวมทั้งสิ้น
                                            </p>
                                            <p className="text-2xl font-black text-indigo-600 tracking-tighter leading-none">{stats.actualChairs}</p>
                                        </div>
                                    </div>


                                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-white shadow-xl shadow-slate-200 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10" />
                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 border-l-2 border-indigo-500">ข้อมูลพื้นที่รวม</p>
                                                <i className="fa-solid fa-expand text-slate-500 text-[10px]" />
                                            </div>
                                            <div className="space-y-1.5 pl-1">
                                                <p className="text-2xl font-black tracking-tight">{stats.areaSqM.toLocaleString()} <span className="text-xs font-medium text-slate-400">ม²</span></p>
                                                <p className="text-[10px] font-medium text-slate-400 leading-snug">
                                                    กว้าง {stats.totalWidthM} ม. × ยาว {stats.totalHeightM} ม.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {buildingProfile.buildingCount > 0 && (
                                        <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-3 flex items-center gap-3">
                                            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                                                <i className="fa-solid fa-building text-amber-600 text-xs" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-amber-700 leading-tight">สเปกอาคารหลัก</p>
                                                <p className="text-[9px] font-medium text-amber-600 mt-0.5">{buildingProfile.buildingCount} อาคาร · {buildingProfile.floorCount} ชั้น · สูง {buildingProfile.heightM} ม.</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-2">
                                        <button onClick={() => window.print()} className="w-full py-3 bg-white border-2 border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition flex items-center justify-center gap-2 shadow-sm">
                                            <i className="fa-solid fa-print opacity-60" /> พิมพ์ผังงานโครงการ
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </React.Fragment>
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
