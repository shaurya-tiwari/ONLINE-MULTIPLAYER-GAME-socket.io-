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

    // Button Styles
    const btnStyle = "w-16 h-16 rounded-full bg-white/20 border-2 border-white/50 backdrop-blur-sm flex items-center justify-center active:bg-white/40 transition-all text-white font-bold select-none touch-none";

    return (
        <div className="absolute inset-0 pointer-events-none z-50 flex flex-col justify-end pb-10 px-6">
            <div className="flex justify-between items-end w-full pointer-events-auto">
                {/* Left Side: Run (Right Arrow) */}
                <div className="flex gap-4">
                    <button
                        className={`${btnStyle} w-20 h-20 bg-blue-500/30`}
                        onTouchStart={handleTouchStart('ArrowRight')}
                        onTouchEnd={handleTouchEnd('ArrowRight')}
                        onMouseDown={handleTouchStart('ArrowRight')} // For testing on PC
                        onMouseUp={handleTouchEnd('ArrowRight')}
                    >
                        RUN ▶
                    </button>
                </div>

                {/* Right Side: Jump & Slide */}
                <div className="flex gap-4 flex-col">
                    <button
                        className={`${btnStyle} bg-green-500/30 mb-4`}
                        onTouchStart={handleTouchStart('Space')}
                        onTouchEnd={handleTouchEnd('Space')}
                        onMouseDown={handleTouchStart('Space')}
                        onMouseUp={handleTouchEnd('Space')}
                    >
                        JUMP
                    </button>

                    <button
                        className={`${btnStyle} bg-red-500/30`}
                        onTouchStart={handleTouchStart('ArrowDown')}
                        onTouchEnd={handleTouchEnd('ArrowDown')}
                        onMouseDown={handleTouchStart('ArrowDown')}
                        onMouseUp={handleTouchEnd('ArrowDown')}
                    >
                        SLIDE
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MobileControls;
