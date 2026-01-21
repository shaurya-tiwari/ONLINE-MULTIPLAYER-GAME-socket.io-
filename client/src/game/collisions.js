export const checkCollision = (player, obstacle) => {
    // Simple AABB Collision
    return (
        player.x < obstacle.x + obstacle.w &&
        player.x + player.w > obstacle.x &&
        player.y < obstacle.y + obstacle.h &&
        player.y + player.h > obstacle.y
    );
};

export const handleCollisions = (player, obstacles) => {
    // We only care about obstacles close to the player to optimize
    // For now, iterate all (map is small enough or we can filter)

    // We assume the player wants to move Right.
    // If they collide, we stop them at the left edge of the obstacle

    for (let obs of obstacles) {
        if (checkCollision(player, obs)) {
            // Check specific rules based on prompt

            // "Type 1: Ground Obstacle -> Player must JUMP"
            // "Type 2: Air Obstacle -> Player must SLIDE"

            // If we are colliding, it means we failed to avoid it.
            // STOP the player.

            // To ensure we don't get stuck inside, we reposition player to the left of obstacle
            // BUT only if we are hitting it from the left
            if (player.x + player.w > obs.x && player.x < obs.x) {
                player.x = obs.x - player.w;
            }

            return true; // Collision detected
        }
    }
    return false;
};
