import React from 'react';

const GameOverOverlay = ({ isHost, onRestart, winnerName }) => {
    return (
        <div className="sketch-ui-root absolute inset-0 z-[100] flex items-center justify-center bg-transparent animate-in fade-in duration-500 p-6 pointer-events-auto">
            <div className="w-full max-w-4xl flex flex-col items-center gap-6 md:gap-10 py-10 md:py-16 px-8 animate-fade-in text-center overflow-y-auto max-h-screen z-20">

                <div className="flex flex-col items-center gap-4 md:gap-6">
                    <h2 className="text-5xl sm:text-7xl md:text-9xl font-black text-black uppercase tracking-tight italic marker-underline drop-shadow-sm leading-none rotate-[-1deg]">
                        {winnerName ? `${winnerName} WON!` : "RACE FINISHED"}
                    </h2>
                    <div className="h-2 md:h-3 w-48 md:w-64 bg-marker/40 rounded-full transform -rotate-1 skew-x-12"></div>
                </div>

                <div className="space-y-2 md:space-y-4">
                    <p className="text-2xl md:text-4xl font-bold text-black opacity-80 uppercase tracking-widest">
                        {isHost ? "Waiting for players..." : "Waiting for host..."}
                    </p>
                </div>

                {isHost && (
                    <button
                        onClick={onRestart}
                        className="btn-ink mt-8 md:mt-12 bg-marker text-paper border-ink text-2xl md:text-4xl px-10 py-5 md:px-12 md:py-6 transform transition-all hover:scale-105 active:scale-95 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.1)] flex items-center gap-4 md:gap-6 uppercase tracking-widest"
                    >
                        <span>PLAY AGAIN</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8 md:w-10 h-10">
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
