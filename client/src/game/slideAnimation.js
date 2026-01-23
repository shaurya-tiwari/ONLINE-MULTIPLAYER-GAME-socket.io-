import { getAsset } from './AssetLoader';

export const drawSlideStickman = (ctx, x, y, width, height, frameCount) => {
    // Animation Speed config
    // 10 frames total.
    const FRAMES_PER_CHANGE = 4;

    // Determine current frame index
    const frameIndex = Math.floor(frameCount / FRAMES_PER_CHANGE);

    const img = getAsset('slide', frameIndex);

    if (img) {
        ctx.drawImage(img, x, y, width, height);
    }
};
