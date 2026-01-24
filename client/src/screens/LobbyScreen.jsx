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
    const cardStyle = "sketch-card w-full max-w-md flex flex-col gap-4 md:gap-6 items-center animate-fade-in max-h-[90vh] overflow-y-auto py-8 px-8 z-[var(--z-screen)] custom-scrollbar landscape:py-4 landscape:gap-2";
    const primaryButtonStyle = "btn-ink bg-marker text-paper border-ink transition-all active:scale-95 py-3 text-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] w-full";
    const secondaryButtonStyle = "text-sm font-black border-b-2 border-transparent hover:border-marker transition-all mt-4 uppercase tracking-widest opacity-60 hover:opacity-100 cursor-pointer text-center w-full block";

    const handleCopy = () => {
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="sketch-ui-root w-full h-full min-h-screen flex items-center justify-center p-4 md:p-6 bg-transparent overflow-hidden relative">
            <div className={cardStyle}>

                {/* Room Details Badge */}
                <div className="w-full flex justify-between items-start gap-2 mb-1 shrink-0">
                    <div className="flex flex-col items-start">
                        <span className="text-[9px] font-black text-marker uppercase tracking-widest">Distance</span>
                        <span className="text-xs font-black text-ink">{raceLength || '500m'}</span>
                    </div>
                    <div className="flex flex-col items-center flex-grow">
                        <span className="text-[9px] font-black text-marker uppercase tracking-widest">Room Code</span>
                        <span onClick={handleCopy} className="text-lg font-black text-ink cursor-pointer hover:text-marker transition-colors">{roomCode}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-marker uppercase tracking-widest">Captain</span>
                        <span className="text-xs font-black text-ink truncate max-w-[80px]">{hostPlayer?.name || '...'}</span>
                    </div>
                </div>

                {/* Room Code Section - Compact on small screens */}
                <div className="w-full text-center flex flex-col items-center gap-1 shrink-0 landscape:hidden">
                    <div
                        onClick={handleCopy}
                        className="group relative cursor-pointer"
                    >
                        <span className="text-6xl md:text-8xl font-black tracking-tighter text-black transition-transform group-hover:scale-105 block leading-none">
                            {roomCode}
                        </span>
                        <div className={`absolute -top-6 left-1/2 -translate-x-1/2 bg-ink text-paper text-[10px] px-2 py-1 rounded transition-opacity ${copied ? 'opacity-100' : 'opacity-0'}`}>
                            COPIED!
                        </div>
                    </div>
                </div>

                {/* Player List Section - SCROLLABLE to save space */}
                <div className="w-full flex-grow overflow-y-auto min-h-[150px] landscape:min-h-[100px] space-y-3 px-1 custom-scrollbar">
                    <div className="flex items-center justify-between border-b-[3px] border-ink pb-1 mb-3 sticky top-0 bg-[#fefcf5] z-10">
                        <h3 className="font-black uppercase tracking-tighter text-2xl italic marker-underline">Athletes</h3>
                        <span className="font-black text-sm bg-ink text-paper px-2 py-0.5 rotate-1">
                            {playerList.length}/4
                        </span>
                    </div>

                    <div className="space-y-1.5 pb-2">
                        {playerList.map((player) => (
                            <div key={player.id} className="flex items-center justify-between group p-2 hover:bg-marker/5 transition-colors rounded-lg border-l-4 border-transparent hover:border-marker">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full border-[3px] border-ink flex items-center justify-center text-lg font-black ${player.isHost ? 'bg-ink text-paper' : 'bg-transparent text-ink'} transform rotate-${(player.name?.length || 0) % 6}`}>
                                        {player.name?.[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className={`font-black uppercase tracking-tight ${player.isHost ? 'text-xl' : 'text-lg opacity-80'}`}>
                                            {player.name}
                                        </p>
                                        {player.isHost && <p className="text-[9px] font-black italic -mt-1 opacity-50 uppercase tracking-tighter">Captain</p>}
                                    </div>
                                </div>
                                {player.isHost && (
                                    <span className="text-[10px] font-black border-[2px] border-ink px-1.5 py-0.2 rounded uppercase tracking-tighter rotate-[-2deg]">HOST</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Section - Fixed at Bottom */}
                <div className="w-full pt-2 shrink-0 border-t-2 border-dashed border-ink/20">
                    {isHost ? (
                        <button onClick={onStartGame} className={primaryButtonStyle}>
                            Launch Race
                        </button>
                    ) : (
                        <div className="w-full py-4 text-center border-2 border-ink border-dashed rounded-lg bg-gray-50/50 animate-pulse">
                            <span className="font-black uppercase tracking-widest text-[10px] italic">Waiting for signal...</span>
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
