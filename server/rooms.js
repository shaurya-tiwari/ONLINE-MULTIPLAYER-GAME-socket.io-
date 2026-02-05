/**
 * DSA REFACTOR: Rooms System
 * Structure: Map<string, RoomStruct>
 * Improvement: O(1) lookup, stable memory shape (no Hidden Class transitions)
 */

// Stable Struct Shape (Factory)
const createRoomStruct = (code, hostId, hostName, raceLength) => ({
    code,
    host: hostId,
    raceLength,
    // players uses Map for O(1) access
    players: new Map([[hostId, { id: hostId, name: hostName || "Athlete", isHost: true }]]),
    gameState: 'lobby' // lobby, racing
});

const rooms = new Map();
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
    const newRoom = createRoomStruct(code, hostId, hostName, raceLength);
    rooms.set(code, newRoom);
    playerToRoom.set(hostId, code);
    return code;
};

const joinRoom = (code, playerId, playerName) => {
    const room = rooms.get(code);
    if (!room) return { error: "Room not found" };
    if (room.gameState !== 'lobby') return { error: "Game already started" };
    if (room.players.size >= 4) return { error: "Room is full (Max 4 players)" };

    room.players.set(playerId, {
        id: playerId,
        name: playerName || "Athlete",
        isHost: false
    });
    playerToRoom.set(playerId, code);
    return { room };
};

const getRoom = (code) => rooms.get(code);

const leaveRoom = (playerId) => {
    const code = playerToRoom.get(playerId);
    const room = rooms.get(code);

    if (!code || !room) {
        playerToRoom.delete(playerId);
        return { code: null, deleted: false };
    }

    room.players.delete(playerId);
    playerToRoom.delete(playerId);

    console.log(`Player ${playerId} left room ${code}`);

    let roomWasDeleted = false;
    let roomCodeToUpdate = code;

    // If Host leaves or Room empty
    if (room.host === playerId || room.players.size === 0) {
        console.log(`Closing room ${code} because host/last player left`);

        // Clean up playerToRoom for ALL players remaining (if any, though usually none if host left logic applies)
        for (const [pId] of room.players) {
            playerToRoom.delete(pId);
        }

        rooms.delete(code);
        roomWasDeleted = true;
        roomCodeToUpdate = null;
    }

    return { code: roomCodeToUpdate, deleted: roomWasDeleted };
};

// Helper to serialize room for client (convert Map to Object for existing frontend compatibility if needed, 
// OR refactor frontend to expect Arrays. For minimal frontend logic change, we convert to Object here OR modify socket emit)
// Strict Rule: "Only replace internal data structures... behavior identical".
// The frontend expects `players` to be an Object.
// We can output Object for network transport but keep Map internally.
const serializeRoomPlayers = (room) => {
    return Object.fromEntries(room.players);
};

module.exports = {
    rooms,
    createRoom,
    joinRoom,
    getRoom,
    leaveRoom,
    serializeRoomPlayers
};
