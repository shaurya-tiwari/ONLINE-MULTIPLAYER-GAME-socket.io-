/**
 * DSA REFACTOR: Physics
 * Improvement: Bitmask State Flags (Integer) instead of Strings
 */

import { triggerShake } from '../game-features/cameraShake';
import { createDustPuff, createRunDust } from '../game-features/visualEffects';
import { getSpeedMultiplier } from '../game-features/playerspeedup';
import { STATE_IDLE, STATE_RUN, STATE_JUMP, STATE_SLIDE, STATE_FINISHED } from './dsaConstants';

export const PHYSICS_CONSTANTS = {
    GRAVITY: 0.8,
    JUMP_FORCE: -15,
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
    state: STATE_IDLE, // Bitmask
    finishTime: 0,
    isGrounded: true,
    slideStartTime: 0
});

export const updatePlayerPhysics = (player, inputs, frameCount, raceLength = 10000, dt = 0.016) => {
    // --- 0. Time Scale for Frame Independence ---
    const timeScale = dt * 60;

    // --- 1. Determine Desired Ground State (Slide vs Run vs Idle) ---

    // Bitwise check for slide
    const isSliding = (player.state & STATE_SLIDE) !== 0;

    let wantSlide = false;
    if (inputs.slide && (inputs.right || isSliding)) {
        if (!isSliding) {
            player.slideStartTime = Date.now();
        }
        const elapsed = Date.now() - (player.slideStartTime || 0);
        if (elapsed < 500) {
            wantSlide = true;
        } else {
            wantSlide = false;
        }
    } else {
        player.slideStartTime = 0;
    }

    // --- 2. Calculate Dynamic Speed ---
    const progress = Math.max(0, Math.min(1, player.x / raceLength));
    const speedMultiplier = getSpeedMultiplier(progress);
    // Scale speed by timeScale
    const currentRunSpeed = (PHYSICS_CONSTANTS.RUN_SPEED * speedMultiplier) * timeScale;

    // --- 3. Physics Sub-stepping ---
    const SUB_STEPS = 2;
    const stepMoveX = inputs.right ? currentRunSpeed / SUB_STEPS : 0;
    // Scale jump force
    const stepJumpForce = (inputs.jump && player.isGrounded && !wantSlide) ? (PHYSICS_CONSTANTS.JUMP_FORCE * timeScale) : 0;

    const wasGrounded = player.isGrounded;

    if (stepJumpForce !== 0) {
        player.vy = stepJumpForce;
        player.isGrounded = false;
        createDustPuff(player.x + player.w / 2, PHYSICS_CONSTANTS.GROUND_Y, 3);
    }

    for (let s = 0; s < SUB_STEPS; s++) {
        // Horizontal
        player.x += stepMoveX;

        // Running Dust
        if (player.isGrounded && inputs.right && frameCount % 12 === 0) {
            createRunDust(player.x, PHYSICS_CONSTANTS.GROUND_Y);
        }

        // Gravity - Scaled by timeScale
        const gravityPerStep = (PHYSICS_CONSTANTS.GRAVITY * timeScale) / SUB_STEPS;

        // Position update
        player.y += (player.vy * timeScale) / SUB_STEPS;

        if (!player.isGrounded) {
            // Accel gravity
            player.vy += gravityPerStep;
        }

        // Ground Collision
        let ch = wantSlide ? PHYSICS_CONSTANTS.PLAYER_HEIGHT_SLIDING : PHYSICS_CONSTANTS.PLAYER_HEIGHT_STANDING;
        let groundY = PHYSICS_CONSTANTS.GROUND_Y - ch;

        if (player.y >= groundY) {
            player.y = groundY;
            player.vy = 0;
            player.isGrounded = true;

            if (!wasGrounded) {
                triggerShake(4, 10);
                createDustPuff(player.x + player.w / 2, PHYSICS_CONSTANTS.GROUND_Y, 8);
            }
        } else {
            player.isGrounded = false;
        }
    }

    // --- 3. Final State Update (Bitmask) ---
    // Reset State
    let newState = STATE_IDLE;

    if (!player.isGrounded) {
        newState = STATE_JUMP;
        player.h = PHYSICS_CONSTANTS.PLAYER_HEIGHT_STANDING;
    }
    else if (wantSlide) {
        newState = STATE_SLIDE;
        player.h = PHYSICS_CONSTANTS.PLAYER_HEIGHT_SLIDING;
        player.y = PHYSICS_CONSTANTS.GROUND_Y - PHYSICS_CONSTANTS.PLAYER_HEIGHT_SLIDING;
    }
    else if (inputs.right) {
        newState = STATE_RUN;
        player.h = PHYSICS_CONSTANTS.PLAYER_HEIGHT_STANDING;
        player.y = PHYSICS_CONSTANTS.GROUND_Y - PHYSICS_CONSTANTS.PLAYER_HEIGHT_STANDING;
    }
    else {
        newState = STATE_IDLE;
        player.h = PHYSICS_CONSTANTS.PLAYER_HEIGHT_STANDING;
        player.y = PHYSICS_CONSTANTS.GROUND_Y - PHYSICS_CONSTANTS.PLAYER_HEIGHT_STANDING;
    }

    // Helper: Preserve FINISHED flag if set
    if ((player.state & STATE_FINISHED) !== 0) {
        newState |= STATE_FINISHED;
    }

    player.state = newState;

    return player;
};
