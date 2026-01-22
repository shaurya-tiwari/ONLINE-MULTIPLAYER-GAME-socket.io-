import { stickmanStill } from './AssetLoader';
import { drawJumpStickman } from './jumpAnimation';
import { drawRunStickman } from './runAnimation';
import { drawSlideStickman } from './slideAnimation';

export const drawStickman = (ctx, x, y, state, frame, color, facingRight = true) => {
    // Dimensions
    const width = 120;  // Double size
    const height = 120;

    // Center the image in the bounding box (x,y is top-left 40x60 box)
    // We draw it slightly offset to center it
    const drawX = x - 40;
    const drawY = y - 60;

    if (state === 'jump') {
        drawJumpStickman(ctx, drawX, drawY, width, height, frame);
        return;
    }

    if (state === 'run') {
        drawRunStickman(ctx, drawX, drawY, width, height, frame);
        return;
    }

    if (state === 'slide') {
        drawSlideStickman(ctx, drawX, drawY, width, height, frame);
        return;
    }

    // Determine which image to use
    let img = stickmanStill; // Idle fallback logic is simple now

    // Draw logic
    if (img && img.complete) {
        ctx.save();

        ctx.drawImage(img, drawX, drawY, width, height);

        ctx.restore();
    } else {
        // Fallback if image not loaded yet (or just empty)
    }
};

const drawLimb = (ctx, x, y, angle, length) => {
    // Deprecated/Unused with images
};
