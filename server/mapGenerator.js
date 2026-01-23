/**
 * DSA REFACTOR: Map Generator
 * Structure: Int16Array (Packed)
 * Layout: [Type, X, Y, W, H, ...]
 * Improvement: Cache locality, compact memory, faster serialization.
 */

const GAME_CONSTANTS = {
    GROUND_Y: 500,
    TREE_WIDTH: 150,
    TREE_HEIGHT: 300,
    OBSTACLE_WIDTH: 120,
    OBSTACLE_HEIGHT: 120,
    TRACK_LENGTH: 5000
};

// Codes for map components
const TYPE_TREE = 0;
const TYPE_OBS_GROUND = 1;
const TYPE_OBS_AIR = 2;

const generateTrack = (length = 5000) => {
    // Temporary JS Arrays for logic (easier to push)
    // We will pack them into Int16Array at the end
    const items = [];

    // logic for obstacles reused but adapted for linear list
    const existingObstacles = []; // Temp for collision check

    // 1. Generate Obstacles
    for (let x = 600; x < length; x += Math.random() * 800 + 500) {
        const typeStr = Math.random() > 0.5 ? 'ground' : 'air';
        let y = GAME_CONSTANTS.GROUND_Y - GAME_CONSTANTS.OBSTACLE_HEIGHT;
        let w = GAME_CONSTANTS.OBSTACLE_WIDTH;
        let h = GAME_CONSTANTS.OBSTACLE_HEIGHT;
        let type = TYPE_OBS_GROUND;

        if (typeStr === 'air') {
            const desiredBottom = 450;
            y = desiredBottom - h;
            type = TYPE_OBS_AIR;
        }

        const obs = { x: Math.floor(x), y, w, h, type };
        existingObstacles.push(obs);
        items.push(type, obs.x, obs.y, obs.w, obs.h);
    }

    // 2. Generate Trees
    for (let x = 100; x < length; x += Math.random() * 300 + 100) {
        const treeX = Math.floor(x);
        const treeW = GAME_CONSTANTS.TREE_WIDTH;

        // Overlap Check against temp obstacles
        const overlap = existingObstacles.some(obs => {
            return (
                treeX < obs.x + obs.w + 50 &&
                treeX + treeW > obs.x - 50
            );
        });

        if (!overlap) {
            items.push(
                TYPE_TREE,
                treeX,
                GAME_CONSTANTS.GROUND_Y - GAME_CONSTANTS.TREE_HEIGHT,
                treeW,
                GAME_CONSTANTS.TREE_HEIGHT
            );
        }
    }

    // Sort items by X position for Rendering Culling optimizations
    // We have stride of 5.
    const stride = 5;
    const count = items.length / stride;

    // Create Float32Array or Int16Array?
    // Positions can be ~5000. Int16 is -32768 to 32767. 
    // We need Int16 or Int32. Let's use Int16Array (smaller packet) if length < 32000.
    // If endless, need Int32. Given current usage, Int16 is fine.

    // However, JS `sort` on plain array is expensive.
    // We'll create an index array to sort.
    const indices = new Array(count).fill(0).map((_, i) => i);
    indices.sort((a, b) => {
        // X is at index (i * 5) + 1
        const xA = items[a * stride + 1];
        const xB = items[b * stride + 1];
        return xA - xB;
    });

    const packedMap = new Int16Array(items.length); // Use Int16 for compactness
    for (let i = 0; i < count; i++) {
        const srcIdx = indices[i];
        const destOffset = i * stride;
        const srcOffset = srcIdx * stride;

        packedMap[destOffset + 0] = items[srcOffset + 0]; // Type
        packedMap[destOffset + 1] = items[srcOffset + 1]; // X
        packedMap[destOffset + 2] = items[srcOffset + 2]; // Y
        packedMap[destOffset + 3] = items[srcOffset + 3]; // W
        packedMap[destOffset + 4] = items[srcOffset + 4]; // H
    }

    return packedMap;
};

module.exports = { generateTrack, GAME_CONSTANTS };
