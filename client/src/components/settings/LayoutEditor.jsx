import React, { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'control-layout-v1';

const DEFAULT_POSITIONS = {
    'mobile-run': { x: 24, y: 24, fromBottom: true, fromLeft: true },
    'mobile-jump': { x: 24, y: 120, fromBottom: true, fromRight: true },
    'mobile-slide': { x: 24, y: 24, fromBottom: true, fromRight: true },
    'hud-main': { x: 16, y: 16, fromTop: true, fromLeft: true },
};

const LayoutEditor = () => {
    const [isActive, setIsActive] = useState(false);
    const [positions, setPositions] = useState(DEFAULT_POSITIONS);
    const [draggingId, setDraggingId] = useState(null);
    const editorRef = useRef(null);

    // CRUD - READ
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Ensure all default keys exist (Migration support)
                setPositions({ ...DEFAULT_POSITIONS, ...parsed });
            } catch (e) {
                console.error("Failed to load layout", e);
                setPositions(DEFAULT_POSITIONS);
            }
        }

        const handleOpen = () => setIsActive(true);
        window.addEventListener('open-layout-editor', handleOpen);
        return () => window.removeEventListener('open-layout-editor', handleOpen);
    }, []);

    // CRUD - UPDATE & CREATE (Save)
    const handleSave = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
            // Trigger storage event for same-tab updates if needed, 
            // but custom event is more direct for our components.
            window.dispatchEvent(new CustomEvent('layout-updated', { detail: positions }));
            setIsActive(false);
            console.log("Layout saved successfully");
        } catch (e) {
            alert("Failed to save layout! Local storage might be full or disabled.");
        }
    };

    // CRUD - DELETE (Reset to Defaults)
    const handleReset = () => {
        if (confirm("Reset to default layout? This will erase your custom positions.")) {
            // We don't delete the key entirely to keep a clean structure, 
            // just set back to defaults.
            setPositions(DEFAULT_POSITIONS);
        }
    };

    const handlePointerDown = (id, e) => {
        e.stopPropagation();
        setDraggingId(id);
    };

    const handlePointerMove = (e) => {
        if (!draggingId) return;

        const rect = editorRef.current.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;

        const newPos = { ...positions[draggingId] };

        // Boundary Logic & Snap
        if (newPos.fromLeft) newPos.x = Math.max(10, Math.min(px, rect.width - 50));
        if (newPos.fromRight) newPos.x = Math.max(10, Math.min(rect.width - px, rect.width - 50));
        if (newPos.fromTop) newPos.y = Math.max(10, Math.min(py, rect.height - 50));
        if (newPos.fromBottom) newPos.y = Math.max(10, Math.min(rect.height - py, rect.height - 50));

        setPositions({ ...positions, [draggingId]: newPos });
    };

    const handlePointerUp = () => setDraggingId(null);

    if (!isActive) return null;

    // Visual styles to match game buttons
    const btnBase = "flex items-center justify-center font-black select-none touch-none border-[3px] border-ink/20 rounded-full bg-paper pointer-events-auto relative shadow-xl cursor-move";

    const getVisualComponent = (id) => {
        switch (id) {
            case 'mobile-run':
                return (
                    <div className={`${btnBase} w-28 h-28 sm:w-36 sm:h-36 text-3xl border-[#3b82f6]/30 text-[#3b82f6]`}>
                        <span className="relative z-10 uppercase tracking-tighter">RUN</span>
                        <div className="absolute inset-[-6px] border border-ink/5 rounded-full rotate-[-5deg] pointer-events-none"></div>
                    </div>
                );
            case 'mobile-jump':
                return (
                    <div className={`${btnBase} w-24 h-24 sm:w-32 sm:h-32 text-2xl border-marker/30 text-marker`}>
                        <span className="relative z-10 uppercase tracking-tighter">JUMP</span>
                        <div className="absolute inset-[-6px] border border-ink/5 rounded-full rotate-[2deg] pointer-events-none"></div>
                    </div>
                );
            case 'mobile-slide':
                return (
                    <div className={`${btnBase} w-24 h-24 sm:w-32 sm:h-32 text-2xl border-blue-500/30 text-blue-600`}>
                        <span className="relative z-10 uppercase tracking-tighter">SLIDE</span>
                        <div className="absolute inset-[-6px] border border-ink/5 rounded-full rotate-[-3deg] pointer-events-none"></div>
                    </div>
                );
            case 'hud-main':
                return (
                    <div className="sketch-card bg-paper border-[3px] border-ink p-4 flex flex-col items-center gap-1 shadow-2xl rotate-[-1deg]">
                        <span className="bg-ink text-paper text-[8px] sm:text-[10px] font-black px-2 py-0.5 rotate-1 uppercase tracking-widest">
                            ROOM CODE
                        </span>
                        <div className="text-ink font-black text-xl sm:text-2xl px-4 py-1">ABCD</div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div
            ref={editorRef}
            className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md touch-none select-none"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {/* GRID OVERLAY FOR PRECISION */}
            <div className="absolute inset-0 pointer-events-none opacity-5"
                style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            {/* INSTRUCTIONS */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <h2 className="text-paper text-6xl font-black uppercase tracking-tighter mb-4 italic opacity-10 leading-none">CUSTOM LAYOUT</h2>
                <div className="p-4 bg-marker/10 border-2 border-marker border-dashed rounded-2xl animate-pulse">
                    <p className="text-marker text-sm font-black uppercase tracking-[0.2em]">Drag elements to reposition</p>
                </div>
            </div>

            {/* DRAGGABLE REAL ELEMENTS */}
            {Object.entries(positions).map(([id, pos]) => (
                <div
                    key={id}
                    onPointerDown={(e) => handlePointerDown(id, e)}
                    className={`absolute transition-transform ${draggingId === id ? 'scale-110 rotate-3 z-50' : 'z-10'}`}
                    style={{
                        top: pos.fromTop ? pos.y : 'auto',
                        bottom: pos.fromBottom ? pos.y : 'auto',
                        left: pos.fromLeft ? pos.x : 'auto',
                        right: pos.fromRight ? pos.x : 'auto',
                        touchAction: 'none'
                    }}
                >
                    {getVisualComponent(id)}

                    {/* Visual indicator for dragging */}
                    {draggingId === id && (
                        <div className="absolute inset-0 border-4 border-marker border-dotted rounded-full scale-125 animate-ping opacity-30" />
                    )}
                </div>
            ))}

            {/* TOOLBAR */}
            <div className="absolute bottom-12 left-0 w-full flex justify-center gap-6 pointer-events-auto px-6 max-sm:flex-col items-center">
                <button
                    onClick={() => setIsActive(false)}
                    className="px-8 py-4 bg-paper/5 border-2 border-paper/10 text-paper/60 font-black uppercase tracking-widest rounded-2xl hover:bg-paper/10 transition-all text-xs"
                >
                    CANCEL
                </button>
                <button
                    onClick={handleReset}
                    className="px-8 py-4 bg-red-500/10 border-2 border-red-500/20 text-red-500/80 font-black uppercase tracking-widest rounded-2xl hover:bg-red-500/20 transition-all text-xs"
                >
                    RESET DEFAULT
                </button>
                <button
                    onClick={handleSave}
                    className="px-16 py-5 bg-marker text-paper font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-[0_10px_40px_-10px_rgba(255,51,102,0.5)] text-sm italic"
                >
                    SAVE CHANGES
                </button>
            </div>
        </div>
    );
};

export default LayoutEditor;
