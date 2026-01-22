// Use Vite's glob import to get all images from directories
const treeImages = import.meta.glob('../assets/trees/*.{png,jpg,jpeg,svg}', { eager: true });
const groundObImages = import.meta.glob('../assets/obstacles/ground/*.{png,jpg,jpeg,svg}', { eager: true });
const airObImages = import.meta.glob('../assets/obstacles/air/*.{png,jpg,jpeg,svg}', { eager: true });

// Convert object to array of values (modules)
const getModules = (globResult) => {
    return Object.values(globResult).map(mod => mod.default);
};

const trees = getModules(treeImages);
const groundObs = getModules(groundObImages);
const airObs = getModules(airObImages);

// Helper to pre-load images
const loadedImages = {
    trees: [],
    ground: [],
    air: []
};

const preload = (srcArray, targetArray) => {
    srcArray.forEach(src => {
        const img = new Image();
        img.src = src;
        targetArray.push(img);
    });
};

preload(trees, loadedImages.trees);
preload(groundObs, loadedImages.ground);
preload(airObs, loadedImages.air);

export const getAsset = (type, index) => {
    let arr = [];
    if (type === 'tree') arr = loadedImages.trees;
    else if (type === 'ground') arr = loadedImages.ground;
    else if (type === 'air') arr = loadedImages.air;

    if (arr.length === 0) return null;

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
