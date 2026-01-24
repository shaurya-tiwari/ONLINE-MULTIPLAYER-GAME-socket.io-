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
    const cardStyle = "sketch-card w-full max-w-md flex flex-col gap-6 md:gap-8 items-center animate-fade-in max-h-[90vh] overflow-y-auto py-10 px-8 z-20";
    const primaryButtonStyle = "btn-ink bg-marker text-paper border-ink transition-all active:scale-95 py-5 text-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] w-full";
    const secondaryButtonStyle = "text-xl font-black border-b-2 border-transparent hover:border-marker transition-all mt-6 uppercase tracking-widest opacity-50 hover:opacity-100 cursor-pointer text-center w-full";

    const handleCopy = () => {
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="sketch-ui-root w-full h-full flex items-center justify-center p-4 md:p-6 bg-transparent overflow-hidden">
            <div className={cardStyle}>

                {/* Room Details Badge */}
                <div className="w-full flex justify-between items-start gap-2 mb-2 shrink-0">
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
                        <span className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-black transition-transform group-hover:scale-105 block leading-none landscape:text-4xl">
                            {roomCode}
                        </span>
                        <div className={`absolute -top-6 md:-top-8 left-1/2 -translate-x-1/2 bg-ink text-paper text-[10px] px-2 py-1 rounded transition-opacity ${copied ? 'opacity-100' : 'opacity-0'}`}>
                            COPIED!
                        </div>
                    </div>
                </div>

                {/* Player List Section - SCROLLABLE to save space */}
                <div className="w-full flex-grow overflow-y-auto min-h-[200px] space-y-4 md:space-y-6 px-1 custom-scrollbar">
                    <div className="flex items-center justify-between border-b-[3px] border-ink pb-2 mb-4 sticky top-0 bg-[#fefcf5] z-10">
                        <h3 className="font-black uppercase tracking-tight text-3xl italic marker-underline">Athletes</h3>
                        <span className="font-black text-lg bg-ink text-paper px-3 py-1 rotate-2">
                            {playerList.length}/4
                        </span>
                    </div>

                    <div className="space-y-2 md:space-y-3 pb-2">
                        {playerList.map((player) => (
                            <div key={player.id} className="flex items-center justify-between group p-3 hover:bg-marker/5 transition-colors rounded-lg border-l-4 border-transparent hover:border-marker">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full border-[3px] border-ink flex items-center justify-center text-xl font-black ${player.isHost ? 'bg-ink text-paper' : 'bg-transparent text-ink'} transform rotate-${(player.name?.length || 0) % 6}`}>
                                        {player.name?.[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className={`font-black uppercase tracking-tight ${player.isHost ? 'text-2xl' : 'text-xl opacity-80'}`}>
                                            {player.name}
                                        </p>
                                        {player.isHost && <p className="text-xs font-black italic -mt-1 opacity-50">TEAM CAPTAIN</p>}
                                    </div>
                                </div>
                                {player.isHost && (
                                    <span className="text-xs font-black border-[2px] border-ink px-2 py-0.5 rounded uppercase tracking-tighter rotate-[-3deg]">HOST</span>
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
