import { getAsset } from './AssetLoader';

export const drawRunStickman = (ctx, x, y, width, height, frameCount) => {
    // Animation Speed config
    // 45 frames is a lot. If we play at 60fps, it takes ~0.75 seconds to loop.
    // That sounds reasonable for a run cycle.
    // Let's play 1 frame every 5 ticks (12fps animation).
    const FRAMES_PER_CHANGE = 3;

    // Determine current frame index (0 to 44)
    const totalFrames = 8; // Or however many loaded, getAsset handles modulo, but for math we can just pass frameCount

    // Pass raw frameCount to getAsset logic? No, getAsset takes index.
    // Calculate index manually to control speed
    const frameIndex = Math.floor(frameCount / FRAMES_PER_CHANGE);

    const img = getAsset('run', frameIndex);

    if (img) {
        ctx.drawImage(img, x, y, width, height);
    }
};
