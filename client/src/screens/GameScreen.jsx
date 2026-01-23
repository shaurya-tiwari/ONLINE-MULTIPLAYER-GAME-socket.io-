import React, { useEffect, useRef, useState } from 'react';
import { startGameLoop, stopGameLoop } from '../game/gameLoop';
import MobileControls from '../components/MobileControls';
import GameOverOverlay from '../components/GameOverOverlay';
import CanvasCover from '../components/CanvasCover';

const GameScreen = ({ socket, roomCode, playerId, players, gameMap }) => {
    const canvasRef = useRef(null);
    const [showGameOver, setShowGameOver] = useState(false);

    const isHost = players[playerId]?.isHost;

    console.log("GameScreen Render:", { playerId, isHost, players });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Reset overlay when map changes (restart)
        setShowGameOver(false);

        // Callback when local player finishes
        const onGameOver = () => {
            setShowGameOver(true);
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
            startGameLoop(canvas, socket, playerId, players, gameMap, roomCode, onGameOver);
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
        };
    }, [socket, playerId, players, gameMap, roomCode]);

    const handleRestart = () => {
        socket.emit('restart_game', { code: roomCode });
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-start bg-transparent overflow-hidden relative pt-12 md:justify-center md:pt-0">
            {/* Main Game Container - Transparent to see paper bg */}
            <div className="relative w-full max-w-6xl aspect-video bg-transparent shadow-none overflow-hidden shrink-0 border-2 border-black/50">
                {/* Canvas Cover (Grass Overlay) - Behind Canvas */}
                <CanvasCover />

                <canvas ref={canvasRef} className="block w-full h-full object-contain relative z-10" />

                {/* HUD Layer */}
                <div className="absolute top-4 left-4 pointer-events-none z-10 w-full pr-8 flex justify-between items-start">
                    <span className="text-black text-xl font-bold font-mono px-2 py-1 border-2 border-black border-dashed transform -rotate-1 bg-white/50 backdrop-blur-sm">ROOM: {roomCode}</span>

                    {isHost && (
                        <button
                            onClick={handleRestart}
                            className="pointer-events-auto bg-white hover:bg-gray-50 text-black text-xl border-2 border-black border-dashed font-bold font-mono px-2 py-1 transform -rotate-1 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
                        >
                            <span>RESTART</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
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
                    />
                )}
            </div>

            {/* Controls Area - Mobile Only, positioned for comfort */}
            {/* Hidden on md (768px+), visible on smaller screens */}
            <div className="w-full h-auto mt-6 px-4 pb-8 md:hidden shrink-0 z-20 pointer-events-auto flex justify-center">
                <MobileControls />
            </div>
        </div>
    );
};

export default GameScreen;
