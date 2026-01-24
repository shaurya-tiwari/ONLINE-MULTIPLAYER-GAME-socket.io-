/**
 * VISUAL EFFECTS (DSA_REFACTOR)
 * System: Particle System
 * Data Structure: Stack (Free List) + Structure of Arrays (TypedArrays)
 * Goal: O(1) spawn, Zero GC, Cache Friendliness
 */

// Constants
const MAX_PARTICLES = 1000; // Increased capacity due to efficiency
const GRAVITY = 0.2;

// --- Structure of Arrays (SoA) Layout ---
// Contiguous memory blocks for CPU cache locality
const posX = new Float32Array(MAX_PARTICLES);
const posY = new Float32Array(MAX_PARTICLES);
const velX = new Float32Array(MAX_PARTICLES);
const velY = new Float32Array(MAX_PARTICLES);
const life = new Float32Array(MAX_PARTICLES);
const decay = new Float32Array(MAX_PARTICLES);
const size = new Float32Array(MAX_PARTICLES);
const active = new Uint8Array(MAX_PARTICLES); // 0 or 1

// --- Stack for Free Indices (O(1) Allocation) ---
// No searching "find()", just pop()
const freeStack = new Int16Array(MAX_PARTICLES);
let stackTop = MAX_PARTICLES - 1;

// Initialize Stack
for (let i = 0; i < MAX_PARTICLES; i++) {
    freeStack[i] = i;
}

// Logic Variables
let currentZoom = 1.0;
let targetZoom = 1.0;

/**
 * Spawns a particle in O(1)
 */
const spawnParticle = (x, y, vx, vy, l, d, s) => {
    if (stackTop < 0) return; // Pool empty

    const index = freeStack[stackTop--]; // Pop

    posX[index] = x;
    posY[index] = y;
    velX[index] = vx;
    velY[index] = vy;
    life[index] = l;
    decay[index] = d;
    size[index] = s;
    active[index] = 1;
};

export const createDustPuff = (x, y, count = 5) => {
    for (let i = 0; i < count; i++) {
        spawnParticle(
            x,
            y,
            (Math.random() - 0.5) * 4 - 2,
            -Math.random() * 2,
            1.0,
            0.02 + Math.random() * 0.02,
            Math.random() * 6 + 2
        );
    }
};

export const createRunDust = (x, y) => {
    spawnParticle(
        x + (Math.random() - 0.5) * 20,
        y,
        -3 - Math.random() * 2,
        -Math.random() * 1,
        0.6,
        0.04,
        Math.random() * 4 + 1
    );
};

export const updateVisualEffects = (playerSpeed, isSprinting) => {
    // Iterate only through MAX_PARTICLES? 
    // To match O(1) spawn, we ideally iterate only active, but swapping is complex.
    // Iterating linear array is fast.

    for (let i = 0; i < MAX_PARTICLES; i++) {
        if (active[i] === 1) {
            // Update Physics
            posX[i] += velX[i];
            posY[i] += velY[i];
            life[i] -= decay[i];

            if (life[i] <= 0) {
                active[i] = 0;
                freeStack[++stackTop] = i; // Push back to stack
            }
        }
    }

    targetZoom = isSprinting ? 1.05 : 1.2;
    currentZoom += (targetZoom - currentZoom) * 0.1;

    return { currentZoom };
};

export const drawWorldEffects = (ctx) => {
    ctx.save();
    ctx.fillStyle = '#838383ff';

    // Batch drawing if possible, but canvas context switch is expensive.
    // Simple iteration.
    for (let i = 0; i < MAX_PARTICLES; i++) {
        if (active[i] === 1) {
            ctx.globalAlpha = Math.max(0, life[i]);
            ctx.beginPath();
            ctx.arc(posX[i], posY[i], size[i], 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
};

export const drawScreenEffects = (ctx, w, h) => {
    // Speed lines removed in previous version, structure kept empty for API compatibility
};
