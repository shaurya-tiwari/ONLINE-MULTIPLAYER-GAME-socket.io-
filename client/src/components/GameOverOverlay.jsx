import React from 'react';

const GameOverOverlay = ({ isHost, onRestart, winnerName }) => {
    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-transparent animate-in fade-in duration-500 p-6 pointer-events-auto">
            <div className="w-full max-w-4xl flex flex-col items-center gap-4 md:gap-8 py-6 md:py-12 px-6 animate-fade-in text-center overflow-y-auto max-h-screen">

                <div className="flex flex-col items-center gap-2 md:gap-4">
                    <h2 className="text-4xl sm:text-6xl md:text-8xl font-black text-white uppercase tracking-tighter italic drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] leading-none">
                        {winnerName ? `${winnerName} WON!` : "RACE FINISHED"}
                    </h2>
                    <div className="h-1 md:h-2 w-32 md:w-48 bg-white/90 rounded-full shadow-lg"></div>
                </div>

                <div className="space-y-2 md:space-y-4">
                    <p className="text-lg md:text-2xl font-bold text-white/90 uppercase tracking-widest drop-shadow-md">
                        {isHost ? "Waiting for players..." : "Waiting for host..."}
                    </p>
                </div>

                {isHost && (
                    <button
                        onClick={onRestart}
                        className="mt-4 md:mt-8 bg-white text-black font-black text-base md:text-xl px-6 py-3 md:px-8 md:py-4 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 md:gap-3 uppercase tracking-wider"
                    >
                        <span>PLAY AGAIN</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5 md:w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                    </button>
                )}

                {!isHost && (
                    <div className="flex flex-col items-center gap-4 mt-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(GameOverOverlay);
