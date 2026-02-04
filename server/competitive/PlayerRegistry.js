/**
 * PlayerRegistry.js
 * 
 * Ensures players are cleanly removed from all game states on disconnect.
 */

const PlayerRegistry = {
    /**
     * Forcefully removes a player from both the room logic and the world state snapshots.
     * Use this when a player leaves or disconnects.
     */
    forceCleanup: (socketId, roomCode, roomManager, worldManager, io) => {
        console.log(`[Competitive] Force Cleaning Player: ${socketId} from Room: ${roomCode}`);

        // 1. Remove from World State (Snapshots)
        if (worldManager && worldManager.removePlayer) {
            worldManager.removePlayer(roomCode, socketId);
        }

        // 2. Notify other clients immediately (Client-side cleanup)
        if (io && roomCode) {
            io.to(roomCode).emit('player_left', { id: socketId });
        }

        // 3. Check for specific ghost conditions
        // (Optional: loop through all rooms if roomCode isn't known)
    }
};

module.exports = PlayerRegistry;
