import React, { useState } from 'react';

const LobbyScreen = ({
    roomCode,
    players,
    onInvite,
    onStartGame,
    isHost
}) => {
    const playerList = Object.values(players || {});
    const [copied, setCopied] = useState(false);

    const cardStyle = "card-paper rough-edge w-full max-w-md flex flex-col gap-8 items-center animate-fade-in";
    const primaryButtonStyle = "btn-ink transition-all active:scale-95";
    const secondaryButtonStyle = "text-sm font-black border-b-2 border-transparent hover:border-ink transition-all mt-4 uppercase tracking-widest opacity-60 hover:opacity-100 cursor-pointer text-center w-full";

    const handleCopy = () => {
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-6 bg-transparent">
            <div className={cardStyle}>

                {/* Room Code Section */}
                <div className="w-full text-center flex flex-col items-center gap-4">
                    <div className="flex flex-col items-center">
                        <h2 className="text-sm font-black text-marker uppercase tracking-widest mb-1">Room Identity</h2>
                        <div className="h-1 w-12 bg-marker mb-4"></div>
                    </div>

                    <div
                        onClick={handleCopy}
                        className="group relative cursor-pointer"
                    >
                        <span className="text-7xl md:text-8xl font-black tracking-tighter text-black transition-transform group-hover:scale-105 block">
                            {roomCode}
                        </span>
                        <div className={`absolute -top-8 left-1/2 -translate-x-1/2 bg-ink text-paper text-[10px] px-2 py-1 rounded transition-opacity ${copied ? 'opacity-100' : 'opacity-0'}`}>
                            COPIED!
                        </div>
                        <p className="text-[10px] font-bold opacity-30 mt-2 uppercase tracking-[0.2em] group-hover:opacity-60 transition-opacity">
                            Click code to copy
                        </p>
                    </div>
                </div>

                {/* Player List Section */}
                <div className="w-full space-y-4">
                    <div className="flex items-center justify-between border-b-2 border-ink pb-2 mb-6">
                        <h3 className="font-black uppercase tracking-tighter text-xl italic">Athletes</h3>
                        <span className="font-black text-sm bg-ink text-paper px-2 py-0.5 rounded-sm">{playerList.length}/4</span>
                    </div>

                    <div className="space-y-3">
                        {playerList.map((player) => (
                            <div key={player.id} className="flex items-center justify-between group p-2 hover:bg-gray-50 transition-colors rounded-sm border-l-4 border-transparent hover:border-marker">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full border-2 border-ink flex items-center justify-center font-black ${player.isHost ? 'bg-ink text-paper' : 'bg-transparent text-ink'}`}>
                                        {player.name?.[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className={`font-black uppercase tracking-tight ${player.isHost ? 'text-lg' : 'text-base opacity-80'}`}>
                                            {player.name}
                                        </p>
                                        {player.isHost && <p className="text-[8px] font-black italic -mt-1 opacity-40">TEAM CAPTAIN</p>}
                                    </div>
                                </div>
                                {player.isHost && (
                                    <span className="text-[10px] font-black border border-ink px-1.5 py-0.5 rounded uppercase tracking-tighter">HOST</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Section */}
                <div className="w-full pt-4">
                    {isHost ? (
                        <button onClick={onStartGame} className={primaryButtonStyle}>
                            Launch Race
                        </button>
                    ) : (
                        <div className="w-full py-4 text-center border-2 border-ink border-dashed rounded-lg bg-gray-50 animate-pulse">
                            <span className="font-black uppercase tracking-widest text-sm italic">Waiting for signal...</span>
                        </div>
                    )}

                    <button onClick={onInvite} className={secondaryButtonStyle}>
                        Copy Invite Link
                    </button>
                </div>

            </div>
        </div>
    );
};

export default LobbyScreen;
