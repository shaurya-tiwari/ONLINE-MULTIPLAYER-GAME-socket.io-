import React, { useEffect, useRef, useState } from 'react';
import { startGameLoop, stopGameLoop } from '../game/gameLoop';
import MobileControls from '../components/MobileControls';
import GameOverOverlay from '../components/GameOverOverlay';
import CanvasCover from '../components/CanvasCover';

const GameScreen = ({ socket, roomCode, playerId, players, gameMap, raceLength }) => {
    const canvasRef = useRef(null);
    const [showGameOver, setShowGameOver] = useState(false);
    const [winnerName, setWinnerName] = useState(null);

    const isHost = players[playerId]?.isHost;

    console.log("GameScreen Render:", { playerId, isHost, players, raceLength });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Reset overlay when map changes (restart)
        setShowGameOver(false);
        setWinnerName(null);

        // Listen for global game over
        const handleGameOver = ({ winner }) => {
            setWinnerName(winner);
            setShowGameOver(true);
            stopGameLoop(); // Freeze the game
        };

        socket.on('game_over', handleGameOver);

        // Callback when local player finishes - only local effect removed, driving via socket now
        const onGameOver = () => {
            // Local fallback or ignored, logic moved to socket
        };

        // Set initial canvas dimensions based on parent
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth || window.innerWidth;
            canvas.height = parent.clientHeight || window.innerHeight;
        } else {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }

        // Initialize Game Loop with Map
        try {
            startGameLoop(canvas, socket, playerId, players, gameMap, roomCode, onGameOver, raceLength);
        } catch (err) {
            console.error("Failed to start game loop:", err);
        }

        // Handle resizing
        const resizeObserver = new ResizeObserver(entries => {
            const entry = entries[0];
            if (entry) {
                // Check for valid dimensions to prevent 0x0 canvas
                if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                    canvas.width = entry.contentRect.width;
                    canvas.height = entry.contentRect.height;
                }
            }
        });

        if (parent) {
            resizeObserver.observe(parent);
        }

        return () => {
            stopGameLoop();
            resizeObserver.disconnect();
            socket.off('game_over', handleGameOver);
        };
    }, [socket, playerId, players, gameMap, roomCode, raceLength]);

    const handleRestart = () => {
        socket.emit('restart_game', { code: roomCode });
    };

    return (
        <div className="fixed inset-0 w-full h-full bg-transparent overflow-hidden touch-none selection:none">
            {/* LAYER 1: BACKGROUND / GAME CANVAS */}
            <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
                <CanvasCover />
                <canvas
                    ref={canvasRef}
                    className="block w-full h-full object-contain relative z-10"
                />
                {/* Vignette is part of the game look, keep it above canvas but below HUD */}
                <div className="vignette-overlay z-15" />
            </div>

            {/* LAYER 2: INTERACTIVE UI (STAY AT TOP) */}
            <div className="absolute inset-0 z-[var(--z-hud)] pointer-events-none sketch-ui-root">

                {/* HUD: Room Details */}
                <div className="absolute flex flex-wrap gap-4 items-center pointer-events-none"
                    style={{
                        top: 'calc(clamp(0.5rem, 4%, 3rem) + env(safe-area-inset-top))',
                        left: 'calc(clamp(0.5rem, 4%, 3rem) + env(safe-area-inset-left))'
                    }}>
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
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 sm:w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* GAME OVER OVERLAY */}
                {showGameOver && (
                    <div className="pointer-events-auto">
                        <GameOverOverlay
                            isHost={isHost}
                            onRestart={handleRestart}
                            winnerName={winnerName}
                        />
                    </div>
                )}

                {/* MOBILE CONTROLS: Absolute bottom, always on top */}
                <div className="absolute inset-x-0 bottom-0 z-30 pointer-events-none">
                    <MobileControls />
                </div>
            </div>
        </div>
    );
};

export default GameScreen;
