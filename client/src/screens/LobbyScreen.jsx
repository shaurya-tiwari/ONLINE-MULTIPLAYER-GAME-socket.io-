import React from 'react';

const LobbyScreen = ({
    roomCode,
    players,
    onInvite,
    onStartGame,
    isHost
}) => {
    const playerList = Object.values(players || {});

    return (
        <div className="flex flex-col items-center gap-8 p-8 md:p-10 w-full max-w-md mx-4 bg-gray-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden animate-fade-in-up">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

            <div className="text-center w-full">
                <h2 className="text-blue-300 text-xs font-bold uppercase tracking-[0.2em] mb-3">Room Code</h2>
                <div className="relative group cursor-pointer" onClick={() => { navigator.clipboard.writeText(roomCode); alert('Code copied!'); }}>
                    <div className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-widest font-mono drop-shadow-lg transition-transform transform group-hover:scale-105">
                        {roomCode}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-400 transition-opacity">
                        Click to Copy
                    </div>
                </div>
            </div>

            <div className="w-full bg-gray-800/40 rounded-2xl p-4 border border-white/5 shadow-inner">
                <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider flex justify-between items-center px-2">
                    <span>Players</span>
                    <span className="bg-gray-700/50 px-2 py-1 rounded text-white text-xs">{playerList.length}/4</span>
                </h3>
                <div className="flex flex-col gap-3">
                    {playerList.map((player) => (
                        <div
                            key={player.id}
                            className="flex items-center justify-between bg-gray-700/40 hover:bg-gray-700/60 p-4 rounded-xl border border-white/5 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${player.isHost ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]' : 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]'}`}></div>
                                <span className="font-bold text-gray-200 group-hover:text-white transition-colors">{player.name}</span>
                            </div>
                            {player.isHost && (
                                <span className="text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-1 rounded-md tracking-wide">
                                    HOST
                                </span>
                            )}
                        </div>
                    ))}
                    {playerList.length === 0 && (
                        <div className="text-center py-4 text-gray-500 text-sm italic">
                            Waiting for players...
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-3 w-full mt-2">
                {isHost ? (
                    <button
                        onClick={onStartGame}
                        className="w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-green-500/25 hover:shadow-green-500/40 transform hover:-translate-y-0.5"
                    >
                        START RACE
                    </button>
                ) : (
                    <div className="w-full py-4 text-center rounded-xl bg-gray-800/50 border border-gray-700 text-gray-400 font-medium animate-pulse">
                        Waiting for host to start...
                    </div>
                )}

                {isHost && (
                    <button
                        onClick={onInvite}
                        className="w-full py-3 rounded-xl font-bold text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        Copy Invite Link
                    </button>
                )}
            </div>
        </div>
    );
};

export default LobbyScreen;
