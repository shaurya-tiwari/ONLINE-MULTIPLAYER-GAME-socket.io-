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

    const handleTouchStart = (key) => (e) => {
        e.preventDefault(); // Prevent scrolling/selecting
        simulateKey(key, 'keydown');
    };

    const handleTouchEnd = (key) => (e) => {
        e.preventDefault();
        simulateKey(key, 'keyup');
    };

    // Sketch themed Button Styles
    const btnBase = "flex items-center justify-center text-black/40 font-black transition-all active:scale-90 select-none touch-none border border-black/5 rounded-full bg-neutral-500/10 hover:bg-neutral-500/20 pointer-events-auto";

    // Run Button (Small/Medium, Left)
    const runBtn = `${btnBase} w-24 h-24 text-xl rotate-[-2deg]`;

    // Action Buttons (Right) - Vertical Column
    const jumpBtn = `${btnBase} w-20 h-20 text-lg rotate-[3deg] border-red-500/10 text-red-600/50 hover:bg-red-500/20`;
    const slideBtn = `${btnBase} w-20 h-20 text-lg rotate-[-1deg] border-blue-500/10 text-blue-600/50 hover:bg-blue-500/20`;

    return (
        <div className="w-full h-full flex justify-between items-end px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-none">
            <div className="flex items-center">
                <button
                    className={runBtn}
                    onPointerDown={handleTouchStart('ArrowRight')}
                    onPointerUp={handleTouchEnd('ArrowRight')}
                    onPointerLeave={handleTouchEnd('ArrowRight')}
                >
                    <span className="tracking-tighter">RUN</span>
                </button>
            </div>

            {/* RIGHT: JUMP (Top) & SLIDE (Bottom) - Vertical Column */}
            <div className="flex flex-col items-center gap-6">
                <button
                    className={jumpBtn}
                    onPointerDown={handleTouchStart('Space')}
                    onPointerUp={handleTouchEnd('Space')}
                    onPointerLeave={handleTouchEnd('Space')}
                >
                    JUMP
                </button>

                <button
                    className={slideBtn}
                    onPointerDown={handleTouchStart('ArrowDown')}
                    onPointerUp={handleTouchEnd('ArrowDown')}
                    onPointerLeave={handleTouchEnd('ArrowDown')}
                >
                    SLIDE
                </button>
            </div>
        </div>
    );
};

export default React.memo(MobileControls);

