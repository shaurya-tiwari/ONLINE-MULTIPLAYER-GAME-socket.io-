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

    // Simplified Modern Button Styles
    const btnBase = "rounded-full flex items-center justify-center text-white font-bold backdrop-blur-sm transition-all active:scale-95 select-none touch-none shadow-lg";

    // Run Button (Large, Left)
    const runBtn = `${btnBase} w-24 h-24 bg-blue-600/40 border-2 border-blue-400/50 active:bg-blue-600/60`;

    // Action Buttons (Right) - Removed bottom margin from jumpBtn
    const jumpBtn = `${btnBase} w-20 h-20 bg-green-600/40 border-2 border-green-400/50 active:bg-green-600/60`;
    const slideBtn = `${btnBase} w-20 h-20 bg-red-600/40 border-2 border-red-400/50 active:bg-red-600/60`;

    return (
        <div className="w-full h-full flex justify-between items-end px-8 pb-4">
            <div className="flex items-center">
                <button
                    className={runBtn}
                    onTouchStart={handleTouchStart('ArrowRight')}
                    onTouchEnd={handleTouchEnd('ArrowRight')}
                    onMouseDown={handleTouchStart('ArrowRight')}
                    onMouseUp={handleTouchEnd('ArrowRight')}
                >
                    <span className="tracking-wider">RUN</span>
                </button>
            </div>

            {/* RIGHT: JUMP & SLIDE (Side by Side) */}
            <div className="flex items-end gap-4">
                <button
                    className={slideBtn}
                    onTouchStart={handleTouchStart('ArrowDown')}
                    onTouchEnd={handleTouchEnd('ArrowDown')}
                    onMouseDown={handleTouchStart('ArrowDown')}
                    onMouseUp={handleTouchEnd('ArrowDown')}
                >
                    SLIDE
                </button>

                <button
                    className={jumpBtn}
                    onTouchStart={handleTouchStart('Space')}
                    onTouchEnd={handleTouchEnd('Space')}
                    onMouseDown={handleTouchStart('Space')}
                    onMouseUp={handleTouchEnd('Space')}
                >
                    JUMP
                </button>
            </div>
        </div>
    );
};

export default MobileControls;

