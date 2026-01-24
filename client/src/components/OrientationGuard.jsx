import React, { useState, useEffect } from 'react';

const OrientationGuard = () => {
    const [isPortrait, setIsPortrait] = useState(false);

    useEffect(() => {
        const checkOrientation = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            // Strictly detect Portrait (taller than wide)
            const isPortraitMode = height > width;

            // Only show for mobile/tablets (typically touch devices or smaller screens)
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

            setIsPortrait(isPortraitMode && isTouchDevice);
        };

        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);

        return () => {
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('orientationchange', checkOrientation);
        };
    }, []);

    if (!isPortrait) return null;

    return (
        <div className="sketch-ui-root fixed inset-0 z-[var(--z-guard)] bg-[#fefcf5] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
            {/* Background Pattern - Grid Paper Feel */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(#0a0a0a 1px, transparent 1px), linear-gradient(90deg, #0a0a0a 1px, transparent 1px)`,
                    backgroundSize: '30px 30px'
                }}
            ></div>

            <div className="sketch-card relative z-10 max-w-sm w-full p-8 transform rotate-0.5">
                {/* Visual Icon */}
                <div className="mb-6 flex justify-center">
                    <div className="animate-[spin_4s_ease-in-out_infinite]">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-12 h-12 text-marker">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                        </svg>
                    </div>
                </div>

                {/* Text Instructions */}
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 text-ink">
                    <span className="marker-underline">ROTATE DEVICE</span>
                </h2>
                <p className="text-lg font-bold text-gray-500 uppercase tracking-widest leading-tight">
                    Please use landscape mode<br />for the best experience
                </p>

                {/* Horizontal Indicator - Sketchy Line */}
                <div className="flex justify-center mt-8 gap-2">
                    <div className="w-10 h-1.5 bg-marker rounded-full animate-pulse rotate-[-1deg]"></div>
                    <div className="w-2.5 h-1.5 bg-marker/20 rounded-full rotate-[10deg]"></div>
                    <div className="w-2.5 h-1.5 bg-marker/20 rounded-full rotate-[-5deg]"></div>
                </div>
            </div>
        </div>
    );
};

export default OrientationGuard;
