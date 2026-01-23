import React, { useState } from 'react';

const HomeScreen = ({ onHost, onJoin }) => {
    const [view, setView] = useState('menu'); // menu, host, join
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [raceLength, setRaceLength] = useState('500m');

    const titleStyle = "text-5xl md:text-7xl lg:text-8xl font-black mb-8 md:mb-12 tracking-tighter animate-float text-black drop-shadow-lg leading-none";
    const cardStyle = "card-paper rough-edge w-full max-w-md flex flex-col gap-4 md:gap-6 items-center animate-fade-in py-6 md:py-8";
    const inputStyle = "w-full bg-transparent border-b-4 border-ink px-4 py-3 md:py-4 text-xl md:text-2xl font-black placeholder-gray-400 outline-none focus:border-marker transition-all uppercase text-center";
    const primaryButtonStyle = "btn-ink transition-all active:scale-95 py-3 md:py-4 text-xl md:text-2xl";
    const secondaryButtonStyle = "text-[10px] md:text-xs font-black border-b-2 border-transparent hover:border-ink transition-all mt-4 md:mt-6 uppercase tracking-widest opacity-60 hover:opacity-100 cursor-pointer";

    const renderMenu = () => (
        <div className={cardStyle}>
            <button onClick={() => setView('host')} className={primaryButtonStyle}>
                Host Game
            </button>
            <button onClick={() => setView('join')} className={primaryButtonStyle}>
                Join Game
            </button>
        </div>
    );

    const renderHost = () => (
        <div className={cardStyle}>
            <div className="flex flex-col items-center gap-2 mb-4">
                <h2 className="text-4xl font-black underline decoration-marker decoration-4 underline-offset-8">HOST ROOM</h2>
                <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Setup your race</p>
            </div>

            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="YOUR NAME"
                className={inputStyle}
                maxLength={12}
            />

            <div className="w-full space-y-2 mt-4">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 text-center">Select Race Length</p>
                <div className="flex gap-2 justify-center">
                    {['500m', '1500m', '3000m'].map(len => (
                        <button
                            key={len}
                            onClick={() => setRaceLength(len)}
                            className={`px-3 py-2 border-2 font-black text-xs transition-all ${raceLength === len ? 'bg-ink text-paper border-ink' : 'border-gray-200 opacity-60'}`}
                        >
                            {len}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={() => name && onHost(name, raceLength)}
                disabled={!name}
                className={`${primaryButtonStyle} mt-4 ${!name ? 'opacity-20 grayscale pointer-events-none' : ''}`}
            >
                CREATE
            </button>

            <button onClick={() => setView('menu')} className={secondaryButtonStyle}>
                Back to Menu
            </button>
        </div>
    );

    const renderJoin = () => (
        <div className={cardStyle}>
            <div className="flex flex-col items-center gap-2 mb-4">
                <h2 className="text-4xl font-black underline decoration-marker decoration-4 underline-offset-8">JOIN RACE</h2>
                <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Enter room details</p>
            </div>

            <div className="w-full space-y-8">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="YOUR NAME"
                    className={inputStyle}
                    maxLength={12}
                />

                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="ROOM CODE"
                    className={inputStyle}
                    maxLength={4}
                />
            </div>

            <button
                onClick={() => name && code && onJoin(name, code)}
                disabled={!name || !code}
                className={`${primaryButtonStyle} ${!name || !code ? 'opacity-20 grayscale pointer-events-none' : ''}`}
            >
                READY
            </button>

            <button onClick={() => setView('menu')} className={secondaryButtonStyle}>
                Back to Menu
            </button>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 relative">
            {/* Title Background Accent */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full opacity-[0.02] pointer-events-none select-none">
                <h1 className="text-[12rem] md:text-[20rem] font-black italic">RACE</h1>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
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
