import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import HomeScreen from './screens/HomeScreen';
import LobbyScreen from './screens/LobbyScreen';
import GameScreen from './screens/GameScreen';
import pageBg from './assets/page/page.jpg';

const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const envUrl = import.meta.env.VITE_SERVER_URL;

// On local, force localhost:3000. 
// On prod, use envUrl if it's not localhost, otherwise auto-connect (undefined).
const serverUrl = isLocal
    ? "http://localhost:3000"
    : (envUrl && !envUrl.includes("localhost") ? envUrl : undefined);

const socket = io(serverUrl, {
    transports: ["websocket"],
    reconnectionAttempts: 5
});

function App() {
    const [screen, setScreen] = useState('home'); // home, lobby, game
    const [playerName, setPlayerName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [players, setPlayers] = useState({});
    const [isHost, setIsHost] = useState(false);
    const [gameMap, setGameMap] = useState(null);
    const [raceLength, setRaceLength] = useState('500m');

    // Use refs for stable access inside listeners
    const playerNameRef = React.useRef(playerName);
    useEffect(() => { playerNameRef.current = playerName; }, [playerName]);

    useEffect(() => {
        const onConnect = () => {
            console.log("Connected to server:", socket.id);
        };

        const onRoomCreated = ({ code, raceLength: serverLength }) => {
            console.log("Room Created:", code, serverLength);
            setRoomCode(code);
            if (serverLength) setRaceLength(serverLength);
            setScreen('lobby');
            setIsHost(true);
            setPlayers({
                [socket.id]: { id: socket.id, name: playerNameRef.current, isHost: true }
            });
        };

        const onUpdateRoom = ({ players, code, raceLength: serverLength }) => {
            console.log("Room Updated:", players, serverLength);
            setPlayers(players);
            setRoomCode(code);
            if (serverLength) setRaceLength(serverLength);
            setScreen('lobby');
        };

        const onGameStarted = ({ gameMap, raceLength: serverLength }) => {
            console.log("Game Started! Map received.");
            setGameMap(gameMap);
            if (serverLength) setRaceLength(serverLength);
            setScreen('game');
        };

        const onGameRestarted = ({ gameMap, raceLength: serverLength }) => {
            console.log("Game Restarted!");
            setGameMap(gameMap);
            if (serverLength) setRaceLength(serverLength);
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

    const handleStartHost = (name, length) => {
        setPlayerName(name);
        setRaceLength(length);
        socket.emit('create_room', { name, raceLength: length });
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
            className="min-h-screen w-full flex justify-center items-center text-black overflow-hidden selection:bg-blue-500/30"
            style={{
                backgroundImage: `url(${pageBg})`,
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed'
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
                    raceLength={raceLength}
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
                    gameMap={gameMap}
                    raceLength={raceLength}
                />
            )}
        </div>
    );
}

export default App;
