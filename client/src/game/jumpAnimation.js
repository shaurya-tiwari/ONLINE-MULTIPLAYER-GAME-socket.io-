import { getAsset } from './AssetLoader';

export const drawJumpStickman = (ctx, x, y, width, height, frameCount) => {
    // Animation Speed config
    const FRAMES_PER_CHANGE = 8; // Slower speed so we can see the change
    // Determine current frame index (0 to 3)
    // We want it to cycle: 0 -> 1 -> 2 -> 3 -> 0 ...
    const frameIndex = Math.floor(frameCount / FRAMES_PER_CHANGE) % 5;

    const img = getAsset('jump', frameIndex);

    if (img && img.complete) {
        // Use the passed dimensions and position
        // Assuming (x, y) is the top-left of the destination box
        ctx.drawImage(img, x, y, width, height);
    }
};
