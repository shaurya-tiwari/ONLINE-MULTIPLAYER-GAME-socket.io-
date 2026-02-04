import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import HomeScreen from './screens/HomeScreen';
import LobbyScreen from './screens/LobbyScreen';
import GameScreen from './screens/GameScreen';
import SettingsPanel from './components/settings/SettingsPanel';
import LayoutEditor from './components/settings/LayoutEditor';
import OrientationGuard from './components/OrientationGuard';
import pageBg from './assets/page/page.jpg';
import { preloadAllAssets } from './game/AssetLoader';

const isLocal = window.location.hostname.includes("localhost") || window.location.hostname.includes("127.0.0.1") || window.location.hostname.includes("::1");
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
window.socket = socket;

function App() {
    const [isLoading, setIsLoading] = useState(true);
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

    const screenRef = React.useRef(screen);
    useEffect(() => { screenRef.current = screen; }, [screen]);

    useEffect(() => {
        // 🚀 PRO PRELOADER: Load all assets before showing any UI
        const load = async () => {
            await preloadAllAssets();
            setIsLoading(false);
        };
        load();

        const onConnect = () => {
            console.log("Connected to server:", socket.id);
        };

        const onRoomCreated = ({ code, raceLength: serverLength, players: serverPlayers }) => {
            console.log("Room Created:", code, serverLength, serverPlayers);
            setRoomCode(code);
            if (serverLength) setRaceLength(serverLength);
            if (serverPlayers) setPlayers(serverPlayers);
            setScreen('lobby');
            setIsHost(true);
        };

        const onUpdateRoom = ({ players, code, raceLength: serverLength }) => {
            console.log("Room Updated:", players, serverLength);
            setPlayers(players);
            setRoomCode(code);
            if (serverLength) setRaceLength(serverLength);

            // Correctly determine if this socket is the host
            if (players && socket.id) {
                const me = players[socket.id];
                if (me) {
                    setIsHost(me.isHost);
                }
            }

            // AUTO-EXIT FIX: Only switch to lobby if we are NOT in the game
            if (screenRef.current !== 'game') {
                setScreen('lobby');
            }
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
        setIsHost(false); // Reset host status immediately on join attempt
        socket.emit('join_room', { name, code });
    };

    const handleStartRace = () => {
        socket.emit('start_game', { code: roomCode });
    };

    const handleLeaveGame = () => {
        if (roomCode) {
            socket.emit('leave_room', { code: roomCode });
        }
        setScreen('home');
        setRoomCode('');
        setIsHost(false); // Reset host status on leave
        setGameMap(null);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen w-full flex flex-col justify-center items-center bg-[#f0f0f0] text-black">
                <div className="w-16 h-16 border-4 border-black border-t-marker rounded-full animate-spin mb-4"></div>
                <h1 className="text-2xl font-black uppercase tracking-widest animate-pulse italic">
                    Loading Assets...
                </h1>
            </div>
        );
    }

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
            <LayoutEditor />
            {screen !== 'game' && <SettingsPanel />}
            <OrientationGuard />
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
                    onLeave={handleLeaveGame}
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
                    onLeave={handleLeaveGame}
                />
            )}
        </div>
    );
}

export default App;
