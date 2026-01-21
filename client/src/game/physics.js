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
    // 1. Handle Input State
    if (inputs.slide) {
        player.state = 'slide';
        player.h = PHYSICS_CONSTANTS.PLAYER_HEIGHT_SLIDING;
        player.y = PHYSICS_CONSTANTS.GROUND_Y - PHYSICS_CONSTANTS.PLAYER_HEIGHT_SLIDING; // Snap to ground
    } else {
        player.h = PHYSICS_CONSTANTS.PLAYER_HEIGHT_STANDING;
        if (player.isGrounded) {
            // If we were sliding and now released, pop back up
            player.y = PHYSICS_CONSTANTS.GROUND_Y - PHYSICS_CONSTANTS.PLAYER_HEIGHT_STANDING;
            player.state = inputs.right ? 'run' : 'idle';
        }
    }

    // 2. Handle Jumping
    if (inputs.jump && player.isGrounded && !inputs.slide) {
        player.vy = PHYSICS_CONSTANTS.JUMP_FORCE;
        player.isGrounded = false;
        player.state = 'jump';
    }

    // 3. Horizontal Movement
    if (inputs.right && !inputs.slide) { // Cannot run while sliding (usually? Let's say yes for now)
        // Actually, sliding usually maintains momentum or has friction. 
        // For simplicity: You can move right while running. Sliding might still move right?
        // Let's allow moving right while sliding for now, or maybe sliding implies momentum.
        // Prompt says "Player must SLIDE... To move forward". So sliding creates forward movement or allows it.
        player.x += PHYSICS_CONSTANTS.RUN_SPEED;
        if (player.isGrounded && !inputs.slide) player.state = 'run';
    } else if (inputs.right && inputs.slide) {
        player.x += PHYSICS_CONSTANTS.RUN_SPEED; // Slide move
    }

    // 4. precise State checks
    if (!player.isGrounded) {
        player.state = 'jump';
    } else if (inputs.slide) {
        player.state = 'slide';
    } else if (inputs.right) {
        player.state = 'run';
    } else {
        player.state = 'idle';
    }

    // 5. Apply Gravity
    player.y += player.vy;
    if (!player.isGrounded) {
        player.vy += PHYSICS_CONSTANTS.GRAVITY;
    }

    // 6. Ground Collision
    const currentGroundY = PHYSICS_CONSTANTS.GROUND_Y - player.h;
    if (player.y >= currentGroundY) {
        player.y = currentGroundY;
        player.vy = 0;
        player.isGrounded = true;
    } else {
        player.isGrounded = false;
    }

    return player;
};
