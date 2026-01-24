import React, { useState, useEffect, useRef } from 'react';
import editorBg from '../../assets/settings background image/setting controller bg .png';

const STORAGE_KEY = 'control-layout-v1';

const DEFAULT_POSITIONS = {
    'mobile-run': { x: 24, y: 24, fromBottom: true, fromLeft: true, scale: 1, opacity: 1 },
    'mobile-jump': { x: 24, y: 120, fromBottom: true, fromRight: true, scale: 1, opacity: 1 },
    'mobile-slide': { x: 24, y: 24, fromBottom: true, fromRight: true, scale: 1, opacity: 1 },
    'hud-main': { x: 16, y: 16, fromTop: true, fromLeft: true, scale: 1, opacity: 1 },
};

const LayoutEditor = () => {
    const [isActive, setIsActive] = useState(false);
    const [positions, setPositions] = useState(DEFAULT_POSITIONS);
    const [draggingId, setDraggingId] = useState(null);
    const [selectedId, setSelectedId] = useState('mobile-run');
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const editorRef = useRef(null);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const merged = { ...DEFAULT_POSITIONS };
                Object.keys(parsed).forEach(key => {
                    if (merged[key]) {
                        merged[key] = { ...merged[key], ...parsed[key] };
                    }
                });
                setPositions(merged);
            } catch (e) {
                console.error("Failed to load layout", e);
                setPositions(DEFAULT_POSITIONS);
            }
        }

        const handleOpen = () => setIsActive(true);
        window.addEventListener('open-layout-editor', handleOpen);
        return () => window.removeEventListener('open-layout-editor', handleOpen);
    }, []);

    const handleSave = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
            window.dispatchEvent(new CustomEvent('layout-updated', { detail: positions }));
            setIsActive(false);
        } catch (e) {
            alert("Failed to save layout!");
        }
    };

    const handleReset = () => {
        if (confirm("Reset to default layout?")) {
            setPositions(DEFAULT_POSITIONS);
        }
    };

    const handlePointerDown = (id, e) => {
        e.stopPropagation();
        setDraggingId(id);
        setSelectedId(id);

        const rect = e.currentTarget.getBoundingClientRect();
        // Capture where inside the button the user clicked
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const handlePointerMove = (e) => {
        if (!draggingId || !editorRef.current) return;

        const containerRect = editorRef.current.getBoundingClientRect();
        const mouseX = e.clientX - containerRect.left;
        const mouseY = e.clientY - containerRect.top;

        const newPos = { ...positions[draggingId] };

        // Calculate new X/Y based on anchor point and drag offset
        // We subtract the original dragOffset to keep the button under the finger exactly where it was grabbed
        if (newPos.fromLeft) {
            newPos.x = mouseX - dragOffset.x;
        } else if (newPos.fromRight) {
            newPos.x = (containerRect.width - mouseX) - (e.currentTarget?.offsetWidth || 100 - dragOffset.x);
            // Simpler: if it's from right, we want (width - mouseX) to be the distance to the pointer.
            // But we need to account for the width of the element and the offset.
            // Let's use a more robust way:
            const elementWidth = e.target.closest('.draggable-item')?.offsetWidth || 0;
            newPos.x = containerRect.width - mouseX - (elementWidth - dragOffset.x);
        }

        if (newPos.fromTop) {
            newPos.y = mouseY - dragOffset.y;
        } else if (newPos.fromBottom) {
            const elementHeight = e.target.closest('.draggable-item')?.offsetHeight || 0;
            newPos.y = containerRect.height - mouseY - (elementHeight - dragOffset.y);
        }

        // Clamp to edges (allowing 0 for edge-to-edge)
        newPos.x = Math.max(0, newPos.x);
        newPos.y = Math.max(0, newPos.y);

        setPositions({ ...positions, [draggingId]: newPos });
    };

    // Re-calculating with simpler logic that doesn't depend on e.target in Move
    const handlePointerMoveRefined = (e) => {
        if (!draggingId || !editorRef.current) return;

        const containerRect = editorRef.current.getBoundingClientRect();
        const pos = positions[draggingId];

        // Absolute mouse position relative to container
        const absX = e.clientX - containerRect.left;
        const absY = e.clientY - containerRect.top;

        const newPos = { ...pos };

        // For elements anchored to Left, new x is simple
        if (pos.fromLeft) {
            newPos.x = absX - dragOffset.x;
        } else {
            // For elements anchored to Right:
            // The current 'x' is the distance from right side of container to right side of element.
            // So if mouse is at absX, and offset from right of element is (elementWidth - dragOffset.x)
            // wait, simpler: track the offset from the anchor.
            newPos.x = (containerRect.width - absX) - (dragOffset.invertedX);
        }

        if (pos.fromTop) {
            newPos.y = absY - dragOffset.y;
        } else {
            newPos.y = (containerRect.height - absY) - (dragOffset.invertedY);
        }

        // Clamp
        newPos.x = Math.max(0, newPos.x);
        newPos.y = Math.max(0, newPos.y);

        setPositions({ ...positions, [draggingId]: newPos });
    };

    const handlePointerDownRefined = (id, e) => {
        e.stopPropagation();
        setDraggingId(id);
        setSelectedId(id);

        const rect = e.currentTarget.getBoundingClientRect();
        const containerRect = editorRef.current.getBoundingClientRect();

        // Offset from top-left of the element
        const offX = e.clientX - rect.left;
        const offY = e.clientY - rect.top;

        // Inverted offsets for right/bottom anchors
        // distance from mouse to right side of element
        const invX = rect.right - e.clientX;
        const invY = rect.bottom - e.clientY;

        setDragOffset({
            x: offX,
            y: offY,
            invertedX: invX,
            invertedY: invY
        });
    };

    const handlePointerUp = () => setDraggingId(null);

    const updateCurrentElement = (key, value) => {
        if (!selectedId) return;
        setPositions({
            ...positions,
            [selectedId]: { ...positions[selectedId], [key]: value }
        });
    };

    if (!isActive) return null;

    const btnBase = "flex items-center justify-center font-black select-none touch-none border-[3px] border-ink/20 rounded-full bg-paper pointer-events-auto relative shadow-xl cursor-move transition-transform duration-75";

    const getVisualComponent = (id) => {
        const { scale = 1, opacity = 1 } = positions[id] || {};
        const isSelected = selectedId === id;
        const glowStyle = isSelected ? "ring-4 ring-marker ring-offset-4 ring-offset-black/20" : "";

        const style = {
            transform: `scale(${scale})`,
            opacity: opacity
        };

        switch (id) {
            case 'mobile-run':
                return (
                    <div className={`${btnBase} ${glowStyle} w-28 h-28 sm:w-36 sm:h-36 text-3xl border-[#3b82f6]/30 text-[#3b82f6]`} style={style}>
                        <span className="relative z-10 uppercase tracking-tighter">RUN</span>
                    </div>
                );
            case 'mobile-jump':
                return (
                    <div className={`${btnBase} ${glowStyle} w-24 h-24 sm:w-32 sm:h-32 text-2xl border-marker/30 text-marker`} style={style}>
                        <span className="relative z-10 uppercase tracking-tighter">JUMP</span>
                    </div>
                );
            case 'mobile-slide':
                return (
                    <div className={`${btnBase} ${glowStyle} w-24 h-24 sm:w-32 sm:h-32 text-2xl border-blue-500/30 text-blue-600`} style={style}>
                        <span className="relative z-10 uppercase tracking-tighter">SLIDE</span>
                    </div>
                );
            case 'hud-main':
                return (
                    <div className={`sketch-card ${glowStyle} bg-paper border-[3px] border-ink p-4 flex flex-col items-center gap-1 shadow-2xl rotate-[-1deg]`} style={style}>
                        <span className="bg-ink text-paper text-[8px] sm:text-[10px] font-black px-2 py-0.5 uppercase tracking-widest leading-none mb-1">ROOM CODE</span>
                        <div className="text-ink font-black text-xl sm:text-2xl px-4 py-1">ABCD</div>
                    </div>
                );
            default: return null;
        }
    };

    const selectedLabel = selectedId ? selectedId.replace('mobile-', '').replace('-', ' ').toUpperCase() : 'NONE';

    return (
        <div
            ref={editorRef}
            className="fixed inset-0 z-[1000] bg-black/85 backdrop-blur-md touch-none select-none overflow-hidden"
            onPointerMove={handlePointerMoveRefined}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            <div
                className="absolute inset-0 z-0 opacity-40 pointer-events-none"
                style={{ backgroundImage: `url(${editorBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            />

            {/* TOP BAR TOOLS */}
            <div className="absolute top-0 left-0 w-full z-[100] bg-paper border-b-4 border-ink p-3 flex flex-wrap items-center justify-between shadow-2xl pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <h2 className="text-ink font-black text-sm sm:text-lg italic leading-none">LAYOUT EDITOR</h2>
                        <span className="text-ink/40 text-[8px] font-bold tracking-[0.1em] uppercase mt-1">Drag buttons to move • Select to resize</span>
                    </div>

                    <div className="h-10 w-[2px] bg-ink/10 mx-2 hidden sm:block" />

                    {selectedId && (
                        <div className="flex items-center gap-4 sm:gap-8 overflow-x-auto pb-1">
                            <div className="flex flex-col min-w-[100px]">
                                <span className="bg-marker text-paper text-[8px] font-black px-2 py-0.5 rounded uppercase mb-1">EDITING: {selectedLabel}</span>
                                <div className="flex gap-4">
                                    <span className="text-ink font-black text-[10px]">SIZE: {((positions[selectedId]?.scale || 1) * 100).toFixed(0)}%</span>
                                    <span className="text-ink font-black text-[10px]">ALPHA: {((positions[selectedId]?.opacity || 1) * 100).toFixed(0)}%</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-ink/40">SIZE</span>
                                    <input
                                        type="range" min="0.5" max="2.0" step="0.05"
                                        value={positions[selectedId]?.scale || 1}
                                        onChange={(e) => updateCurrentElement('scale', parseFloat(e.target.value))}
                                        className="w-24 sm:w-40 h-1.5 bg-ink/10 rounded-lg appearance-none cursor-pointer accent-marker"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-ink/40">Transparency</span>
                                    <input
                                        type="range" min="0.1" max="1.0" step="0.05"
                                        value={positions[selectedId]?.opacity || 1}
                                        onChange={(e) => updateCurrentElement('opacity', parseFloat(e.target.value))}
                                        className="w-24 sm:w-40 h-1.5 bg-ink/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                    <button onClick={handleReset} className="px-3 py-1.5 border-2 border-red-500/20 text-red-500 text-[9px] font-black uppercase rounded hover:bg-red-500/10 transition-colors">Reset</button>
                    <button onClick={() => setIsActive(false)} className="px-3 py-1.5 border-2 border-ink/20 text-ink/60 text-[9px] font-black uppercase rounded hover:bg-ink/5 transition-colors">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-1.5 bg-marker text-paper text-[9px] font-black uppercase rounded hover:scale-105 transition-all shadow-lg">Save</button>
                </div>
            </div>

            {/* DRAGGABLE ELEMENTS */}
            {Object.entries(positions).map(([id, pos]) => (
                <div
                    key={id}
                    onPointerDown={(e) => handlePointerDownRefined(id, e)}
                    className="absolute z-10 draggable-item"
                    style={{
                        top: pos.fromTop ? pos.y : 'auto',
                        bottom: pos.fromBottom ? pos.y : 'auto',
                        left: pos.fromLeft ? pos.x : 'auto',
                        right: pos.fromRight ? pos.x : 'auto',
                        touchAction: 'none'
                    }}
                >
                    {getVisualComponent(id)}
                    {selectedId === id && draggingId !== id && (
                        <div className="absolute -inset-4 border-2 border-marker border-dashed rounded-full animate-[spin_10s_linear_infinite] pointer-events-none opacity-20" />
                    )}
                </div>
            ))}
        </div>
    );
};

export default LayoutEditor;
