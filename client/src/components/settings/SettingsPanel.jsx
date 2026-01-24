import React, { useState } from 'react';
import ControlLayoutSetting from './ControlLayoutSetting';

const SettingsPanel = () => {
    const [isOpen, setIsOpen] = useState(false);

    const togglePanel = () => setIsOpen(!isOpen);

    return (
        <div className="sketch-ui-root fixed top-0 left-0 z-[var(--z-overlay)] pointer-events-none p-4 sm:p-6"
            style={{ top: 'env(safe-area-inset-top)', left: 'env(safe-area-inset-left)' }}>

            {/* Toggle Button */}
            <button
                onClick={togglePanel}
                className="pointer-events-auto w-12 h-12 sm:w-14 sm:h-14 bg-paper border-[3px] border-ink rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] flex items-center justify-center transform hover:scale-105 active:scale-95 transition-all rotate-[-1deg]"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
                    className={`w-7 h-7 sm:w-8 h-8 transition-transform duration-500 ${isOpen ? 'rotate-90 text-marker' : 'text-ink'}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774a1.125 1.125 0 0 1 .12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.894.15c.542.09.94.56.94 1.109v1.094c0 .55-.398 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738a1.125 1.125 0 0 1-.12 1.45l-.773.773a1.125 1.125 0 0 1-1.45.12l-.737-.527c-.35-.25-.806-.272-1.204-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527a1.125 1.125 0 0 1-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15a1.125 1.125 0 0 1-.94-1.11v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.398-.165.71-.505.78-.929l.15-.894Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
            </button>

            {/* Panel Content (Slide in) */}
            <div className={`pointer-events-auto absolute top-20 left-4 sm:left-6 w-72 sm:w-80 transition-all duration-300 transform ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0 pointer-events-none'}`}>
                <div className="sketch-card p-6 border-[3px] rotate-[0.5deg]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-black uppercase tracking-tighter italic">
                            <span className="marker-underline">Settings</span>
                        </h3>
                    </div>

                    <div className="space-y-6">
                        <ControlLayoutSetting onAction={() => setIsOpen(false)} />

                        <div className="p-4 border-2 border-dashed border-ink/20 rounded-lg text-center">
                            <p className="font-bold text-ink/40 uppercase tracking-widest text-[10px]">
                                More settings coming soon...
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t-2 border-ink/5 flex justify-center">
                        <button
                            onClick={togglePanel}
                            className="text-[10px] font-black uppercase tracking-widest text-ink/30 hover:text-marker transition-colors"
                        >
                            Close Panel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
