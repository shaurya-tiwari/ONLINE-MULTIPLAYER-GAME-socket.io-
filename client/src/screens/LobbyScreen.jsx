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
        <div className="flex flex-col items-center gap-8 p-8 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 min-w-[400px]">
            <div className="text-center">
                <h2 className="text-gray-400 text-sm uppercase tracking-widest mb-1">Room Code</h2>
                <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-wider font-mono">
                    {roomCode}
                </div>
            </div>

            <div className="w-full">
                <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">
                    Players ({playerList.length})
                </h3>
                <div className="flex flex-col gap-3">
                    {playerList.map((player) => (
                        <div
                            key={player.id}
                            className="flex items-center justify-between bg-gray-700/50 p-3 rounded-lg border border-gray-600"
                        >
                            <span className="font-medium text-white">{player.name}</span>
                            {player.isHost && (
                                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                                    HOST
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-4 w-full mt-4">
                {isHost && (
                    <button
                        onClick={onInvite}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg transition-all"
                    >
                        Invite Player
                    </button>
                )}

                {isHost ? (
                    <button
                        onClick={onStartGame}
                        className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold shadow-lg transition-all"
                    >
                        Start Race
                    </button>
                ) : (
                    <div className="flex-1 text-center py-3 text-gray-400 animate-pulse">
                        Waiting for host...
                    </div>
                )}

            </div>
        </div>
    );
};

export default LobbyScreen;
