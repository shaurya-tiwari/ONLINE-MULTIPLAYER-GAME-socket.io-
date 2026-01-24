import React from 'react';

const GameOverOverlay = ({ isHost, onRestart, winnerName }) => {
    return (
        <div className="sketch-ui-root absolute inset-0 z-[var(--z-overlay)] flex items-center justify-center bg-transparent animate-in fade-in duration-500 p-4 md:p-6 pointer-events-auto">
            <div className="w-full max-w-2xl flex flex-col items-center gap-4 md:gap-8 py-8 md:py-12 px-6 animate-fade-in text-center overflow-y-auto max-h-[90vh] z-20 sketch-card bg-[#fefcf5] border-[4px] border-ink shadow-[12px_12px_0px_0px_rgba(0,0,0,0.15)] custom-scrollbar">

                <div className="flex flex-col items-center gap-2 md:gap-4">
                    <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-black uppercase tracking-tighter leading-none scale-110">
                        <span className="marker-underline">{winnerName ? `${winnerName} WON!` : "FINISH LINE"}</span>
                    </h2>
                    <div className="h-2 w-32 bg-marker/20 rounded-full transform -rotate-1"></div>
                </div>

                <div className="space-y-1">
                    <p className="text-xl md:text-3xl font-black text-black opacity-80 uppercase tracking-widest italic">
                        {isHost ? "Ready to race again?" : "Waiting for Captain..."}
                    </p>
                </div>

                {isHost && (
                    <button
                        onClick={onRestart}
                        className="btn-ink mt-6 md:mt-10 bg-marker text-paper border-ink text-xl md:text-2xl px-8 py-4 md:px-10 md:py-5 transform transition-all hover:scale-105 active:scale-95 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] flex items-center gap-3 md:gap-4 uppercase tracking-widest font-black"
                    >
                        <span>PLAY AGAIN</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6 md:w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                    </button>
                )}

                {!isHost && (
                    <div className="flex flex-col items-center gap-4 mt-2">
                        <div className="w-8 h-8 border-4 border-ink/20 border-t-marker rounded-full animate-spin"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(GameOverOverlay);
