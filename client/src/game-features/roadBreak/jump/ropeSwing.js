/**
 * Rope Swing Physics System
 * 
 * Specialized Pendulum Physics for large gaps.
 * Uses angular velocity and momentum buildup to allow traversal.
 */

import { STATE_ROPE, STATE_JUMP } from '../../../game/dsaConstants';

const ROPE_CONFIG = {
    GRAVITY: 9.8,           // Real-world gravity
    FRICTION: 0.992,        // Heavier damping for slower motion
    INPUT_FORCE: 0.00008,   // Even gentler input
    PUMP_EFFICIENCY: 3.2,   // Slower momentum buildup
    MAX_VELOCITY: 0.12,     // Significant cap for "sloww" feel
    ATTACH_OFFSET_Y: 20     // Grab offset
};

/**
 * Checks if a player can grab an active rope.
 * Player must be jumping and near the rope's current end point.
 */
export const checkRopeGrab = (player, rope) => {
    if (!rope || (player.state & STATE_ROPE)) return false;

    // Grab possible only during JUMP state
    if (!(player.state & STATE_JUMP)) return false;

    // Distance threshold for grab
    const dx = player.x + player.w / 2 - rope.currentX;
    const dy = player.y - rope.currentY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    return dist < 30; // Tight Grab radius for "pixel-perfect" feel
};

/**
 * Core Pendulum Physics Update
 * Enhanced for natural, realistic rope swing feel
 */
export const updateRopePhysics = (rope, inputs, dt) => {
    // 0. DT Safety: Clamp DT to prevent spikes/teleports
    const safeDt = Math.max(0, Math.min(dt, 0.05));
    const timeScale = safeDt * 60;

    // 1. Calculate Gravitational Restoring Force (Very slow)
    // α = -(g/L) * sin(θ) - reduced scaling for slower period
    const gravityForce = -(ROPE_CONFIG.GRAVITY * 0.015 / (rope.length / 100)) * Math.sin(rope.angle);

    // 2. Process Player Input (Pumping)
    let appliedTorque = 0;
    if (inputs.right || inputs.left) {
        const inputDir = inputs.right ? 1 : -1;

        // Check if pumping with or against the swing
        const isSameDir = (inputDir > 0 && rope.angularVelocity > 0) ||
            (inputDir < 0 && rope.angularVelocity < 0);

        if (isSameDir || Math.abs(rope.angularVelocity) < 0.002) {
            // Pumping WITH the swing - smooth momentum growth
            const currentLevel = rope.momentumLevel || 1.0;
            const growthRate = 0.0018 * timeScale;
            const targetLevel = 5.0;

            // Exponential approach to max (feels more natural than linear)
            rope.momentumLevel = currentLevel + (targetLevel - currentLevel) * growthRate;

            appliedTorque = inputDir * ROPE_CONFIG.INPUT_FORCE *
                (rope.momentumLevel * ROPE_CONFIG.PUMP_EFFICIENCY);
        } else {
            // Pumping AGAINST - slow decay
            rope.momentumLevel = Math.max(1.0, (rope.momentumLevel || 1.0) - 0.025 * timeScale);
            appliedTorque = inputDir * ROPE_CONFIG.INPUT_FORCE * 0.3;
        }
    } else {
        // No input - very slow momentum decay (preserve energy)
        if (rope.momentumLevel) {
            rope.momentumLevel = Math.max(1.0, rope.momentumLevel - 0.002 * timeScale);
        }
    }

    // 3. Update Angular Velocity
    rope.angularVelocity += (gravityForce + appliedTorque) * timeScale;

    // 4. Natural Damping (smoother energy preservation)
    // Less aggressive damping at low speeds, more at high speeds
    const speedFactor = Math.abs(rope.angularVelocity);
    const dampingFactor = ROPE_CONFIG.FRICTION + (1 - ROPE_CONFIG.FRICTION) * speedFactor * 0.5;
    rope.angularVelocity *= Math.pow(dampingFactor, timeScale);

    // Clamp velocity
    rope.angularVelocity = Math.max(-ROPE_CONFIG.MAX_VELOCITY,
        Math.min(ROPE_CONFIG.MAX_VELOCITY, rope.angularVelocity));

    // 5. Update Angle
    rope.angle += rope.angularVelocity * timeScale;

    // 6. Update Visual End Point
    rope.currentX = rope.anchorX + Math.sin(rope.angle) * rope.length;
    rope.currentY = rope.anchorY + Math.cos(rope.angle) * rope.length;

    // Safety Check: Prevent NaNs
    if (isNaN(rope.angle)) rope.angle = 0;
    if (isNaN(rope.angularVelocity)) rope.angularVelocity = 0;
    if (isNaN(rope.currentX)) rope.currentX = rope.anchorX;
    if (isNaN(rope.currentY)) rope.currentY = rope.anchorY + rope.length;

    return rope;
};

/**
 * Initializes a rope for a specific gap
 */
export const createRopeInstance = (gap) => {
    return {
        anchorX: gap.x + gap.w / 2,
        anchorY: -300, // Raised anchor for realism
        length: 720,   // Shortened for player length alignment
        angle: 0.0,    // Start perfectly still
        angularVelocity: 0,
        momentumLevel: 1.0, // Force multiplier
        currentX: gap.x + gap.w / 2,
        currentY: 420  // AnchorY + Length (-300 + 720)
    };
};

/**
 * Syncs player position to rope end
 */
export const syncPlayerToRope = (player, rope) => {
    player.x = rope.currentX - (player.w / 2);
    player.y = rope.currentY - ROPE_CONFIG.ATTACH_OFFSET_Y;
    player.vy = 0;
    player.isGrounded = false;
};




