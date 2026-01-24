import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'control-layout-v1';

const DEFAULT_POSITIONS = {
    'mobile-run': { x: 24, y: 24, fromBottom: true, fromLeft: true, scale: 1, opacity: 1 },
    'mobile-back': { x: 140, y: 24, fromBottom: true, fromLeft: true, scale: 1, opacity: 1 },
    'mobile-jump': { x: 24, y: 120, fromBottom: true, fromRight: true, scale: 1, opacity: 1 },
    'mobile-slide': { x: 24, y: 24, fromBottom: true, fromRight: true, scale: 1, opacity: 1 },
    'hud-main': { x: 16, y: 16, fromTop: true, fromLeft: true, scale: 1, opacity: 1 },
};

const MobileControls = () => {
    const [positions, setPositions] = useState(DEFAULT_POSITIONS);

    useEffect(() => {
        const loadLayout = () => {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    const merged = { ...DEFAULT_POSITIONS };
                    Object.keys(parsed).forEach(key => {
                        if (merged[key]) {
                            merged[key] = { ...merged[key], ...parsed[key] };
                        }
                    });
                    setPositions(merged);
                } catch (e) {
                    console.error("Failed to load layout", e);
                }
            }
        };

        loadLayout();
        window.addEventListener('layout-updated', loadLayout);
        return () => window.removeEventListener('layout-updated', loadLayout);
    }, []);

    const simulateKey = (code, type) => {
        const event = new KeyboardEvent(type, {
            code: code,
            bubbles: true,
            cancelable: true
        });
        window.dispatchEvent(event);
    };

    const keyMap = { run: 'ArrowRight', back: 'ArrowLeft', jump: 'Space', slide: 'ArrowDown' };

    const handleAction = (action, isDown) => {
        const key = keyMap[action];
        if (key) simulateKey(key, isDown ? 'keydown' : 'keyup');
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    };

    const btnBase = "flex items-center justify-center text-ink/60 font-black transition-all active:scale-95 select-none touch-none border-[3px] border-ink/10 rounded-full bg-paper/60 hover:bg-paper/90 pointer-events-auto relative shadow-md transform origin-center";
    const runBtn = `${btnBase} w-28 h-28 sm:w-36 sm:h-36 text-3xl rotate-[-1deg] border-[#3b82f6]/30 text-[#3b82f6]`;
    const backBtn = `${btnBase} w-20 h-20 sm:w-24 sm:h-24 text-xl rotate-[1deg] border-[#3b82f6]/20 text-[#3b82f6]/80`;
    const jumpBtn = `${btnBase} w-24 h-24 sm:w-32 sm:h-32 text-2xl rotate-[2deg] border-marker/30 text-marker hover:bg-marker/10`;
    const slideBtn = `${btnBase} w-24 h-24 sm:w-32 sm:h-32 text-2xl rotate-[-1deg] border-blue-500/30 text-blue-600 hover:bg-blue-500/10`;

    const ControlButton = ({ label, style, action, scale, opacity }) => (
        <button
            className={style}
            onPointerDown={(e) => { e.preventDefault(); handleAction(action, true); }}
            onPointerUp={(e) => { e.preventDefault(); handleAction(action, false); }}
            onPointerCancel={(e) => { e.preventDefault(); handleAction(action, false); }}
            onPointerLeave={(e) => { e.preventDefault(); handleAction(action, false); }}
            style={{
                touchAction: 'none',
                transform: `scale(${scale})`,
                opacity: opacity
            }}
        >
            <span className="relative z-10 uppercase tracking-tighter font-black">{label}</span>
            <div className="absolute inset-[-6px] border border-ink/5 rounded-full rotate-[-5deg] pointer-events-none"></div>
            <div className="absolute inset-[-3px] border border-ink/5 rounded-full rotate-[3deg] pointer-events-none"></div>
        </button>
    );

    const getPosStyle = (id) => {
        const p = positions[id] || DEFAULT_POSITIONS[id];
        return {
            position: 'absolute',
            bottom: p.fromBottom ? p.y : 'auto',
            top: p.fromTop ? p.y : 'auto',
            left: p.fromLeft ? p.x : 'auto',
            right: p.fromRight ? p.x : 'auto',
        };
    };

    return (
        <div className="sketch-ui-root fixed inset-0 pointer-events-none landscape-safe-area">
            {/* Left: Run Buttons */}
            <div style={getPosStyle('mobile-run')} className="pb-6 px-6">
                <ControlButton label="RUN" style={runBtn} action="run" scale={positions['mobile-run']?.scale || 1} opacity={positions['mobile-run']?.opacity || 1} />
            </div>
            <div style={getPosStyle('mobile-back')} className="pb-6 px-6">
                <ControlButton label="BACK" style={backBtn} action="back" scale={positions['mobile-back']?.scale || 1} opacity={positions['mobile-back']?.opacity || 1} />
            </div>

            {/* Center: Fullscreen */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pb-4">
                <button
                    onClick={toggleFullscreen}
                    className="btn-ink pointer-events-auto bg-paper/60 text-ink/80 border-ink/20 text-[11px] sm:text-sm px-6 py-2.5 rounded-full relative transform rotate-1 hover:bg-paper/90 shadow-md"
                >
                    <span className="relative z-10 tracking-[0.2em] font-black uppercase flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
                        MAXIMIZE
                    </span>
                </button>
            </div>

            {/* Right: JUMP */}
            <div style={getPosStyle('mobile-jump')} className="pb-6 px-12">
                <ControlButton label="JUMP" style={jumpBtn} action="jump" scale={positions['mobile-jump']?.scale || 1} opacity={positions['mobile-jump']?.opacity || 1} />
            </div>

            {/* Right: SLIDE */}
            <div style={getPosStyle('mobile-slide')} className="pb-6 px-12">
                <ControlButton label="SLIDE" style={slideBtn} action="slide" scale={positions['mobile-slide']?.scale || 1} opacity={positions['mobile-slide']?.opacity || 1} />
            </div>
        </div>
    );
};

export default React.memo(MobileControls);
