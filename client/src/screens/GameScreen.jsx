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
        <div className="w-full h-screen bg-transparent overflow-hidden relative">
            {/* Main Game Container - Fixed Aspect Ratio Box with framing */}
            {/* FIX: Using max-h-[80vh] ensures the box never exceeds 80% of screen height, so bottom border is always visible. */}
            {/* 3. CANVAS BOX */}
            {/* Logic: For screens < 950px (Mobile/Small Tablet), use 'aspect-[3/2]' (Square but wide). For Desktop, use 'aspect-video'. */}
            {/* Height: Capped at 60vh on mobile, 80vh on desktop. Width: Tighter on mobile (max-w-xl). */}
            <div className="absolute inset-0 w-full h-full bg-transparent overflow-hidden">
                <CanvasCover />
                <canvas ref={canvasRef} className="block w-full h-full relative z-10" />
                <div className="vignette-overlay" />
            </div>

            {/* HUD Layer - Using safe area padding */}
            <div className="sketch-ui-root absolute z-20 flex flex-wrap gap-4 items-center pointer-events-none"
                style={{
                    top: 'clamp(0.5rem, 4%, 3rem)',
                    left: 'clamp(0.5rem, 4%, 3rem)'
                }}>
                {/* Room Identity Badge */}
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
                        className="btn-ink pointer-events-auto bg-marker/80 text-paper border-ink text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] transform transition-all hover:scale-105 active:scale-95 uppercase tracking-widest flex items-center gap-2 opacity-60 hover:opacity-100"
                        style={{ minHeight: 'auto' }}
                    >
                        <span className="hidden sm:inline">RESTART</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 sm:w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Game Over Overlay */}
            {showGameOver && (
                <GameOverOverlay
                    isHost={isHost}
                    onRestart={handleRestart}
                    winnerName={winnerName}
                />
            )}
            {/* Controls Area - Mobile Only, positioned for comfort */}
            <div className="absolute bottom-0 left-0 w-full h-auto px-4 pb-1 z-20 pointer-events-auto md:flex justify-center">
                <MobileControls />
            </div>
        </div>
    );
};

export default GameScreen;
