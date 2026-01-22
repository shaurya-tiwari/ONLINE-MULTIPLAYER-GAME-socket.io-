const GAME_CONSTANTS = {
    GROUND_Y: 500,
    TREE_WIDTH: 150,
    TREE_HEIGHT: 300,
    OBSTACLE_WIDTH: 120, // Doubled size
    OBSTACLE_HEIGHT: 120, // Doubled size
    TRACK_LENGTH: 5000
};

const generateTrack = (length = 5000) => {
    const trees = [];
    const obstacles = [];

    // 1. Generate Obstacles FIRST (Gameplay critical)
    for (let x = 600; x < length; x += Math.random() * 800 + 500) { // Slightly more spacing for bigger objects
        const type = Math.random() > 0.5 ? 'ground' : 'air';
        let y = GAME_CONSTANTS.GROUND_Y - GAME_CONSTANTS.OBSTACLE_HEIGHT;
        let w = GAME_CONSTANTS.OBSTACLE_WIDTH;
        let h = GAME_CONSTANTS.OBSTACLE_HEIGHT;

        if (type === 'air') {
            // Air Obstacle Logic:
            // Must allow sliding under (Slide Height = 30)
            // Must block standing (Stand Height = 60)

            // Ground Y = 500
            // Slide Top = 470
            // Stand Top = 440

            // We want Obstacle Bottom (y+h) to be around 450.
            // 450 leaves 50px gap from ground (Enough for 30px slide)
            // 450 clips standing player (top at 440, so head is at 440... wait)
            // Player Y is Top. 
            // Stand: Y=440, H=60. Range [440, 500].
            // Slide: Y=470, H=30. Range [470, 500].

            // Obstacle Bottom = 450.
            // Obs Range [y, 450].

            // Stand Overlap: [440, 500] vs [y, 450]. Overlap occurs (440-450). HIT.
            // Slide Overlap: [470, 500] vs [y, 450]. No Overlap (470 > 450). SAFE.

            const desiredBottom = 450;
            y = desiredBottom - h;
        }

        obstacles.push({
            id: `obs_${x}`,
            x: Math.floor(x),
            y: y,
            w: w,
            h: h,
            type: type
        });
    }

    // 2. Generate Trees (Decoration) - Check for overlaps
    for (let x = 100; x < length; x += Math.random() * 300 + 100) {
        // Proposed Tree Bounds
        const treeX = Math.floor(x);
        const treeW = GAME_CONSTANTS.TREE_WIDTH;

        // Simple overlap check with margins
        const overlap = obstacles.some(obs => {
            return (
                treeX < obs.x + obs.w + 50 && // Margin
                treeX + treeW > obs.x - 50
            );
        });

        if (!overlap) {
            trees.push({
                x: treeX,
                y: GAME_CONSTANTS.GROUND_Y - GAME_CONSTANTS.TREE_HEIGHT,
                w: treeW,
                h: GAME_CONSTANTS.TREE_HEIGHT,
                type: 'tree'
            });
        }
    }

    return { trees, obstacles, length };
};

module.exports = { generateTrack, GAME_CONSTANTS };
