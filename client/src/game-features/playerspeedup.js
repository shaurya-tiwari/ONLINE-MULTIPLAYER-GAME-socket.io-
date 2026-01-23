/**
 * playerspeedup.js
 * 
 * Handles dynamic speed scaling based on race progress percentage.
 * This ensures that races of all lengths (500m, 1500m, 3000m) feel 
 * equally intense and challenging.
 */

/**
 * Calculates the speed multiplier based on the player's progress (0.0 to 1.0).
 * 
 * Logic:
 * 0–30%   → 1.0x (Normal)
 * 30–60%  → 1.1x (Building heat)
 * 60–90%  → 1.2x (Intense)
 * 90–100% → 1.3x (Final Sprint Peak)
 * 
 * @param {number} progress - The race progress (player.x / raceLength)
 * @returns {number} The speed multiplier
 */
export const getSpeedMultiplier = (progress) => {
    if (progress < 0.3) return 1.0;
    if (progress < 0.6) return 1.1;
    if (progress < 0.9) return 1.2;
    return 1.3;
};

/**
 * Checks if the player has entered the "Final Sprint" phase.
 * 
 * @param {number} progress - The race progress (player.x / raceLength)
 * @returns {boolean} True if in final sprint (>= 85%)
 */
export const isFinalSprint = (progress) => {
    return progress >= 0.85;
};
