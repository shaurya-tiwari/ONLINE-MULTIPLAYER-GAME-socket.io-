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
    const btnBase = "flex items-center justify-center text-ink/60 font-black transition-all active:scale-90 select-none touch-none border-[3px] border-ink/10 rounded-full bg-paper/50 hover:bg-paper/80 pointer-events-auto relative shadow-sm";

    // Run Button (Left, Bottom)
    const runBtn = `${btnBase} w-20 h-20 md:w-24 md:h-24 text-xl rotate-[-1deg]`;

    // Action Buttons (Right) - Vertical Column
    const jumpBtn = `${btnBase} w-16 h-16 md:w-20 md:h-20 text-lg rotate-[2deg] border-marker/20 text-marker hover:bg-marker/10`;
    const slideBtn = `${btnBase} w-16 h-16 md:w-20 md:h-20 text-lg rotate-[-1deg] border-blue-500/20 text-blue-600 hover:bg-blue-500/10`;

    const ControlButton = ({ label, style, action }) => (
        <button
            className={style}
            onPointerDown={() => handleAction(action, true)}
            onPointerUp={() => handleAction(action, false)}
            onPointerLeave={() => handleAction(action, false)}
        >
            <span className="relative z-10 uppercase tracking-tighter">{label}</span>
            {/* Subtle Decorative Sketch Rings */}
            <div className="absolute inset-[-4px] border border-ink/5 rounded-full rotate-[-5deg] pointer-events-none"></div>
            <div className="absolute inset-[-2px] border border-ink/5 rounded-full rotate-[3deg] pointer-events-none"></div>
        </button>
    );

    return (
        <div className="sketch-ui-root w-full h-full flex justify-between items-end px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-none landscape-safe-area">
            {/* Left: Run Button */}
            <div className="flex items-center pb-2">
                <ControlButton label="RUN" style={runBtn} action="run" />
            </div>

            {/* Center: Fullscreen Toggle */}
            <div className="flex items-center pb-4">
                <button
                    onClick={toggleFullscreen}
                    className="btn-ink pointer-events-auto bg-paper/30 text-ink/40 border-ink/10 text-[9px] px-3 py-1.5 rounded-full relative transform rotate-1 hover:bg-paper/60"
                    style={{ minHeight: 'auto', width: 'auto' }}
                >
                    <span className="relative z-10 tracking-[0.15em] font-black uppercase">FULLSCREEN</span>
                </button>
            </div>

            {/* Right: JUMP & SLIDE */}
            <div className="flex flex-col items-center gap-4 md:gap-6 pb-2">
                <ControlButton label="JUMP" style={jumpBtn} action="jump" />
                <ControlButton label="SLIDE" style={slideBtn} action="slide" />
            </div>
        </div>
    );
};

export default React.memo(MobileControls);
