// Race Length Options and Utility Functions (Server-side)
// 1m in-game is approx 10 pixels for scale

const RACE_LENGTHS = {
    "500m": 1500,
    "1500m": 4500,
    "3000m": 9000
};

const DEFAULT_RACE_LENGTH = "500m";

const getFinishLinePosition = (label) => {
    const meters = RACE_LENGTHS[label] || RACE_LENGTHS[DEFAULT_RACE_LENGTH];
    return meters * 10; // 10 pixels per meter scale
};

const validateRaceLength = (label) => {
    return RACE_LENGTHS.hasOwnProperty(label) ? label : DEFAULT_RACE_LENGTH;
};

module.exports = {
    RACE_LENGTHS,
    DEFAULT_RACE_LENGTH,
    getFinishLinePosition,
    validateRaceLength
};
