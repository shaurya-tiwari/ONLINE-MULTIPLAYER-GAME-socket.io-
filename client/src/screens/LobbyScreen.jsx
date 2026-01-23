import React, { useState } from 'react';

const LobbyScreen = ({
    roomCode,
    players,
    onInvite,
    onStartGame,
    isHost,
    raceLength
}) => {
    const playerList = Object.values(players || {});
    const hostPlayer = playerList.find(p => p.isHost);
    const [copied, setCopied] = useState(false);

    // Changed: Added max-h-screen and overflow handling to outer card
    const cardStyle = "card-paper rough-edge w-full max-w-md flex flex-col gap-4 md:gap-8 items-center animate-fade-in max-h-[90vh] overflow-hidden py-8 px-6";
    const primaryButtonStyle = "btn-ink transition-all active:scale-95 py-4 text-xl";
    const secondaryButtonStyle = "text-sm font-black border-b-2 border-transparent hover:border-ink transition-all mt-4 uppercase tracking-widest opacity-60 hover:opacity-100 cursor-pointer text-center w-full";

    const handleCopy = () => {
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-4 md:p-6 bg-transparent overflow-hidden">
            <div className={cardStyle}>

                {/* Room Details Badge */}
                <div className="w-full flex justify-between items-start gap-2 mb-2">
                    <div className="flex flex-col items-start">
                        <span className="text-[8px] font-black text-marker uppercase tracking-widest">Distance</span>
                        <span className="text-sm font-black text-ink">{raceLength || '500m'}</span>
                    </div>
                    <div className="flex flex-col items-center flex-grow">
                        <span className="text-[8px] font-black text-marker uppercase tracking-widest">Room Code</span>
                        <span onClick={handleCopy} className="text-xl font-black text-ink cursor-pointer hover:text-marker transition-colors">{roomCode}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-marker uppercase tracking-widest">Captain</span>
                        <span className="text-sm font-black text-ink truncate max-w-[80px]">{hostPlayer?.name || '...'}</span>
                    </div>
                </div>

                {/* Room Code Section - Compact on small screens */}
                <div className="w-full text-center flex flex-col items-center gap-1 md:gap-2 shrink-0">
                    <div
                        onClick={handleCopy}
                        className="group relative cursor-pointer"
                    >
                        <span className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-black transition-transform group-hover:scale-105 block leading-none">
                            {roomCode}
                        </span>
                        <div className={`absolute -top-6 md:-top-8 left-1/2 -translate-x-1/2 bg-ink text-paper text-[10px] px-2 py-1 rounded transition-opacity ${copied ? 'opacity-100' : 'opacity-0'}`}>
                            COPIED!
                        </div>
                    </div>
                </div>

                {/* Player List Section - SCROLLABLE to save space */}
                <div className="w-full flex-grow overflow-y-auto min-h-0 space-y-2 md:space-y-4 px-1 custom-scrollbar">
                    <div className="flex items-center justify-between border-b-2 border-ink pb-2 mb-2 md:mb-6 sticky top-0 bg-[#f4f1ea] z-10">
                        <h3 className="font-black uppercase tracking-tighter text-lg md:text-xl italic">Athletes</h3>
                        <span className="font-black text-xs md:text-sm bg-ink text-paper px-2 py-0.5 rounded-sm">{playerList.length}/4</span>
                    </div>

                    <div className="space-y-2 md:space-y-3 pb-2">
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

                {/* Action Section - Fixed at Bottom */}
                <div className="w-full pt-2 md:pt-4 shrink-0">
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
