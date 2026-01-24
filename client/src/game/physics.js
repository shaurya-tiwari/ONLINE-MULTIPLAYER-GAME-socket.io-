/**
 * Physics Engine
 * Refactored for maximum smoothness and frame independence
 */

import { triggerShake } from '../game-features/cameraShake';
import { createDustPuff, createRunDust } from '../game-features/visualEffects';
import { getSpeedMultiplier } from '../game-features/playerspeedup';
import { STATE_IDLE, STATE_RUN, STATE_JUMP, STATE_SLIDE, STATE_FINISHED } from './dsaConstants';

export const PHYSICS_CONSTANTS = {
    GRAVITY: 0.8,
    JUMP_FORCE: -15, // Restored to original
    RUN_SPEED: 5,
    GROUND_Y: 500,
    PLAYER_HEIGHT_STANDING: 60,
    PLAYER_HEIGHT_SLIDING: 30,
    PLAYER_WIDTH: 40
};

export const createPlayerState = (id, name, x = 100) => ({
    id,
    name,
    x,
    y: PHYSICS_CONSTANTS.GROUND_Y - PHYSICS_CONSTANTS.PLAYER_HEIGHT_STANDING,
    w: PHYSICS_CONSTANTS.PLAYER_WIDTH,
    h: PHYSICS_CONSTANTS.PLAYER_HEIGHT_STANDING,
    vy: 0,
    state: STATE_IDLE,
    finishTime: 0,
    isGrounded: true,
    slideStartTime: 0
});

export const updatePlayerPhysics = (player, inputs, frameCount, raceLength = 10000, dt = 0.016) => {
    // Standardize timeScale (target 60fps)
    const timeScale = Math.min(dt * 60, 2.0); // Cap at 2.0 to prevent huge jumps during lag

    // --- 1. SLIDE LOGIC ---
    const isSliding = (player.state & STATE_SLIDE) !== 0;
    let wantSlide = false;

    if (inputs.slide && (inputs.right || isSliding)) {
        if (!isSliding) player.slideStartTime = Date.now();
        const elapsed = Date.now() - (player.slideStartTime || 0);
        if (elapsed < 500) wantSlide = true;
    } else {
        player.slideStartTime = 0;
    }

    // --- 2. HORIZONTAL MOVEMENT ---
    const progress = Math.max(0, Math.min(1, player.x / raceLength));
    const speedMultiplier = getSpeedMultiplier(progress);
    const runSpeed = (PHYSICS_CONSTANTS.RUN_SPEED * speedMultiplier) * timeScale;

    if (inputs.right) {
        player.x += runSpeed;
        // Run dust
        if (player.isGrounded && frameCount % 12 === 0) {
            createRunDust(player.x, PHYSICS_CONSTANTS.GROUND_Y);
        }
    }

    // --- 3. VERTICAL MOVEMENT (JUMP & GRAVITY) ---
    if (inputs.jump && player.isGrounded && !wantSlide) {
        player.vy = PHYSICS_CONSTANTS.JUMP_FORCE; // Set initial velocity (unscaled here)
        player.isGrounded = false;
        createDustPuff(player.x + player.w / 2, PHYSICS_CONSTANTS.GROUND_Y, 3);
    }

    // Apply Velocity and Gravity
    if (!player.isGrounded) {
        // Vertical step: displacement = velocity * time
        player.y += player.vy * timeScale;
        // Gravity step: velocity += gravity * time
        player.vy += PHYSICS_CONSTANTS.GRAVITY * timeScale;
    }

    // --- 4. GROUND COLLISION ---
    const currentHeight = wantSlide ? PHYSICS_CONSTANTS.PLAYER_HEIGHT_SLIDING : PHYSICS_CONSTANTS.PLAYER_HEIGHT_STANDING;
    const groundY = PHYSICS_CONSTANTS.GROUND_Y - currentHeight;

    if (player.y >= groundY) {
        if (!player.isGrounded) {
            // Landing
            triggerShake(4, 10);
            createDustPuff(player.x + player.w / 2, PHYSICS_CONSTANTS.GROUND_Y, 8);
        }
        player.y = groundY;
        player.vy = 0;
        player.isGrounded = true;
    } else {
        player.isGrounded = false;
    }

    // --- 5. STATE UPDATES ---
    let newState = STATE_IDLE;
    if (!player.isGrounded) {
        newState = STATE_JUMP;
        player.h = PHYSICS_CONSTANTS.PLAYER_HEIGHT_STANDING;
    } else if (wantSlide) {
        newState = STATE_SLIDE;
        player.h = PHYSICS_CONSTANTS.PLAYER_HEIGHT_SLIDING;
    } else if (inputs.right) {
        newState = STATE_RUN;
        player.h = PHYSICS_CONSTANTS.PLAYER_HEIGHT_STANDING;
    }

    // Preserve FINISHED state
    if ((player.state & STATE_FINISHED) !== 0) newState |= STATE_FINISHED;
    player.state = newState;

    return player;
};
