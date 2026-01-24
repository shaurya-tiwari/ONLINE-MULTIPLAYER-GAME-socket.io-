import React from 'react';

const ControlLayoutSetting = ({ onAction }) => {
    const handleEditLayout = () => {
        // Dispatch custom event to open editor
        window.dispatchEvent(new CustomEvent('open-layout-editor'));
        if (onAction) onAction();
    };

    return (
        <div className="space-y-3">
            <h4 className="font-black text-xs uppercase tracking-[0.2em] text-ink/40">Gameplay UI</h4>
            <div className="sketch-card bg-[#fefcf5] p-3 border-2 border-ink/80 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <span className="font-black text-xs uppercase tracking-widest text-ink">Control Layout</span>
                    <span className="bg-blue-500 text-paper text-[9px] px-2 py-0.5 rounded uppercase font-black">ADVANCED</span>
                </div>

                <p className="text-[10px] font-bold text-ink/60 uppercase leading-relaxed">
                    Reposition buttons and HUD elements for your screen.
                </p>

                <button
                    onClick={handleEditLayout}
                    className="w-full py-2 bg-ink text-paper text-[10px] font-black uppercase tracking-widest rounded hover:bg-marker transition-colors"
                >
                    EDIT LAYOUT
                </button>
            </div>
        </div>
    );
};

export default ControlLayoutSetting;
