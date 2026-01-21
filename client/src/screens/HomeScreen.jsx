import React, { useState } from 'react';

const HomeScreen = ({ onHost, onJoin }) => {
    const [name, setName] = useState('');

    return (
        <div className="flex flex-col items-center gap-6 p-8 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Stickman Racing
            </h1>

            <div className="w-full">
                <label className="block text-gray-400 text-sm mb-2">Enter Your Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Speedster"
                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
            </div>

            <div className="flex gap-4 w-full mt-2">
                <button
                    onClick={() => name && onHost(name)}
                    disabled={!name}
                    className={`flex-1 py-3 rounded-lg font-bold transition-all ${name
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/30'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    Host Game
                </button>

                <button
                    onClick={() => name && onJoin(name)}
                    disabled={!name}
                    className={`flex-1 py-3 rounded-lg font-bold transition-all ${name
                            ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg hover:shadow-green-500/30'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    Join Game
                </button>
            </div>
        </div>
    );
};

export default HomeScreen;
