/**
 * Camera Shake Feature
 * Handles screen vibrations for juice effects
 */

let shakeIntensity = 0;
let shakeDuration = 0;
let shakeDecay = 0.9; // How fast the shake stops (0-1)

/**
 * Trigger a camera shake
 * @param {number} intensity - Max pixel offset
 * @param {number} duration - Number of frames
 * @param {number} [decay=0.9] - Falloff speed
 */
export const triggerShake = (intensity, duration, decay = 0.9) => {
    shakeIntensity = intensity;
    shakeDuration = duration;
    shakeDecay = decay;
};

/**
 * Get current shake offset
 * Should be called once per frame in the render loop
 * @returns {{x: number, y: number}}
 */
export const getShakeOffset = () => {
    if (shakeDuration <= 0) {
        shakeIntensity = 0;
        return { x: 0, y: 0 };
    }

    // Calculated offsets
    const x = (Math.random() - 0.5) * 2 * shakeIntensity;
    const y = (Math.random() - 0.5) * 2 * shakeIntensity;

    // Decay the effect
    shakeIntensity *= shakeDecay;
    shakeDuration--;

    return { x, y };
};

export const resetShake = () => {
    shakeIntensity = 0;
    shakeDuration = 0;
};
