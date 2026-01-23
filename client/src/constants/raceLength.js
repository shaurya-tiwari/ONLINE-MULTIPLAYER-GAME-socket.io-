// Race Length Options and Utility Functions
// 1m in-game is approx 10 pixels for scale

export const RACE_LENGTHS = {
    "500m": 500,
    "1500m": 1500,
    "3000m": 3000
};

export const DEFAULT_RACE_LENGTH = "500m";

/**
 * Validates and returns pixel length for a given label
 * @param {string} label - "500m", "1500m", or "3000m"
 * @returns {number} - Pixel length
 */
export const getFinishLinePosition = (label) => {
    const meters = RACE_LENGTHS[label] || RACE_LENGTHS[DEFAULT_RACE_LENGTH];
    return meters * 10; // 10 pixels per meter scale
};

/**
 * Returns the numeric meter value for a label
 * @param {string} label 
 * @returns {number}
 */
export const getRaceLengthMeters = (label) => {
    return RACE_LENGTHS[label] || RACE_LENGTHS[DEFAULT_RACE_LENGTH];
};
