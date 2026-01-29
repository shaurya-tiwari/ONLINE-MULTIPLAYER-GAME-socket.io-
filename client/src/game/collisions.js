/**
 * DSA REFACTOR: Collision System
 * Algorithm: 1D Spatial Hash Grid
 * Improvement: O(1) lookup regardless of map size.
 */

import { triggerShake } from '../game-features/cameraShake';
import { MAP_STRIDE, TYPE_OBS_AIR, TYPE_OBS_GROUND } from './dsaConstants';

const CELL_SIZE = 1000;
let spatialHash = new Map(); // Map<CellIndex, Array<ObsIndices>>

/**
 * Build the Spatial Hash from the SoA Map Data
 * @param {Int16Array} mapData - The packed map data
 */
export const buildSpatialHash = (mapData) => {
    spatialHash.clear();
    const count = mapData.length / MAP_STRIDE;

    for (let i = 0; i < count; i++) {
        const offset = i * MAP_STRIDE;
        const type = mapData[offset + 0];

        // Only hash obstacles
        if (type === TYPE_OBS_GROUND || type === TYPE_OBS_AIR) {
            const x = mapData[offset + 1];
            const w = mapData[offset + 3];

            // Determine start and end buckets
            const startCell = Math.floor(x / CELL_SIZE);
            const endCell = Math.floor((x + w) / CELL_SIZE);

            for (let c = startCell; c <= endCell; c++) {
                if (!spatialHash.has(c)) {
                    spatialHash.set(c, []); // Use simple array for bucket list
                }
                spatialHash.get(c).push(offset); // Store OFFSET in valid mapData
            }
        }
    }
};

const checkAABB = (px, py, pw, ph, ox, oy, ow, oh) => {
    return (
        px < ox + ow &&
        px + pw > ox &&
        py < oy + oh &&
        py + ph > oy
    );
};

export const handleCollisions = (player, mapData) => {
    // 1. Determine Player's Bucket(s)
    const pStart = Math.floor(player.x / CELL_SIZE);
    const pEnd = Math.floor((player.x + player.w) / CELL_SIZE);

    let collided = false;

    // 2. Iterate only relevant buckets
    for (let c = pStart; c <= pEnd; c++) {
        const bucket = spatialHash.get(c);
        if (!bucket) continue;

        for (let i = 0; i < bucket.length; i++) {
            const offset = bucket[i];

            // Extract Obstacle Data from SoA
            const ox = mapData[offset + 1];
            const oy = mapData[offset + 2];
            const ow = mapData[offset + 3];
            const oh = mapData[offset + 4];

            if (checkAABB(player.x, player.y, player.w, player.h, ox, oy, ow, oh)) {
                // Resolution Logic
                // Use a small buffer (5px) to prevent jitter from triggering harsh resets
                const overlap = (player.x + player.w) - ox;
                if (overlap > 2 && player.x < ox) {
                    player.x -= overlap; // Push back exactly the overlap amount
                    player.vx *= 0.1;   // Kill most momentum but not all (prevents "sudden stop" feel)
                    triggerShake(8, 15);
                    collided = true;
                }
            }
        }
    }

    return collided;
};
