const GAME_CONSTANTS = {
    GROUND_Y: 500,
    TREE_WIDTH: 150,    // Wider trees
    TREE_HEIGHT: 300,   // Doubled height
    OBSTACLE_WIDTH: 60, // Bigger ground obstacle
    OBSTACLE_HEIGHT: 60,
    TRACK_LENGTH: 5000
};

const generateTrack = (length = 5000) => {
    const trees = [];
    const obstacles = [];

    // Generate Trees (Background decoration)
    for (let x = 100; x < length; x += Math.random() * 300 + 100) {
        trees.push({
            x: Math.floor(x),
            y: GAME_CONSTANTS.GROUND_Y - GAME_CONSTANTS.TREE_HEIGHT,
            w: GAME_CONSTANTS.TREE_WIDTH,
            h: GAME_CONSTANTS.TREE_HEIGHT,
            type: 'tree'
        });
    }

    // Generate Obstacles
    for (let x = 600; x < length; x += Math.random() * 600 + 400) {
        const type = Math.random() > 0.5 ? 'ground' : 'air';
        let y = GAME_CONSTANTS.GROUND_Y - GAME_CONSTANTS.OBSTACLE_HEIGHT;
        let w = GAME_CONSTANTS.OBSTACLE_WIDTH;
        let h = GAME_CONSTANTS.OBSTACLE_HEIGHT;

        if (type === 'air') {
            // "Slightly down... touch head... slide"
            // Start at Ground - N. 
            // Player Standing Height = 60. Standing Top = 440.
            // If we want it to touch head, bottom of obstacle should be around 450-460.
            // Let's say obstacle h=60. 
            // If y=400 (Bottom=460), it hits head (440-500).
            // Player Sliding Height = 30. Sliding Top = 470.
            // So obstacle bottom must be > 470 to pass under.

            // Let's set Bottom to 430? No, that hits sliding player too.
            // Wait, coordinate system: 0 is top, 500 is ground.
            // Standing Head Y = 500 - 60 = 440.
            // Sliding Head Y = 500 - 30 = 470.

            // We want obstacle to BLOCK Standing (Y < 440 + PlayerH) but PASS Sliding (Y < 470?).
            // Actually, we want obstacle to be LOW enough to hit Standing, but HIGH enough to pass Sliding.
            // Gap must be available at bottom.
            // So Obstacle Y + H < 470 is bad (hits sliding).
            // Obstacle Y + H needs to be < 470? No, we want to go UNDER.
            // So the obstacle must be in the AIR.
            // Gap is from Ground (500) up to Obstacle Bottom (y+h).
            // Gap needs to be > 30 (slide height).
            // Gap needs to be < 60 (stand height) to force slide.

            w = 80; // Bigger Air Object width
            h = 80;

            // Goal: Bottom of obstacle (y+h) should be at 460.
            // 460 is below Standing Head (440) -> HEADSHOT.
            // 460 is above Sliding Head (470) -> SAFE. (Wait, 470 is below 460? Yes, Y increases down).

            // Y increases DOWN. Ground is 500.
            // Standing Top: 440.
            // Sliding Top: 470.

            // We want Obstacle Bottom (y+h) to be at 450.
            // 450 > 440 (Standing Top) -> Overlap? YES. Obstacle 450 is "lower" (visually) than 440. It hits head.
            // 450 < 470 (Sliding Top) -> NO. 450 is "higher" than 470. 
            // Wait, if Obstacle Bottom is 450, and Sliding Top is 470...
            // Visual:
            // 440 (Stand Head)
            // 450 (Obstacle Bottom)
            // 470 (Slide Head)
            // 500 (Ground)

            // So if Obstacle ends at 450, the standing player (up to 440) hits it? 
            // No, the Player is from 440 to 500.
            // If Obstacle is at Y=370, H=80 -> Ends at 450.
            // Collision: Player Y (440) < Obs Y+H (450) AND Player Y+H (500) > Obs Y (370).
            // Overlap Y range: [440, 500] vs [370, 450]. Iterate? Yes, [440, 450]. HIT.

            // Sliding: Player [470, 500].
            // Obs [370, 450].
            // Overlap? No. 470 > 450. SAFE.

            // So Obstacle Bottom should be 450.
            // y = 450 - h = 450 - 80 = 370.

            y = 370;
        }

        obstacles.push({
            id: `obs_${x}`,
            x: Math.floor(x),
            y: y,
            w: w,
            h: h, // Use specific h
            type: type
        });
    }

    return { trees, obstacles, length };
};

module.exports = { generateTrack, GAME_CONSTANTS };
