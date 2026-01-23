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
    const btnBase = "flex items-center justify-center text-ink font-black transition-all active:scale-90 select-none touch-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] border-4 border-ink rough-edge bg-paper hover:bg-ink hover:text-paper";

    // Run Button (Large, Left)
    const runBtn = `${btnBase} w-32 h-32 text-2xl rotate-[-2deg]`;

    // Action Buttons (Right) - Vertical Column
    const jumpBtn = `${btnBase} w-28 h-28 text-xl rotate-[3deg] border-marker text-marker hover:bg-marker hover:text-paper`;
    const slideBtn = `${btnBase} w-28 h-28 text-xl rotate-[-1deg] border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6] hover:text-paper`;

    return (
        <div className="w-full h-full flex justify-between items-end px-10 pb-[max(2rem,env(safe-area-inset-bottom))]">
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

