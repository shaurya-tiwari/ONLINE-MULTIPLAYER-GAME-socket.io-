import React, { useEffect, useRef, useState } from 'react';
import { startGameLoop, stopGameLoop } from '../game/gameLoop';
import MobileControls from '../components/MobileControls';
import GameOverOverlay from '../components/GameOverOverlay';
import CanvasCover from '../components/CanvasCover';

const STORAGE_KEY = 'control-layout-v1';

const DEFAULT_POSITIONS = {
    'mobile-run': { x: 24, y: 24, fromBottom: true, fromLeft: true, scale: 1, opacity: 1 },
    'mobile-jump': { x: 24, y: 120, fromBottom: true, fromRight: true, scale: 1, opacity: 1 },
    'mobile-slide': { x: 24, y: 24, fromBottom: true, fromRight: true, scale: 1, opacity: 1 },
    'hud-main': { x: 16, y: 16, fromTop: true, fromLeft: true, scale: 1, opacity: 1 },
};

const GameScreen = ({ socket, roomCode, playerId, players, gameMap, raceLength, onLeave }) => {
    const canvasRef = useRef(null);
    const [showGameOver, setShowGameOver] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [winnerName, setWinnerName] = useState(null);
    const [positions, setPositions] = useState(DEFAULT_POSITIONS);

    useEffect(() => {
        const loadLayout = () => {
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
                }
            }
        };

        loadLayout();
        window.addEventListener('layout-updated', loadLayout);

        const canvas = canvasRef.current;
        if (!canvas) return;

        setShowGameOver(false);
        setWinnerName(null);

        const handleGameOver = ({ winner }) => {
            console.log("[GameScreen] Game Over received. Winner:", winner);
            setWinnerName(winner);
            setShowGameOver(true);
            stopGameLoop();
        };

        socket.on('game_over', handleGameOver);

        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth || window.innerWidth;
            canvas.height = parent.clientHeight || window.innerHeight;
        }

        try {
            startGameLoop(canvas, socket, playerId, players, gameMap, roomCode, () => { }, raceLength);
        } catch (err) {
            console.error("Failed to start game loop:", err);
        }

        const resizeObserver = new ResizeObserver(entries => {
            const entry = entries[0];
            if (entry && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                canvas.width = entry.contentRect.width;
                canvas.height = entry.contentRect.height;
            }
        });

        if (parent) resizeObserver.observe(parent);

        return () => {
            stopGameLoop();
            resizeObserver.disconnect();
            socket.off('game_over', handleGameOver);
            window.removeEventListener('layout-updated', loadLayout);
        };
    }, [socket, playerId, gameMap, roomCode, raceLength]);

    const handleRestart = () => {
        socket.emit('restart_game', { code: roomCode });
    };

    const isHost = players[playerId]?.isHost;

    const getPosStyle = (id) => {
        const p = positions[id] || DEFAULT_POSITIONS[id];
        return {
            position: 'absolute',
            bottom: p.fromBottom ? p.y : 'auto',
            top: p.fromTop ? p.y : 'auto',
            left: p.fromLeft ? p.x : 'auto',
            right: p.fromRight ? p.x : 'auto',
            transform: `scale(${p.scale || 1})`,
            opacity: p.opacity || 1,
            transformOrigin: p.fromTop ? (p.fromLeft ? 'top left' : 'top right') : (p.fromLeft ? 'bottom left' : 'bottom right')
        };
    };

    return (
        <div className="fixed inset-0 w-full h-full bg-transparent overflow-hidden touch-none selection:none">
            {/* LAYER 1: BACKGROUND / GAME CANVAS */}
            <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
                <CanvasCover />
                <canvas ref={canvasRef} className="block w-full h-full object-contain relative z-10" />
                <div className="vignette-overlay z-15" />
            </div>

            {/* Exit Game Button (Top-Left) */}
            <div className="absolute top-6 left-6 pointer-events-auto landscape-safe-area z-[100]">
                <button
                    onClick={() => setShowExitConfirm(true)}
                    className="!p-3 rounded-full bg-ink border-2 border-paper hover:bg-ink/80 transition-all group shadow-xl"
                    title="Exit Game"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor" className="w-6 h-6 text-paper group-hover:text-paper/70 transition-colors">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                </button>
            </div>

            {/* LAYER 2: INTERACTIVE UI */}
            <div className="absolute inset-0 z-[var(--z-hud)] pointer-events-none sketch-ui-root">
                {/* HUD: Room Details */}
                <div
                    className="absolute flex flex-wrap gap-4 items-center pointer-events-none landscape-safe-area"
                    style={getPosStyle('hud-main')}
                >
                    <div className="pointer-events-auto flex flex-col items-center transform -rotate-1">
                        <span className="bg-ink text-paper text-[8px] sm:text-[10px] font-black px-2 py-0.5 rotate-1 uppercase tracking-widest leading-none">
                            ROOM CODE
                        </span>
                        <div className="sketch-card bg-paper border-[2px] border-ink text-ink font-black text-sm sm:text-base px-3 py-1 sm:px-4 sm:py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] -mt-1">
                            {roomCode}
                        </div>
                    </div>

                    {isHost && (
                        <button
                            onClick={handleRestart}
                            className="btn-ink pointer-events-auto bg-marker/80 text-paper border-ink text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] transform transition-all hover:scale-105 active:scale-95 uppercase tracking-widest flex items-center gap-2"
                            style={{ minHeight: 'auto' }}
                        >
                            <span className="hidden sm:inline">RESTART</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 sm:w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                        </button>
                    )}
                </div>

                {/* GAME OVER OVERLAY */}
                {showGameOver && (
                    <div className="pointer-events-auto">
                        <GameOverOverlay isHost={isHost} onRestart={handleRestart} winnerName={winnerName} />
                    </div>
                )}

                {/* MOBILE CONTROLS */}
                <div className="absolute inset-0 z-30 pointer-events-none">
                    <MobileControls />
                </div>

                {/* EXIT CONFIRMATION MODAL */}
                {showExitConfirm && (
                    <div className="fixed inset-0 z-[var(--z-overlay)] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6 pointer-events-auto sketch-ui-root">
                        <div className="sketch-card max-w-sm w-full text-center flex flex-col gap-6 p-8 bg-paper">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-ink uppercase tracking-tight">LEAVE RACE?</h3>
                                <p className="text-sm font-bold text-ink/60 uppercase tracking-widest">Your progress will be lost.</p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={onLeave}
                                    className="btn-ink bg-marker text-paper w-full"
                                >
                                    QUIT TO MENU
                                </button>
                                <button
                                    onClick={() => setShowExitConfirm(false)}
                                    className="btn-ink bg-transparent text-ink/60 border-ink/20 w-full"
                                >
                                    STAY & RACE
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GameScreen;
