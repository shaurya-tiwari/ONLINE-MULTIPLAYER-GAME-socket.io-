import React, { useState } from 'react';

const HomeScreen = ({ onHost, onJoin }) => {
    const [view, setView] = useState('menu'); // menu, host, join
    const [name, setName] = useState('');
    const [code, setCode] = useState('');

    const renderMenu = () => (
        <div className="flex flex-col sm:flex-row gap-4 w-full mt-4 animate-fade-in-up">
            <button
                onClick={() => setView('host')}
                className="flex-1 py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white shadow-blue-500/20 border border-blue-400/20"
            >
                Host Game
            </button>
            <button
                onClick={() => setView('join')}
                className="flex-1 py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-white shadow-emerald-500/20 border border-emerald-400/20"
            >
                Join Game
            </button>
        </div>
    );

    const renderHost = () => (
        <div className="w-full flex flex-col gap-6 animate-fade-in-right">
            <div>
                <label className="block text-blue-300 text-sm font-semibold tracking-wider mb-2 uppercase ml-1">Your Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Speedster"
                    className="w-full px-5 py-4 bg-gray-900/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700 transition-all placeholder-gray-500 text-lg shadow-inner"
                />
            </div>
            <div className="flex gap-4">
                <button
                    onClick={() => setView('menu')}
                    className="px-6 py-3 rounded-xl font-bold bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white transition-all border border-gray-600 hover:border-gray-500 backdrop-blur-sm"
                >
                    Back
                </button>
                <button
                    onClick={() => name && onHost(name)}
                    disabled={!name}
                    className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all shadow-lg ${name
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25 hover:shadow-blue-500/40 transform hover:-translate-y-0.5'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                        }`}
                >
                    Start Game
                </button>
            </div>
        </div>
    );

    const renderJoin = () => (
        <div className="w-full flex flex-col gap-6 animate-fade-in-left">
            <div>
                <label className="block text-emerald-300 text-sm font-semibold tracking-wider mb-2 uppercase ml-1">Your Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. DriftKing"
                    className="w-full px-5 py-4 bg-gray-900/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-700 transition-all placeholder-gray-500 text-lg shadow-inner"
                />
            </div>
            <div>
                <label className="block text-emerald-300 text-sm font-semibold tracking-wider mb-2 uppercase ml-1">Room Code</label>
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="ABCD"
                    maxLength={4}
                    className="w-full px-5 py-4 bg-gray-900/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-700 transition-all uppercase tracking-widest text-lg font-mono placeholder-gray-600 shadow-inner"
                />
            </div>
            <div className="flex gap-4 pt-2">
                <button
                    onClick={() => setView('menu')}
                    className="px-6 py-3 rounded-xl font-bold bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white transition-all border border-gray-600 hover:border-gray-500 backdrop-blur-sm"
                >
                    Back
                </button>
                <button
                    onClick={() => name && code && onJoin(name, code)}
                    disabled={!name || !code}
                    className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all shadow-lg ${name && code
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40 transform hover:-translate-y-0.5'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                        }`}
                >
                    Join Room
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col items-center gap-8 p-8 md:p-10 w-full max-w-md mx-4 bg-gray-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl -z-10 pointer-events-none"></div>

            <div className="text-center space-y-2">
                <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-sm tracking-tight">
                    Stickman Racing
                </h1>
                <p className="text-gray-400 text-sm font-medium tracking-wide">MULTIPLAYER EDITION</p>
            </div>

            {view === 'menu' && renderMenu()}
            {view === 'host' && renderHost()}
            {view === 'join' && renderJoin()}
        </div>
    );
};

export default HomeScreen;
