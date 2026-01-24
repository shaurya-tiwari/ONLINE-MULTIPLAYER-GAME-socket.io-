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

    useEffect(() => {
        // Load from local storage
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setPositions(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load layout", e);
            }
        }

        const handleOpen = () => setIsActive(true);
        window.addEventListener('open-layout-editor', handleOpen);
        return () => window.removeEventListener('open-layout-editor', handleOpen);
    }, []);

    const handleSave = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
        setIsActive(false);
        // Dispatch event to notify components to update
        window.dispatchEvent(new CustomEvent('layout-updated', { detail: positions }));
        alert("Layout Saved!");
    };

    const handleReset = () => {
        if (confirm("Reset to default layout?")) {
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

        // Calculate offset from corners based on element type
        const newPos = { ...positions[draggingId] };

        if (newPos.fromLeft) newPos.x = Math.max(0, px);
        if (newPos.fromRight) newPos.x = Math.max(0, rect.width - px);
        if (newPos.fromTop) newPos.y = Math.max(0, py);
        if (newPos.fromBottom) newPos.y = Math.max(0, rect.height - py);

        setPositions({ ...positions, [draggingId]: newPos });
    };

    const handlePointerUp = () => {
        setDraggingId(null);
    };

    if (!isActive) return null;

    return (
        <div
            ref={editorRef}
            className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 touch-none"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {/* INSTRUCTIONS */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <h2 className="text-paper text-4xl font-black uppercase tracking-tighter mb-2 italic">LAYOUT EDITOR</h2>
                <p className="text-paper/60 text-sm font-bold uppercase tracking-widest">Drag buttons to reposition them</p>
            </div>

            {/* VIRTUAL DRAGGABLE ELEMENTS */}
            {Object.entries(positions).map(([id, pos]) => (
                <div
                    key={id}
                    onPointerDown={(e) => handlePointerDown(id, e)}
                    className={`absolute p-4 border-2 border-dashed rounded-xl cursor-move transition-transform active:scale-95 ${draggingId === id ? 'border-marker bg-marker/20' : 'border-paper/40 bg-paper/5'}`}
                    style={{
                        top: pos.fromTop ? pos.y : 'auto',
                        bottom: pos.fromBottom ? pos.y : 'auto',
                        left: pos.fromLeft ? pos.x : 'auto',
                        right: pos.fromRight ? pos.x : 'auto',
                        width: id === 'mobile-run' ? '120px' : (id === 'hud-main' ? '200px' : '100px'),
                        height: id.includes('mobile') ? '100px' : '60px',
                        zIndex: draggingId === id ? 10 : 1
                    }}
                >
                    <div className="w-full h-full flex items-center justify-center text-center">
                        <span className="text-paper font-black text-[10px] uppercase break-words leading-none">
                            {id.replace('-', ' ')}
                        </span>
                    </div>
                </div>
            ))}

            {/* TOOLBAR */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-auto">
                <button
                    onClick={handleReset}
                    className="px-8 py-3 bg-paper/10 border-2 border-paper/20 text-paper font-black uppercase tracking-widest rounded-lg hover:bg-paper/20 transition-all text-xs"
                >
                    RESET
                </button>
                <button
                    onClick={handleSave}
                    className="px-12 py-3 bg-marker text-paper font-black uppercase tracking-widest rounded-lg hover:scale-105 active:scale-95 transition-all shadow-xl text-xs"
                >
                    SAVE CHANGES
                </button>
            </div>

            {/* CANCEL BUTTON */}
            <button
                onClick={() => setIsActive(false)}
                className="absolute top-6 right-6 text-paper/40 hover:text-paper transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

export default LayoutEditor;
