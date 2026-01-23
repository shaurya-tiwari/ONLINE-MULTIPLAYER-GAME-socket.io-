import { triggerShake } from '../game-features/cameraShake';
import { createDustPuff, createRunDust } from '../game-features/visualEffects';
import { getSpeedMultiplier } from '../game-features/playerspeedup';

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
    state: 'idle', // idle, run, jump, slide
    isGrounded: true
});

export const updatePlayerPhysics = (player, inputs, frameCount, raceLength = 10000) => {
    // --- 1. Determine Desired Ground State (Slide vs Run vs Idle) ---

    // Check Slide Timer
    let wantSlide = false;
    if (inputs.slide && (inputs.right || player.state === 'slide')) {
        if (player.state !== 'slide') {
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
    const currentRunSpeed = PHYSICS_CONSTANTS.RUN_SPEED * speedMultiplier;

    // --- 3. Physics Sub-stepping (Production Stability) ---
    // We run physics in 2 smaller steps to prevent "tunneling" through obstacles
    const SUB_STEPS = 2;
    const stepMoveX = inputs.right ? currentRunSpeed / SUB_STEPS : 0;
    const stepJumpForce = (inputs.jump && player.isGrounded && !wantSlide) ? PHYSICS_CONSTANTS.JUMP_FORCE : 0;

    // Track previous grounded state for landing effects
    const wasGrounded = player.isGrounded;

    // Apply jump initial velocity once
    if (stepJumpForce !== 0) {
        player.vy = stepJumpForce;
        player.isGrounded = false;
        createDustPuff(player.x + player.w / 2, PHYSICS_CONSTANTS.GROUND_Y, 3); // Jump puff
    }

    for (let s = 0; s < SUB_STEPS; s++) {
        // Horizontal Movement
        player.x += stepMoveX;
        player.vx = inputs.right ? stepMoveX * SUB_STEPS : 0; // Track actual speed per frame

        // Spawn small running dust
        if (player.isGrounded && inputs.right && frameCount % 12 === 0) {
            createRunDust(player.x, PHYSICS_CONSTANTS.GROUND_Y);
        }

        // Gravity
        player.y += player.vy / SUB_STEPS;
        if (!player.isGrounded) {
            player.vy += PHYSICS_CONSTANTS.GRAVITY / SUB_STEPS;
        }

        // Ground Collision Resolution (Simplified for sub-steps)
        let ch = wantSlide ? PHYSICS_CONSTANTS.PLAYER_HEIGHT_SLIDING : PHYSICS_CONSTANTS.PLAYER_HEIGHT_STANDING;
        let groundY = PHYSICS_CONSTANTS.GROUND_Y - ch;

        if (player.y >= groundY) {
            player.y = groundY;
            player.vy = 0;
            player.isGrounded = true;

            // Landing Juice!
            if (!wasGrounded) {
                triggerShake(4, 10);
                createDustPuff(player.x + player.w / 2, PHYSICS_CONSTANTS.GROUND_Y, 8);
            }
        } else {
            player.isGrounded = false;
        }
    }

    // --- 3. Final State & Dimensions Sync ---
    if (!player.isGrounded) {
        player.state = 'jump';
        player.h = PHYSICS_CONSTANTS.PLAYER_HEIGHT_STANDING;
    }
    else if (wantSlide) {
        player.state = 'slide';
        player.h = PHYSICS_CONSTANTS.PLAYER_HEIGHT_SLIDING;
        player.y = PHYSICS_CONSTANTS.GROUND_Y - PHYSICS_CONSTANTS.PLAYER_HEIGHT_SLIDING;
    }
    else if (inputs.right) {
        player.state = 'run';
        player.h = PHYSICS_CONSTANTS.PLAYER_HEIGHT_STANDING;
        player.y = PHYSICS_CONSTANTS.GROUND_Y - PHYSICS_CONSTANTS.PLAYER_HEIGHT_STANDING;
    }
    else {
        player.state = 'idle';
        player.h = PHYSICS_CONSTANTS.PLAYER_HEIGHT_STANDING;
        player.y = PHYSICS_CONSTANTS.GROUND_Y - PHYSICS_CONSTANTS.PLAYER_HEIGHT_STANDING;
    }

    return player;
};
