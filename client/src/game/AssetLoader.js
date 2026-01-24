/**
 * PRO-SCALE ASSET LOADER & CACHING SYSTEM (DSA REFACTOR)
 * Improvement: Uses ImageBitmap for off-thread decoding and GPU-ready textures.
 * Structure: Map<string, ImageBitmap>
 */

// 1. Module Level Cache (Vite Globs)
const treeImages = import.meta.glob('../assets/trees/*.{png,jpg,jpeg,svg}', { eager: true });
const groundObImages = import.meta.glob('../assets/obstacles/ground/*.{png,jpg,jpeg,svg}', { eager: true });
const airObImages = import.meta.glob('../assets/obstacles/air/*.{png,jpg,jpeg,svg}', { eager: true });
const jumpImagesGlob = import.meta.glob('../assets/jump images/*.{png,jpg,jpeg,svg}', { eager: true });
const runImagesGlob = import.meta.glob('../assets/run/*.{png,jpg,jpeg,svg}', { eager: true });
const slideImagesGlob = import.meta.glob('../assets/slide/*.{png,jpg,jpeg,svg}', { eager: true });
const finishImagesGlob = import.meta.glob('../assets/finish/*.{png,jpg,jpeg,svg}', { eager: true });

// Background & Specials
import stickmanStillSrc from '../assets/stickman/stickmanStill.png';
import stickmanGifSrc from '../assets/stickman/stickman.gif';
import pageBgSrc from '../assets/page/page.jpg';

// Helpers to sort glob results
const getModules = (globResult) => {
    const sortedKeys = Object.keys(globResult).sort((a, b) => {
        const numA = (a.match(/\d+/) || [0])[0];
        const numB = (b.match(/\d+/) || [0])[0];
        return parseInt(numA) - parseInt(numB);
    });
    return sortedKeys.map(key => globResult[key].default);
};

// 2. In-Memory Persistent Cache (Map<string, ImageBitmap>)
const bitmapCache = new Map();

const assetCategories = {
    tree: getModules(treeImages),
    ground: getModules(groundObImages),
    air: getModules(airObImages),
    jump: getModules(jumpImagesGlob),
    run: getModules(runImagesGlob),
    slide: getModules(slideImagesGlob),
    finish: getModules(finishImagesGlob),
    single: {
        stickmanStill: stickmanStillSrc,
        stickmanGif: stickmanGifSrc,
        pageBg: pageBgSrc
    }
};

/**
 * DSA Change: Load as ImageBitmap
 * Benefits: Background thread decoding, zero main-thread jank on draw.
 */
const loadToCache = async (src) => {
    if (bitmapCache.has(src)) return bitmapCache.get(src);

    try {
        // Fetch Blob then createImageBitmap
        const response = await fetch(src);
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);

        bitmapCache.set(src, bitmap);
        return bitmap;
    } catch (e) {
        console.warn(`Failed to process bitmap: ${src}`, e);
        return null;
    }
};

// Exports for direct access (Will be ImageBitmaps after preload)
export let stickmanStill = null;
export let stickmanGif = null;
export let pageBg = pageBgSrc; // Keep str for CSS

// Preload System
export const preloadAllAssets = async () => {
    // console.time("Asset Preload (Bitmap)");
    const loadBatch = [];

    // Queue all loads
    Object.values(assetCategories).forEach(srcs => {
        if (Array.isArray(srcs)) {
            srcs.forEach(src => loadBatch.push(loadToCache(src)));
        } else {
            Object.values(srcs).forEach(src => loadBatch.push(loadToCache(src)));
        }
    });

    await Promise.all(loadBatch);

    // Sync individual exports
    stickmanStill = bitmapCache.get(stickmanStillSrc);
    stickmanGif = bitmapCache.get(stickmanGifSrc);

    // console.timeEnd("Asset Preload (Bitmap)");
    return true;
};

// O(1) Snapshot Retrieval
export const getAsset = (type, index) => {
    const srcs = assetCategories[type];
    if (!srcs || srcs.length === 0) return null;
    const src = srcs[index % srcs.length];
    return bitmapCache.get(src); // Returns ImageBitmap
};

export const getAssetSrc = (type, index) => {
    // Helper if src needed for non-canvas
    const srcs = assetCategories[type];
    return srcs ? srcs[index % srcs.length] : null;
};
