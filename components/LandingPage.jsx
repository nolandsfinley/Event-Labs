import React, { useState } from 'react';

const RENTAL_PLANS = [
    { id: '1m', label: '1 เดือน', months: 1, price: 299, original: null, tag: null },
    { id: '3m', label: '3 เดือน', months: 3, price: 799, original: 897, tag: 'ประหยัด 10%' },
    { id: '6m', label: '6 เดือน', months: 6, price: 1499, original: 1794, tag: 'คุ้มค่า 16%' },
    { id: '9m', label: '9 เดือน', months: 9, price: 2199, original: 2691, tag: 'ยอดนิยม 18%' },
    { id: '1y', label: '1 ปี', months: 12, price: 2790, original: 3588, tag: 'คุ้มสุด 22%' },
];

const COMPARE_FEATURES = [
    { label: 'จำนวนโปรเจกต์', starter: '3 โปรเจกต์', pro: 'ไม่จำกัด', lifetime: 'ไม่จำกัด' },
    { label: 'อัปโหลดเอกสาร', starter: '5 สล็อต/โปรเจกต์', pro: 'ไม่จำกัด', lifetime: 'ไม่จำกัด' },
    { label: 'เครื่องมือวาดพื้นฐาน', starter: true, pro: true, lifetime: true },
    { label: 'Cloud Real-time Sync', starter: false, pro: true, lifetime: true },
    { label: 'ส่งออก PDF ความคมชัดสูง', starter: false, pro: true, lifetime: true },
    { label: 'คลังเอกสาร (Document Archive)', starter: false, pro: true, lifetime: true },
    { label: 'ตารางประสานงาน (Coordination)', starter: false, pro: true, lifetime: true },
    { label: 'ระบบจัดการแขก (Guest Names)', starter: false, pro: true, lifetime: true },
    { label: 'Premium Assets', starter: false, pro: true, lifetime: true },
    { label: 'Priority Support', starter: false, pro: false, lifetime: true },
    { label: 'อัปเดตฟรีตลอดอายุการใช้งาน', starter: false, pro: false, lifetime: true },
];

const FAQS = [
    {
        q: 'ยกเลิกแพ็กเกจได้ไหม?',
        a: 'ได้ครับ สำหรับ Pro Rental สามารถยกเลิกได้ตลอดเวลา ระบบจะไม่ต่ออายุอัตโนมัติ ข้อมูลโปรเจกต์จะยังคงอยู่แต่จะถูกจำกัดเป็น Starter หลังหมดอายุ'
    },
    {
        q: 'ชำระเงินผ่านช่องทางไหนได้บ้าง?',
        a: 'รองรับ PromptPay, บัตรเครดิต/เดบิต (Visa, Mastercard), และ QR Payment ธนาคารชั้นนำทุกแห่งในไทย'
    },
    {
        q: 'ต่ออายุอัตโนมัติหรือเปล่า?',
        a: 'ไม่ครับ ระบบจะแจ้งเตือนทาง Email 7 วันก่อนหมดอายุ คุณสามารถเลือกต่ออายุหรือเลือกระยะเวลาใหม่ได้เอง'
    },
    {
        q: 'ข้อมูลโปรเจกต์จะหายไหมหากไม่ต่ออายุ?',
        a: 'ข้อมูลจะถูกเก็บรักษาไว้ 90 วันหลังหมดอายุ และจะถูกจำกัดการเข้าถึงบางฟีเจอร์ หากต่ออายุภายใน 90 วัน ข้อมูลทั้งหมดจะกลับมาครบ'
    },
    {
        q: 'Pro Lifetime แตกต่างจาก Pro Rental อย่างไร?',
        a: 'Pro Lifetime จ่ายครั้งเดียวแล้วใช้งานได้ตลอดชีพ รวมถึงได้รับ Priority Support และอัปเดตฟีเจอร์ใหม่ฟรีตลอด ไม่มีค่าใช้จ่ายเพิ่มเติมในอนาคต'
    },
    {
        q: 'มีนโยบายคืนเงินไหม?',
        a: 'มีครับ หากพบปัญหาทางเทคนิคที่เราไม่สามารถแก้ไขได้ภายใน 7 วันหลังสมัคร ยินดีคืนเงินเต็มจำนวนโดยไม่มีเงื่อนไข'
    },
];

