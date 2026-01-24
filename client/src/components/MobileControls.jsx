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
    const btnBase = "flex items-center justify-center text-black/50 font-black transition-all active:scale-90 select-none touch-none border-[2px] border-black/10 rounded-full bg-neutral-500/10 hover:bg-neutral-500/20 pointer-events-auto relative";

    // Run Button (Small/Medium, Left)
    const runBtn = `${btnBase} w-24 h-24 text-xl rotate-[-2deg]`;

    // Action Buttons (Right) - Vertical Column
    const jumpBtn = `${btnBase} w-20 h-20 text-lg rotate-[3deg] border-red-500/10 text-red-600/50 hover:bg-red-500/20`;
    const slideBtn = `${btnBase} w-20 h-20 text-lg rotate-[-1deg] border-blue-500/10 text-blue-600/50 hover:bg-blue-500/20`;

    const ControlButton = ({ label, style, action }) => (
        <button
            className={style}
            onPointerDown={() => handleAction(action, true)}
            onPointerUp={() => handleAction(action, false)}
            onPointerLeave={() => handleAction(action, false)}
        >
            <span className="relative z-10">{label}</span>
            {/* Sketchy Decorative Rings */}
            <div className="absolute inset-[-4px] border-[1.5px] border-black/5 rounded-full rotate-[-12deg] pointer-events-none"></div>
            <div className="absolute inset-[-2px] border-[1px] border-black/5 rounded-full rotate-[8deg] pointer-events-none"></div>
        </button>
    );

    return (
        <div className="sketch-ui-root w-full h-full flex justify-between items-end px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-none">
            {/* Left: Run Button */}
            <div className="flex items-center">
                <ControlButton label="RUN" style={runBtn} action="run" />
            </div>

            {/* Center: Fullscreen Toggle */}
            <div className="flex items-center pb-2">
                <button
                    onClick={toggleFullscreen}
                    className="btn-ink pointer-events-auto bg-white/10 text-black/40 border-black/10 text-[10px] px-3 py-2 rounded-full relative transform rotate-1 hover:bg-white/20"
                >
                    <span className="relative z-10 tracking-[0.2em] font-black">FULLSCREEN</span>
                    <div className="absolute inset-[-2px] border border-black/5 rounded-full rotate-[-5deg] pointer-events-none"></div>
                </button>
            </div>

            {/* Right: JUMP & SLIDE */}
            <div className="flex flex-col items-center gap-6">
                <ControlButton label="JUMP" style={jumpBtn} action="jump" />
                <ControlButton label="SLIDE" style={slideBtn} action="slide" />
            </div>
        </div>
    );
};

export default React.memo(MobileControls);
