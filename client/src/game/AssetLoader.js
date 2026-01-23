// Use Vite's glob import to get all images from directories
const treeImages = import.meta.glob('../assets/trees/*.{png,jpg,jpeg,svg}', { eager: true });
const groundObImages = import.meta.glob('../assets/obstacles/ground/*.{png,jpg,jpeg,svg}', { eager: true });
const airObImages = import.meta.glob('../assets/obstacles/air/*.{png,jpg,jpeg,svg}', { eager: true });
const jumpImagesGlob = import.meta.glob('../assets/jump images/*.{png,jpg,jpeg,svg}', { eager: true });
const runImagesGlob = import.meta.glob('../assets/run/*.{png,jpg,jpeg,svg}', { eager: true });
const slideImagesGlob = import.meta.glob('../assets/slide/*.{png,jpg,jpeg,svg}', { eager: true });

// Convert object to array of values (modules)
const getModules = (globResult) => {
    // Sort keys to ensure animation order (jump1, jump2, jump 3, jump4)
    // We try to find numbers in the filenames and sort by that
    const sortedKeys = Object.keys(globResult).sort((a, b) => {
        const numA = (a.match(/\d+/) || [0])[0];
        const numB = (b.match(/\d+/) || [0])[0];
        return parseInt(numA) - parseInt(numB);
    });
    return sortedKeys.map(key => globResult[key].default);
};

const trees = getModules(treeImages);
const groundObs = getModules(groundObImages);
const airObs = getModules(airObImages);
const jumpFrames = getModules(jumpImagesGlob);
const runFrames = getModules(runImagesGlob);
const slideFrames = getModules(slideImagesGlob);

// Helper to pre-load images
const loadedImages = new Map([
    ['tree', []],
    ['ground', []],
    ['air', []],
    ['jump', []],
    ['run', []],
    ['slide', []]
]);

const preload = (srcArray, type) => {
    const targetArray = loadedImages.get(type);
    srcArray.forEach(src => {
        const img = new Image();
        img.src = src;
        targetArray.push(img);
    });
};

preload(trees, 'tree');
preload(groundObs, 'ground');
preload(airObs, 'air');
preload(jumpFrames, 'jump');
preload(runFrames, 'run');
preload(slideFrames, 'slide');

/**
 * O(1) Asset Retrieval (Optimized for hot render loop)
 */
export const getAsset = (type, index) => {
    const arr = loadedImages.get(type);
    if (!arr || arr.length === 0) return null;

    // Use modulo to cycle through available images deterministically
    return arr[index % arr.length];
};

// Stickman Assets
import stickmanStillSrc from '../assets/stickman/stickmanStill.png';
import stickmanGifSrc from '../assets/stickman/stickman.gif';

export const stickmanStill = new Image();
stickmanStill.src = stickmanStillSrc;

export const stickmanGif = new Image();
stickmanGif.src = stickmanGifSrc;
