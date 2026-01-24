/**
 * DSA Refactor Constants
 * Shared definitions for Bitmasks, Network Protocols, and Physics
 */

// Player State Bitmask
export const STATE_IDLE = 0;
export const STATE_RUN = 1 << 0;     // 1
export const STATE_JUMP = 1 << 1;    // 2
export const STATE_SLIDE = 1 << 2;   // 4
export const STATE_FINISHED = 1 << 3; // 8
export const STATE_REVERSE = 1 << 4;  // 16 (Facing Left)
export const STATE_ROPE = 1 << 5;     // 32 (Hanging on Rope)

// Asset Types (Mapped to integers for binary encoding if needed)
export const TYPE_TREE = 0;
export const TYPE_OBS_GROUND = 1;
export const TYPE_OBS_AIR = 2;
export const TYPE_GAP_JUMP = 3;
export const TYPE_GAP_ROPE = 4;
export const TYPE_GAP_BRIDGE = 5;

// Map Data Layout (Stride = 5: Type, X, Y, W, H)
export const MAP_STRIDE = 5;
