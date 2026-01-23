const rooms = {};

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
    return { room: rooms[code] };
};

const getRoom = (code) => rooms[code];

const leaveRoom = (playerId) => {
    let roomCodeToUpdate = null;
    let roomWasDeleted = false;

    for (const code in rooms) {
        if (rooms[code].players[playerId]) {
            const room = rooms[code];
            delete room.players[playerId];
            roomCodeToUpdate = code;

            // Log for debugging
            console.log(`Player ${playerId} left room ${code}`);

            // If Host leaves, we close the room for simplicity in this version
            // (Or migrate host if you want more complexity)
            if (room.host === playerId || Object.keys(room.players).length === 0) {
                console.log(`Closing room ${code} because host/last player left`);
                delete rooms[code];
                roomWasDeleted = true;
                roomCodeToUpdate = null;
            }
            break;
        }
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
