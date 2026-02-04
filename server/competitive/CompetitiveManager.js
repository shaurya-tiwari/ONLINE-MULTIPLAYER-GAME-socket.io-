/**
 * CompetitiveManager.js
 * 
 * Houses "Senior" logic for competitive integrity without cluttering main socket handlers.
 * Focuses on: Atomic Wins, Map Consistency, and Basic Input Validation.
 */

const { getFinishLinePosition } = require('../raceLength');

// Internal state for things that don't belong in the room object itself (optional)
// But to keep it "Stateful", we mostly store things ON the room object passed to us.

const CompetitiveManager = {
    /**
     * Ensures every player in the room has the exact same map.
     * Stores map in room object if not already present.
     */
    ensureMapConsistency: (room, generateTrackFn) => {
        if (!room) return null;

        // If map doesn't exist yet, generate it once
        if (!room.competitiveMap) {
            const pixelLength = getFinishLinePosition(room.raceLength);
            room.competitiveMap = generateTrackFn(pixelLength);
            room.winnerName = null; // Reset winner state for new map/run
            console.log(`[Competitive] Map generated and locked for room ${room.code}`);
        }

        return room.competitiveMap;
    },

    /**
     * Implements "Winner Lock" (Atomic Wins).
     * Only allows the first valid 'player_won' event to set the winner.
     */
    trySetWinner: (room, playerName, x) => {
        if (!room) return { success: false, reason: 'No room found' };

        // 1. Atomic Lock check
        if (room.winnerName) {
            return { success: false, reason: `Winner already locked: ${room.winnerName}`, lockedWinner: room.winnerName };
        }

        // 2. Basic Logic Bypass Check (Finish Line X)
        const requiredX = getFinishLinePosition(room.raceLength);
        if (x < requiredX - 50) {
            console.warn(`[Competitive] Suspicious win attempt by ${playerName}: x=${x} < ${requiredX}`);
            return { success: false, reason: 'Invalid finish position' };
        }

        // 3. Lock it in
        room.winnerName = playerName;
        console.log(`[Competitive] Winner LOCKED: ${playerName} in room ${room.code}`);
        return { success: true, winner: playerName };
    },

    /**
     * Cleans up any state when a game restarts or room is cleared.
     */
    resetRoomState: (room) => {
        if (!room) return;
        room.competitiveMap = null;
        room.winnerName = null;
    }
};

module.exports = CompetitiveManager;
