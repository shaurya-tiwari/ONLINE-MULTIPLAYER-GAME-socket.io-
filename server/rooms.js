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

module.exports = {
    rooms,
    createRoom,
    joinRoom,
    getRoom
};
