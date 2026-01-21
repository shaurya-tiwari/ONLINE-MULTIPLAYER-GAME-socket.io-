import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import HomeScreen from './screens/HomeScreen';
import LobbyScreen from './screens/LobbyScreen';
import GameScreen from './screens/GameScreen';
import pageBg from './assets/page/page.jpg';

const socket = io(
    import.meta.env.VITE_SERVER_URL ||
    (window.location.hostname === "localhost" ? "http://localhost:3000" : undefined),
    {
        transports: ["websocket"],
        reconnectionAttempts: 5
    }
);

function App() {
    const [screen, setScreen] = useState('home'); // home, lobby, game
    const [playerName, setPlayerName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [players, setPlayers] = useState({});
    const [isHost, setIsHost] = useState(false);
    const [gameMap, setGameMap] = useState(null); // [NEW] Map state

    // Use refs for stable access inside listeners
    const playerNameRef = React.useRef(playerName);
    useEffect(() => { playerNameRef.current = playerName; }, [playerName]);

    useEffect(() => {
        const onConnect = () => {
            console.log("Connected to server:", socket.id);
        };

        const onRoomCreated = ({ code }) => {
            console.log("Room Created:", code);
            setRoomCode(code);
            setScreen('lobby');
            setIsHost(true);
            setPlayers({
                [socket.id]: { id: socket.id, name: playerNameRef.current, isHost: true }
            });
        };

        const onUpdateRoom = ({ players, code }) => {
            console.log("Room Updated:", players);
            setPlayers(players);
            setRoomCode(code);
            setScreen('lobby');
        };

        const onGameStarted = ({ gameMap }) => {
            console.log("Game Started! Map received.");
            setGameMap(gameMap);
            setScreen('game');
        };

        const onGameRestarted = ({ gameMap }) => {
            console.log("Game Restarted!");
            setGameMap(gameMap);
        };

        const onError = ({ message }) => {
            alert(message);
        };

        socket.on('connect', onConnect);
        socket.on('room_created', onRoomCreated);
        socket.on('update_room', onUpdateRoom);
        socket.on('game_started', onGameStarted);
        socket.on('game_restarted', onGameRestarted);
        socket.on('error', onError);

        return () => {
            socket.off('connect', onConnect);
            socket.off('room_created', onRoomCreated);
            socket.off('update_room', onUpdateRoom);
            socket.off('game_started', onGameStarted);
            socket.off('game_restarted', onGameRestarted);
            socket.off('error', onError);
        };
    }, []); // Empty dependency array = stable listeners

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
        <div
            className="min-h-screen w-full flex justify-center items-center text-white overflow-hidden selection:bg-blue-500/30"
            style={{
                backgroundImage: `url(${pageBg})`,
                backgroundRepeat: 'repeat',
                backgroundSize: 'auto'
            }}
        >
            {screen === 'home' && (
                <HomeScreen
                    onHost={handleStartHost}
                    onJoin={(name, code) => {
                        handleJoinGame(name, code);
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
