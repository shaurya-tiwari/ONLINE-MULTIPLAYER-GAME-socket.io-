import React, { useEffect, useRef, useState } from 'react';
import { startGameLoop, stopGameLoop } from '../game/gameLoop';
import MobileControls from '../components/MobileControls';
import GameOverOverlay from '../components/GameOverOverlay';

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

        // Set canvas dimensions
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Callback when local player finishes
        const onGameOver = () => {
            setShowGameOver(true);
        };

        // Initialize Game Loop with Map
        startGameLoop(canvas, socket, playerId, players, gameMap, roomCode, onGameOver);

        // Handle resizing
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        return () => {
            stopGameLoop();
            window.removeEventListener('resize', handleResize);
        };
    }, [socket, playerId, players, gameMap, roomCode]);

    const handleRestart = () => {
        socket.emit('restart_game', { code: roomCode });
    };

    return (
        <div className="w-full h-full bg-black overflow-hidden relative">
            <canvas ref={canvasRef} className="block" />

            {/* HUD Layer */}
            <div className="absolute top-4 left-4 text-white text-xl font-bold font-mono pointer-events-none">
                ROOM: {roomCode}
            </div>

            {/* Game Over Overlay */}
            {showGameOver && (
                <GameOverOverlay
                    isHost={isHost}
                    onRestart={handleRestart}
                />
            )}

            {/* Mobile Controls Overlay */}
            <MobileControls />
        </div>
    );
};

export default GameScreen;
