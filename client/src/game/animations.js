import { stickmanStill } from './AssetLoader';
import { drawJumpStickman } from './jumpAnimation';
import { drawRunStickman } from './runAnimation';
import { drawSlideStickman } from './slideAnimation';
import { STATE_IDLE, STATE_RUN, STATE_JUMP, STATE_SLIDE, STATE_ROPE, STATE_REVERSE } from './dsaConstants';

export const drawStickman = (ctx, x, y, state, frame, color, facingRight = true) => {
    // Dimensions
    const width = 25;
    const height = 50;

    const drawX = x - 25;
    const drawY = y - 6 + 15;

    // Determine direction
    const facingLeft = (state & STATE_REVERSE) !== 0;

    ctx.save();
    if (facingLeft) {
        ctx.translate(drawX + width / 2, 0);
        ctx.scale(-1, 1);
        ctx.translate(-(drawX + width / 2), 0);
    }

    // Bitmask Checks
    if ((state & STATE_ROPE) !== 0) {
        // Use jump animation for hanging, but anchor it better if needed
        drawJumpStickman(ctx, drawX, drawY, width, height, frame);
        ctx.restore();
        return;
    }

    if ((state & STATE_JUMP) !== 0) {
        drawJumpStickman(ctx, drawX, drawY, width, height, frame);
        ctx.restore();
        return;
    }

    if ((state & STATE_RUN) !== 0) {
        drawRunStickman(ctx, drawX, drawY, width, height, frame);
        ctx.restore();
        return;
    }

    if ((state & STATE_SLIDE) !== 0) {
        drawSlideStickman(ctx, drawX, drawY - 25, width, height, frame);
        ctx.restore();
        return;
    }

    // Fallback / Idle
    let img = stickmanStill;

    if (img) { // Removed .complete check as ImageBitmap is always ready or null
        ctx.save();
        ctx.translate(drawX + width / 2, drawY + height);

        let rot = 0;
        let scaleY = 1.0;
        if ((state & STATE_RUN) !== 0) rot = 0.05;
        if ((state & STATE_JUMP) !== 0) rot = -0.05;
        if ((state & STATE_IDLE) !== 0 || state === 0) scaleY = 1.0 + Math.sin(frame * 0.1) * 0.02;

        ctx.rotate(rot);
        ctx.scale(1.0, scaleY);
        ctx.translate(-(drawX + width / 2), -(drawY + height));

        ctx.drawImage(img, drawX, drawY, width, height);
        ctx.restore();
    }
    ctx.restore();
};
