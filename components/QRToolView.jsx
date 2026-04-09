import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

const QRToolView = ({ projectId }) => {
    const [url, setUrl] = useState('');
    const [qrData, setQrData] = useState('');
    const [color, setColor] = useState('#1e293b');
    const [bg, setBg] = useState('#ffffff');
    const [size, setSize] = useState(300);
    const [history, setHistory] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(`eflow_qr_history_${projectId}`) || '[]');
        } catch { return []; }
    });

    useEffect(() => {
        if (!url) {
            setQrData('');
            return;
        }
        generateQR();
    }, [url, color, bg, size]);

    useEffect(() => {
        localStorage.setItem(`eflow_qr_history_${projectId}`, JSON.stringify(history));
    }, [history, projectId]);

    const generateQR = async () => {
        try {
            const data = await QRCode.toDataURL(url, {
                width: size,
                margin: 2,
                color: { dark: color, light: bg }
            });
            setQrData(data);
        } catch (err) {
            console.error(err);
        }
    };

    const saveToHistory = () => {
        if (!url || !qrData) return;
        const newItem = {
            id: Date.now(),
            url,
            data: qrData,
            date: new Date().toISOString()
        };
        setHistory([newItem, ...history].slice(0, 10));
    };

    const downloadQR = () => {
        if (!qrData) return;
        const link = document.createElement('a');
        link.href = qrData;
        link.download = `qr-code-${Date.now()}.png`;
        link.click();
    };

    return (
        <div className="flex-1 overflow-y-auto bg-[#f5f5f7]">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-8 py-5">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    📱 QR Code Generator
                    <span className="text-[10px] bg-blue-100 text-blue-600 font-black px-2 py-1 rounded-full uppercase tracking-wider">Workspace Tool</span>
                </h2>
                <p className="text-sm text-slate-400 font-medium">สร้าง QR Code สำหรับลิงก์ลงทะเบียน, แบบสำรวจ หรือข้อมูลแนะนำงาน</p>
            </div>

            <div className="p-6 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Controls */}
                <div className="space-y-5">
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                        <p className="text-sm font-black text-slate-700 mb-3">ใส่ลิงก์หรือข้อความ</p>
                        <textarea
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://google.com/forms/your-survey"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none resize-none focus:border-blue-400 focus:bg-white transition leading-relaxed"
                            rows={3}
                        />

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 mb-1">สีของ QR Code</p>
                                <div className="flex gap-2 items-center">
                                    <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent overflow-hidden" />
                                    <span className="text-xs font-mono text-slate-500 uppercase">{color}</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 mb-1">สีพื้นหลัง</p>
                                <div className="flex gap-2 items-center">
                                    <input type="color" value={bg} onChange={e => setBg(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent overflow-hidden" />
                                    <span className="text-xs font-mono text-slate-500 uppercase">{bg}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button onClick={downloadQR} disabled={!qrData}
                                className={`flex-1 py-3 font-black text-sm rounded-xl transition flex items-center justify-center gap-2 ${!qrData ? 'bg-slate-100 text-slate-300' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                                <i className="fa-solid fa-download" /> ดาวน์โหลด PNG
                            </button>
                            <button onClick={saveToHistory} disabled={!qrData}
                                className={`px-5 py-3 font-black text-sm rounded-xl border border-slate-200 transition ${!qrData ? 'bg-slate-50 text-slate-300' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                                <i className="fa-solid fa-bookmark" />
                            </button>
                        </div>
                    </div>

                    {/* Quick Labels */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                        <p className="text-sm font-black text-slate-700 mb-3">ตัวอย่างการใช้งาน</p>
                        <div className="space-y-2">
                            {[
                                { t: 'แบบสำรวจ Feedback', l: 'https://docs.google.com/forms/...' },
                                { t: 'ลิงก์ลงทะเบียนหน้างาน', l: 'https://event-labs.com/reg/...' },
                                { t: 'WiFi Password', l: 'JOIN OUR GUEST WIFI' },
                            ].map(item => (
                                <button key={item.t} onClick={() => setUrl(item.l)}
                                    className="w-full p-3 text-left bg-slate-50 hover:bg-blue-50 border border-slate-100 rounded-xl group transition">
                                    <p className="text-xs font-black text-slate-700 group-hover:text-blue-700">{item.t}</p>
                                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.l}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div className="space-y-5">
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                        {qrData ? (
                            <div className="animate-in fade-in zoom-in duration-300">
                                <img src={qrData} alt="QR Code" className="w-64 h-64 shadow-xl border-4 border-white rounded-2xl" />
                                <p className="text-center text-[10px] font-black text-slate-400 mt-6 uppercase tracking-widest">Preview ขนาดจริง {size}px</p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="w-48 h-48 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200 mx-auto mb-4">
                                    <i className="fa-solid fa-qrcode text-4xl text-slate-200" />
                                </div>
                                <p className="text-sm font-bold text-slate-300">ใส่ลิงก์เพื่อสร้าง QR Code</p>
                            </div>
                        )}
                    </div>

                    {/* History */}
                    {history.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                            <p className="text-sm font-black text-slate-700 mb-3">ประวัติล่าสุด</p>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {history.map(item => (
                                    <div key={item.id} className="w-20 shrink-0 group cursor-pointer" onClick={() => setUrl(item.url)}>
                                        <div className="w-20 h-20 bg-slate-50 rounded-lg overflow-hidden border border-slate-100 group-hover:border-blue-300 transition">
                                            <img src={item.data} alt="QR" className="w-full h-full object-cover" />
                                        </div>
                                        <p className="text-[8px] font-bold text-slate-400 mt-1 truncate">{new Date(item.date).toLocaleDateString('th-TH')}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QRToolView;
