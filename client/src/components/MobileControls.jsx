import React from 'react';

const MobileControls = () => {
    const simulateKey = (code, type) => {
        const event = new KeyboardEvent(type, {
            code: code,
            bubbles: true,
            cancelable: true
        });
        window.dispatchEvent(event);
    };

    // Mapping actions to keyboard keys
    const keyMap = {
        run: 'ArrowRight',
        jump: 'Space',
        slide: 'ArrowDown',
    };

    const handleAction = (action, isDown) => {
        const key = keyMap[action];
        if (key) {
            simulateKey(key, isDown ? 'keydown' : 'keyup');
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    // Sketch themed Button Styles
    const btnBase = "flex items-center justify-center text-ink/60 font-black transition-all active:scale-90 select-none touch-none border-[3px] border-ink/10 rounded-full bg-paper/60 hover:bg-paper/90 pointer-events-auto relative shadow-md";

    // Bigger Buttons for better touch targets - EXTRA BIG
    const runBtn = `${btnBase} w-28 h-28 sm:w-36 sm:h-36 text-3xl rotate-[-1deg] border-[#3b82f6]/30 text-[#3b82f6]`;
    const jumpBtn = `${btnBase} w-24 h-24 sm:w-32 sm:h-32 text-2xl rotate-[2deg] border-marker/30 text-marker hover:bg-marker/10`;
    const slideBtn = `${btnBase} w-24 h-24 sm:w-32 sm:h-32 text-2xl rotate-[-1deg] border-blue-500/30 text-blue-600 hover:bg-blue-500/10`;

    const ControlButton = ({ label, style, action }) => (
        <button
            className={style}
            onPointerDown={(e) => { e.preventDefault(); handleAction(action, true); }}
            onPointerUp={(e) => { e.preventDefault(); handleAction(action, false); }}
            onPointerCancel={(e) => { e.preventDefault(); handleAction(action, false); }}
            onPointerLeave={(e) => { e.preventDefault(); handleAction(action, false); }}
            style={{ touchAction: 'none' }}
        >
            <span className="relative z-10 uppercase tracking-tighter font-black">{label}</span>
            <div className="absolute inset-[-6px] border border-ink/5 rounded-full rotate-[-5deg] pointer-events-none"></div>
            <div className="absolute inset-[-3px] border border-ink/5 rounded-full rotate-[3deg] pointer-events-none"></div>
        </button>
    );

    return (
        <div className="sketch-ui-root w-full h-full flex justify-between items-end px-6 sm:px-16 pb-[max(4rem,calc(2rem+env(safe-area-inset-bottom)))] pointer-events-none landscape-safe-area">
            {/* Left: Run Button - Shifted up and bigger */}
            <div className="flex flex-col items-center gap-4 pb-6">
                <ControlButton label="RUN" style={runBtn} action="run" />
            </div>

            {/* Center: System Controls (Shifted higher) */}
            <div className="flex flex-col items-center pb-12 gap-6">
                <button
                    onClick={toggleFullscreen}
                    className="btn-ink pointer-events-auto bg-paper/60 text-ink/80 border-ink/20 text-[11px] sm:text-sm px-6 py-2.5 rounded-full relative transform rotate-1 hover:bg-paper/90 shadow-md"
                    style={{ minHeight: 'auto', width: 'auto' }}
                >
                    <span className="relative z-10 tracking-[0.2em] font-black uppercase flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                        </svg>
                        MAXIMIZE
                    </span>
                </button>
            </div>

            {/* Right: JUMP & SLIDE - Stacked for thumb comfort */}
            <div className="flex flex-col items-center gap-8 sm:gap-10 pb-6">
                <ControlButton label="JUMP" style={jumpBtn} action="jump" />
                <ControlButton label="SLIDE" style={slideBtn} action="slide" />
            </div>
        </div>
    );
};

export default React.memo(MobileControls);
