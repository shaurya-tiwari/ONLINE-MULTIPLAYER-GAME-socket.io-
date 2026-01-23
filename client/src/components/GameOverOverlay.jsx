import React from 'react';

const GameOverOverlay = ({ isHost, onRestart }) => {
    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-ink/80 animate-in fade-in duration-500 p-6">
            <div className="card-paper rough-edge w-full max-w-md flex flex-col items-center gap-8 py-12 px-6 shadow-2xl animate-fade-in text-center">

                <div className="flex flex-col items-center gap-2">
                    <h2 className="text-4xl md:text-5xl font-black text-ink uppercase tracking-tighter italic">
                        Race Finished
                    </h2>
                    <div className="h-1 w-24 bg-marker"></div>
                </div>

                <div className="space-y-2">
                    <p className="font-black text-xl uppercase tracking-tighter opacity-80">
                        {isHost ? "RACE CONCLUDED" : "PODIUM SECURED"}
                    </p>
                    <p className="text-xs font-bold opacity-40 uppercase tracking-widest max-w-[200px] mx-auto">
                        {isHost
                            ? "You are the team captain. Would you like to restart the race?"
                            : "Waiting for the team captain to signal the next start..."}
                    </p>
                </div>

                {isHost && (
                    <button
                        onClick={onRestart}
                        className="btn-ink w-full max-w-[240px] flex items-center justify-center gap-3 active:scale-95 transition-all py-3 text-xl"
                    >
                        <span>READY UP</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                    </button>
                )}

                {!isHost && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-4 border-ink border-t-marker rounded-full animate-spin"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Awaiting Signal</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GameOverOverlay;
