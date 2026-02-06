import React, { useState } from 'react';
import grassImg from '../assets/grass/grass.png';

const HomeScreen = ({ onHost, onJoin }) => {
    const [view, setView] = useState('menu'); // menu, host, join
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [raceLength, setRaceLength] = useState('500m');
    const [copied, setCopied] = useState(false);

    const requestLandscape = async () => {
        try {
            // 1. Try to enter fullscreen if not already (often required for orientation lock)
            const doc = document.documentElement;
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                if (doc.requestFullscreen) await doc.requestFullscreen().catch(() => { });
                else if (doc.webkitRequestFullscreen) doc.webkitRequestFullscreen();
            }

            // 2. Try to lock orientation to landscape
            if (screen.orientation && screen.orientation.lock) {
                await screen.orientation.lock('landscape').catch(err => {
                    console.warn("Orientation lock failed:", err);
                });
            } else if (screen.lockOrientation) {
                screen.lockOrientation('landscape');
            } else if (screen.webkitLockOrientation) {
                screen.webkitLockOrientation('landscape');
            } else if (screen.mozLockOrientation) {
                screen.mozLockOrientation('landscape');
            }
        } catch (err) {
            console.warn("Orientation request error:", err);
        }
    };

    const toggleFullscreen = () => {
        const doc = document.documentElement;
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            // Standard Fullscreen API
            if (doc.requestFullscreen) {
                doc.requestFullscreen().catch(err => console.warn(err));
            }
            // iOS/Safari Fallback: Pseudo-Fullscreen
            else if (doc.webkitRequestFullscreen) {
                doc.webkitRequestFullscreen();
            } else {
                // If native API is completely unavailable (like iPhone), use our CSS-based fallback
                document.body.classList.toggle('ios-pseudo-fullscreen');
                window.scrollTo(0, 0);
            }
            // Also try to lock landscape when maximizing
            requestLandscape();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else {
                document.body.classList.remove('ios-pseudo-fullscreen');
            }
        }
    };

    // Dynamic Title sizing: Shorter when in sub-menus or landscape
    const isMainLogo = view === 'menu';
    const titleStyle = `font-black tracking-tighter text-black drop-shadow-sm leading-[0.85] transition-all duration-300 
        ${isMainLogo ? 'text-6xl md:text-8xl lg:text-9xl mb-6 md:mb-0 lg:text-left text-center' : 'text-3xl md:text-5xl mb-4 md:mb-6 lg:text-left text-center'} 
        landscape:text-left landscape:mb-0 landscape:text-5xl lg:landscape:text-7xl`;

    const cardStyle = "sketch-card w-full max-w-sm flex flex-col gap-6 items-center animate-fade-in py-8 px-8 z-20 landscape:py-4 landscape:gap-3 max-h-[85vh] landscape:max-h-[85dvh] overflow-y-auto custom-scrollbar";
    const inputStyle = "w-full bg-transparent border-b-[3px] border-ink px-4 py-2 text-2xl font-black placeholder-gray-300 outline-none focus:border-marker transition-all uppercase text-center";

    // Primary vs Secondary Button Styles
    const primaryButtonStyle = "btn-ink bg-marker text-paper border-ink hover:bg-black hover:text-white transition-all active:scale-95 text-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)]";
    const secondaryButtonStyle = "btn-ink bg-white text-ink border-ink transition-all active:scale-95 text-2xl opacity-95 hover:opacity-100 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.05)]";

    const backButtonStyle = "text-sm font-black border-b-2 border-transparent hover:border-marker transition-all mt-4 uppercase tracking-widest opacity-60 hover:opacity-100 cursor-pointer";

    const renderMenu = () => (
        <div className={cardStyle}>
            <div className="w-full space-y-4 landscape:space-y-3">
                <button onClick={() => setView('host')} className={primaryButtonStyle}>
                    HOST GAME
                </button>
                <button onClick={() => setView('join')} className={secondaryButtonStyle}>
                    JOIN GAME
                </button>
            </div>
            <p className="text-[10px] font-bold opacity-30 mt-2 uppercase tracking-[0.2em] landscape:hidden">Multiplayer Stickman Racing</p>
        </div>
    );

    const renderHost = () => (
        <div className={cardStyle}>
            <div className="flex flex-col items-center gap-1 mb-1">
                <h2 className="text-2xl font-black border-b-4 border-marker leading-tight">HOST ROOM</h2>
                <p className="text-[9px] font-bold opacity-50 uppercase tracking-widest">Setup your race</p>
            </div>

            <div className="w-full space-y-1">
                <label className="text-[9px] font-black uppercase text-marker tracking-tighter ml-1">Captain Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ENTER NAME"
                    className={inputStyle}
                    maxLength={12}
                    autoFocus
                />
            </div>

            <div className="w-full space-y-2 mt-1">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-50 text-center">Race Length</p>
                <div className="flex gap-2 justify-center">
                    {['500m', '1500m', '3000m'].map(len => (
                        <button
                            key={len}
                            onClick={() => setRaceLength(len)}
                            className={`flex-1 min-w-[60px] py-2 border-2 font-black text-xs transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] active:translate-y-[1px] active:shadow-none
                                ${raceLength === len ? 'bg-ink text-paper border-ink' : 'bg-white text-ink border-gray-200'}`}
                        >
                            {len}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={() => {
                    if (name) {
                        onHost(name, raceLength);
                    }
                }}
                disabled={!name}
                className={`${primaryButtonStyle} mt-2 w-full ${!name ? 'opacity-20 grayscale pointer-events-none' : ''}`}
            >
                START ROOM
            </button>

            <button onClick={() => setView('menu')} className={backButtonStyle}>
                ← Back to Menu
            </button>
        </div>
    );

    const renderJoin = () => (
        <div className={cardStyle}>
            <div className="flex flex-col items-center gap-1 mb-1">
                <h2 className="text-2xl font-black border-b-4 border-marker leading-tight">JOIN RACE</h2>
                <p className="text-[9px] font-bold opacity-50 uppercase tracking-widest">Enter room details</p>
            </div>

            <div className="w-full space-y-3 landscape:space-y-2">
                <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-marker tracking-tighter ml-1">Athlete Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="ENTER NAME"
                        className={inputStyle}
                        maxLength={12}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-marker tracking-tighter ml-1">Room Code</label>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="CODE"
                        className={inputStyle}
                        maxLength={4}
                    />
                </div>
            </div>

            <button
                onClick={() => {
                    if (name && code) {
                        onJoin(name, code);
                    }
                }}
                disabled={!name || !code}
                className={`${primaryButtonStyle} mt-2 w-full ${!name || !code ? 'opacity-20 grayscale pointer-events-none' : ''}`}
            >
                JOIN RACE
            </button>

            <button onClick={() => setView('menu')} className={backButtonStyle}>
                ← Back to Menu
            </button>
        </div>
    );

    return (
        <div className="sketch-ui-root w-full h-full min-h-screen flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden bg-transparent">
            {/* Cinematic Vignette (Preserved) */}
            <div className="vignette-overlay" />

            {/* Top Right Controls - Fullscreen */}
            <div className="absolute top-4 right-4 z-[var(--z-overlay)] pointer-events-none">
                <button
                    onClick={toggleFullscreen}
                    className="btn-ink !w-auto pointer-events-auto bg-white/50 text-ink border-ink text-[10px] px-3 py-1.5 hover:bg-white transform -rotate-1 transition-all active:scale-95 shadow-sm font-black tracking-widest"
                    style={{ minHeight: 'auto' }}
                >
                    MAXIMIZE
                </button>
            </div>

            {/* Decorative Assets - Providing Grounded "Stage" Feel */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-[var(--z-bg)]">
                {/* Left Grass */}
                <img
                    src={grassImg}
                    alt=""
                    className="absolute -left-16 bottom-0 h-48 sm:h-64 md:h-80 lg:h-96 w-auto opacity-20 sm:opacity-40 select-none -scale-x-100 translate-y-4"
                />
                {/* Right Grass */}
                <img
                    src={grassImg}
                    alt=""
                    className="absolute -right-16 bottom-0 h-48 sm:h-64 md:h-80 lg:h-96 w-auto opacity-20 sm:opacity-40 select-none translate-y-4"
                />
            </div>

            {/* Title Background Accent - Very subtle watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] opacity-[0.012] pointer-events-none select-none">
                <h1 className="text-[14rem] md:text-[24rem] font-black italic">RACE</h1>
            </div>

            <div className="relative z-[var(--z-screen)] flex flex-col lg:flex-row landscape:flex-row items-center justify-center text-center w-full max-w-6xl gap-8 md:gap-16 lg:gap-32">
                <h1 className={titleStyle}>
                    <span className="marker-underline inline-block mb-2 scale-110">STICKMAN</span><br />
                    <span className="marker-underline inline-block rotate-1">RACE</span>
                </h1>

                <div className="flex flex-col items-center w-full max-w-sm">
                    {view === 'menu' && renderMenu()}
                    {view === 'host' && renderHost()}
                    {view === 'join' && renderJoin()}
                </div>
            </div>
        </div>
    );
};

export default HomeScreen;
