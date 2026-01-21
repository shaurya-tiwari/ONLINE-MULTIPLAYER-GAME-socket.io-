import React from 'react';

const LobbyScreen = ({
    roomCode,
    players,
    onInvite,
    onStartGame,
    isHost
}) => {
    const playerList = Object.values(players || {});

    // Sketchbook Button Style
    const buttonStyle = "w-full py-4 text-2xl font-black border-2 border-black rounded-lg hover:bg-black hover:text-white transition-all transform hover:-translate-y-1 active:translate-y-0 uppercase tracking-widest bg-transparent text-black";
    const boxStyle = "w-full border-2 border-black p-4 relative"; // No background, just border

    return (
        <div className="flex flex-col items-center gap-8 w-full max-w-md animate-fade-in-up">

            {/* Room Code - Sticky Note Style */}
            <div className="text-center relative transform -rotate-2">
                <p className="text-xl font-bold mb-2 uppercase tracking-tight">Room Code</p>
                <div
                    onClick={() => { navigator.clipboard.writeText(roomCode); alert('Code copied!'); }}
                    className="cursor-pointer border-4 border-black border-dashed px-8 py-2 text-6xl font-black tracking-widest hover:scale-105 transition-transform bg-transparent"
                >
                    {roomCode}
                </div>
                <p className="text-xs font-bold mt-2 opacity-50 uppercase tracking-widest">Click to Copy</p>
            </div>

            {/* Player List */}
            <div className={`w-full ${boxStyle}`}>
                <h3 className="text-xl font-black uppercase border-b-2 border-black pb-2 mb-4 flex justify-between">
                    Players <span>{playerList.length}/4</span>
                </h3>

                <div className="flex flex-col gap-3">
                    {playerList.map((player) => (
                        <div key={player.id} className="flex items-center justify-between text-2xl font-bold">
                            <span className="flex items-center gap-2">
                                <span className="text-3xl">{player.isHost ? "★" : "•"}</span>
                                <span className={player.isHost ? "underline decoration-2" : ""}>{player.name}</span>
                            </span>
                            {player.isHost && <span className="text-sm border border-black px-2 py-1 rounded">HOST</span>}
                        </div>
                    ))}
                    {playerList.length === 0 && (
                        <div className="text-center py-4 text-gray-400 italic font-medium">Waiting for players...</div>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="w-full space-y-4">
                {isHost ? (
                    <button onClick={onStartGame} className={buttonStyle}>
                        START RACE
                    </button>
                ) : (
                    <div className="w-full py-4 text-center text-xl font-bold text-black border-2 border-black border-dashed animate-pulse uppercase">
                        Waiting for Host...
                    </div>
                )}

                <button
                    onClick={onInvite}
                    className="text-lg font-bold text-black border-b border-transparent hover:border-black transition-all w-full text-center uppercase"
                >
                    Copy Invite Link
                </button>
            </div>
        </div>
    );
};

export default LobbyScreen;