const LandingPage = ({
    loginEmail, setLoginEmail,
    loginPassword, setLoginPassword,
    showPassword, setShowPassword,
    isSignUp, setIsSignUp,
    loading, error,
    handleLogin,
    handleGoogleSignIn,
    showMobileMenu, setShowMobileMenu
}) => {
    const [selectedRental, setSelectedRental] = useState('1m');
    const [openFaq, setOpenFaq] = useState(null);
    const rentalPlan = RENTAL_PLANS.find(p => p.id === selectedRental);

    const CellValue = ({ val }) => {
        if (val === true) return <i className="fa-solid fa-circle-check text-blue-500 text-lg"></i>;
        if (val === false) return <i className="fa-solid fa-circle-xmark text-slate-300 text-lg"></i>;
        return <span className="text-xs font-bold text-slate-700">{val}</span>;
    };

    return (
        <div className="w-full min-h-screen bg-white font-sans text-slate-900 select-none">
            {/* Sticky Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <i className="fa-solid fa-water text-white text-lg"></i>
                        </div>
                        <span className="text-2xl font-black tracking-tighter text-slate-900">Eflow</span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">Features</a>
                        <a href="#pricing" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">Pricing</a>
                        <button
                            onClick={() => document.getElementById('auth-form')?.scrollIntoView({ behavior: 'smooth' })}
                            className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-full hover:bg-slate-800 transition-all active:scale-95"
                        >
                            Get Started
                        </button>
                    </div>

                    {/* Mobile Hamburger */}
                    <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="md:hidden w-10 h-10 flex items-center justify-center text-slate-900">
                        <i className={`fa-solid ${showMobileMenu ? 'fa-xmark' : 'fa-bars'} text-xl`}></i>
                    </button>
                </div>

                {/* Mobile Side Menu Overlay */}
                {showMobileMenu && (
                    <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-100 p-6 flex flex-col gap-6 shadow-xl animate-fade-in">
                        <a href="#features" onClick={() => setShowMobileMenu(false)} className="text-lg font-bold text-slate-600">Features</a>
                        <a href="#pricing" onClick={() => setShowMobileMenu(false)} className="text-lg font-bold text-slate-600">Pricing</a>
                        <button
                            onClick={() => {
                                setShowMobileMenu(false);
                                document.getElementById('auth-form')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl"
                        >
                            Get Started
                        </button>
                    </div>
                )}
            </nav>

            {/* Section 1: Hero & Login */}
            <section className="min-h-screen flex flex-col md:flex-row relative pt-20">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50 -z-10 hidden md:block"></div>
                <div className="absolute top-40 left-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl -z-10 animate-pulse"></div>

                {/* Left Side: Value Prop */}
                <div className="flex-1 flex flex-col justify-center px-10 md:px-20 py-20">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest mb-8 border border-blue-100">
                        <i className="fa-solid fa-bolt-lightning"></i> AI-Powered Event Design
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tight mb-8 leading-[0.9]">
                        Elevate Your <br />
                        <span className="hero-gradient-text">Event Flow.</span>
                    </h1>
                    <p className="text-xl text-slate-600 mb-12 max-w-lg leading-relaxed font-medium">
                        แพลตฟอร์มการวาดและจัดการพื้นที่งานอีเวนต์ ปรับมุมหมุนโซน 360 องศา วางตำแหน่งเก้าอี้ พร้อมซิงก์ข้อมูลขึ้นคลาวด์แบบเรียลไทม์
                    </p>
                    <div className="flex flex-wrap items-center gap-8 mb-12">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center border border-green-100">
                                <i className="fa-solid fa-check"></i>
                            </div>
                            <span className="text-sm font-bold text-slate-700">Smart Zoom &amp; Pan</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center border border-green-100">
                                <i className="fa-solid fa-check"></i>
                            </div>
                            <span className="text-sm font-bold text-slate-700">Local &amp; Cloud Sync</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-slate-200 overflow-hidden ring-1 ring-slate-100">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="user" />
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1 text-amber-400">
                                {[1, 2, 3, 4, 5].map(i => <i key={i} className="fa-solid fa-star text-[10px]"></i>)}
                            </div>
                            <span className="text-[12px] font-bold text-slate-500">Trusted by over 1k Professionals</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div id="auth-form" className="flex-1 flex items-center justify-center p-10 bg-slate-50 md:bg-transparent">
                    <div className="w-full max-w-md bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 animate-fade-in relative overflow-hidden">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-2">ยินดีต้อนรับ</h2>
                            <p className="text-slate-500 font-medium">เข้าสู่ระบบ Eflow ของคุณ</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-3">
                                <i className="fa-solid fa-circle-exclamation text-lg"></i>
                                {error}
                            </div>
                        )}

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Email Identity</label>
                                <div className="relative group">
                                    <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"></i>
                                    <input
                                        type="email"
                                        placeholder="name@company.com"
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">Secure Passkey</label>
                                <div className="relative group">
                                    <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"></i>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                                    />
                                    <button
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                                    >
                                        <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleLogin}
                                disabled={loading}
                                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black tracking-tight hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
                            >
                                {loading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-arrow-right-to-bracket"></i>}
                                {isSignUp ? 'สร้างบัญชีผู้ใช้' : 'เข้าสู่ระบบ'}
                            </button>

                            <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-slate-400 font-bold tracking-widest uppercase">หรือใช้ระบบ Social</span></div>
                            </div>

                            <button
                                onClick={handleGoogleSignIn}
                                className="w-full py-4 bg-white border border-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-3"
                            >
                                <img src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" className="w-5 h-5" alt="google" />
                                Continue with Google
                            </button>
                        </div>

                        <p className="mt-10 text-center text-sm font-bold text-slate-400">
                            {isSignUp ? 'มีบัญชีอยู่แล้ว?' : 'ยังไม่มีบัญชี?'}
                            <button onClick={() => setIsSignUp(!isSignUp)} className="ml-2 text-blue-600 hover:underline">
                                {isSignUp ? 'เข้าสู่ระบบ' : 'เริ่มสร้างบัญชีฟรี'}
                            </button>
                        </p>
                    </div>
                </div>
            </section>

            {/* Section 2: Features */}
            <section id="features" className="landing-section bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-sm font-black text-blue-600 uppercase tracking-[0.4em] mb-4">Core Capabilities</h2>
                        <h3 className="text-5xl font-black text-slate-900 tracking-tight">Everything you need for <br /> Perfect Event Planning</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="feature-card group">
                            <div className="feature-icon-wrapper">
                                <i className="fa-solid fa-rotate"></i>
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 mb-4">360° Zone Control</h4>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                ปรับทิศทางและมุมหมุนของพื้นที่งานได้อย่างอิสระ พร้อมระบบ Smart Snapping ช่วยให้การจัดวางแม่นยำขึ้น
                            </p>
                        </div>
                        <div className="feature-card group">
                            <div className="feature-icon-wrapper" style={{ background: '#fef2f2', color: '#ef4444' }}>
                                <i className="fa-solid fa-cloud-arrow-up"></i>
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 mb-4">Real-time Cloud Sync</h4>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                ทำงานร่วมกับทีมได้ทุกที่ ข้อมูลซิงก์ขึ้น Cloud อัตโนมัติ ป้องกันข้อมูลสูญหายด้วยระบบ Hybrid Storage
                            </p>
                        </div>
                        <div className="feature-card group">
                            <div className="feature-icon-wrapper" style={{ background: '#f0fdf4', color: '#22c55e' }}>
                                <i className="fa-solid fa-file-pdf"></i>
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 mb-4">Cinematic Export</h4>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                นำออกไฟล์งานเป็น PDF คุณภาพสูง พร้อม Layout ที่สวยงามระดับมืออาชีพ เหมาะสำหรับนำเสนอในที่ประชุม
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 3: Pricing */}
            <section id="pricing" className="landing-section bg-slate-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-sm font-black text-blue-600 uppercase tracking-[0.4em] mb-4">Pricing Plans</h2>
                        <h3 className="text-5xl font-black text-slate-900 tracking-tight">Start Free, Upgrade for Power</h3>
                        <p className="text-slate-500 font-medium mt-4 text-lg">ไม่มีค่าธรรมเนียมซ่อน · ยกเลิกได้ตลอดเวลา · คืนเงินภายใน 7 วัน</p>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">

                        {/* Free / Starter Plan */}
                        <div className="pricing-card group flex flex-col justify-between">
                            <div>
                                <div className="mb-8">
                                    <h4 className="text-lg font-black text-slate-400 uppercase tracking-widest mb-2">Starter</h4>
                                    <div className="flex items-baseline gap-1 mb-1">
                                        <span className="text-5xl font-black text-slate-900">฿0</span>
                                        <span className="text-slate-400 font-bold">/เดือน</span>
                                    </div>
                                    <p className="text-slate-400 text-xs font-bold">ฟรีตลอดไป ไม่ต้องใช้บัตรเครดิต</p>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    {[
                                        { text: 'สร้างได้สูงสุด 3 โปรเจกต์', ok: true },
                                        { text: 'อัปโหลดไฟล์ 5 สล็อต/โปรเจกต์', ok: true },
                                        { text: 'เครื่องมือวาดหลัก', ok: true },
                                        { text: 'Cloud Real-time Sync', ok: false },
                                        { text: 'ส่งออก PDF ความคมชัดสูง', ok: false },
                                        { text: 'คลังเอกสาร & ประสานงาน', ok: false },
                                    ].map((item, i) => (
                                        <li key={i} className={`flex items-center gap-3 font-bold text-sm ${item.ok ? 'text-slate-700' : 'text-slate-300'}`}>
                                            <i className={`fa-solid ${item.ok ? 'fa-circle-check text-green-500' : 'fa-circle-xmark text-slate-200'} flex-shrink-0`}></i>
                                            {item.text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-full py-4 border-2 border-slate-900 text-slate-900 rounded-2xl font-black tracking-tight hover:bg-slate-900 hover:text-white transition-all">
                                เริ่มใช้ฟรี
                            </button>
                        </div>

                        {/* Pro Rental */}
                        <div className="pricing-card premium group flex flex-col justify-between relative overflow-hidden lg:col-span-2">
                            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-bl-2xl">Rental Options</div>
                            <div>
                                <div className="mb-6">
                                    <h4 className="text-lg font-black text-blue-400 uppercase tracking-widest mb-3">Pro Rental</h4>

                                    {/* Duration Pill Selector */}
                                    <div className="flex flex-wrap gap-2 mb-5">
                                        {RENTAL_PLANS.map((plan) => (
                                            <button
                                                key={plan.id}
                                                onClick={() => setSelectedRental(plan.id)}
                                                className={`relative py-2 px-5 rounded-xl text-xs font-black transition-all duration-200 border ${
                                                    selectedRental === plan.id
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/30 scale-105'
                                                        : 'text-slate-400 border-white/10 hover:text-white hover:bg-white/10 hover:border-white/20'
                                                }`}
                                            >
                                                {plan.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Dynamic Price Display */}
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                                        <div className="flex items-baseline gap-3">
                                            <span className="text-5xl font-black text-white">฿{rentalPlan.price.toLocaleString()}</span>
                                            {rentalPlan.original && (
                                                <span className="text-slate-500 text-base line-through">฿{rentalPlan.original.toLocaleString()}</span>
                                            )}
                                            {rentalPlan.tag && (
                                                <span className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase rounded-xl tracking-tight shadow-lg whitespace-nowrap">
                                                    {rentalPlan.tag}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-blue-300/50 text-sm font-bold">
                                            ≈ ฿{Math.round(rentalPlan.price / rentalPlan.months).toLocaleString()} / เดือน &middot; ระยะเวลา {rentalPlan.label}
                                        </p>
                                    </div>
                                </div>

                                {/* Feature Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mb-8">
                                    {[
                                        'ไม่จำกัดจำนวนโปรเจกต์',
                                        'Cloud Real-time Sync',
                                        'ส่งออก PDF ความคมชัดสูง',
                                        'คลังเอกสาร (Document Archive)',
                                        'ตารางประสานงาน',
                                        'ระบบจัดการแขก (Guest Names)',
                                        'อัปโหลดเอกสารไม่จำกัด',
                                        'Premium Visual Assets',
                                    ].map((feat, i) => (
                                        <div key={i} className="flex items-center gap-3 text-slate-300 font-bold text-sm">
                                            <i className="fa-solid fa-circle-check text-blue-500 flex-shrink-0"></i>
                                            {feat}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black tracking-tight hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/40">
                                เลือกแพ็กเกจ {rentalPlan.label}
                            </button>
                        </div>

                        {/* Lifetime Plan - Full Width */}
                        <div className="pricing-card group border-4 border-amber-400 flex flex-col justify-between bg-slate-900 relative lg:col-span-3">
                            <div className="absolute -top-4 left-8 bg-amber-400 text-slate-900 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                                <i className="fa-solid fa-crown text-[8px]"></i> One-Time Purchase · Best Value
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 pt-4">
                                <div className="md:w-1/4">
                                    <h4 className="text-lg font-black text-amber-400 uppercase tracking-widest mb-2">Pro Lifetime</h4>
                                    <div className="flex items-baseline gap-2 mb-2">
                                        <span className="text-5xl font-black text-white">฿9,900</span>
                                    </div>
                                    <p className="text-amber-400/50 text-xs font-bold uppercase tracking-tighter mb-3">จ่ายครั้งเดียวจบ ใช้งานได้ตลอดชีพ</p>
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-400/10 border border-amber-400/20 rounded-lg text-amber-300 text-[10px] font-black">
                                        <i className="fa-solid fa-calculator"></i>
                                        เทียบเท่า ฿275/เดือน ตลอด 3 ปี
                                    </div>
                                </div>
                                <div className="md:w-2/4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { icon: 'fa-infinity', text: 'ทุกฟีเจอร์ของ Pro ครบ' },
                                        { icon: 'fa-arrows-rotate', text: 'อัปเดตฟรีตลอดอายุการใช้งาน' },
                                        { icon: 'fa-headset', text: 'Priority Support 24/7' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center flex-shrink-0">
                                                <i className={`fa-solid ${item.icon} text-amber-400 text-xs`}></i>
                                            </div>
                                            <span className="text-white font-bold text-sm">{item.text}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="md:w-1/4 flex md:justify-end">
                                    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-full md:w-auto px-10 py-4 bg-amber-400 text-slate-900 rounded-2xl font-black tracking-tight hover:bg-amber-300 transition-all whitespace-nowrap shadow-lg shadow-amber-400/20">
                                        Buy Once, Own Forever
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Trust Badges */}
                    <div className="flex flex-wrap items-center justify-center gap-8 mt-12 pt-8 border-t border-slate-200">
                        {[
                            { icon: 'fa-shield-halved', text: 'ชำระเงินปลอดภัย 100%', sub: 'SSL Encrypted' },
                            { icon: 'fa-rotate-left', text: 'คืนเงินภายใน 7 วัน', sub: 'ไม่มีเงื่อนไข' },
                            { icon: 'fa-ban', text: 'ยกเลิกได้ตลอดเวลา', sub: 'ไม่มีค่าปรับ' },
                            { icon: 'fa-qrcode', text: 'รองรับ PromptPay', sub: 'บัตรเครดิต / QR' },
                        ].map((b, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                    <i className={`fa-solid ${b.icon} text-slate-400`}></i>
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-700">{b.text}</p>
                                    <p className="text-[11px] font-bold text-slate-400">{b.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Feature Comparison Table */}
                    <div className="mt-20">
                        <div className="text-center mb-10">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">เปรียบเทียบแพ็กเกจ</h3>
                            <p className="text-slate-500 font-medium mt-2">ดูความแตกต่างของแต่ละแผนแบบชัดเจน</p>
                        </div>
                        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-lg">
                            {/* Header */}
                            <div className="grid grid-cols-4 bg-slate-900 text-white">
                                <div className="p-5 text-sm font-black text-slate-400 uppercase tracking-widest">ฟีเจอร์</div>
                                <div className="p-5 text-center border-l border-white/5">
                                    <p className="text-xs font-black text-slate-400 uppercase">Starter</p>
                                    <p className="text-xl font-black text-white mt-1">ฟรี</p>
                                </div>
                                <div className="p-5 text-center border-l border-white/5 bg-blue-600/10">
                                    <p className="text-xs font-black text-blue-400 uppercase">Pro Rental</p>
                                    <p className="text-xl font-black text-white mt-1">฿299<span className="text-xs font-bold text-slate-400">/เดือน</span></p>
                                </div>
                                <div className="p-5 text-center border-l border-white/5 bg-amber-500/10">
                                    <p className="text-xs font-black text-amber-400 uppercase">Lifetime</p>
                                    <p className="text-xl font-black text-white mt-1">฿9,900</p>
                                </div>
                            </div>
                            {/* Rows */}
                            {COMPARE_FEATURES.map((feat, i) => (
                                <div key={i} className={`grid grid-cols-4 border-b border-slate-100 last:border-b-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                    <div className="p-4 text-sm font-bold text-slate-700">{feat.label}</div>
                                    <div className="p-4 flex items-center justify-center border-l border-slate-100">
                                        <CellValue val={feat.starter} />
                                    </div>
                                    <div className="p-4 flex items-center justify-center border-l border-slate-100 bg-blue-50/30">
                                        <CellValue val={feat.pro} />
                                    </div>
                                    <div className="p-4 flex items-center justify-center border-l border-slate-100 bg-amber-50/30">
                                        <CellValue val={feat.lifetime} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* FAQ Section */}
                    <div className="mt-20 max-w-3xl mx-auto">
                        <div className="text-center mb-10">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">คำถามที่พบบ่อย</h3>
                            <p className="text-slate-500 font-medium mt-2">หากมีคำถามเพิ่มเติม ติดต่อเราได้ตลอดเวลา</p>
                        </div>
                        <div className="space-y-3">
                            {FAQS.map((faq, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                    <button
                                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                        className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
                                    >
                                        <span className="font-black text-slate-900 pr-4">{faq.q}</span>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${openFaq === i ? 'bg-blue-600 rotate-45' : 'bg-slate-100'}`}>
                                            <i className={`fa-solid fa-plus text-xs ${openFaq === i ? 'text-white' : 'text-slate-500'}`}></i>
                                        </div>
                                    </button>
                                    {openFaq === i && (
                                        <div className="px-6 pb-6 text-slate-600 font-medium leading-relaxed border-t border-slate-100 pt-4 animate-fade-in">
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom CTA Banner */}
                    <div className="mt-20 bg-slate-900 rounded-3xl p-12 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 pointer-events-none"></div>
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-blue-600/20">
                                <i className="fa-solid fa-bolt-lightning"></i> ยังลังเลอยู่?
                            </div>
                            <h3 className="text-4xl font-black text-white tracking-tight mb-4">ลองใช้ฟรีก่อนได้เลย</h3>
                            <p className="text-slate-400 font-medium mb-8 max-w-lg mx-auto">
                                ไม่ต้องใช้บัตรเครดิต · สร้างโปรเจกต์ได้ 3 อัน · เริ่มวางแผนงานได้ทันที
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-4">
                                <button
                                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                    className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black tracking-tight hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/30 active:scale-95"
                                >
                                    <i className="fa-solid fa-arrow-right-to-bracket mr-2"></i>
                                    เริ่มใช้งานฟรี
                                </button>
                                <a href="#pricing" className="px-8 py-4 border border-white/10 text-slate-300 rounded-2xl font-black hover:bg-white/5 transition-all">
                                    ดูแพ็กเกจ Pro
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
