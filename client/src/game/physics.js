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

export const updatePlayerPhysics = (player, inputs) => {
    // --- 1. Determine Desired Ground State (Slide vs Run vs Idle) ---

    // Check Slide Timer
    let wantSlide = false;
    // REQUIREMENT: Must be running (inputs.right) to START a slide.
    // If already sliding (player.state === 'slide'), allow continuing.
    if (inputs.slide && (inputs.right || player.state === 'slide')) {
        // Init start time if new slide request
        if (player.state !== 'slide') {
            player.slideStartTime = Date.now();
        }
        // Check duration (0.5s)
        const elapsed = Date.now() - (player.slideStartTime || 0);
        if (elapsed < 500) {
            wantSlide = true;
        } else {
            // Timer expired. Auto-stand.
            wantSlide = false;
        }
    } else {
        player.slideStartTime = 0; // Reset
    }

    // --- 2. Handle Movement Logic ---

    // Horizontal Movement
    // Allowed if Running (Right) OR Sliding (Right + Slide)
    // Actually, physically you move right in both states.
    if (inputs.right) {
        player.x += PHYSICS_CONSTANTS.RUN_SPEED;
    }

    // Jumping Force
    // Allowed only if Grounded AND NOT Sliding
    if (inputs.jump && player.isGrounded && !wantSlide) {
        player.vy = PHYSICS_CONSTANTS.JUMP_FORCE;
        player.isGrounded = false;
        // State will update to jump automatically below
    }


    // --- 3. Physics & Gravity ---
    player.y += player.vy;

    if (!player.isGrounded) {
        player.vy += PHYSICS_CONSTANTS.GRAVITY;
    }

    // --- 4. Ground Collision Resolution ---

    // Calculate Hitbox Height based on INTENDED state for collision check?
    // Be careful: if we change height, we might fall through ground.
    // Let's decide height based on the physical action happening.
    let currentHeight = PHYSICS_CONSTANTS.PLAYER_HEIGHT_STANDING;
    if (wantSlide) {
        currentHeight = PHYSICS_CONSTANTS.PLAYER_HEIGHT_SLIDING;
    }

    const currentGroundY = PHYSICS_CONSTANTS.GROUND_Y - currentHeight;

    if (player.y >= currentGroundY) {
        // Hit Ground
        player.y = currentGroundY;
        player.vy = 0;
        player.isGrounded = true;
    } else {
        // In Air
        player.isGrounded = false;
    }


    // --- 5. Final State & Dimensions Sync ---
    // Strict Priority: JUMP (Air) > SLIDE (Ground) > RUN (Ground) > IDLE (Ground)

    if (!player.isGrounded) {
        player.state = 'jump';
        // In air, we usually use Standing box, but maybe crouch jump?
        // Let's stick to standing size for jump constant
        player.h = PHYSICS_CONSTANTS.PLAYER_HEIGHT_STANDING;
    }
    else if (wantSlide) {
        player.state = 'slide';
        player.h = PHYSICS_CONSTANTS.PLAYER_HEIGHT_SLIDING;
        // Ensure Y is correct for the slide height (should be handled by collision above, but safety set)
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
