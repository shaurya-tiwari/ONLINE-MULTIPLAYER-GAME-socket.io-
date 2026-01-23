import React, { useState } from 'react';

const HomeScreen = ({ onHost, onJoin }) => {
    const [view, setView] = useState('menu'); // menu, host, join
    const [name, setName] = useState('');
    const [code, setCode] = useState('');

    const titleStyle = "text-6xl md:text-9xl font-black mb-16 tracking-tighter animate-float text-black drop-shadow-lg";
    const cardStyle = "card-paper rough-edge w-full max-w-md flex flex-col gap-6 items-center animate-fade-in";
    const inputStyle = "w-full bg-transparent border-b-4 border-ink px-4 py-4 text-2xl font-black placeholder-gray-400 outline-none focus:border-marker transition-all uppercase text-center";
    const primaryButtonStyle = "btn-ink transition-all active:scale-95";
    const secondaryButtonStyle = "text-sm font-black border-b-2 border-transparent hover:border-ink transition-all mt-8 uppercase tracking-widest opacity-60 hover:opacity-100 cursor-pointer";

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

            <button
                onClick={() => name && onHost(name)}
                disabled={!name}
                className={`${primaryButtonStyle} ${!name ? 'opacity-20 grayscale pointer-events-none' : ''}`}
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full opacity-[0.03] pointer-events-none select-none">
                <h1 className="text-[20rem] font-black italic">RACE</h1>
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
