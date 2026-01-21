import React from 'react';

const GameOverOverlay = ({ isHost, onRestart }) => {
    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="bg-gray-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-[0_0_50px_rgba(59,130,246,0.3)] text-center max-w-md w-full mx-4 transform transition-all animate-bounce-in">

                <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-2 italic uppercase tracking-wider drop-shadow-lg">
                    Race Finished
                </h2>

                <div className="h-1.5 w-24 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mb-8 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>

                <p className="text-gray-300 mb-8 text-lg font-medium">
                    {isHost
                        ? "You are the Host. Start a new race?"
                        : "Waiting for Host to restart..."}
                </p>

                {isHost && (
                    <button
                        onClick={onRestart}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xl rounded-2xl shadow-lg shadow-blue-500/30 transform transition-all hover:scale-105 active:scale-95 border border-white/10"
                    >
                        RESTART RACE ↻
                    </button>
                )}

                {!isHost && (
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500/30 border-t-blue-500"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GameOverOverlay;
