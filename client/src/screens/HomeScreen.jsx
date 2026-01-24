import React, { useState } from 'react';

const HomeScreen = ({ onHost, onJoin }) => {
    const [view, setView] = useState('menu'); // menu, host, join
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [raceLength, setRaceLength] = useState('500m');

    // Dynamic Title sizing: Shorter when in sub-menus or landscape
    const isMainLogo = view === 'menu';
    const titleStyle = `font-black tracking-tighter animate-float text-black drop-shadow-lg leading-none transition-all duration-300 
        ${isMainLogo ? 'text-5xl md:text-7xl lg:text-8xl mb-8 md:mb-12' : 'text-3xl md:text-5xl mb-4 md:mb-6'} 
        landscape:text-4xl landscape:mb-2`;

    const cardStyle = "card-paper rough-edge w-full max-w-md flex flex-col gap-4 items-center animate-fade-in py-6 md:py-8 landscape:py-4 landscape:gap-3 max-h-[90vh] overflow-y-auto";
    const inputStyle = "w-full bg-transparent border-b-4 border-ink px-4 py-2 md:py-3 text-xl md:text-2xl font-black placeholder-gray-300 outline-none focus:border-marker transition-all uppercase text-center";

    // Primary vs Secondary Button Styles
    const primaryButtonStyle = "btn-ink bg-marker text-paper border-ink hover:bg-black hover:text-white transition-all active:scale-95 py-3 md:py-4 text-xl md:text-2xl";
    const secondaryButtonStyle = "btn-ink bg-white text-ink border-ink transition-all active:scale-95 py-3 md:py-4 text-xl md:text-2xl opacity-90 hover:opacity-100";

    const backButtonStyle = "text-[10px] md:text-xs font-black border-b-2 border-transparent hover:border-ink transition-all mt-2 md:mt-4 uppercase tracking-widest opacity-60 hover:opacity-100 cursor-pointer";

    const renderMenu = () => (
        <div className={cardStyle}>
            <div className="w-full space-y-4">
                <button onClick={() => setView('host')} className={primaryButtonStyle}>
                    HOST GAME
                </button>
                <button onClick={() => setView('join')} className={secondaryButtonStyle}>
                    JOIN GAME
                </button>
            </div>
            <p className="text-[10px] font-bold opacity-30 mt-2 uppercase tracking-[0.2em]">Multiplayer Stickman Racing</p>
        </div>
    );

    const renderHost = () => (
        <div className={cardStyle}>
            <div className="flex flex-col items-center gap-1 mb-2">
                <h2 className="text-3xl font-black underline decoration-marker decoration-4 underline-offset-4">HOST ROOM</h2>
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Setup your race</p>
            </div>

            <div className="w-full space-y-1">
                <label className="text-[9px] font-black uppercase text-marker tracking-tighter ml-1">Captain Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ENTER NAME"
                    className={inputStyle}
                    maxLength={12}
                />
            </div>

            <div className="w-full space-y-3 mt-2">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-center">Race Length</p>
                <div className="flex gap-2 justify-center">
                    {['500m', '1500m', '3000m'].map(len => (
                        <button
                            key={len}
                            onClick={() => setRaceLength(len)}
                            className={`flex-1 min-w-[70px] py-3 border-2 font-black text-sm transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] active:translate-y-[1px] active:shadow-none
                                ${raceLength === len ? 'bg-ink text-paper border-ink' : 'bg-white text-ink border-gray-200 opacity-60'}`}
                        >
                            {len}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={() => name && onHost(name, raceLength)}
                disabled={!name}
                className={`${primaryButtonStyle} mt-4 w-full ${!name ? 'opacity-20 grayscale pointer-events-none' : ''}`}
            >
                START ROOM
            </button>

            <button onClick={() => setView('menu')} className={backButtonStyle}>
                ← Back to Menu
            </button>
        </div>
    );

    const renderJoin = () => (
        <div className={cardStyle}>
            <div className="flex flex-col items-center gap-1 mb-2">
                <h2 className="text-3xl font-black underline decoration-marker decoration-4 underline-offset-4">JOIN RACE</h2>
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Enter room details</p>
            </div>

            <div className="w-full space-y-4">
                <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-marker tracking-tighter ml-1">Athlete Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="ENTER NAME"
                        className={inputStyle}
                        maxLength={12}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-marker tracking-tighter ml-1">Room Code</label>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="CODE"
                        className={inputStyle}
                        maxLength={4}
                    />
                </div>
            </div>

            <button
                onClick={() => name && code && onJoin(name, code)}
                disabled={!name || !code}
                className={`${primaryButtonStyle} mt-4 w-full ${!name || !code ? 'opacity-20 grayscale pointer-events-none' : ''}`}
            >
                JOIN RACE
            </button>

            <button onClick={() => setView('menu')} className={backButtonStyle}>
                ← Back to Menu
            </button>
        </div>
    );

    return (
        <div className="w-full h-full min-h-screen flex flex-col items-center justify-center p-4 md:p-6 relative overflow-y-auto">
            {/* Title Background Accent */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full opacity-[0.015] pointer-events-none select-none">
                <h1 className="text-[12rem] md:text-[20rem] font-black italic">RACE</h1>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center w-full max-w-lg">
                <h1 className={titleStyle}>
                    STICKMAN<br />RACE
                </h1>

                {view === 'menu' && renderMenu()}
                {view === 'host' && renderHost()}
                {view === 'join' && renderJoin()}
            </div>
        </div>
    );
};

export default HomeScreen;
