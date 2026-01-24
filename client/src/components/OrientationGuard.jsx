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
        <div className="fixed inset-0 z-[100] bg-[#f0f0f0] flex flex-col items-center justify-center p-8 text-center animate-fade-in backdrop-blur-sm">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(#0a0a0a 1px, transparent 1px)`,
                    backgroundSize: '24px 24px'
                }}
            ></div>

            <div className="relative z-10 max-w-sm w-full bg-white border-4 border-ink p-8 shadow-[12px_12px_0px_0px_rgba(10,10,10,0.1)] rough-edge transform rotate-1">
                {/* Visual Icon */}
                <div className="mb-6 flex justify-center">
                    <div className="animate-[spin_4s_ease-in-out_infinite]">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-16 h-16 text-marker">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                        </svg>
                    </div>
                </div>

                {/* Text Instructions */}
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 text-ink">
                    ROTATE DEVICE
                </h2>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-tight">
                    Please use landscape mode<br />for the best experience
                </p>

                {/* Horizontal Indicator */}
                <div className="flex justify-center mt-8 gap-1">
                    <div className="w-8 h-1 bg-marker rounded-full animate-pulse"></div>
                    <div className="w-2 h-1 bg-marker/30 rounded-full"></div>
                    <div className="w-2 h-1 bg-marker/30 rounded-full"></div>
                </div>
            </div>
        </div>
    );
};

export default OrientationGuard;
