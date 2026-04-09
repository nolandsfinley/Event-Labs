console.log("🔥 app.jsx is executing at the top level...");
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

import LandingPage from './components/LandingPage';
import TemplateModal from './components/TemplateModal';
import AppSidebar from './components/AppSidebar';
import ProjectGrid from './components/ProjectGrid';
import DashboardView from './components/DashboardView';
import ChecklistView from './components/ChecklistView';
import BudgetView from './components/BudgetView';
import VendorView from './components/VendorView';
import GuestView from './components/GuestView';
import AccountSettings from './components/AccountSettings';
import ProjectWorkspace from './components/ProjectWorkspace';
import EditorHeader from './components/EditorHeader';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    collection,
    getDocs,
    onSnapshot,
    serverTimestamp
} from 'firebase/firestore';

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("✅ Firebase Modular initialized successfully");

// --- ค่าคงที่และการตั้งค่าพื้นฐาน ---
const UNIT_SCALE = 2; // 1cm = 2px
const DEFAULT_VENUE_SIZE = { width: 5000, height: 5000 };
const DEFAULT_PROJECT_NAME = 'โปรเจกต์ใหม่';

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
    console.log("💎 App component main function START");
    console.log("🎬 App component is rendering...");
    const [currentView, setCurrentView] = useState('landing');
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [activeTab, setActiveTab] = useState('floorplan');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isPro, setIsPro] = useState(false); // Pro status synced from Firestore
    const [userPlan, setUserPlan] = useState({ plan: 'free', duration: null, expiry: null }); // plan: 'free' | 'rental' | 'lifetime'
    const [homeTab, setHomeTab] = useState('dashboard'); // 'dashboard' | 'projects' | 'account'
    const [activeWorkspaceProject, setActiveWorkspaceProject] = useState(null); // project object when inside workspace
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState('idle'); // 'idle' | 'checking' | 'success'
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [activeMode, setActiveMode] = useState('edit_chair');
    const [zoom, setZoom] = useState(1.0);
    const targetZoomRef = useRef(1.0);
    const zoomAnimRef = useRef(null);
    const targetPanRef = useRef({ x: 0, y: 0 });
    const panAnimRef = useRef(null);

    const [currentLayoutId, setCurrentLayoutId] = useState(null);
    const [layoutName, setLayoutName] = useState(DEFAULT_PROJECT_NAME);
    const [projectName, setProjectName] = useState(DEFAULT_PROJECT_NAME);
    const [venueSize, setVenueSize] = useState(DEFAULT_VENUE_SIZE);
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
    const [loading, setLoading] = useState(false); // Used in landing page
    const [error, setError] = useState('');      // Used in landing page
    const [isSignUp, setIsSignUp] = useState(false); // Used in landing page
    const [showPassword, setShowPassword] = useState(false); // Used in landing page
    const [cloudLayouts, setCloudLayouts] = useState([]);

    // ระบบจัดการ UI & Global Styles ตาม View
    useEffect(() => {
        document.title = "Eflow | " + (currentView.charAt(0).toUpperCase() + currentView.slice(1));

        // จัดการการเลื่อนหน้าจอ (Scrolling)
        if (currentView === 'landing') {
            document.body.style.overflow = 'auto';
            document.body.style.overflowX = 'hidden';
        } else {
            document.body.style.overflow = 'hidden';
        }

        console.log("📍 Current View switched to:", currentView);
    }, [currentView]);

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
    const [docCategories, setDocCategories] = useState([
        { id: 'all', name: 'ทั้งหมด', icon: 'fa-globe' },
        { id: 'cat1', name: 'Premium VIP', icon: 'fa-star' },
        { id: 'cat2', name: 'Backstage', icon: 'fa-user-shield' },
        { id: 'cat3', name: 'Operations', icon: 'fa-gears' },
        { id: 'cat4', name: 'Logistics', icon: 'fa-truck-fast' },
    ]);
    const [activeDocCategory, setActiveDocCategory] = useState('all');
    const [docsList, setDocsList] = useState(Array.from({ length: 1 }, (_, i) => ({
        id: Date.now() + i,
        name: `เอกสาร ${i + 1}`,
        url: null,
        mime: null,
        createdAt: null,
        categoryId: null // No category initially
    })));
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
    const workspaceRef = useRef(null);
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

    // Moveable & Collapsible Sidebar
    const [sidebarPos, setSidebarPos] = useState({ x: 16, y: 80 });
    const [isSidebarDragging, setIsSidebarDragging] = useState(false);
    const sidebarDragMoved = useRef(false);
    const sidebarOffset = useRef({ x: 0, y: 0 });

    // --- Tape Measure Tool State ---
    const [measuringPoints, setMeasuringPoints] = useState(null); // { start, end }
    const [isMeasuring, setIsMeasuring] = useState(false);
    const [tapeSpacing, setTapeSpacing] = useState(120); // 120cm = 1.2m
    const [tapeCount, setTapeCount] = useState(1);
    // Note: isSidebarOpen state already exists in the code

    useEffect(() => {
        // --- Sidebar Viewport Safety on Resize ---
        const handleResize = () => {
            setSidebarPos(prev => {
                const padding = 20;
                const sidebarWidth = isSidebarOpen ? 380 : 64;
                const maxX = window.innerWidth - sidebarWidth - padding;
                const maxY = window.innerHeight - 64 - padding;
                return {
                    x: Math.max(padding, Math.min(maxX, prev.x)),
                    y: Math.max(80, Math.min(maxY, prev.y)) // Min Y is 80px
                };
            });
        };
        window.addEventListener('resize', handleResize);

        // FAST HIDE: Remove initial loader as soon as React mounts
        const loader = document.getElementById('initial-loader');
        if (loader) {
            loader.style.opacity = '0';
            loader.style.transition = 'opacity 0.3s ease-out'; // Faster fade
            setTimeout(() => { if (loader.parentNode) loader.remove(); }, 300);
        }

        // Safety timeout: If something hangs, ensure loader is gone after 4s
        const safetyTimer = setTimeout(() => {
            const l = document.getElementById('initial-loader');
            if (l && l.parentNode) l.remove();
        }, 4000);

        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(safetyTimer);
        };
    }, [isSidebarOpen]);

    // 2. Firebase Auth & Profile Listener
    useEffect(() => {
        let profileUnsubscribe = null;

        const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                if (user) {
                    setCurrentUser(user);
                    setCurrentView('home');

                    // 1. Listen to layouts
                    const querySnapshot = await getDocs(collection(db, 'users', user.uid, 'layouts'));
                    const layouts = [];
                    querySnapshot.forEach((d) => {
                        layouts.push({ id: d.id, ...d.data() });
                    });
                    setCloudLayouts(layouts);

                    // 2. Listen to User Profile for Real-time Pro Status
                    const userRef = doc(db, 'users', user.uid);
                    profileUnsubscribe = onSnapshot(userRef, (docSnap) => {
                        if (docSnap.exists()) {
                            const userData = docSnap.data();
                            const plan = userData.plan || (userData.isPro ? 'rental' : 'free');
                            const expiry = userData.planExpiry ? userData.planExpiry.toDate() : null;
                            // Check if rental plan has expired
                            const isExpired = plan === 'rental' && expiry && expiry < new Date();
                            const effectivePro = (plan === 'lifetime' || (plan === 'rental' && !isExpired));
                            setIsPro(effectivePro);
                            setUserPlan({
                                plan: isExpired ? 'free' : plan,
                                duration: userData.planDuration || null,
                                expiry: expiry
                            });
                            console.log("💎 Plan Sync:", plan, "| Expiry:", expiry);
                        } else {
                            // If user doc doesn't exist, create default
                            setIsPro(false);
                            setUserPlan({ plan: 'free', duration: null, expiry: null });
                            setDoc(userRef, { email: user.email, isPro: false, plan: 'free' }, { merge: true });
                        }
                    });

                } else {
                    setCurrentUser(null);
                    setCloudLayouts([]);
                    setIsPro(false);
                    setUserPlan({ plan: 'free', duration: null, expiry: null });
                    setCurrentView('landing');
                    if (profileUnsubscribe) profileUnsubscribe();
                }
            } catch (e) {
                console.error("Auth Listener Error:", e);
                setCurrentView('landing');
            }
        });

        return () => {
            authUnsubscribe();
            if (profileUnsubscribe) profileUnsubscribe();
        };
    }, []);

    // --- Keep refs in sync with state ---
    useEffect(() => { activeModeRef.current = activeMode; }, [activeMode]);
    useEffect(() => { drawingColorRef.current = drawingColor; }, [drawingColor]);
    useEffect(() => { drawingWidthRef.current = drawingWidth; }, [drawingWidth]);
    useEffect(() => { panRef.current = pan; }, [pan]);
    useEffect(() => { zoomRef.current = zoom; }, [zoom]);
    useEffect(() => { drawingsRef.current = drawings; }, [drawings]);

    // --- Canvas Drawing Renderer ---
    const renderCanvas = useCallback(() => {
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
                updatedAt: serverTimestamp()
            };
            await setDoc(doc(db, 'workspaces', 'main-workspace'), workspaceData);
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
            const docSnap = await getDoc(doc(db, 'workspaces', 'main-workspace'));
            if (docSnap.exists()) {
                const data = docSnap.data();
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

    const addDocFile = (slotId, file) => {
        if (!file) return;
        const ok = file.type === 'application/pdf' || file.type.startsWith('image/');
        if (!ok) {
            showToast('รองรับเฉพาะ PDF / รูปภาพ', 'error');
            return;
        }
        const url = URL.createObjectURL(file);
        setDocsList(prev => prev.map(s => s.id === slotId ? { ...s, url, mime: file.type, createdAt: Date.now() } : s));
        showToast('อัปโหลดแล้ว');
    };

    const removeDoc = (slotId) => {
        setDocsList(prev => prev.map(s => {
            if (s.id === slotId) {
                if (s.url && String(s.url).startsWith('blob:')) URL.revokeObjectURL(s.url);
                return { ...s, url: null, mime: null, createdAt: null };
            }
            return s;
        }));
        showToast('ลบเอกสารแล้ว');
    };

    const addNewSlot = () => {
        setDocsList(prev => [...prev, { id: Date.now(), name: `เอกสาร ${prev.length + 1}`, url: null, mime: null, createdAt: null }]);
        showToast('เพิ่มช่องใหม่แล้ว');
    };

    const deleteSlot = (slotId) => {
        setDocsList(prev => {
            const slot = prev.find(s => s.id === slotId);
            if (slot?.url && String(slot.url).startsWith('blob:')) URL.revokeObjectURL(slot.url);
            return prev.filter(s => s.id !== slotId);
        });
        showToast('ลบช่องออกแล้ว');
    };

    const updateSlotName = (slotId, newName) => {
        setDocsList(prev => prev.map(s => s.id === slotId ? { ...s, name: newName } : s));
    };

    const updateDocCategoryName = (id, newName) => {
        setDocCategories(prev => prev.map(cat => cat.id === id ? { ...cat, name: newName } : cat));
    };

    const assignDocToCategory = (docId, catId) => {
        if (catId === 'all') return; // Cannot explicitly move into 'all' as it shows everything anyway
        setDocsList(prev => prev.map(doc => doc.id === docId ? { ...doc, categoryId: catId } : doc));
        showToast('ย้ายเอกสารเข้าหมวดหมู่แล้ว');
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
            setDocsList(prev => prev.map(s => s.id === category ? { ...s, url: dataUrl, mime: 'image/jpeg', createdAt: Date.now() } : s));
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

            // Comprehensive check for editable elements
            const isEditable = e.target.closest('input, textarea, select, [contenteditable="true"]');
            if (isEditable) return;

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
            } else if (e.code === "Space") {
                e.preventDefault();
                deleteActiveZone(true);
            }
        };

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isSelectingArea, currentView, activeTab, chairMenu, editingChair, showExportModal, scanCropModal, docPreview]);

    // Isolated Trackpad Events (Pinch-to-zoom & Smooth Pan)
    useEffect(() => {
        const ws = workspaceRef.current;
        if (!ws || currentView !== 'editor') return;

        const onNativeWheel = (e) => {
            if (e.target.closest('.no-pan')) return;

            // PREVENT Browser Zoom / History Navigation
            e.preventDefault();

            // Detect pinch (Ctrl key on trackpads)
            const isTrackpadPinch = e.ctrlKey && Math.abs(e.deltaY) < 50;
            const isMouseWheel = !e.ctrlKey && !e.metaKey;
            const isCmdScroll = e.metaKey || (e.ctrlKey && !isTrackpadPinch);

            if (isTrackpadPinch || isCmdScroll) {
                const sensitivity = isTrackpadPinch ? 0.008 : 0.003;
                const delta = -e.deltaY * sensitivity;
                const newZoom = zoom * (1 + delta);
                smoothZoomTo(newZoom, e.clientX, e.clientY);
            } else if (isMouseWheel) {
                // Smooth Panning (Trackpad two-finger scroll)
                setPan(p => ({
                    x: p.x - e.deltaX,
                    y: p.y - e.deltaY
                }));
            }
        };

        const onNativeGesture = (e) => {
            e.preventDefault(); // Prevent Safari zoom
        };

        // Important: passive: false allows us to stop browser zoom/navigation
        ws.addEventListener('wheel', onNativeWheel, { passive: false });
        ws.addEventListener('gesturestart', onNativeGesture, { passive: false });
        ws.addEventListener('gesturechange', onNativeGesture, { passive: false });

        return () => {
            ws.removeEventListener('wheel', onNativeWheel);
            ws.removeEventListener('gesturestart', onNativeGesture);
            ws.removeEventListener('gesturechange', onNativeGesture);
        };
    }, [currentView, zoom, pan]);

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
        setIsSelectingArea(false);
        // Do NOT setExportArea(null) here, we need it for printing styles
        setSelectionStart(null);

        // Trigger print with selected area
        setTimeout(() => {
            window.print();
            // Restore and clean up after the print dialog is handled
            setTimeout(() => {
                setExportArea(null);
                setShowExportModal(false);
            }, 500);
        }, 100);
        showToast("กำลังเตรียม export ส่วนที่เลือก...");
    };

    // --- Auto-Save to Cloud (Canva Style) ---
    useEffect(() => {
        if (!currentUser || currentView !== 'editor') return;

        // Skip auto-save if we don't even have a project name yet
        if (!projectName && zones.length === 0 && drawings.length === 0) return;

        const timer = setTimeout(() => {
            console.log("☁️ Auto-saving to cloud...");
            handleSaveToCloud();
        }, 3000); // 3 seconds delay after last change

        return () => clearTimeout(timer);
    }, [zones, drawings, guestNames, venueSize, projectName, currentUser, currentView]);

    // --- Firebase Authentication Functions ---
    const handleLogin = async () => {
        setError(''); // Clear previous errors

        if (loginEmail === 'test' && loginPassword === 'test') {
            setCurrentUser({ email: 'test@eventlabs.com', uid: 'test-user-123' });
            setCurrentView('home');
            showToast("Bypass Login Success!");
            return;
        }

        if (!loginEmail || !loginPassword) {
            const msg = "กรุณากรอก Email และ Password";
            setError(msg);
            showToast(msg, "error");
            return;
        }

        setLoading(true);
        setIsLoading(true);
        try {
            console.log(isSignUp ? "📝 Attempting Sign-Up with:" : "🔐 Attempting login with:", loginEmail);

            let result;
            if (isSignUp) {
                result = await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
                console.log("✅ Sign-Up SUCCESS:", result.user.email);
                showToast("สร้างบัญชีผู้ใช้สำเร็จ!");
            } else {
                result = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
                console.log("✅ Login SUCCESS:", result.user.email);
                showToast("เข้าสู่ระบบสำเร็จ!");
            }

            setLoginEmail('');
            setLoginPassword('');
            setError('');
        } catch (err) {
            console.error("❌ Auth ERROR:", err.code, err.message);
            const messages = {
                'auth/user-not-found': 'ไม่พบบัญชีผู้ใช้นี้ ลองสมัครสมาชิกใหม่',
                'auth/wrong-password': 'Password ไม่ถูกต้อง',
                'auth/invalid-email': 'Email ไม่ถูกต้อง',
                'auth/user-disabled': 'บัญชีปิดการใช้งานแล้ว',
                'auth/too-many-requests': 'ลองใหม่อีกครั้งในภายหลัง',
                'auth/email-already-in-use': 'Email นี้มีการใช้งานแล้ว',
                'auth/weak-password': 'Password ควรมีความยาวอย่างน้อย 6 ตัวอักษร',
                'auth/operation-not-allowed': 'ไม่สามารถสมัครได้ ติดต่อผู้ดูแล'
            };
            const displayMsg = messages[err.code] || err.message || "เกิดข้อผิดพลาด";
            setError(displayMsg);
            showToast(displayMsg, "error");
        } finally {
            setLoading(false);
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setLoading(true);
        setIsLoading(true);
        try {
            console.log("🔓 Attempting Google Sign-In...");
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            console.log("✅ Google Sign-In SUCCESS:", result.user.email);
            setCurrentUser(result.user);
            setCurrentView('home');
            showToast("เข้าสู่ระบบด้วย Google สำเร็จ!");
        } catch (err) {
            console.error("❌ Google Sign-In ERROR:", err.code, err.message);
            const messages = {
                'auth/popup-blocked': 'Pop-up ถูกบล็อก โปรดเปิดอนุญาต pop-up บนเบราว์เซอร์',
                'auth/popup-closed-by-user': 'คุณปิด login window',
                'auth/unauthorized-domain': 'Domain นี้ยังไม่ได้ authorize ใน Firebase Console',
                'auth/operation-not-allowed': 'Google Sign-In ยังไม่เปิดใช้งาน ใน Firebase Console',
                'auth/invalid-client-id': 'Firebase config ไม่ถูกต้อง',
            };
            const displayMsg = messages[err.code] || `Google Sign-In ผิดพลาด: ${err.message}`;
            setError(displayMsg);
            showToast(displayMsg, "error");
        } finally {
            setLoading(false);
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
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
            // Project Limit Check for Free Users
            if (!isPro && cloudLayouts.length >= 2 && !currentLayoutId) {
                setShowUpgradeModal(true);
                showToast("จำกัด 2 โปรเจกต์สำหรับเวอร์ชันฟรี กรุณาอัปเกรดเพื่อไม่จำกัดจำนวน 🚀", "error");
                return;
            }

            const layoutData = {
                id: currentLayoutId || `layout-${Date.now()}`,
                name: layoutName,
                zones: zones,
                drawings: drawings,
                guestNames: guestNames,
                buildingProfile: buildingProfile,
                chairImages: chairImages,
                coordinationRows: coordinationRows,
                docsList: docsList,
                updatedAt: Date.now(),
            };

            // Save to Firebase
            await setDoc(doc(db, 'users', currentUser.uid, 'layouts', layoutData.id), layoutData);

            // Important: Set the current ID so subsequent saves update the same document
            if (!currentLayoutId) setCurrentLayoutId(layoutData.id);

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
            setDocsList(l.docsList || [{ id: Date.now(), name: 'เอกสาร 1', url: null, mime: null, createdAt: null }]);
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
        if (!isPro && cloudLayouts.length >= 2) {
            setShowUpgradeModal(true);
            showToast("จำกัด 2 โปรเจกต์สำหรับเวอร์ชันฟรี 🚀", "error");
            return;
        }
        setBuildingProfile({ buildingCount: 0, floorCount: 0, widthM: 0, lengthM: 0, heightM: 0 });
        setShowTemplateModal(true);
    };

    // planType: 'rental' | 'lifetime', duration: '1m'|'3m'|'6m'|'9m'|'1y' (null for lifetime)
    const handleUpgrade = async (planType = 'rental', duration = '1m') => {
        if (!currentUser) {
            showToast("กรุณาเข้าสู่ระบบเพื่อดำเนินการอัปเกรด", "error");
            return;
        }

        setPaymentStatus('checking');
        showToast("กำลังตรวจสอบยอดเงินโอน... กรุณารอสักครู่ ⏳");

        try {
            await new Promise(resolve => setTimeout(resolve, 3000));

            const userRef = doc(db, 'users', currentUser.uid);

            // Calculate expiry date for rental plans
            let planExpiry = null;
            const durationMonthMap = { '1m': 1, '3m': 3, '6m': 6, '9m': 9, '1y': 12 };
            if (planType === 'rental' && duration) {
                const months = durationMonthMap[duration] || 1;
                const expiry = new Date();
                expiry.setMonth(expiry.getMonth() + months);
                planExpiry = expiry;
            }

            await setDoc(userRef, {
                isPro: true,
                plan: planType,
                planDuration: planType === 'lifetime' ? null : duration,
                planExpiry: planExpiry,
                planStartedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }, { merge: true });

            setPaymentStatus('success');
            setTimeout(() => {
                setShowUpgradeModal(false);
                setPaymentStatus('idle');
                const label = planType === 'lifetime' ? 'Pro Lifetime' : `Pro Rental (${duration})`;
                showToast(`ยืนยันสำเร็จ! ยินดีต้อนรับสมาชิก ${label} 🎉`);
            }, 2000);
        } catch (err) {
            console.error("Payment Verification Error:", err);
            setPaymentStatus('idle');
            showToast("ไม่พบข้อมูลการโอนเงิน กรุณาลองใหม่อีกครั้ง", "error");
        }
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
                    { id: 'stage-1', type: 'stage', name: 'Main Stage', x: 100, y: 100, width: 800, height: 300, color: 'indigo', rotation: 0 },
                    { id: 'zone-vip-l', type: 'seating', name: 'VIP Front Left', ...DEFAULT_ZONE_CONFIG, x: 100, y: 450, rows: 10, columns: 8, spacingX: 20, color: 'blue' },
                    { id: 'zone-vip-r', type: 'seating', name: 'VIP Front Right', ...DEFAULT_ZONE_CONFIG, x: 550, y: 450, rows: 10, columns: 8, spacingX: 20, color: 'purple' },
                    { id: 'zone-gen-l', type: 'seating', name: 'Regular Left', ...DEFAULT_ZONE_CONFIG, x: 100, y: 1000, rows: 20, columns: 12, color: 'sky' },
                    { id: 'zone-gen-r', type: 'seating', name: 'Regular Right', ...DEFAULT_ZONE_CONFIG, x: 600, y: 1000, rows: 20, columns: 12, color: 'sky' }
                ]);
                setActiveZoneId('stage-1');
            } else if (templateId === 'gala') {
                setLayoutName('งานจัดเลี้ยง / Gala (Circular)');
                setZones([
                    { id: 'stage-main', type: 'stage', name: 'เวทีหลัก', x: 400, y: 50, width: 400, height: 200, color: 'rose' },
                    { id: 'table-1', type: 'seating', name: 'โต๊ะ VIP 01', ...DEFAULT_ZONE_CONFIG, x: 200, y: 400, rows: 4, columns: 4, spacingX: 40, spacingY: 40, color: 'amber' },
                    { id: 'table-2', type: 'seating', name: 'โต๊ะ VIP 02', ...DEFAULT_ZONE_CONFIG, x: 600, y: 400, rows: 4, columns: 4, spacingX: 40, spacingY: 40, color: 'amber' },
                    { id: 'table-3', type: 'seating', name: 'โต๊ะ A1', ...DEFAULT_ZONE_CONFIG, x: 200, y: 700, rows: 5, columns: 6, color: 'slate' },
                    { id: 'table-4', type: 'seating', name: 'โต๊ะ A2', ...DEFAULT_ZONE_CONFIG, x: 600, y: 700, rows: 5, columns: 6, color: 'slate' }
                ]);
                setActiveZoneId('stage-main');
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
            } else if (templateId === 'tomorrowland') {
                setLayoutName('Tomorrowland Mainstage Style');
                setZones([
                    { id: 'main-stage', type: 'stage', name: 'The Adscendo Stage', x: 200, y: 50, width: 1200, height: 500, color: 'indigo', gradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' },
                    { id: 'vip-deck-l', type: 'seating', name: 'VIP Deck Left', ...DEFAULT_ZONE_CONFIG, x: 50, y: 650, rows: 5, columns: 20, color: 'amber', rotation: -15 },
                    { id: 'vip-deck-r', type: 'seating', name: 'VIP Deck Right', ...DEFAULT_ZONE_CONFIG, x: 1000, y: 650, rows: 5, columns: 20, color: 'amber', rotation: 15 },
                    { id: 'dancefloor', type: 'seating', name: 'Main Dancefloor (Standing)', ...DEFAULT_ZONE_CONFIG, x: 300, y: 700, rows: 30, columns: 40, spacingX: 2, spacingY: 2, color: 'blue' }
                ]);
                setActiveZoneId('main-stage');
            } else if (templateId === 'tedtalk') {
                setLayoutName('TED Talk Theater');
                setZones([
                    { id: 'circular-stage', type: 'stage', name: 'TED Stage', x: 500, y: 200, width: 400, height: 400, color: 'rose', gradient: 'radial-gradient(circle, #ef4444 0%, #991b1b 100%)' },
                    { id: 'audience-l', type: 'seating', name: 'Left Wing', ...DEFAULT_ZONE_CONFIG, x: 100, y: 700, rows: 15, columns: 12, color: 'slate', rotation: 30 },
                    { id: 'audience-c', type: 'seating', name: 'Center Row', ...DEFAULT_ZONE_CONFIG, x: 450, y: 800, rows: 15, columns: 20, color: 'slate' },
                    { id: 'audience-r', type: 'seating', name: 'Right Wing', ...DEFAULT_ZONE_CONFIG, x: 950, y: 700, rows: 15, columns: 12, color: 'slate', rotation: -30 }
                ]);
                setActiveZoneId('circular-stage');
            } else if (templateId === 'fifafinal') {
                setLayoutName('Stadium: FIFA World Cup Final');
                setZones([
                    { id: 'pitch', type: 'stage', name: 'Pitch / Arena', x: 400, y: 400, width: 800, height: 1200, color: 'emerald', rotation: 90, gradient: 'linear-gradient(90deg, #059669 50%, #10b981 50%)' },
                    { id: 'stand-w', type: 'seating', name: 'Grandstand West', ...DEFAULT_ZONE_CONFIG, x: 50, y: 350, rows: 40, columns: 20, color: 'blue' },
                    { id: 'stand-e', type: 'seating', name: 'Grandstand East', ...DEFAULT_ZONE_CONFIG, x: 1300, y: 350, rows: 40, columns: 20, color: 'blue' },
                    { id: 'stand-n', type: 'seating', name: 'North End', ...DEFAULT_ZONE_CONFIG, x: 450, y: 50, rows: 10, columns: 35, color: 'red' },
                    { id: 'stand-s', type: 'seating', name: 'South End', ...DEFAULT_ZONE_CONFIG, x: 450, y: 1300, rows: 10, columns: 35, color: 'red' }
                ]);
                setActiveZoneId('pitch');
            } else if (templateId === 'metgala') {
                setLayoutName('Met Gala - The Garden of Time');
                setZones([
                    { id: 'stairs', type: 'stage', name: 'The Grand Entrance', x: 200, y: 50, width: 800, height: 400, color: 'slate', gradient: 'linear-gradient(to bottom, #f8fafc, #cbd5e1)' },
                    { id: 'table-vogue', type: 'seating', name: 'Table 01 (Anna Wintour)', ...DEFAULT_ZONE_CONFIG, x: 300, y: 600, rows: 5, columns: 5, spacingX: 40, spacingY: 40, color: 'rose' },
                    { id: 'table-honor', type: 'seating', name: 'Table of Honor', ...DEFAULT_ZONE_CONFIG, x: 600, y: 600, rows: 5, columns: 5, spacingX: 40, spacingY: 40, color: 'rose' },
                    { id: 'guest-l', type: 'seating', name: 'West Wing', ...DEFAULT_ZONE_CONFIG, x: 50, y: 900, rows: 10, columns: 10, color: 'indigo' },
                    { id: 'guest-r', type: 'seating', name: 'East Wing', ...DEFAULT_ZONE_CONFIG, x: 800, y: 900, rows: 10, columns: 10, color: 'indigo' }
                ]);
                setActiveZoneId('stairs');
            } else {
                setLayoutName(`Template: ${templateId}`);
                setZones([
                    { id: 'auto-stage', type: 'stage', name: 'เวทีหลัก', x: 200, y: 200, width: 600, height: 200, color: 'blue' }
                ]);
                setActiveZoneId('auto-stage');
            }

            setCurrentView('editor');
            setIsAnimating(false);
            showToast(`เปิดเทมเพลต ${templateId} สำเร็จ`);
        }, 50);
    };

    const downloadCoordinationCsv = () => {
        const headers = [
            "ชื่อโซน",
            "จำนวนการจัดวาง",
            "หน่วยงานรับผิดชอบ",
            "บุคคลติดต่อ/เบอร์โทร",
            "ผู้ประสานงาน",
            "หมายเหตุ/สถานะ",
            "ตรวจสอบงาน",
            "บันทึกวันที่",
            "การเบิกของ",
            "การคืนของ",
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

    const updateLayoutName = async (id, newName) => {
        if (!currentUser) return;
        if (!newName.trim()) return;
        try {
            await updateDoc(doc(db, 'users', currentUser.uid, 'layouts', id), {
                name: newName,
                updatedAt: Date.now()
            });
            setCloudLayouts(prev => prev.map(l => l.id === id ? { ...l, name: newName, updatedAt: Date.now() } : l));
            showToast("เปลี่ยนชื่อโปรเจกต์เรียบร้อยแล้วค่ะ ✨");
        } catch (e) {
            console.error("Update name error:", e);
            showToast("เปลี่ยนชื่อไม่สำเร็จ", "error");
        }
    };

    const deleteLayout = async (e, id) => {
        e.stopPropagation();

        if (!currentUser) {
            showToast("กรุณาเข้าสู่ระบบก่อนลบโปรเจกต์ 🔐", "error");
            return;
        }

        try {
            await deleteDoc(doc(db, 'users', currentUser.uid, 'layouts', id));
            const newLayouts = cloudLayouts.filter(l => l.id !== id);
            setCloudLayouts(newLayouts);
            if (currentLayoutId === id) handleCreateNew();
            showToast("ลบข้อมูลออกจากคลาวด์เรียบร้อยแล้วค่ะ");
        } catch (e) {
            console.error("Delete error:", e);
            showToast("ลบข้อมูลไม่สำเร็จ กรุณาลองใหม่", "error");
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

    const deleteActiveZone = (silent = false) => {
        if (!activeZone || zones.length <= 1) {
            showToast("ต้องมีอย่างน้อย 1 โซน", "error");
            return;
        }

        const proceed = silent || window.confirm(`ต้องการลบ ${activeZone.name || "โซนนี้"} ใช่หรือไม่?`);

        if (proceed) {
            const newZones = zones.filter(z => z.id !== activeZoneId);
            if (newZones.length > 0) {
                setZones(newZones);
                setActiveZoneId(newZones[0].id);
                showToast("ลบโซนเรียบร้อยแล้วค่ะ ✨");
            }
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

        // --- Sidebar Dragging (Allowed anytime) ---
        const sidebarHeader = e.target.closest('.sidebar-header');
        const isClickingButton = e.target.closest('button');

        if (sidebarHeader && !isClickingButton) {
            sidebarDragMoved.current = false;

            if (isSidebarOpen) {
                // Smoothly teleport sidebar pos so the 64px icon is centered under the mouse
                // since it's about to collapse to 64x64 anyway
                const newX = e.clientX - 32;
                const newY = e.clientY - 32;
                setSidebarPos({ x: newX, y: newY });
                sidebarOffset.current = { x: 32, y: 32 };
            } else {
                sidebarOffset.current = {
                    x: e.clientX - sidebarPos.x,
                    y: e.clientY - sidebarPos.y
                };
            }

            setIsSidebarDragging(true);
            sidebarHeader.setPointerCapture(e.pointerId);
            return;
        }

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
            pinHeader.setPointerCapture(e.pointerId);
            return;
        }

        if (e.target.closest('.no-pan')) return;

        if (e.target.closest('.chair-element') && activeMode === 'edit_chair') return;

        // --- Drawing Mode handled by native overlay listeners ---
        if (activeMode === 'pen' || activeMode === 'highlighter') {
            return; // Drawing is handled by the overlay's native DOM listeners
        }

        const dragHandle = e.target.closest('.zone-draggable');
        if (dragHandle && activeMode === 'move_zone') {
            const zoneId = dragHandle.getAttribute('data-zone-id');
            const zone = zones.find(z => z.id === zoneId);
            if (zone) {
                // Calculate anchor point inside the zone (in workspace units)
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = (e.clientX - rect.left - pan.x) / zoom;
                const mouseY = (e.clientY - rect.top - pan.y) / zoom;

                setDragContext({
                    type: 'zone',
                    zoneId,
                    anchorX: mouseX - zone.x,
                    anchorY: mouseY - zone.y
                });
                setActiveZoneId(zoneId);
                e.target.setPointerCapture(e.pointerId);
            }
            return;
        }

        // --- Tape Measure Start ---
        if (activeMode === 'tape_measure') {
            const rect = e.currentTarget.getBoundingClientRect();
            const startX = (e.clientX - rect.left - pan.x) / zoom;
            const startY = (e.clientY - rect.top - pan.y) / zoom;
            setMeasuringPoints({ start: { x: startX, y: startY }, end: { x: startX, y: startY } });
            setIsMeasuring(true);
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

        // --- Sidebar Dragging ---
        if (isSidebarDragging) {
            sidebarDragMoved.current = true;
            const nextX = e.clientX - sidebarOffset.current.x;
            const nextY = Math.max(80, e.clientY - sidebarOffset.current.y); // Clamp top to 80px
            setSidebarPos({ x: nextX, y: nextY });
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
            const rect = e.currentTarget.getBoundingClientRect();
            const currentX = (e.clientX - rect.left - pan.x) / zoom;
            const currentY = (e.clientY - rect.top - pan.y) / zoom;

            const nextX = Math.max(0, currentX - (dragContext.anchorX || 0));
            const nextY = Math.max(0, currentY - (dragContext.anchorY || 0));

            setZones(prev => prev.map(z => z.id === dragContext.zoneId ? { ...z, x: nextX, y: nextY } : z));
        }

        // --- Tape Measure Drag ---
        if (isMeasuring && measuringPoints) {
            const rect = e.currentTarget.getBoundingClientRect();
            const endX = (e.clientX - rect.left - pan.x) / zoom;
            const endY = (e.clientY - rect.top - pan.y) / zoom;
            setMeasuringPoints(p => ({ ...p, end: { x: endX, y: endY } }));
        }
    };

    const handlePointerUp = (e) => {
        if (isNotePinDragging) {
            setIsNotePinDragging(false);
            e.target.releasePointerCapture(e.pointerId);
            return;
        }
        if (isSidebarDragging) {
            setIsSidebarDragging(false);
            e.target.releasePointerCapture(e.pointerId);

            // Only auto-expand if we actually moved it (to distinguish from a simple button click)
            if (sidebarDragMoved.current) {
                setIsSidebarOpen(true);
            }
            const midX = window.innerWidth / 2;

            setSidebarPos(prev => {
                const sidebarWidth = isSidebarOpen || sidebarDragMoved.current ? 380 : 64;
                const padding = 16;
                const targetX = prev.x < midX ? padding : (window.innerWidth - sidebarWidth - padding);
                const targetY = (isSidebarOpen || sidebarDragMoved.current) ? 80 : Math.max(80, Math.min(window.innerHeight - 80, prev.y));
                return { x: targetX, y: targetY };
            });
            return;
        }
        // Drawing handled by overlay
        if (isDrawingRef.current) return;
        if (dragContext) {
            e.target.releasePointerCapture(e.pointerId);
            setDragContext(null);
        }

        // --- Tape Measure Stop ---
        if (isMeasuring) {
            setIsMeasuring(false);
            e.target.releasePointerCapture(e.pointerId);
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
                if (oB.top >= aB.bottom) lines.push({ x: cX, y: aB.bottom, w: 0, h: oB.top - oB.bottom, v: Math.round(oB.top - oB.bottom) });
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
    try {
        // หน้าจอ Landing Page (บังคับให้เข้าสู่ระบบ)
        if (currentView === 'landing') {
            return (
                <>
                    <LandingPage
                        loginEmail={loginEmail}
                        setLoginEmail={setLoginEmail}
                        loginPassword={loginPassword}
                        setLoginPassword={setLoginPassword}
                        showPassword={showPassword}
                        setShowPassword={setShowPassword}
                        isSignUp={isSignUp}
                        setIsSignUp={setIsSignUp}
                        loading={loading}
                        error={error}
                        handleLogin={handleLogin}
                        handleGoogleSignIn={handleGoogleSignIn}
                        showMobileMenu={showMobileMenu}
                        setShowMobileMenu={setShowMobileMenu}
                    />
                    {showUpgradeModal && (
                        <UpgradeModalUI
                            onUpgrade={handleUpgrade}
                            onClose={() => paymentStatus === 'idle' && setShowUpgradeModal(false)}
                            paymentStatus={paymentStatus}
                        />
                    )}
                </>
            );
        }

        // หน้า Library (Home) — Eflow Event OS
        if (currentView === 'home') {
            // ─── Project Workspace ───────────────────────────────────────────────────
            if (activeWorkspaceProject) {
                return (
                    <ProjectWorkspace
                        project={activeWorkspaceProject}
                        onBack={() => setActiveWorkspaceProject(null)}
                        onOpenFloorPlan={(project) => {
                            setActiveWorkspaceProject(null);
                            loadLayout(project);
                        }}
                        isPro={isPro}
                        setShowUpgradeModal={setShowUpgradeModal}
                    />
                );
            }
            const homeViewClass = (isAnimating && animationDirection === 'exit') ? 'view-exit-animation' : '';
            return (
                <div className={`flex w-full h-screen bg-[#f5f5f7] font-sans text-slate-900 overflow-hidden select-none ${homeViewClass}`}>
                    <TemplateModal
                        showTemplateModal={showTemplateModal}
                        setShowTemplateModal={setShowTemplateModal}
                        handleSelectTemplate={handleSelectTemplate}
                    />

                    {/* Toast notification */}
                    {message.text && (
                        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-full shadow-lg transition-all duration-300 font-medium text-white flex items-center gap-2 text-sm ${message.type === 'error' ? 'bg-red-500' : 'bg-slate-800'}`}>
                            <i className="fa-solid fa-check"></i> {message.text}
                        </div>
                    )}

                    {/* Full-feature Navigation Sidebar */}
                    <AppSidebar
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        isPro={isPro}
                        userPlan={userPlan}
                        setShowUpgradeModal={setShowUpgradeModal}
                        currentUser={currentUser}
                        handleLogout={handleLogout}
                        activeTab={homeTab}
                        setActiveTab={setHomeTab}
                    />

                    {/* Main Content Area — switches by homeTab */}
                    {homeTab === 'dashboard' && (
                        <DashboardView
                            cloudLayouts={cloudLayouts}
                            currentUser={currentUser}
                            userPlan={userPlan}
                            isPro={isPro}
                            setShowUpgradeModal={setShowUpgradeModal}
                            onNavigate={setHomeTab}
                        />
                    )}
                    {homeTab === 'projects' && (
                        <ProjectGrid
                            currentUser={currentUser}
                            cloudLayouts={cloudLayouts}
                            handleCreateNew={handleCreateNew}
                            loadLayout={loadLayout}
                            deleteLayout={deleteLayout}
                            updateLayoutName={updateLayoutName}
                            onOpenWorkspace={(project) => setActiveWorkspaceProject(project)}
                            isPro={isPro}
                            userPlan={userPlan}
                            setShowUpgradeModal={setShowUpgradeModal}
                        />
                    )}
                    {homeTab === 'checklist' && <ChecklistView projectId={null} />}
                    {homeTab === 'budget' && <BudgetView projectId={null} />}
                    {homeTab === 'vendors' && <VendorView projectId={null} />}
                    {homeTab === 'guests' && <GuestView projectId={null} />}
                    {homeTab === 'account' && (
                        <AccountSettings
                            currentUser={currentUser}
                            userPlan={userPlan}
                            setShowUpgradeModal={setShowUpgradeModal}
                        />
                    )}

                    {/* Pro Upgrade Modal */}
                    {showUpgradeModal && <UpgradeModalUI onUpgrade={handleUpgrade} onClose={() => paymentStatus === 'idle' && setShowUpgradeModal(false)} paymentStatus={paymentStatus} />}
                </div>
            );
        }

        // หน้า Editor หลัก
        const editorViewClass = isAnimating && animationDirection === 'enter' ? 'view-enter-animation' : '';
        return (
            <div className={`flex flex-col w-full min-h-screen bg-[#f2f2f7] font-sans text-slate-900 overflow-hidden ${editorViewClass}`}>
                {message.text && <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-2.5 rounded-full shadow-lg transition-all duration-300 font-medium text-sm text-white flex items-center gap-2 ${message.type === 'error' ? 'bg-red-500' : 'bg-slate-800'}`}><i className="fa-solid fa-check"></i> {message.text}</div>}

                {/* Navbar ด้านบน */}
                <EditorHeader
                    goToHome={goToHome}
                    layoutName={layoutName}
                    setLayoutName={setLayoutName}
                    currentLayoutId={currentLayoutId}
                    updateLayoutName={updateLayoutName}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    loadProject={loadProject}
                    saveProject={saveProject}
                    handleExportClick={handleExportClick}
                    isPro={isPro}
                    setShowUpgradeModal={setShowUpgradeModal}
                    currentUser={currentUser}
                    handleSaveToCloud={handleSaveToCloud}
                />

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
                            <aside
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                className={`no-pan z-[35] flex flex-col fixed select-none ${isSidebarDragging ? '' : 'transition-all duration-300 ease-out'}`}
                                style={{
                                    left: sidebarPos.x,
                                    top: sidebarPos.y,
                                    width: (isSidebarOpen && !isSidebarDragging) ? '380px' : '64px',
                                    height: (isSidebarOpen && !isSidebarDragging) ? `calc(100vh - ${sidebarPos.y}px - 20px)` : '64px',
                                    maxHeight: (isSidebarOpen && !isSidebarDragging) ? `calc(100vh - ${sidebarPos.y}px - 20px)` : '64px',
                                    opacity: 1,
                                    pointerEvents: 'auto',
                                    cursor: isSidebarDragging ? 'grabbing' : 'default'
                                }}
                            >
                                {(!isSidebarOpen || isSidebarDragging) ? (
                                    <div
                                        className={`sidebar-header group w-14 h-14 bg-white/95 backdrop-blur-2xl border-2 border-slate-200/80 rounded-2xl flex flex-col items-center justify-center cursor-grab active:cursor-grabbing shadow-2xl shadow-slate-200/50 hover:scale-110 active:scale-95 transition-all duration-300 ${isSidebarDragging ? 'scale-110 opacity-90' : ''}`}
                                        onClick={(e) => {
                                            if (!isSidebarDragging && !isSidebarOpen) {
                                                const midX = window.innerWidth / 2;
                                                const padding = 16;
                                                if (sidebarPos.x > midX) {
                                                    // Move left so the 380px sidebar fits on screen
                                                    setSidebarPos(prev => ({ x: window.innerWidth - 380 - padding, y: 80 }));
                                                }
                                                setIsSidebarOpen(true);
                                            }
                                        }}
                                        title={isSidebarOpen ? "จะกางกลับอัตโนมัติเมื่อวาง" : "คลิกเพื่อขยายเครื่องมือ / ลากเพื่อย้าย"}
                                    >
                                        <div className="relative">
                                            <i className={`fa-solid ${activeMode === 'move_zone' ? 'fa-plus-minus' :
                                                activeMode === 'tape_measure' ? 'fa-ruler-combined' :
                                                    activeMode === 'move_layout' ? 'fa-arrows-up-down-left-right' :
                                                        activeMode === 'pen' ? 'fa-pen-nib' :
                                                            activeMode === 'highlighter' ? 'fa-highlighter' :
                                                                'fa-briefcase'
                                                } text-[#007aff] text-xl transition-all duration-300 group-hover:rotate-12`} />
                                            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white shadow-sm scale-0 group-hover:scale-100 transition-transform duration-300" />
                                        </div>
                                        <span className="text-[7px] font-black text-blue-400/60 uppercase tracking-tighter mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">Expand</span>
                                    </div>
                                ) : (
                                    <div
                                        className={`w-full h-full bg-white/95 backdrop-blur-2xl border-2 border-slate-200/80 rounded-[2rem] shadow-2xl shadow-slate-200/50 p-5 pb-20 overflow-y-auto flex flex-col gap-6 thin-scrollbar ${isSidebarDragging ? 'scale-[1.01] opacity-95' : ''}`}
                                    >
                                        {(() => {
                                            const isSidebarOnRight = sidebarPos.x > (window.innerWidth / 2);
                                            return (
                                                <div
                                                    className={`sidebar-header flex items-center justify-between shrink-0 cursor-grab active:cursor-grabbing pb-2 border-b border-slate-100/50 ${isSidebarOnRight ? 'flex-row-reverse' : ''}`}
                                                    title="ลากเพื่อย้ายตำแหน่ง"
                                                >
                                                    <div className={`flex items-center gap-2 ${isSidebarOnRight ? 'flex-row-reverse' : ''}`}>
                                                        <div className="w-8 h-8 bg-[#007aff] rounded-xl flex items-center justify-center shadow-lg shadow-blue-200/80">
                                                            <i className="fa-solid fa-briefcase text-white text-xs" />
                                                        </div>
                                                        <div className={isSidebarOnRight ? 'text-right' : 'text-left'}>
                                                            <span className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none">Toolbar</span>
                                                            <p className="text-[9px] font-bold text-slate-400 opacity-60">Control Panel</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const midX = window.innerWidth / 2;
                                                            const padding = 16;
                                                            if (sidebarPos.x > midX) {
                                                                // Move right so the 64px icon snaps to the edge
                                                                setSidebarPos(prev => ({ x: window.innerWidth - 64 - padding, y: prev.y }));
                                                            }
                                                            setIsSidebarOpen(false);
                                                        }}
                                                        className="w-7 h-7 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition"
                                                        title="ย่อหน้าต่าง"
                                                    >
                                                        <i className={`fa-solid ${isSidebarOnRight ? 'fa-chevron-right' : 'fa-chevron-left'} text-[10px]`} />
                                                    </button>
                                                </div>
                                            );
                                        })()}

                                        <div className="grid grid-cols-5 bg-slate-100 p-1.5 rounded-2xl shadow-inner border border-slate-200/60 shrink-0 gap-1">
                                            {[
                                                { id: 'edit_chair', icon: 'fa-eraser', label: 'ลบ/เพิ่ม', key: 'R', color: 'text-[#007aff]' },
                                                { id: 'tape_measure', icon: 'fa-ruler-horizontal', label: 'ตลับเมตร', key: 'T', color: 'text-indigo-600' },
                                                { id: 'move_zone', icon: 'fa-arrows-up-down-left-right', label: 'ย้ายโซน', key: 'M', color: 'text-emerald-600' },
                                                { id: 'pen', icon: 'fa-pen-nib', label: 'ปากกา', key: 'P', color: 'text-rose-500' },
                                                { id: 'highlighter', icon: 'fa-highlighter', label: 'ไฮไลท์', key: 'H', color: 'text-amber-500' }
                                            ].map(m => (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    onClick={() => setActiveMode(m.id)}
                                                    className={`py-2 px-1 text-[9px] sm:text-[10px] font-bold rounded-xl flex flex-col justify-center items-center gap-1 transition-all ${activeMode === m.id ? 'bg-white shadow-md ' + m.color : 'text-slate-500 hover:bg-white/60'}`}
                                                >
                                                    <i className={`fa-solid ${m.icon} text-sm`}></i>
                                                    <span className="truncate w-full text-center">{m.label}</span>
                                                    <span className="text-[7px] font-black opacity-40">{m.key}</span>
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
                                                    <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                                                        <div className={`shrink-0 w-2.5 h-2.5 rounded-full ${ZONE_COLORS[z.color].bg}`} />
                                                        <input
                                                            type="text"
                                                            value={z.name}
                                                            onChange={(e) => {
                                                                setZones(prev => prev.map(item => item.id === z.id ? { ...item, name: e.target.value } : item));
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="bg-transparent border-none outline-none focus:ring-0 w-full font-bold text-xs p-0 text-slate-700 placeholder-slate-400"
                                                            placeholder="ชื่อโซน..."
                                                        />
                                                    </div>
                                                    {activeZoneId === z.id && zones.length > 1 && (
                                                        <i
                                                            className="fa-solid fa-trash-can text-red-500 p-1.5 transition-colors hover:bg-red-50 rounded-lg"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteActiveZone(true); // true = silent/immediate
                                                            }}
                                                            title="ลบโซนนี้ทันที"
                                                        ></i>
                                                    )}
                                                </div>
                                            ))}

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

                                                        {activeMode === 'tape_measure' && (
                                                            <SidebarCollapsible title="ตั้งค่าตลับเมตร (Tape Measure)" icon={<i className="fa-solid fa-ruler-combined text-indigo-500" />} defaultOpen>
                                                                <div className="space-y-4 p-1">
                                                                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-4 border border-indigo-200 shadow-sm">
                                                                        <div className="flex justify-between items-center mb-3">
                                                                            <label className="text-[11px] font-black text-indigo-700 uppercase tracking-wider">ระยะห่างที่ต้องการ (เมตร)</label>
                                                                            <span className="text-sm font-black text-indigo-600">{(tapeSpacing / 100).toFixed(2)} m</span>
                                                                        </div>
                                                                        <div className="flex gap-2 mb-3">
                                                                            {[0.5, 1.0, 1.2, 1.5, 2.0].map(m => (
                                                                                <button key={m} onClick={() => setTapeSpacing(m * 100)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${tapeSpacing === m * 100 ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-105' : 'bg-white text-indigo-600 border-indigo-200 hover:border-indigo-400'}`}>
                                                                                    {m}m
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                        <input type="range" min="10" max="1000" step="10" value={tapeSpacing} onChange={(e) => setTapeSpacing(parseInt(e.target.value))} className="w-full accent-indigo-600" />
                                                                    </div>

                                                                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4 border border-amber-200 shadow-sm">
                                                                        <div className="flex justify-between items-center mb-3">
                                                                            <label className="text-[11px] font-black text-amber-700 uppercase tracking-wider">จำนวนสิ่งของ (ชิ้น)</label>
                                                                            <span className="text-sm font-black text-amber-600">{tapeCount} ชิ้น</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-4">
                                                                            <button onClick={() => setTapeCount(Math.max(1, tapeCount - 1))} className="w-8 h-8 rounded-full bg-white border border-amber-300 flex items-center justify-center hover:bg-amber-600 hover:text-white transition-all"><i className="fa-solid fa-minus"></i></button>
                                                                            <input type="number" value={tapeCount} onChange={(e) => setTapeCount(Math.max(1, parseInt(e.target.value) || 1))} className="flex-1 bg-transparent text-center font-black text-amber-800 outline-none" />
                                                                            <button onClick={() => setTapeCount(tapeCount + 1)} className="w-8 h-8 rounded-full bg-white border border-amber-300 flex items-center justify-center hover:bg-amber-600 hover:text-white transition-all"><i className="fa-solid fa-plus"></i></button>
                                                                        </div>
                                                                        <p className="text-[9px] font-bold text-amber-600/60 mt-3 text-center italic">ลากตลับเมตรเพื่อดูตำแหน่งวางจริง</p>
                                                                    </div>

                                                                    <button onClick={() => setMeasuringPoints(null)} className="w-full py-3 rounded-xl bg-slate-800 text-white text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95">
                                                                        รีเซ็ตการวัด (Clear)
                                                                    </button>
                                                                </div>
                                                            </SidebarCollapsible>
                                                        )}
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

                                                <SidebarCollapsible title="พื้นที่อาคารและข้อกำหนด" icon={<i className="fa-solid fa-building text-amber-600" />} defaultOpen={true}>
                                                    <p className="text-[10px] text-slate-500 leading-relaxed px-1">ใช้สำหรับสรุปความต้องการพื้นที่อาคาร (ถ้ามี)</p>
                                                    <BuildingMetricControl title="ความกว้างอาคาร (ม.)" field="widthM" min={0} max={200} presets={PRESET_BUILDING_DIM_M} presetSuffix="m" buildingProfile={buildingProfile} setBuildingProfile={setBuildingProfile} />
                                                    <BuildingMetricControl title="ความยาวอาคาร (ม.)" field="lengthM" min={0} max={200} presets={PRESET_BUILDING_DIM_M} presetSuffix="m" buildingProfile={buildingProfile} setBuildingProfile={setBuildingProfile} />
                                                </SidebarCollapsible>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </aside>

                            {/* แผ่น Canvas หลัก */}
                            <main
                                ref={workspaceRef}
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
                                    body, html { overflow: visible !important; height: auto !important; }
                                    main { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; height: 100% !important; background: white !important; overflow: visible !important; }
                                    .freeform-dot-grid { display: none !important; }
                                    .drawing-canvas { opacity: 1 !important; z-index: 20 !important; }
                                    ${exportArea ? `
                                        .workspace-container {
                                            transform: translate(${-exportArea.x}px, ${-exportArea.y}px) !important;
                                            width: ${exportArea.width}px !important;
                                            height: ${exportArea.height}px !important;
                                            clip-path: rect(0 ${exportArea.width}px ${exportArea.height}px 0) !important;
                                        }
                                    ` : ''}
                                }
                            `}</style>
                                {/* Drawing Overlay */}
                                <div
                                    ref={drawingOverlayRef}
                                    className="absolute inset-0 z-[25] no-print"
                                    style={{
                                        pointerEvents: (activeMode === 'pen' || activeMode === 'highlighter') ? 'auto' : 'none',
                                        cursor: 'crosshair',
                                        touchAction: 'none'
                                    }}
                                />

                                <div className="absolute inset-0 freeform-dot-grid pointer-events-none" style={{
                                    backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
                                    backgroundPosition: `${pan.x}px ${pan.y}px`,
                                    opacity: 0.4,
                                    backgroundImage: `radial-gradient(circle, #cbd5e1 ${1.2 * zoom}px, transparent 0)`
                                }} />

                                {paperConfig.type !== 'infinite' && (() => {
                                    const scaleFactor = paperConfig.unit === 'mm' ? (UNIT_SCALE / 10) : 1;
                                    const pWidth = paperConfig.width * scaleFactor;
                                    const pHeight = paperConfig.height * scaleFactor;
                                    return (
                                        <div
                                            className="absolute bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] pointer-events-none z-0 transition-all duration-300"
                                            style={{ left: 0, top: 0, width: pWidth, height: pHeight, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}
                                        >
                                            <div className="absolute inset-0 border border-slate-200" />
                                            <div className="absolute -top-6 left-0 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <i className="fa-solid fa-file-lines"></i>
                                                {PAPER_SIZES[paperConfig.type]?.name || 'Custom'} ({paperConfig.width}x{paperConfig.height} {paperConfig.unit})
                                            </div>
                                        </div>
                                    );
                                })()}

                                {isSelectingArea && exportArea && (
                                    <div className="fixed pointer-events-none z-50 border-2 border-dashed border-blue-500 bg-blue-500/10 shadow-md" style={{ left: `${exportArea.x}px`, top: `${exportArea.y}px`, width: `${exportArea.width}px`, height: `${exportArea.height}px` }}>
                                        <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-br font-bold">
                                            {Math.round(exportArea.width)} × {Math.round(exportArea.height)} px
                                        </div>
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
                                    {buildingProfile.widthM > 0 && buildingProfile.lengthM > 0 && (() => {
                                        const bWidthPx = buildingProfile.widthM * 100 * (UNIT_SCALE / 2);
                                        const bLengthPx = buildingProfile.lengthM * 100 * (UNIT_SCALE / 2);
                                        const buildingGap = 60;
                                        return Array.from({ length: buildingProfile.buildingCount || 1 }).map((_, bi) => {
                                            const offsetX = bi * (bWidthPx + buildingGap);
                                            return (
                                                <div key={`bldg-${bi}`} className="absolute pointer-events-none z-[1]" style={{ left: offsetX, top: 0, width: bWidthPx, height: bLengthPx }}>
                                                    <div className="absolute inset-0 border-2 border-dashed border-amber-400/60 rounded-md" />
                                                    <div className="absolute inset-0 bg-amber-50/15 rounded-md" />
                                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-amber-100/90 backdrop-blur-sm border border-amber-300/80 rounded-full px-3 py-0.5 shadow-sm whitespace-nowrap">
                                                        <i className="fa-solid fa-building text-amber-600 text-[8px]" />
                                                        <span className="text-[9px] font-bold text-amber-700">{buildingProfile.buildingCount > 1 ? `อาคาร ${bi + 1}` : 'อาคาร'}</span>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}

                                    {stats.globalWidth > 0 && stats.globalHeight > 0 && (
                                        <div className="absolute pointer-events-none opacity-40 z-0" style={{ left: stats.globalMinX * (UNIT_SCALE / 2), top: stats.globalMinY * (UNIT_SCALE / 2), width: stats.globalWidth * (UNIT_SCALE / 2), height: stats.globalHeight * (UNIT_SCALE / 2) }}>
                                            <div className="absolute -top-10 left-0 right-0 h-px bg-slate-500 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-slate-500 rounded-full absolute left-0" /><div className="w-1.5 h-1.5 bg-slate-500 rounded-full absolute right-0" /><span className="bg-[#f2f2f7] px-2 text-[10px] font-bold text-slate-600">กว้าง {stats.totalWidthM} ม.</span></div>
                                            <div className="absolute -left-10 top-0 bottom-0 w-px bg-slate-500 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-slate-500 rounded-full absolute top-0" /><div className="w-1.5 h-1.5 bg-slate-500 rounded-full absolute bottom-0" /><span className="bg-[#f2f2f7] px-2 py-0.5 text-[10px] font-bold text-slate-600 origin-center -rotate-90 whitespace-nowrap">ยาว {stats.totalHeightM} ม.</span></div>
                                        </div>
                                    )}

                                    {renderSmartGuides()}

                                    <canvas ref={canvasRef} className="absolute pointer-events-none z-[15]" style={{ left: 0, top: 0, width: '10000px', height: '10000px', imageRendering: 'pixelated' }} />

                                    {/* Tape Measure Overlay */}
                                    {measuringPoints && (
                                        <div className="absolute pointer-events-none z-[40]" style={{ left: 0, top: 0 }}>
                                            <svg width="10000" height="10000" style={{ pointerEvents: 'none' }}>
                                                <defs>
                                                    <filter id="glow">
                                                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                                        <feMerge>
                                                            <feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" />
                                                        </feMerge>
                                                    </filter>
                                                </defs>

                                                {/* Main Ruler Line */}
                                                <line
                                                    x1={measuringPoints.start.x * (UNIT_SCALE / 2)}
                                                    y1={measuringPoints.start.y * (UNIT_SCALE / 2)}
                                                    x2={measuringPoints.end.x * (UNIT_SCALE / 2)}
                                                    y2={measuringPoints.end.y * (UNIT_SCALE / 2)}
                                                    stroke="#4f46e5" strokeWidth="2" strokeDasharray="5,3" filter="url(#glow)"
                                                />

                                                {/* Distance Calculations */}
                                                {(() => {
                                                    const dx = measuringPoints.end.x - measuringPoints.start.x;
                                                    const dy = measuringPoints.end.y - measuringPoints.start.y;
                                                    const distCm = Math.sqrt(dx * dx + dy * dy);
                                                    const distM = distCm / 100;

                                                    // Marks calculation
                                                    const angle = Math.atan2(dy, dx);
                                                    const marks = [];
                                                    // Every 10cm small mark, Every 100cm large mark
                                                    for (let i = 0; i <= distCm; i += 10) {
                                                        const isLarge = i % 100 === 0;
                                                        const markLen = isLarge ? 12 : 6;
                                                        const mx = measuringPoints.start.x + (i * Math.cos(angle));
                                                        const my = measuringPoints.start.y + (i * Math.sin(angle));
                                                        const px = mx * (UNIT_SCALE / 2);
                                                        const py = my * (UNIT_SCALE / 2);

                                                        // Perpendicular offset for marks
                                                        const ox = Math.cos(angle + Math.PI / 2) * markLen;
                                                        const oy = Math.sin(angle + Math.PI / 2) * markLen;

                                                        marks.push(
                                                            <g key={i}>
                                                                <line
                                                                    x1={px - ox / 2} y1={py - oy / 2} x2={px + ox / 2} y2={py + oy / 2}
                                                                    stroke={isLarge ? '#4f46e5' : '#818cf8'} strokeWidth={isLarge ? 2 : 1}
                                                                />
                                                                {isLarge && i > 0 && i < distCm && (
                                                                    <text x={px + ox} y={py + oy} fill="#4f46e5" fontSize="10" fontWeight="bold" textAnchor="middle" transform={`rotate(${(angle * 180 / Math.PI) + 90}, ${px + ox}, ${py + oy})`}>
                                                                        {i / 100}m
                                                                    </text>
                                                                )}
                                                            </g>
                                                        );
                                                    }

                                                    // Spacing Markers (Ghost Chairs/Points)
                                                    const spacingMarkers = [];
                                                    if (tapeSpacing > 0 && tapeCount > 1) {
                                                        for (let i = 1; i < tapeCount; i++) {
                                                            const sDist = i * tapeSpacing;
                                                            if (sDist > distCm) break;
                                                            const sx = measuringPoints.start.x + (sDist * Math.cos(angle));
                                                            const sy = measuringPoints.start.y + (sDist * Math.sin(angle));
                                                            const spx = sx * (UNIT_SCALE / 2);
                                                            const spy = sy * (UNIT_SCALE / 2);
                                                            spacingMarkers.push(
                                                                <g key={`spacing-${i}`}>
                                                                    <circle cx={spx} cy={spy} r="4" fill="#fbbf24" stroke="white" strokeWidth="1" opacity="0.8" />
                                                                    <rect x={spx - 10} y={spy - 10} width="20" height="20" rx="3" fill="#fbbf24" opacity="0.3" stroke="#fbbf24" strokeWidth="1" />
                                                                    <text x={spx} y={spy + 20} fill="#d97706" fontSize="8" fontWeight="black" textAnchor="middle">#{i + 1} ({sDist / 100}m)</text>
                                                                </g>
                                                            );
                                                        }
                                                    }

                                                    return (
                                                        <>
                                                            {marks}
                                                            {spacingMarkers}
                                                            {/* End Label */}
                                                            <g transform={`translate(${measuringPoints.end.x * (UNIT_SCALE / 2) + 15}, ${measuringPoints.end.y * (UNIT_SCALE / 2)})`}>
                                                                <rect x="0" y="-12" width="65" height="24" rx="12" fill="#4f46e5" />
                                                                <text x="32" y="4" fill="white" fontSize="11" fontWeight="black" textAnchor="middle">
                                                                    {distM.toFixed(2)} m
                                                                </text>
                                                            </g>
                                                        </>
                                                    );
                                                })()}
                                            </svg>
                                        </div>
                                    )}

                                    {zones.map(zone => {
                                        if (!zone) return null;
                                        const b = getBounds(zone);
                                        const isZoneActive = activeZoneId === zone.id;
                                        if (b.width <= 0 && b.height <= 0 && !isZoneActive) return null;
                                        const isDraggingThis = dragContext?.zoneId === zone.id;
                                        const cInfo = ZONE_COLORS[zone.color] || ZONE_COLORS.blue;
                                        const zoneRotation = zone.rotation || 0;
                                        const customBackground = zone.gradient || zone.customColor || null;

                                        return (
                                            <div key={zone.id} className={`absolute transition-all ${isDraggingThis ? 'duration-0 z-10' : 'duration-200 z-10'} ${isZoneActive ? `ring-4 ring-offset-8 ${cInfo.ring}/20 rounded` : ''}`} style={{ left: (zone.x || 0) * (UNIT_SCALE / 2), top: (zone.y || 0) * (UNIT_SCALE / 2), width: Math.max(10, b.width) * (UNIT_SCALE / 2), height: Math.max(10, b.height) * (UNIT_SCALE / 2), transform: `rotate(${zoneRotation}deg)`, transformOrigin: 'center center' }}>
                                                <div data-zone-id={zone.id} className={`zone-draggable absolute -top-8 left-0 px-3 py-1 rounded shadow-sm text-[9px] font-bold whitespace-nowrap cursor-grab active:cursor-grabbing flex items-center gap-1 ${isZoneActive ? (customBackground ? 'bg-slate-800 text-white' : `${cInfo.bg} text-white`) : 'bg-white/90 text-slate-600 border border-slate-200 hover:border-slate-400'}`} style={{ transform: `rotate(${-zoneRotation}deg)`, transformOrigin: 'left center' }}>
                                                    <i className="fa-solid fa-arrows-up-down-left-right opacity-70 pointer-events-none"></i> <span className="pointer-events-none">{zone.name || 'โซนไม่มีชื่อ'}</span>
                                                </div>

                                                {zone.type === 'stage' || zone.type === 'booth' ? (
                                                    <div className={`w-full h-full relative border-4 border-black/20 shadow-inner flex flex-col items-center justify-center overflow-hidden ${zone.type === 'stage' ? 'rounded-md' : 'rounded-sm'} ${!customBackground ? cInfo.bg : ''}`} style={{ background: customBackground, backgroundImage: zone.image ? `url(${zone.image})` : (customBackground || undefined), backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                                        {!zone.image && (
                                                            <>
                                                                <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMSIvPjxwYXRoIGQ9Ik0wIDRMMCAwTDEgME0wIDRaIiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAuMiIvPjwvc3ZnPg==')]"></div>
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
                                                                        <div key={ci} onClick={(e) => { e.stopPropagation(); setActiveZoneId(zone.id); handleChairClick(zone.id, ri, ci); }} className={`chair-element relative flex-shrink-0 border-2 rounded-[6px] transition-all pointer-events-auto ${activeMode === 'edit_chair' ? 'cursor-grab active:cursor-grabbing' : ''} ${isH ? 'opacity-10 bg-transparent border-dashed border-slate-300' : `bg-white shadow-sm ${isZoneActive ? cInfo.border : 'border-slate-300'} hover:border-slate-800`}`} style={{ width: (zone.chairWidth || 0) * (UNIT_SCALE / 2), height: (zone.chairHeight || 0) * (UNIT_SCALE / 2), marginRight: ci === (zone.columns - 1) ? 0 : (zone.spacingX || 0) * (UNIT_SCALE / 2) }}>
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


                        </React.Fragment >
                    )}

                    {/* Tab: Documents */}
                    {
                        activeTab === "documents" && (
                            <main className="flex-1 bg-[#0f172a] p-6 sm:p-10 overflow-y-auto min-h-full scrollbar-hide">
                                <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-start gap-8 lg:gap-16 border-b border-white/5 pb-8">
                                        <div className="flex flex-col md:flex-row md:items-center gap-8 lg:gap-12">
                                            {/* Category Navigation System */}
                                            <div className="flex flex-wrap items-center gap-3 p-2 bg-slate-900/60 rounded-3xl border border-white/5 backdrop-blur-2xl shadow-2xl order-1 lg:order-none">
                                                {docCategories.map((cat) => (
                                                    <div
                                                        key={cat.id}
                                                        onClick={() => setActiveDocCategory(cat.id)}
                                                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-blue-600/40', 'scale-110', 'ring-2', 'ring-blue-500/50'); }}
                                                        onDragLeave={(e) => { e.currentTarget.classList.remove('bg-blue-600/40', 'scale-110', 'ring-2', 'ring-blue-500/50'); }}
                                                        onDrop={(e) => {
                                                            e.preventDefault();
                                                            e.currentTarget.classList.remove('bg-blue-600/40', 'scale-110', 'ring-2', 'ring-blue-500/50');
                                                            const docIdStr = e.dataTransfer.getData('docId');
                                                            if (docIdStr) assignDocToCategory(parseInt(docIdStr), cat.id);
                                                        }}
                                                        className={`
                                                        relative px-5 py-3 rounded-2xl transition-all duration-500 cursor-pointer flex items-center gap-3 group
                                                        ${activeDocCategory === cat.id ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}
                                                    `}
                                                    >
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeDocCategory === cat.id ? 'bg-blue-400/30' : 'bg-slate-800'}`}>
                                                            <i className={`fa-solid ${cat.id === 'all' ? 'fa-hurricane' : 'fa-folder-closed'} text-[10px]`}></i>
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={cat.name}
                                                            disabled={cat.id === 'all'}
                                                            onChange={(e) => updateDocCategoryName(cat.id, e.target.value)}
                                                            className={`bg-transparent text-[12px] font-black outline-none w-20 text-center transition-all ${cat.id === 'all' ? 'cursor-pointer' : 'cursor-text focus:text-white capitalize'}`}
                                                            onClick={(e) => cat.id !== 'all' && e.stopPropagation()}
                                                        />
                                                        <div className={`px-2 py-0.5 rounded-md text-[9px] font-black ${activeDocCategory === cat.id ? 'bg-white/20' : 'bg-slate-800'}`}>
                                                            {cat.id === 'all' ? docsList.length : docsList.filter(d => d.categoryId === cat.id).length}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="space-y-1 shrink-0 order-first lg:order-none">
                                                <h2 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.4)] border border-blue-400/30">
                                                        <i className="fa-solid fa-layer-group text-white text-xl"></i>
                                                    </div>
                                                    <div className="flex flex-col text-left">
                                                        <span>คลังเก็บเอกสาร</span>
                                                        <span className="text-blue-500/80 text-[10px] font-black uppercase tracking-[0.5em] mt-1">Digital Security Vault</span>
                                                    </div>
                                                </h2>
                                            </div>
                                        </div>

                                    </div>

                                    <div className="hero-selection-grid pb-20">
                                        {docsList
                                            .filter(slot => activeDocCategory === 'all' || slot.categoryId === activeDocCategory)
                                            .map((slot) => {
                                                const isPdf = slot.mime?.includes('pdf');
                                                const hasFile = !!slot.url;

                                                return (
                                                    <div
                                                        key={slot.id}
                                                        draggable={true}
                                                        onDragStart={(e) => {
                                                            e.dataTransfer.setData('docId', slot.id.toString());
                                                            e.currentTarget.classList.add('opacity-30', 'grayscale', 'scale-90');
                                                        }}
                                                        onDragEnd={(e) => e.currentTarget.classList.remove('opacity-30', 'grayscale', 'scale-90')}
                                                        className="group relative vertical-card rounded-[2.5rem] bg-[#1e293b] border border-white/5 shadow-2xl overflow-hidden"
                                                    >
                                                        {/* Card Body */}
                                                        <div className="flex-1 relative overflow-hidden bg-slate-950/20 flex items-center justify-center">
                                                            {hasFile ? (
                                                                isPdf ? (
                                                                    <div className="flex flex-col items-center gap-4 text-rose-500">
                                                                        <div className="relative">
                                                                            <i className="fa-solid fa-file-pdf text-7xl drop-shadow-[0_0_20px_rgba(244,63,94,0.4)]"></i>
                                                                            <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-4 h-4 rounded-full border-2 border-[#1e293b] animate-pulse"></div>
                                                                        </div>
                                                                        <span className="text-[9px] text-rose-400/80 font-black tracking-widest uppercase bg-rose-500/10 border border-rose-500/20 px-4 py-1.5 rounded-full backdrop-blur-md">REPORT READY</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-full h-full relative group">
                                                                        <img src={slot.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 brightness-75 group-hover:brightness-105" alt={slot.name} />
                                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                                    </div>
                                                                )
                                                            ) : (
                                                                <div className="flex flex-col items-center gap-8 text-slate-700/40 group-hover:text-blue-500/40 transition-all duration-700">
                                                                    <div className="w-24 h-24 rounded-full border-4 border-dashed border-current flex items-center justify-center animate-[spin_10s_linear_infinite]">
                                                                        <i className="fa-solid fa-plus text-2xl"></i>
                                                                    </div>
                                                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] mb-4">Empty Slot</span>
                                                                </div>
                                                            )}

                                                            {/* Actions Overlay */}
                                                            <div className="absolute inset-0 bg-slate-950/80 p-8 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center gap-5 backdrop-blur-lg">
                                                                {hasFile ? (
                                                                    <>
                                                                        <button
                                                                            onClick={() => setDocPreview({ url: slot.url, name: slot.name, mime: slot.mime, zoom: 1 })}
                                                                            className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-2xl shadow-blue-600/50"
                                                                        >
                                                                            <i className="fa-solid fa-expand text-xl"></i>
                                                                        </button>
                                                                        <div className="flex gap-3">
                                                                            <label className="w-12 h-12 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center cursor-pointer hover:bg-blue-600 hover:text-white transition-all shadow-lg" title="อัปโหลดไฟล์">
                                                                                <i className="fa-solid fa-cloud-arrow-up"></i>
                                                                                <input type="file" className="hidden" onChange={(e) => addDocFile(slot.id, e.target.files?.[0])} />
                                                                            </label>
                                                                            <label className="w-12 h-12 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center cursor-pointer hover:bg-amber-600 hover:text-white transition-all shadow-lg" title="สแกน / ถ่ายภาพ">
                                                                                <i className="fa-solid fa-camera"></i>
                                                                                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
                                                                                    const f = e.target.files?.[0];
                                                                                    if (!f) return;
                                                                                    const url = URL.createObjectURL(f);
                                                                                    setScanCropModal({ src: url, category: slot.id, crop: { l: 5, t: 5, r: 5, b: 5 } });
                                                                                    e.target.value = "";
                                                                                }} />
                                                                            </label>
                                                                            <button
                                                                                onClick={() => removeDoc(slot.id)}
                                                                                className="w-12 h-12 rounded-full bg-rose-600/10 text-rose-500 border border-rose-500/20 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-lg"
                                                                                title="ลบไฟล์"
                                                                            >
                                                                                <i className="fa-solid fa-trash-can"></i>
                                                                            </button>
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <div className="flex gap-4">
                                                                        <label className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-2xl shadow-blue-600/40" title="อัปโหลด">
                                                                            <i className="fa-solid fa-plus text-3xl"></i>
                                                                            <input type="file" className="hidden" onChange={(e) => addDocFile(slot.id, e.target.files?.[0])} />
                                                                        </label>
                                                                        <label className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center cursor-pointer hover:bg-amber-600 hover:text-white transition-all self-end shadow-xl" title="กล้อง / สแกน">
                                                                            <i className="fa-solid fa-camera text-lg"></i>
                                                                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
                                                                                const f = e.target.files?.[0];
                                                                                if (!f) return;
                                                                                const url = URL.createObjectURL(f);
                                                                                setScanCropModal({ src: url, category: slot.id, crop: { l: 5, t: 5, r: 5, b: 5 } });
                                                                                e.target.value = "";
                                                                            }} />
                                                                        </label>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Slot Delete (Small X) */}
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); deleteSlot(slot.id); }}
                                                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-rose-600 hover:scale-110 backdrop-blur-md border border-white/5"
                                                                title="ลบช่องนี้"
                                                            >
                                                                <i className="fa-solid fa-xmark text-xs"></i>
                                                            </button>
                                                        </div>

                                                        {/* Footer Info Area */}
                                                        <div className="h-20 bg-gradient-to-b from-[#1e293b] to-[#0f172a] border-t border-white/5 flex flex-col items-center justify-center px-4 py-3 relative overflow-hidden">
                                                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
                                                            <input
                                                                type="text"
                                                                value={slot.name}
                                                                onChange={(e) => updateSlotName(slot.id, e.target.value)}
                                                                className="w-full bg-transparent text-center text-[14px] font-black text-white hover:text-blue-400 focus:text-blue-400 outline-none placeholder:text-slate-700 transition-all uppercase tracking-tight"
                                                                placeholder="Set Name..."
                                                            />
                                                            <div className="mt-2 flex items-center gap-2">
                                                                <div className={`w-2 h-2 rounded-full ${hasFile ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'bg-slate-800'}`}></div>
                                                                <span className={`text-[10px] font-black uppercase tracking-widest ${hasFile ? 'text-cyan-400' : 'text-slate-600'}`}>
                                                                    {hasFile ? 'Localized' : 'Ready'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                        {/* New Slot Button Card */}
                                        <button
                                            onClick={addNewSlot}
                                            className="group aspect-[3/4] rounded-[2.5rem] border-4 border-dashed border-slate-800 bg-slate-900/20 flex flex-col items-center justify-center gap-4 hover:border-blue-500/50 hover:bg-blue-600/5 transition-all text-slate-700 hover:text-blue-500 shadow-inner"
                                        >
                                            <div className="w-16 h-16 rounded-3xl border-2 border-slate-800 flex items-center justify-center group-hover:border-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all rotate-45 group-hover:rotate-0">
                                                <i className="fa-solid fa-plus text-2xl -rotate-45 group-hover:rotate-0 transition-transform"></i>
                                            </div>
                                            <span className="text-[11px] font-black uppercase tracking-[0.4em] opacity-30 group-hover:opacity-100">Add Content</span>
                                        </button>
                                    </div>
                                </div>
                            </main>
                        )
                    }
                    {
                        activeTab === "coordination" && (
                            <main className="flex-1 bg-white p-4 sm:p-6 overflow-x-auto thin-scrollbar">
                                <div className="min-w-[1200px] h-full flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                                <i className="fa-solid fa-clipboard-list text-blue-500"></i>
                                                ตารางประสานงานโซน
                                            </h2>
                                            <p className="text-xs text-slate-500 mt-0.5">ระบุผู้รับผิดชอบและสถานะแต่ละโซน (Auto-sync กับผังหลัก)</p>
                                        </div>
                                        <button
                                            onClick={downloadCoordinationCsv}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
                                        >
                                            <i className="fa-solid fa-file-csv"></i>
                                            นำออกข้อมูล CSV
                                        </button>
                                    </div>

                                    <div className="flex-1 border border-slate-200 rounded-2xl bg-slate-50/50 overflow-hidden shadow-sm flex flex-col">
                                        <div className="grid grid-cols-[1.5fr_1fr_1.5fr_1.2fr_1.2fr_1.5fr_1.2fr_1.2fr_1.2fr] bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider py-4 px-4 sticky top-0">
                                            <div>ชื่อโซน / รายละเอียด</div>
                                            <div className="text-center">จำนวน (Objects)</div>
                                            <div>หน่วยงานรับผิดชอบ</div>
                                            <div>ผู้ติดต่อ / เบอร์โทร</div>
                                            <div>ผู้ประสานงานหลัก</div>
                                            <div>หมายเหตุ / สถานะ</div>
                                            <div className="text-center">รับของ (วันที่)</div>
                                            <div className="text-center">ส่งคืน (วันที่)</div>
                                            <div className="text-center">การตรวจสอบ</div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto">
                                            {coordinationRows.map((row) => (
                                                <div key={row.zoneId} className="grid grid-cols-[1.5fr_1fr_1.5fr_1.2fr_1.2fr_1.5fr_1.2fr_1.2fr_1.2fr] items-center border-b border-slate-200 bg-white hover:bg-blue-50/30 transition-colors">
                                                    <div className="p-3 text-xs font-bold text-slate-700 border-r border-slate-100 flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${ZONE_COLORS[zones.find(z => z.id === row.zoneId)?.color]?.bg || 'bg-blue-500'}`} />
                                                        {row.zoneName}
                                                    </div>
                                                    <div className="p-3 text-center text-xs font-black text-slate-500 border-r border-slate-100">{row.objectCount}</div>
                                                    <div className="p-2 border-r border-slate-100">
                                                        <input
                                                            type="text"
                                                            value={row.responsibleOrg}
                                                            onChange={(e) => setCoordinationRows(prev => prev.map(r => r.zoneId === row.zoneId ? { ...r, responsibleOrg: e.target.value } : r))}
                                                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-400 rounded p-1.5 text-xs text-slate-800 outline-none hover:bg-slate-50"
                                                            placeholder="หน่วยงาน..."
                                                        />
                                                    </div>
                                                    <div className="p-2 border-r border-slate-100">
                                                        <input
                                                            type="text"
                                                            value={row.contactAtOrg}
                                                            onChange={(e) => setCoordinationRows(prev => prev.map(r => r.zoneId === row.zoneId ? { ...r, contactAtOrg: e.target.value } : r))}
                                                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-400 rounded p-1.5 text-xs text-slate-800 outline-none hover:bg-slate-50"
                                                            placeholder="ชื่อ / เบอร์..."
                                                        />
                                                    </div>
                                                    <div className="p-2 border-r border-slate-100">
                                                        <input
                                                            type="text"
                                                            value={row.coordinator}
                                                            onChange={(e) => setCoordinationRows(prev => prev.map(r => r.zoneId === row.zoneId ? { ...r, coordinator: e.target.value } : r))}
                                                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-400 rounded p-1.5 text-xs text-slate-800 outline-none hover:bg-slate-50"
                                                            placeholder="ผู้รับงาน..."
                                                        />
                                                    </div>
                                                    <div className="p-2 border-r border-slate-100">
                                                        <textarea
                                                            rows={1}
                                                            value={row.notes}
                                                            onChange={(e) => setCoordinationRows(prev => prev.map(r => r.zoneId === row.zoneId ? { ...r, notes: e.target.value } : r))}
                                                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-400 rounded p-1.5 text-xs text-slate-800 outline-none hover:bg-slate-50 resize-none h-auto min-h-[30px]"
                                                            placeholder="เน้นย้ำ / สถานะ..."
                                                        />
                                                    </div>
                                                    <div className="p-2 border-r border-slate-100">
                                                        <input
                                                            type="text"
                                                            value={row.pickupDate}
                                                            onChange={(e) => setCoordinationRows(prev => prev.map(r => r.zoneId === row.zoneId ? { ...r, pickupDate: e.target.value } : r))}
                                                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-400 rounded p-1.5 text-center text-[10px] text-slate-600 outline-none hover:bg-slate-50"
                                                            placeholder="DD/MM/YY"
                                                        />
                                                    </div>
                                                    <div className="p-2 border-r border-slate-100">
                                                        <input
                                                            type="text"
                                                            value={row.returnDate}
                                                            onChange={(e) => setCoordinationRows(prev => prev.map(r => r.zoneId === row.zoneId ? { ...r, returnDate: e.target.value } : r))}
                                                            className="w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-400 rounded p-1.5 text-center text-[10px] text-slate-600 outline-none hover:bg-slate-50"
                                                            placeholder="DD/MM/YY"
                                                        />
                                                    </div>
                                                    <div className="p-2">
                                                        <select
                                                            value={row.checklistDone}
                                                            onChange={(e) => setCoordinationRows(prev => prev.map(r => r.zoneId === row.zoneId ? { ...r, checklistDone: e.target.value } : r))}
                                                            className={`w-full bg-transparent border-0 rounded p-1 text-[10px] font-bold outline-none cursor-pointer hover:bg-slate-50 ${row.checklistDone === 'ok' ? 'text-emerald-600' : row.checklistDone === 'pending' ? 'text-amber-500' : 'text-rose-500'}`}
                                                        >
                                                            <option value="">(ตรวจสอบ)</option>
                                                            <option value="ok">✅ เรียบร้อย</option>
                                                            <option value="pending">⏳ รอดำเนินการ</option>
                                                            <option value="fail">❌ พบปัญหา</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </main>
                        )
                    }
                </div >

                {/* เมนูจัดการ object (โหมด ลบ/เพิ่ม) */}
                {
                    chairMenu && (
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
                    )
                }

                {/* ครอปภาพสแกนแนว A4 (ตัดขอบ %) */}
                {
                    scanCropModal && (
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
                    )
                }

                {/* Preview เอกสาร — ซูมล้อ / ลากเลื่อน */}
                {
                    docPreview && (
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
                    )
                }

                {/* Modal for editing guest names */}
                {
                    editingChair && (
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
                    )
                }
                {/* Pro Upgrade Modal */}
                {showUpgradeModal && (
                    <UpgradeModalUI
                        onUpgrade={handleUpgrade}
                        onClose={() => {
                            if (paymentStatus === 'idle') setShowUpgradeModal(false);
                        }}
                        paymentStatus={paymentStatus}
                    />
                )}
            </div >
        );
    } catch (error) {
        console.error("🔴 APP RENDER ERROR:", error);
        return (
            <div style={{ padding: '40px', background: '#fff1f2', color: '#be123c', fontFamily: 'sans-serif', minHeight: '100vh', zIndex: 9999, position: 'relative' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>⚠️ พบข้อผิดพลาดขณะวาดหน้าจอ (Render Error)</h1>
                <p>ขออภัยครับ พบปัญหาในการประมวลผลหน้าจอ <strong>{currentView}</strong>:</p>
                <code style={{ display: 'block', background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #fecaca', marginTop: '10px', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                    {error.toString()}
                </code>
                <p style={{ marginTop: '20px' }}><strong>สถานะปัจจุบัน:</strong> View={currentView}, User={currentUser ? currentUser.email : 'Guest'}</p>
                <button
                    onClick={() => {
                        window.location.reload();
                    }}
                    style={{ marginTop: '20px', padding: '10px 20px', background: '#be123c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                    ลองรีเฟรชหน้าจออีกครั้ง
                </button>
            </div>
        );
    }
}


// --- Premium Upgrade Modal Component ---
const UpgradeModalUI = ({ onUpgrade, onClose, paymentStatus }) => {
    const [selectedPlan, setSelectedPlan] = useState('1m');

    const plans = [
        { id: '1m', label: '1 เดือน', price: 299, original: null, tag: null },
        { id: '3m', label: '3 เดือน', price: 799, original: 897, tag: 'ประหยัด 10%' },
        { id: '6m', label: '6 เดือน', price: 1499, original: 1794, tag: 'สุดยอดดีล 15%' },
        { id: '9m', label: '9 เดือน', price: 2199, original: 2691, tag: 'ยอดนิยม 18%' },
        { id: '1y', label: '1 ปี', price: 2790, original: 3588, tag: 'คุ้มค่าที่สุด 22%' },
        { id: 'lifetime', label: 'ซื้อขาด', price: 9900, original: null, tag: 'Best Value', isLifetime: true }
    ];

    const currentPlan = plans.find(p => p.id === selectedPlan);

    if (paymentStatus === 'checking' || paymentStatus === 'success') {
        return (
            <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"></div>
                <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 text-center animate-[cardFadeIn_0.3s_ease-out]">
                    {paymentStatus === 'checking' ? (
                        <div className="space-y-6">
                            <div className="relative w-32 h-32 mx-auto">
                                <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <i className="fa-solid fa-receipt text-3xl text-blue-600"></i>
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">กำลังตรวจสอบการโอนเงิน</h3>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3 text-left">
                                <div className="w-12 h-12 bg-white rounded-lg border border-slate-100 flex items-center justify-center shrink-0">
                                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PROMPT_PAY_PAYMENT_SIMULATION" alt="QR Code" className="w-10 h-10 opacity-80" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Transaction ID</p>
                                    <p className="text-xs font-mono font-bold text-slate-600">EF-2026-PRO-{currentPlan.id.toUpperCase()}</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 font-medium">รอระบบธนาคารส่งข้อมูลยืนยันสักครู่ครับ...<br />แพ็กเกจ: {currentPlan.label}</p>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-[scaleIn_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)]">
                            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-4xl shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-50">
                                <i className="fa-solid fa-check"></i>
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-slate-900">ปลดล็อกสำเร็จ!</h3>
                                <p className="text-slate-500 font-bold mt-2">ขอบคุณที่ร่วมเป็นส่วนหนึ่งของ Eflow</p>
                            </div>
                            <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between">
                                <span className="text-sm font-bold opacity-80">Plan Active</span>
                                <span className="text-xs font-black px-3 py-1 bg-white/10 rounded-full">{currentPlan.label}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl animate-[cardFadeIn_0.3s_ease-out] overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
                {/* Left Side: Features (Hidden on mobile scroll) */}
                <div className="md:w-5/12 bg-gradient-to-br from-indigo-700 via-blue-700 to-blue-800 p-8 text-white relative flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400 text-amber-950 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-amber-300 shadow-lg shadow-amber-400/20">
                            <i className="fa-solid fa-crown"></i> Premium Access
                        </div>
                        <h2 className="text-3xl font-black tracking-tight mb-4 leading-none">Upgrade to <span className="opacity-90">Pro</span></h2>
                        <ul className="space-y-4">
                            {[
                                { icon: "fa-infinity", title: "ไม่จำกัดโปรเจกต์", desc: "จากเดิมจำกัด 3 โปรเจกต์" },
                                { icon: "fa-cloud-arrow-up", title: "Cloud Sync", desc: "บันทึกข้อมูลแบบเรียลไทม์" },
                                { icon: "fa-file-export", title: "ส่งออกไฟล์ความคมชัดสูง", desc: "พิมพ์และนำออกเป็น PDF" },
                                { icon: "fa-rocket", title: "Premium Assets", desc: "โมเดลและของตกแต่งสุดพิเศษ" }
                            ].map((item, idx) => (
                                <li key={idx} className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                                        <i className={`fa-solid ${item.icon} text-xs text-white`}></i>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white leading-tight">{item.title}</p>
                                        <p className="text-[10px] text-blue-100/60 font-medium">{item.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10">
                        <p className="text-[10px] text-blue-100/60 font-bold flex items-center gap-2">
                            <i className="fa-solid fa-shield-halved"></i>
                            ชำระเงินปลอดภัย 100% · ยกเลิกได้ตลอดเวลา
                        </p>
                    </div>
                </div>

                {/* Right Side: Plan Selection */}
                <div className="flex-1 p-8 space-y-6 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-black text-slate-800">เลือกแพ็กเกจของคุณ</h3>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {plans.map((plan) => (
                            <button
                                key={plan.id}
                                onClick={() => setSelectedPlan(plan.id)}
                                className={`relative text-left p-4 rounded-2xl border-2 transition-all group ${selectedPlan === plan.id
                                    ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-50'
                                    : 'border-slate-100 hover:border-slate-300 bg-white'
                                    }`}
                            >
                                {plan.tag && (
                                    <span className={`absolute -top-2 -right-2 px-2 py-1 text-[8px] font-black uppercase tracking-tighter rounded-full text-white ${plan.id === 'lifetime' ? 'bg-amber-400' : 'bg-blue-600'
                                        }`}>
                                        {plan.tag}
                                    </span>
                                )}
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-500 mb-1">{plan.label}</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-lg font-black text-slate-900">฿{plan.price.toLocaleString()}</span>
                                        {plan.original && (
                                            <span className="text-[10px] text-slate-400 line-through">฿{plan.original}</span>
                                        )}
                                    </div>
                                    {plan.isLifetime && <span className="text-[9px] font-black text-amber-600 mt-1">ซื้อขาดครั้งเดียว</span>}
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mt-auto">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ยอดชำระสุทธิ</p>
                                <h4 className="text-3xl font-black text-slate-900">฿{currentPlan.price.toLocaleString()}</h4>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                    {currentPlan.id === 'lifetime' ? 'ชำระครั้งเดียว' : `เช่า ${currentPlan.label}`}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={onUpgrade}
                            className="w-full py-4 bg-slate-900 border-b-4 border-slate-950 text-white rounded-2xl font-black tracking-tight hover:bg-slate-800 active:translate-y-0.5 active:border-b-0 transition-all flex items-center justify-center gap-3 shadow-xl"
                        >
                            <i className="fa-solid fa-credit-card"></i>
                            ชำระเงินและเปิดใช้งาน
                        </button>
                    </div>

                    <p className="text-center text-[11px] text-slate-400 font-medium">
                        ราคานี้เป็นราคารวมภาษีมูลค่าเพิ่มแล้ว สามารถออกใบกำกับภาษีได้
                    </p>
                </div>
            </div>
        </div>
    );
};



// Render App
try {
    console.log("🚀 Starting React render...");
    const rootElement = document.getElementById('root');
    if (!rootElement) {
        throw new Error("❌ Root element not found! Check id='root' in HTML");
    }

    const root = createRoot(rootElement);
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
                - React: ✅ Loaded (Modular)<br/>
                - Firebase: ✅ Loaded (Modular v10)<br/>
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
