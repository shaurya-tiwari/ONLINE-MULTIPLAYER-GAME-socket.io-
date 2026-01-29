/**
 * DSA REFACTOR: World State Manager
 * Handles:
 * 1. Player state caching (Quantized)
 * 2. Pre-allocated Buffer pooling
 * 3. Binary Snapshot generation
 */

const states = new Map(); // RoomCode -> Map<PlayerId, ArrayBuffer>

// Packet Layout (Quantized):
// [ID_LEN(1), ID(N), X(2-uint16), Y_OFF(1-uint8), State(1)]
// Total = 5 + N bytes per player

const updatePlayerState = (roomCode, playerId, buffer) => {
    if (!states.has(roomCode)) {
        states.set(roomCode, new Map());
    }
    states.get(roomCode).set(playerId, buffer);
};

const getRoomSnapshot = (roomCode) => {
    const roomStates = states.get(roomCode);
    if (!roomStates || roomStates.size === 0) return null;

    // Snapshot Type (1 byte) = 0x01 (Batch Update)
    let totalLen = 1 + 1; // Type + Count
    for (const buf of roomStates.values()) {
        totalLen += buf.byteLength;
    }

    const snapshot = Buffer.allocUnsafe(totalLen);
    snapshot[0] = 0x01;
    snapshot[1] = roomStates.size;

    let offset = 2;
    for (const buf of roomStates.values()) {
        const u8 = new Uint8Array(buf);
        snapshot.set(u8, offset);
        offset += u8.length;
    }

    return snapshot;
};

const removePlayer = (roomCode, playerId) => {
    if (states.has(roomCode)) {
        states.get(roomCode).delete(playerId);
        if (states.get(roomCode).size === 0) states.delete(roomCode);
    }
};

const clearRoom = (roomCode) => {
    states.delete(roomCode);
};

const getActiveRoomCodes = () => Array.from(states.keys());

module.exports = {
    updatePlayerState,
    getRoomSnapshot,
    removePlayer,
    clearRoom,
    getActiveRoomCodes
};
