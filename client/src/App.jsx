import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import HomeScreen from './screens/HomeScreen';
import LobbyScreen from './screens/LobbyScreen';
import GameScreen from './screens/GameScreen';

const socket = io();

function App() {
    const [screen, setScreen] = useState('home'); // home, lobby, game
    const [playerName, setPlayerName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [players, setPlayers] = useState({});
    const [isHost, setIsHost] = useState(false);
    const [gameMap, setGameMap] = useState(null); // [NEW] Map state

    useEffect(() => {
        socket.on('connect', () => {
            console.log("Connected to server:", socket.id);
        });

        socket.on('room_created', ({ code }) => {
            setRoomCode(code);
            setScreen('lobby');
            setIsHost(true);
            setPlayers({
                [socket.id]: { id: socket.id, name: playerName, isHost: true }
            });
        });

        socket.on('update_room', ({ players, code }) => {
            setPlayers(players);
            setRoomCode(code);
            setScreen('lobby');
        });

        // Modified to accept map data
        socket.on('game_started', ({ gameMap }) => {
            setGameMap(gameMap);
            setScreen('game');
        });

        socket.on('game_restarted', ({ gameMap }) => {
            setGameMap(gameMap);
            // Screen is already 'game', but map update triggers re-render in GameScreen
        });

        socket.on('error', ({ message }) => {
            alert(message);
        });

        return () => {
            socket.off('connect');
            socket.off('room_created');
            socket.off('update_room');
            socket.off('game_started');
            socket.off('game_restarted');
            socket.off('error');
        };
    }, [playerName]);

    const handleStartHost = (name) => {
        setPlayerName(name);
        socket.emit('create_room', { name });
    };

    const handleJoinGame = (name, code) => {
        setPlayerName(name);
        socket.emit('join_room', { name, code });
    };

    const handleStartRace = () => {
        socket.emit('start_game', { code: roomCode });
    };

    return (
        <div className="w-screen h-screen flex justify-center items-center bg-gray-900">
            {screen === 'home' && (
                <HomeScreen
                    onHost={handleStartHost}
                    onJoin={() => {
                        const code = prompt("Enter Room Code:");
                        const name = prompt("Enter Your Name:");
                        if (code && name) handleJoinGame(name, code.toUpperCase());
                    }}
                />
            )}

            {screen === 'lobby' && (
                <LobbyScreen
                    roomCode={roomCode}
                    players={players}
                    isHost={isHost}
                    onInvite={() => { }}
                    onStartGame={handleStartRace}
                />
            )}

            {screen === 'game' && (
                <GameScreen
                    socket={socket}
                    roomCode={roomCode}
                    playerId={socket.id}
                    players={players}
                    gameMap={gameMap} // [NEW] Pass map to GameScreen
                />
            )}
        </div>
    );
}

export default App;
