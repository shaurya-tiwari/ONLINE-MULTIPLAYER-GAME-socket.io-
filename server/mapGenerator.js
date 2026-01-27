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
const TYPE_GAP_JUMP = 3;
const TYPE_GAP_ROPE = 4;
const TYPE_GAP_BRIDGE = 5;

const generateTrack = (length = 15000) => {
    // 1. Guaranteed Variety Deck
    // We ensure at least one of each interesting type is in the "deck" to be placed.
    const deck = [
        TYPE_GAP_ROPE, TYPE_GAP_JUMP, TYPE_GAP_BRIDGE,
        TYPE_OBS_GROUND, TYPE_OBS_AIR,
        TYPE_GAP_ROPE, // Add extra ropes as they are the main fun feature
        TYPE_GAP_ROPE
    ];

    // Shuffle the deck initially
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    const items = [];
    const existingObstacles = [];

    // Density Control:
    // We want more obstacles for longer maps.
    // 16000px -> ~10-12 obstacles
    // 90000px -> ~50-60 obstacles
    // Stride of ~800-1400px

    let currentX = 800; // Start offset
    let deckIndex = 0;

    while (currentX < length - 1500) {
        // Gap or Obstacle?
        // If we still have deck items, force one from the deck.
        // Otherwise, random generation.

        let type;
        if (deckIndex < deck.length) {
            type = deck[deckIndex++];
        } else {
            // Random Fallback after deck is exhausted
            const roll = Math.random();
            if (roll < 0.35) {
                // Gap Types
                const sub = Math.random();
                if (sub < 0.60) type = TYPE_GAP_ROPE;
                else if (sub < 0.90) type = TYPE_GAP_JUMP;
                else type = TYPE_GAP_BRIDGE;
            } else {
                // Obstacles
                type = Math.random() > 0.5 ? TYPE_OBS_GROUND : TYPE_OBS_AIR;
            }
        }

        const isGap = (type === TYPE_GAP_JUMP || type === TYPE_GAP_ROPE || type === TYPE_GAP_BRIDGE);

        if (isGap) {
            // 3. Size Logic: 3 Distinct Sizes for Gameplay Variety
            let gapWidth;
            if (type === TYPE_GAP_ROPE) {
                // Large: Rope Swing Only (320px - 450px)
                gapWidth = 320 + Math.random() * 130;
            } else if (type === TYPE_GAP_BRIDGE) {
                // Medium: Walkable Bridge (180px - 260px)
                gapWidth = 180 + Math.random() * 80;
            } else {
                // Small: Jumpable (90px - 120px) - FIXED: Now strictly jumpable
                gapWidth = 90 + Math.random() * 30;
            }

            const gapX = Math.floor(currentX);
            items.push(type, gapX, GAME_CONSTANTS.GROUND_Y, Math.floor(gapWidth), 20);
            existingObstacles.push({ x: gapX, w: gapWidth });

            currentX += gapWidth + 200; // Minimum safe landing
        } else {
            let y = GAME_CONSTANTS.GROUND_Y - GAME_CONSTANTS.OBSTACLE_HEIGHT;
            let w = GAME_CONSTANTS.OBSTACLE_WIDTH;
            let h = GAME_CONSTANTS.OBSTACLE_HEIGHT;

            if (type === TYPE_OBS_AIR) {
                y = 450 - h; // Roughly chest height
            }

            const obs = { x: Math.floor(currentX), y, w, h, type };
            existingObstacles.push(obs);
            items.push(type, obs.x, obs.y, obs.w, obs.h);

            currentX += w + 100;
        }

        // Random stride to next obstacle
        currentX += 600 + Math.random() * 800;
    }

    // 2. Generate Trees (visual filler)
    for (let x = 100; x < length; x += Math.random() * 300 + 100) {
        const treeX = Math.floor(x);
        const treeW = GAME_CONSTANTS.TREE_WIDTH;

        // Overlap Check against obstacles
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

    // Sort items by X
    const stride = 5;
    const count = items.length / stride;

    const indices = new Array(count).fill(0).map((_, i) => i);
    indices.sort((a, b) => {
        const xA = items[a * stride + 1];
        const xB = items[b * stride + 1];
        return xA - xB;
    });

    // Use Int32Array for large maps (>32k coords)
    const packedMap = new Int32Array(items.length);
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

    return Buffer.from(packedMap.buffer);
};

module.exports = { generateTrack, GAME_CONSTANTS };
