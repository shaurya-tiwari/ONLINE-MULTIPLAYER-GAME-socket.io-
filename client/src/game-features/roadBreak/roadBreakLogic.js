/**
 * Road Break Logic System
 * 
 * Future-proof logic for handling various types of gaps (Jump, Rope, Bridge).
 * Integrates with the existing MAP_STRIDE (Type, X, Y, W, H) architecture.
 */

import { TYPE_GAP_JUMP, TYPE_GAP_ROPE, TYPE_GAP_BRIDGE } from '../../game/dsaConstants';

/**
 * Checks if the player is currently inside a road break section.
 * This can be used for death logic (if they fall) or rope state triggers.
 * 
 * @param {Object} player - current player state
 * @param {Int16Array} mapData - packed map buffer
 * @returns {Object|null} The gap object being traversed, or null
 */
export const checkRoadBreakTraversed = (player, mapData) => {
    // Note: Since mapData is already sorted by X, we could optimize this,
    // but for initial logic, we'll keep it simple and clean.

    const STRIDE = 5;
    const count = mapData.length / STRIDE;

    for (let i = 0; i < count; i++) {
        const offset = i * STRIDE;
        const type = mapData[offset];

        // Filter for Gap types
        if (type === TYPE_GAP_JUMP || type === TYPE_GAP_ROPE || type === TYPE_GAP_BRIDGE) {
            const x = mapData[offset + 1];
            const w = mapData[offset + 3];

            // Player is inside the horizontal boundaries of the gap
            // DSA FIX: Add Forgiveness Margin (Use narrower gap collision than visual)
            const GAP_MARGIN = 20;
            if (player.x + (player.w / 2) > x + GAP_MARGIN && player.x + (player.w / 2) < x + w - GAP_MARGIN) {
                return {
                    type,
                    x,
                    w,
                    y: mapData[offset + 2],
                    h: mapData[offset + 4]
                };
            }
        }
    }

    return null;
};

/**
 * Strategic Logic Placeholder for Rope Interaction
 * This will be called by physics loop later when state is TYPE_GAP_ROPE
 */
export const handleRopePhysics = (player, gap) => {
    // TODO: Implement hanging logic
    // example: player.vy = 0, player.isGrounded = false, state = STATE_EXT_HANG
};

/**
 * Strategic Logic Placeholder for Bridge Interaction
 * This will behave like normal ground for now
 */
export const handleBridgePhysics = (player, gap) => {
    // Normal ground behavior
};

/**
 * Finds the nearest gap to the LEFT of the player.
 * Used when a player falls but has drifted past the gap's strict X/W boundaries.
 * 
 * @param {number} playerX 
 * @param {Int16Array} mapData 
 * @returns {Object|null} Nearest gap object or null
 */
export const findNearestGapLeft = (playerX, mapData) => {
    const STRIDE = 5;
    const count = mapData.length / STRIDE;

    let nearestGap = null;
    let minDist = 1000; // Search radius (pixels)

    for (let i = 0; i < count; i++) {
        const offset = i * STRIDE;
        const type = mapData[offset];

        if (type === TYPE_GAP_JUMP || type === TYPE_GAP_ROPE || type === TYPE_GAP_BRIDGE) {
            const x = mapData[offset + 1];
            const w = mapData[offset + 3];
            const gapEnd = x + w;

            // We are looking for a gap where the player is to the RIGHT of it (playerX > gapEnd)
            if (playerX > gapEnd) {
                const dist = playerX - gapEnd;
                if (dist < minDist) {
                    minDist = dist;
                    nearestGap = {
                        type,
                        x,
                        w,
                        y: mapData[offset + 2],
                        h: mapData[offset + 4]
                    };
                }
            }
        }
    }
    return nearestGap;
};
