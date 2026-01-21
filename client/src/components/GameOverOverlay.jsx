import React from 'react';

const GameOverOverlay = ({ isHost, onRestart }) => {
    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="bg-gray-900 border-2 border-blue-500 p-8 rounded-2xl shadow-[0_0_50px_rgba(59,130,246,0.5)] text-center max-w-md w-full mx-4">

                <h2 className="text-4xl font-black text-white mb-2 italic uppercase tracking-wider">
                    Race Finished
                </h2>

                <div className="h-1 w-24 bg-blue-500 mx-auto mb-6 rounded-full"></div>

                <p className="text-gray-400 mb-8 text-lg">
                    {isHost
                        ? "You are the Host. Start a new race?"
                        : "Waiting for Host to restart..."}
                </p>

                {isHost && (
                    <button
                        onClick={onRestart}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xl rounded-xl shadow-lg transform transition-all hover:scale-105 active:scale-95"
                    >
                        RESTART RACE ↻
                    </button>
                )}

                {!isHost && (
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GameOverOverlay;
