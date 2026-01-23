/**
 * PRO-SCALE ASSET LOADER & CACHING SYSTEM
 * Implements 3-level caching: 
 * 1. Module Level Globbing (Vite)
 * 2. In-Memory Image Object Cache (Persistence across restarts)
 * 3. Browser Cache optimization via pre-fetching
 */

// 1. Module Level Cache (Vite Globs)
const treeImages = import.meta.glob('../assets/trees/*.{png,jpg,jpeg,svg}', { eager: true });
const groundObImages = import.meta.glob('../assets/obstacles/ground/*.{png,jpg,jpeg,svg}', { eager: true });
const airObImages = import.meta.glob('../assets/obstacles/air/*.{png,jpg,jpeg,svg}', { eager: true });
const jumpImagesGlob = import.meta.glob('../assets/jump images/*.{png,jpg,jpeg,svg}', { eager: true });
const runImagesGlob = import.meta.glob('../assets/run/*.{png,jpg,jpeg,svg}', { eager: true });
const slideImagesGlob = import.meta.glob('../assets/slide/*.{png,jpg,jpeg,svg}', { eager: true });

// Background & Specials
import stickmanStillSrc from '../assets/stickman/stickmanStill.png';
import stickmanGifSrc from '../assets/stickman/stickman.gif';
import pageBgSrc from '../assets/page/page.jpg';

// Helpers to sort glob results (ensures animation frame order)
const getModules = (globResult) => {
    const sortedKeys = Object.keys(globResult).sort((a, b) => {
        const numA = (a.match(/\d+/) || [0])[0];
        const numB = (b.match(/\d+/) || [0])[0];
        return parseInt(numA) - parseInt(numB);
    });
    return sortedKeys.map(key => globResult[key].default);
};

// 2. In-Memory Persistent Cache (O(1) Access)
const assetCache = new Map();
const assetCategories = {
    tree: getModules(treeImages),
    ground: getModules(groundObImages),
    air: getModules(airObImages),
    jump: getModules(jumpImagesGlob),
    run: getModules(runImagesGlob),
    slide: getModules(slideImagesGlob),
    single: {
        stickmanStill: stickmanStillSrc,
        stickmanGif: stickmanGifSrc,
        pageBg: pageBgSrc
    }
};

/**
 * Core Caching Logic: Load into Image object and store in Map
 */
const loadToCache = (src) => {
    if (assetCache.has(src)) return assetCache.get(src);

    const img = new Image();
    img.src = src;
    // We return a promise that resolves when the image is decoded and ready in memory
    const promise = new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = () => {
            console.warn(`Failed to load asset: ${src}`);
            resolve(img); // Resolve anyway to not block game, but log it
        };
    });

    assetCache.set(src, { img, promise });
    return { img, promise };
};

// Ready-to-use exports
export let stickmanStill = new Image();
export let stickmanGif = new Image();
export let pageBg = pageBgSrc; // Export src for CSS usage

/**
 * Preload All System: Bridges logic between App start and Game Loop
 */
export const preloadAllAssets = async () => {
    console.time("Asset Preload");
    const loadBatch = [];

    // Batch load categories
    Object.values(assetCategories).forEach(srcs => {
        if (Array.isArray(srcs)) {
            srcs.forEach(src => loadBatch.push(loadToCache(src).promise));
        } else {
            Object.values(srcs).forEach(src => loadBatch.push(loadToCache(src).promise));
        }
    });

    // Wait for all to be in browser/memory cache
    const loadedAssets = await Promise.all(loadBatch);

    // Sync individual exports
    stickmanStill = loadToCache(stickmanStillSrc).img;
    stickmanGif = loadToCache(stickmanGifSrc).img;

    console.timeEnd("Asset Preload");
    return true;
};

/**
 * O(1) Snapshot Retrieval
 * Never reloads images, always returns from persistent Map
 */
export const getAsset = (type, index) => {
    const srcs = assetCategories[type];
    if (!srcs || srcs.length === 0) return null;

    const src = srcs[index % srcs.length];
    return loadToCache(src).img;
};

// Kickoff initial parse
Object.entries(assetCategories).forEach(([type, srcs]) => {
    if (Array.isArray(srcs)) {
        srcs.forEach(src => loadToCache(src));
    }
});
loadToCache(stickmanStillSrc);
loadToCache(stickmanGifSrc);
loadToCache(pageBgSrc);
