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
    // OFFSET: +15px to push player down to ground line
    const drawY = y - 55 + 15;

    if (state === 'jump') {
        drawJumpStickman(ctx, drawX, drawY, width, height, frame);
        return;
    }

    if (state === 'run') {
        drawRunStickman(ctx, drawX, drawY, width, height, frame);
        return;
    }

    if (state === 'slide') {
        // Slide needs to be lifted up slightly compared to others
        // because the physics box is lower, or the sprite center is different
        drawSlideStickman(ctx, drawX, drawY - 25, width, height, frame);
        return;
    }

    // Determine which image to use
    let img = stickmanStill; // Idle fallback logic is simple now

    // Draw logic
    if (img && img.complete) {
        ctx.save();

        // Juice: Suble Lean & Squish
        ctx.translate(drawX + width / 2, drawY + height);

        let rot = 0;
        let scaleY = 1.0;
        if (state === 'run') rot = 0.05; // Lean forward
        if (state === 'jump') rot = -0.05; // Kick back
        if (state === 'idle') scaleY = 1.0 + Math.sin(frame * 0.1) * 0.02; // Breathing

        ctx.rotate(rot);
        ctx.scale(1.0, scaleY);
        ctx.translate(-(drawX + width / 2), -(drawY + height));

        ctx.drawImage(img, drawX, drawY, width, height);

        ctx.restore();
    } else {
        // Fallback if image not loaded yet (or just empty)
    }
};

const drawLimb = (ctx, x, y, angle, length) => {
    // Deprecated/Unused with images
};
