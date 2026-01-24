import { getAsset } from './AssetLoader';

/**
 * Syncs the run animation with the actual distance traveled.
 * This eliminates the "sliding" look and ensures animation speed
 * always matches the movement speed perfectly.
 */
export const drawRunStickman = (ctx, x, y, width, height, frameCount) => {
    // Distance (in pixels) the player must travel to advance one animation frame
    // 20-25 usually feels good for this character size
    const distancePerFrame = 8;

    // Use absolute x position to determine the frame
    // This makes the animation independent of FPS and perfectly synced with ground
    const frameIndex = Math.floor(Math.abs(x) / distancePerFrame);

    const img = getAsset('run', frameIndex);

    if (img) {
        ctx.drawImage(img, x, y, width, height);
    }
};
