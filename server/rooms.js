const rooms = {};
const playerToRoom = new Map(); // O(1) lookup for cleanup

const generateRoomCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

const createRoom = (hostId, hostName, raceLength = '500m') => {
    const code = generateRoomCode();
    rooms[code] = {
        code,
        host: hostId,
        raceLength,
        players: {
            [hostId]: {
                id: hostId,
                name: hostName,
                isHost: true
            }
        },
        gameState: 'lobby' // lobby, racing
    };
    playerToRoom.set(hostId, code);
    return code;
};

const joinRoom = (code, playerId, playerName) => {
    if (!rooms[code]) return { error: "Room not found" };
    if (rooms[code].gameState !== 'lobby') return { error: "Game already started" };

    rooms[code].players[playerId] = {
        id: playerId,
        name: playerName,
        isHost: false
    };
    playerToRoom.set(playerId, code);
    return { room: rooms[code] };
};

const getRoom = (code) => rooms[code];

const leaveRoom = (playerId) => {
    const code = playerToRoom.get(playerId);
    if (!code || !rooms[code]) {
        playerToRoom.delete(playerId);
        return { code: null, deleted: false };
    }

    const room = rooms[code];
    delete room.players[playerId];
    playerToRoom.delete(playerId);

    console.log(`Player ${playerId} left room ${code}`);

    let roomWasDeleted = false;
    let roomCodeToUpdate = code;

    // If Host leaves, we close the room
    if (room.host === playerId || Object.keys(room.players).length === 0) {
        console.log(`Closing room ${code} because host/last player left`);

        // Clean up playerToRoom for ALL players in this room
        Object.keys(room.players).forEach(pId => playerToRoom.delete(pId));

        delete rooms[code];
        roomWasDeleted = true;
        roomCodeToUpdate = null;
    }

    return { code: roomCodeToUpdate, deleted: roomWasDeleted };
};

module.exports = {
    rooms,
    createRoom,
    joinRoom,
    getRoom,
    leaveRoom
};
