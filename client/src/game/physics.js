/**
 * Physics Engine - Professional Edition
 * Refactored for maximum responsiveness, fluid transitions and frame independence.
 * Features: Jump Buffering, Coyote Time, and Deterministic State Machine.
 */

import { triggerShake } from '../game-features/cameraShake';
import { createDustPuff, createRunDust } from '../game-features/visualEffects';
import { getSpeedMultiplier } from '../game-features/playerspeedup';
import { STATE_IDLE, STATE_RUN, STATE_JUMP, STATE_SLIDE, STATE_FINISHED, STATE_REVERSE } from './dsaConstants';
import { checkRoadBreakTraversed } from '../game-features/roadBreak/roadBreakLogic';

export const PHYSICS_CONSTANTS = {
    GRAVITY: 0.8,
    JUMP_FORCE: -15,
    RUN_SPEED: 5,
    GROUND_Y: 500,
    PLAYER_HEIGHT_STANDING: 60,
    PLAYER_HEIGHT_SLIDING: 30,
    PLAYER_WIDTH: 40,

    // Professional Feel Constants
    COYOTE_TIME_MS: 100,        // Grace period after leaving ground to still jump
    JUMP_BUFFER_MS: 150,       // Time before landing where a jump press is "queued"
    SLIDE_DURATION_MS: 500,    // Max slide duration
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

    // Internal State Trackers for "Feel"
    lastJumpInput: false,
    lastTimeGrounded: 0,       // For Coyote Time
    jumpBufferTime: 0,         // For Jump Buffering
    slideStartTime: 0
});

export const updatePlayerPhysics = (player, inputs, frameCount, raceLength = 10000, dt = 0.016, mapData = null) => {
    const now = Date.now();
    const safeDt = (dt <= 0 || dt > 0.1) ? 0.0166 : dt;
    const timeScale = safeDt * 60;

    // --- 1. STATE PRE-PROCESSING ---
    const isSliding = (player.state & STATE_SLIDE) !== 0;

    // Update Grounded Status and Coyote Time
    if (player.isGrounded) {
        player.lastTimeGrounded = now;
    }

    // --- 2. INPUT PROCESSING (BUFFERING & EDGE DETECTION) ---
    const jumpPressed = !!inputs.jump;
    const justPressedJump = jumpPressed && !player.lastJumpInput;

    // Buffering: If jump pressed, store the time
    if (justPressedJump) {
        player.jumpBufferTime = now;
    }
    player.lastJumpInput = jumpPressed;

    // --- 3. SLIDE LOGIC ---
    let wantSlide = false;
    if (inputs.slide && (inputs.right || isSliding)) {
        if (!isSliding) player.slideStartTime = now;
        const elapsedSling = now - (player.slideStartTime || 0);
        if (elapsedSling < PHYSICS_CONSTANTS.SLIDE_DURATION_MS) wantSlide = true;
    } else {
        player.slideStartTime = 0;
    }

    // --- 4. ACCURATE JUMP TRIGGER ---
    // Conditions for manual jump: Just pressed or Buffered within window
    const bufferValid = (now - player.jumpBufferTime) < PHYSICS_CONSTANTS.JUMP_BUFFER_MS;
    const coyoteValid = (now - player.lastTimeGrounded) < PHYSICS_CONSTANTS.COYOTE_TIME_MS;

    if (bufferValid && (player.isGrounded || coyoteValid) && !wantSlide) {
        player.vy = PHYSICS_CONSTANTS.JUMP_FORCE;
        player.isGrounded = false;
        player.lastTimeGrounded = 0; // Consumption
        player.jumpBufferTime = 0;   // Consumption
        createDustPuff(player.x + player.w / 2, PHYSICS_CONSTANTS.GROUND_Y, 3);
    }

    // --- 5. HORIZONTAL MOVEMENT (FORWARD & BACKWARD) ---
    const progress = Math.max(0, Math.min(1, player.x / raceLength));
    const speedMultiplier = getSpeedMultiplier(progress);
    const currentRunSpeed = (PHYSICS_CONSTANTS.RUN_SPEED * speedMultiplier) * timeScale;

    let isMoving = false;
    let facingLeft = (player.state & STATE_REVERSE) !== 0;

    if (inputs.right) {
        player.x += currentRunSpeed;
        facingLeft = false;
        isMoving = true;
    } else if (inputs.left) {
        player.x -= currentRunSpeed;
        facingLeft = true;
        isMoving = true;
    }

    if (isMoving && player.isGrounded && frameCount % 12 === 0) {
        createRunDust(player.x, PHYSICS_CONSTANTS.GROUND_Y);
    }

    // --- 6. VERTICAL PHYSICS ---
    if (!player.isGrounded) {
        player.y += player.vy * timeScale;
        player.vy += PHYSICS_CONSTANTS.GRAVITY * timeScale;
    }

    // --- 7. GROUND COLLISION & RESOLUTION ---
    const currentHeight = wantSlide ? PHYSICS_CONSTANTS.PLAYER_HEIGHT_SLIDING : PHYSICS_CONSTANTS.PLAYER_HEIGHT_STANDING;
    const groundY = PHYSICS_CONSTANTS.GROUND_Y - currentHeight;

    if (player.y >= groundY) {
        // Check if there's actually ground here (not a road break)
        const currentGap = mapData ? checkRoadBreakTraversed(player, mapData) : null;

        if (currentGap) {
            // Over a gap!
            player.isGrounded = false;
            // Let the player fall naturally by gravity (vy will increase)
        } else {
            // Solid ground
            if (!player.isGrounded) {
                triggerShake(4, 10);
                createDustPuff(player.x + player.w / 2, PHYSICS_CONSTANTS.GROUND_Y, 8);
            }
            player.y = groundY;
            player.vy = 0;
            player.isGrounded = true;
        }
    } else {
        player.isGrounded = false;
    }

    // --- 7.5 FALL & RESPAWN DETECTION ---
    // If player falls significantly below ground level, reset to before the gap
    const fallThreshold = PHYSICS_CONSTANTS.GROUND_Y + 500;
    if (player.y > fallThreshold) {
        const gap = mapData ? checkRoadBreakTraversed(player, mapData) : null;
        if (gap) {
            // Respawn slightly behind the gap
            player.x = gap.x - 120;
        } else {
            // Fallback safety reset
            player.x -= 150;
        }

        // Reset vertical state to ground level
        player.y = PHYSICS_CONSTANTS.GROUND_Y - PHYSICS_CONSTANTS.PLAYER_HEIGHT_STANDING;
        player.vy = 0;
        player.isGrounded = true;

        // Immediate feedback
        triggerShake(10, 20);
    }

    // --- 8. STATE MACHINE SYNC ---
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
    } else {
        player.h = PHYSICS_CONSTANTS.PLAYER_HEIGHT_STANDING;
    }

    // Preserve special flags (Finished)
    if ((player.state & STATE_FINISHED) !== 0) newState |= STATE_FINISHED;
    if (facingLeft) newState |= STATE_REVERSE;
    player.state = newState;

    return player;
};
