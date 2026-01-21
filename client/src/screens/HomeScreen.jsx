import React, { useState } from 'react';

const HomeScreen = ({ onHost, onJoin }) => {
    const [view, setView] = useState('menu'); // menu, host, join
    const [name, setName] = useState('');
    const [code, setCode] = useState('');

    // Simple Sketch Styles
    const containerStyle = "flex flex-col items-center gap-6 w-full max-w-md animate-fade-in-up";
    const titleStyle = "text-6xl md:text-8xl font-black mb-12 tracking-wider transform -rotate-2 relative z-10 text-black";
    const inputStyle = "w-full bg-transparent border-b-2 border-black border-dashed px-4 py-3 text-2xl placeholder-gray-500 font-bold text-center outline-none focus:border-solid transition-all uppercase placeholder-gray-400";
    const buttonStyle = "w-full py-4 text-2xl font-black border-2 border-black rounded-lg hover:bg-black hover:text-white transition-all transform hover:-translate-y-1 active:translate-y-0 uppercase tracking-widest";
    const secondaryBtnStyle = "text-xl font-bold text-black border-b border-transparent hover:border-black transition-all mt-4 uppercase";

    const renderMenu = () => (
        <div className={containerStyle}>
            <button onClick={() => setView('host')} className={buttonStyle}>
                Host Game
            </button>
            <button onClick={() => setView('join')} className={buttonStyle}>
                Join Game
            </button>
        </div>
    );

    const renderHost = () => (
        <div className={containerStyle}>
            <h2 className="text-3xl font-black mb-4 border-b-4 border-black inline-block">HOST GAME</h2>

            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ENTER NAME"
                className={inputStyle}
                maxLength={12}
            />

            <button
                onClick={() => name && onHost(name)}
                disabled={!name}
                className={`${buttonStyle} ${!name ? 'opacity-30 cursor-not-allowed hover:bg-transparent hover:text-black hover:translate-y-0' : ''}`}
            >
                START
            </button>

            <button onClick={() => setView('menu')} className={secondaryBtnStyle}>
                BACK
            </button>
        </div>
    );

    const renderJoin = () => (
        <div className={containerStyle}>
            <h2 className="text-3xl font-black mb-4 border-b-4 border-black inline-block">JOIN GAME</h2>

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

            <button
                onClick={() => name && code && onJoin(name, code)}
                disabled={!name || !code}
                className={`${buttonStyle} ${!name || !code ? 'opacity-30 cursor-not-allowed hover:bg-transparent hover:text-black hover:translate-y-0' : ''}`}
            >
                JOIN
            </button>

            <button onClick={() => setView('menu')} className={secondaryBtnStyle}>
                BACK
            </button>
        </div>
    );

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <h1 className={titleStyle}>
                STICKMAN <br /> RACE
            </h1>

            {view === 'menu' && renderMenu()}
            {view === 'host' && renderHost()}
            {view === 'join' && renderJoin()}
        </div>
    );
};

export default HomeScreen;
