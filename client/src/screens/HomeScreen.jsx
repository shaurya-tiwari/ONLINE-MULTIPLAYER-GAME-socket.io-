import React, { useState } from 'react';

const HomeScreen = ({ onHost, onJoin }) => {
    const [view, setView] = useState('menu'); // menu, host, join
    const [name, setName] = useState('');
    const [code, setCode] = useState('');

    const renderMenu = () => (
        <div className="flex gap-4 w-full mt-2">
            <button
                onClick={() => setView('host')}
                className="flex-1 py-3 rounded-lg font-bold transition-all bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/30"
            >
                Host Game
            </button>
            <button
                onClick={() => setView('join')}
                className="flex-1 py-3 rounded-lg font-bold transition-all bg-green-600 hover:bg-green-500 text-white shadow-lg hover:shadow-green-500/30"
            >
                Join Game
            </button>
        </div>
    );

    const renderHost = () => (
        <div className="w-full flex flex-col gap-4">
            <div>
                <label className="block text-gray-400 text-sm mb-2">Enter Your Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Speedster"
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
            </div>
            <div className="flex gap-3">
                <button
                    onClick={() => setView('menu')}
                    className="px-6 py-3 rounded-lg font-bold bg-gray-600 hover:bg-gray-500 text-white transition-all"
                >
                    Back
                </button>
                <button
                    onClick={() => name && onHost(name)}
                    disabled={!name}
                    className={`flex-1 py-3 rounded-lg font-bold transition-all ${name
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    Start Game
                </button>
            </div>
        </div>
    );

    const renderJoin = () => (
        <div className="w-full flex flex-col gap-4">
            <div>
                <label className="block text-gray-400 text-sm mb-2">Enter Your Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Speedster"
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
            </div>
            <div>
                <label className="block text-gray-400 text-sm mb-2">Room Code</label>
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="ABCD"
                    maxLength={4}
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all uppercase"
                />
            </div>
            <div className="flex gap-3">
                <button
                    onClick={() => setView('menu')}
                    className="px-6 py-3 rounded-lg font-bold bg-gray-600 hover:bg-gray-500 text-white transition-all"
                >
                    Back
                </button>
                <button
                    onClick={() => name && code && onJoin(name, code)}
                    disabled={!name || !code}
                    className={`flex-1 py-3 rounded-lg font-bold transition-all ${name && code
                        ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    Join Room
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col items-center gap-6 p-8 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-96">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Stickman Racing
            </h1>

            {view === 'menu' && renderMenu()}
            {view === 'host' && renderHost()}
            {view === 'join' && renderJoin()}
        </div>
    );
};

export default HomeScreen;
