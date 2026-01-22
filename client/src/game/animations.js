import { stickmanStill, stickmanGif } from './AssetLoader';

export const drawStickman = (ctx, x, y, state, frame, color, facingRight = true) => {
    // Determine which image to use
    let img = stickmanStill;
    if (state === 'run') {
        img = stickmanGif;
    }

    // Draw logic
    if (img && img.complete) {
        ctx.save();

        // Dimensions
        const width = 60;  // Slightly larger than box to fit
        const height = 60;

        // Center the image in the bounding box (x,y is top-left 40x60 box)
        // We draw it slightly offset to center it
        const drawX = x - 10;
        const drawY = y;

        ctx.drawImage(img, drawX, drawY, width, height);

        ctx.restore();
    } else {
        // Fallback if image not loaded yet (or just empty)
    }
};

const drawLimb = (ctx, x, y, angle, length) => {
    // Deprecated/Unused with images
};
