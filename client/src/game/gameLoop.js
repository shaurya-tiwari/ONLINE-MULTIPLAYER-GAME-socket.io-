/**
 * DSA REFACTOR: MAIN GAME ENGINE LOOP
 * Integrates:
 * 1. Event Ring Buffer (Zero Allocations)
 * 2. Binary Networking (ArrayBuffer)
 * 3. Spatial Hash Physics
 * 4. SoA Rendering (Int16Array)
 */

console.log("DSA Game Engine v2.1 Loaded"); // Force Update

import { updatePlayerPhysics, createPlayerState } from './physics';
import { handleCollisions, buildSpatialHash } from './collisions';
import { drawStickman } from './animations';
import { getAsset } from './AssetLoader';
import { getFinishLinePosition } from '../constants/raceLength';
import { STATE_FINISHED, MAP_STRIDE, TYPE_TREE, TYPE_OBS_GROUND, TYPE_OBS_AIR, TYPE_GAP_JUMP, TYPE_GAP_ROPE, TYPE_GAP_BRIDGE, STATE_ROPE, STATE_JUMP } from './dsaConstants';
import { createRopeInstance, updateRopePhysics, checkRopeGrab, syncPlayerToRope } from '../game-features/roadBreak/jump/ropeSwing';

// Juice Features
import { getShakeOffset, triggerShake } from '../game-features/cameraShake';
import { updateVisualEffects, drawWorldEffects, drawScreenEffects, createDustPuff } from '../game-features/visualEffects';
import { startCountdown, updateCountdown, renderCountdown, isRaceLocked } from '../game-features/countdown';
// isFinalSprint removed


// --- 1. EVENT RING BUFFER (Zero-GC Input Handling) ---
const MAX_EVENTS = 64;
const EVENT_SIZE = 2; // [KeyCode, IsDown]
const inputRingBuffer = new Uint8Array(MAX_EVENTS * EVENT_SIZE);
let inputHead = 0;
let inputTail = 0;

// Rope Context
let activeRope = null;
let lastRopeGapId = -1; // To prevent immediate re-grab of same rope gap
const ropeStates = new Map(); // Persistent physics state for all world ropes

// Mapping Keys to Byte Codes
const KEY_RIGHT = 1;
const KEY_JUMP = 2;
const KEY_SLIDE = 3;
const KEY_LEFT = 4;

// --- 2. GAME VARIABLES ---
let animationFrameId;
let ctx;
let canvas;
let myId;
let users;
let mapData; // Int16Array
let cameraX = 0;

// Persistent Input State (Updated from Ring Buffer)
let inputs = {
    right: false,
    left: false,
    jump: false,
    slide: false
};

export const clearInputs = () => {
    inputs.right = false;
    inputs.left = false;
    inputs.jump = false;
    inputs.slide = false;
    // Reset Ring Buffer
    inputHead = 0;
    inputTail = 0;
};

let socketRef;
let roomCodeRef;
let frameCount = 0;
let onGameOverCallback;
let MAP_LENGTH = 5000;

// --- 3. BINARY NETWORK BUFFERS ---
// Pre-allocated for reuse
const UPDATE_PACKET_SIZE = 64; // Approx
const updateBuffer = new ArrayBuffer(UPDATE_PACKET_SIZE);
const updateView = new DataView(updateBuffer);
// We also need a Uint8Array view to write strings/bytes
const updateBytes = new Uint8Array(updateBuffer);

let lastEmitTime = 0;
const EMIT_RATE = 30;

const remotePlayers = {};
let lastFrameTime = performance.now();
let isTabActive = true;
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// --- NAME COLORS ---
const NAME_TAG_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
const getPlayerColor = (id) => {
    if (!id) return NAME_TAG_COLORS[0];
    let hash = 0;
    for (let i = 0; i < id.length; i++) { hash = id.charCodeAt(i) + ((hash << 5) - hash); }
    return NAME_TAG_COLORS[Math.abs(hash) % NAME_TAG_COLORS.length];
};

// --- INPUT LISTENERS (Push to Ring Buffer) ---
const pushEvent = (code, isDown) => {
    const nextHead = (inputHead + 1) % MAX_EVENTS;
    // Overwrite if full (Drop old events, prefer new)

    // Store
    const offset = inputHead * EVENT_SIZE;
    inputRingBuffer[offset] = code;
    inputRingBuffer[offset + 1] = isDown ? 1 : 0;

    inputHead = nextHead;
    if (inputHead === inputTail) {
        // Buffer full, advance tail to drop oldest
        inputTail = (inputTail + 1) % MAX_EVENTS;
    }
};

const mapKey = (code) => {
    if (code === 'ArrowRight' || code === 'KeyD') return KEY_RIGHT;
    if (code === 'ArrowLeft' || code === 'KeyA') return KEY_LEFT;
    if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') return KEY_JUMP;
    if (code === 'ArrowDown' || code === 'KeyS') return KEY_SLIDE;
    return 0;
};

const handleKeyDown = (e) => {
    const key = mapKey(e.code);
    if (key) pushEvent(key, true);
};

const handleKeyUp = (e) => {
    const key = mapKey(e.code);
    if (key) pushEvent(key, false);
};

export const startGameLoop = (canvasElem, socket, playerId, players, gameMap, roomCode, onGameOver, raceLengthLabel) => {
    // 1. HARD STOP: Kill any existing loop before starting a new one
    stopGameLoop();

    canvas = canvasElem;
    ctx = canvas.getContext('2d');
    myId = playerId;

    // DSA Fix: Robust Map Decoding (Handles Buffer Pooling & Offset)
    if (gameMap && gameMap.buffer) {
        // Ensure we only read the exact slice provided by the socket
        mapData = new Int32Array(gameMap.buffer, gameMap.byteOffset, gameMap.byteLength / 4);
    } else if (gameMap instanceof ArrayBuffer) {
        mapData = new Int32Array(gameMap);
    } else {
        mapData = gameMap;
    }

    // Clear persistent states
    ropeStates.clear();
    activeRope = null;
    lastRopeGapId = -1;

    // Build Spatial Hash immediately
    if (mapData) buildSpatialHash(mapData);

    socketRef = socket;
    roomCodeRef = roomCode;
    frameCount = 0;
    onGameOverCallback = onGameOver;
    MAP_LENGTH = getFinishLinePosition(raceLengthLabel);

    startCountdown();
    clearInputs();

    users = {};
    Object.values(players).forEach(p => {
        users[p.id] = createPlayerState(p.id, p.name);
        remotePlayers[p.id] = {
            current: { ...users[p.id] },
            target: { ...users[p.id] },
            lastUpdate: Date.now()
        };
    });

    // DSA: Handle Binary Updates
    socket.on('player_updated', (buffer) => {
        if (buffer instanceof ArrayBuffer || buffer instanceof Uint8Array) {
            parsePlayerUpdate(buffer);
        } else {
            handleLegacyUpdate(buffer);
        }
    });

    // DSA: Handle Real-time Room Changes (Cleanup Disconnected Players)
    socket.on('update_room', ({ players: serverPlayers }) => {
        if (!serverPlayers) return;
        // Prune players who are no longer in the server list
        Object.keys(users).forEach(id => {
            if (id !== myId && !serverPlayers[id]) {
                delete users[id];
                delete remotePlayers[id];
            }
        });
    });

    cameraX = 0;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Mobile/Pointer Input
    const handlePointerDown = (e) => {
        const rect = canvas.getBoundingClientRect();
        // Check restart button area logic... 
        // (Simplified for brevity, same logic as before but uses pushEvent handling if mapped, 
        // strictly speaking buttons are UI events, not game inputs, but we keep logic)
        if (!users[myId]) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        if (users[myId].state & STATE_FINISHED && x >= cx - 120 && x <= cx + 120 && y >= cy + 20 && y <= cy + 80) {
            if (socketRef && roomCodeRef) socketRef.emit('restart_game', { code: roomCodeRef });
        }
    };
    canvas.handlePointerDown = handlePointerDown;
    canvas.addEventListener('pointerdown', handlePointerDown);

    const handleVisibilityChange = () => {
        isTabActive = !document.hidden;
        if (isTabActive) lastFrameTime = performance.now();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.handleVisibilityChange = handleVisibilityChange;

    lastFrameTime = performance.now();
    requestAnimationFrame(loop);
};

const loop = (currentTime) => {
    if (!isTabActive || !ctx) { // Check ctx stop
        animationFrameId = requestAnimationFrame(loop);
        return;
    }

    const dt = (currentTime - lastFrameTime) / 1000;
    lastFrameTime = currentTime;

    // Process Input Ring Buffer
    let jumpOccurred = false;
    let slideOccurred = false;

    while (inputHead !== inputTail) {
        const offset = inputTail * EVENT_SIZE;
        const code = inputRingBuffer[offset];
        const isDown = inputRingBuffer[offset + 1] === 1;

        if (code === KEY_RIGHT) {
            inputs.right = isDown;
        } else if (code === KEY_LEFT) {
            inputs.left = isDown;
        } else if (code === KEY_JUMP) {
            inputs.jump = isDown;
            if (isDown) jumpOccurred = true;
        } else if (code === KEY_SLIDE) {
            inputs.slide = isDown;
            if (isDown) slideOccurred = true;
        }

        inputTail = (inputTail + 1) % MAX_EVENTS;
    }

    // Effective inputs for this frame: prioritize "down" events if they occurred in the buffer
    const effectiveInputs = {
        ...inputs,
        jump: inputs.jump || jumpOccurred,
        slide: inputs.slide || slideOccurred
    };

    update(dt, effectiveInputs);
    render(dt);
    frameCount++;
    animationFrameId = requestAnimationFrame(loop);
};

export const stopGameLoop = () => {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null; // Important: Nullify ID
    }
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    if (canvas) canvas.removeEventListener('pointerdown', canvas.handlePointerDown);
    document.removeEventListener('visibilitychange', document.handleVisibilityChange);
    if (socketRef) {
        socketRef.off('player_updated');
        socketRef.off('update_room');
    }
    ctx = null;
};

// --- BINARY PARSER ---
const parsePlayerUpdate = (buffer) => {
    // Convert to DataView
    let view;
    if (buffer.buffer) view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    else view = new DataView(buffer);

    // Skip Room Code (4 bytes)
    let offset = 4;

    // Read ID Len
    const idLen = view.getUint8(offset);
    offset += 1;

    // Read ID String
    let id = "";
    for (let i = 0; i < idLen; i++) {
        id += String.fromCharCode(view.getUint8(offset + i));
    }
    offset += idLen;

    if (id === myId) return; // Should not happen with server relay logic, but safety

    if (!users[id]) {
        // Need name? Binary packet can include it only on first join or assume known from lobby.
        // For physics update, we might not send name every frame.
        // If unknown user, we might ignore or fetch.
        // For now, auto-create:
        users[id] = createPlayerState(id, "Player");
        remotePlayers[id] = { current: { ...users[id] }, target: { ...users[id] }, lastUpdate: Date.now() };
    }

    const target = remotePlayers[id].target;
    const tx = view.getFloat32(offset, true); offset += 4;
    const ty = view.getFloat32(offset, true); offset += 4;
    target.x = isNaN(tx) ? 100 : tx;
    target.y = isNaN(ty) ? 440 : ty;
    target.state = view.getUint8(offset); offset += 1;
    const flags = view.getUint8(offset); offset += 1; // [Finished(1bit), ...]
    target.finished = (flags & 1) === 1;

    remotePlayers[id].lastUpdate = Date.now();
};

const handleLegacyUpdate = (remotePlayer) => {
    // ... kept for fallback if needed ...
};

const update = (dt, frameInputs) => {
    try {
        if (!users[myId]) return;
        const player = users[myId];

        updateCountdown(() => {
            triggerShake(15, 20);
            createDustPuff(player.x + player.w / 2, 500, 15);
        });

        if (isRaceLocked()) return;

        // Check Finish
        if (player.x >= MAP_LENGTH) {
            player.state |= STATE_FINISHED;
            if (!player.finished) {
                player.finished = true;
                triggerShake(10, 30);
                if (socketRef && roomCodeRef) {
                    socketRef.emit('player_won', {
                        code: roomCodeRef,
                        name: player.name,
                        x: player.x
                    });
                }
            }
        } else {
            // --- ENHANCED ROPE SYSTEM ---
            const count = mapData ? mapData.length / MAP_STRIDE : 0;
            for (let i = 0; i < count; i++) {
                const offset = i * MAP_STRIDE;
                if (mapData[offset] === TYPE_GAP_ROPE) {
                    const gapX = mapData[offset + 1];
                    const gapW = mapData[offset + 3];

                    // 1. Get or Create persistent rope state
                    let rope = ropeStates.get(i);
                    if (!rope) {
                        rope = createRopeInstance({ x: gapX, w: gapW });
                        ropeStates.set(i, rope);
                    }

                    // 2. Process Physics (Always active for all ropes)
                    const isHeld = (player.state & STATE_ROPE) && activeRope === rope;
                    const ropeInputs = isHeld ? frameInputs : { left: false, right: false };
                    updateRopePhysics(rope, ropeInputs, dt);

                    // 3. Handle Active Interaction
                    if (isHeld) {
                        syncPlayerToRope(player, rope);

                        // Exit Rope: Jump press
                        const now = Date.now();
                        const justPressedJump = frameInputs.jump && !player.lastJumpInput;
                        const canRelease = (now - (player.ropeGrabTime || 0)) > 300;

                        if (canRelease && justPressedJump) {
                            player.state &= ~STATE_ROPE;

                            // REALISTIC PENDULUM THROW (Inertia Boost):
                            // v = omega * L (Tangential Speed)
                            const tangSpeed = rope.angularVelocity * rope.length;

                            // Increased scale (0.4) to make the rope "throw" the player
                            const PHYSICS_SCALE = 0.4;
                            const tVx = tangSpeed * Math.cos(rope.angle) * PHYSICS_SCALE;
                            const tVy = -tangSpeed * Math.sin(rope.angle) * PHYSICS_SCALE;

                            // Launch trajectory: High influence from rope velocity + smaller jump kick ( -10 )
                            player.vx = tVx;
                            player.vy = tVy - 10;

                            activeRope = null;
                            triggerShake(12, 15); // Slightly stronger shake for better feedback
                        }
                    } else if (!(player.state & STATE_ROPE) && (player.state & STATE_JUMP)) {
                        // 4. Check for New Grab
                        if (i !== lastRopeGapId && Math.abs(player.x - gapX) < 400) {
                            if (checkRopeGrab(player, rope)) {
                                activeRope = rope;
                                player.state |= STATE_ROPE;
                                player.ropeGrabTime = Date.now();
                                lastRopeGapId = i;
                                triggerShake(8, 10);
                            }
                        }
                    }
                }
            }

            // Cleanup far ropes periodically to save memory
            if (frameCount % 600 === 0) {
                for (const [id, rope] of ropeStates) {
                    if (Math.abs(player.x - rope.anchorX) > 2000) ropeStates.delete(id);
                }
            }

            if (!(player.state & STATE_ROPE)) {
                updatePlayerPhysics(player, frameInputs, frameCount, MAP_LENGTH, dt, mapData);
                if (player.isGrounded) lastRopeGapId = -1;
            }
        }

        // Keep track of jump input for state machine (even during ropes)
        player.lastJumpInput = !!frameInputs.jump;

        // DSA: Spatial Hash Collision Check
        if (mapData) {
            handleCollisions(player, mapData); // Uses spatial hash internally now
        }

        // --- DSA: BINARY EMIT ---
        if (socketRef && roomCodeRef) {
            const now = Date.now();
            if (now - lastEmitTime > EMIT_RATE) {
                // Pack Data ...
                let offset = 0;
                for (let i = 0; i < 4; i++) { updateBytes[offset++] = roomCodeRef.charCodeAt(i); }
                const idLen = player.id.length;
                updateBytes[offset++] = idLen;
                for (let i = 0; i < idLen; i++) { updateBytes[offset++] = player.id.charCodeAt(i); }
                updateView.setFloat32(offset, player.x, true); offset += 4;
                updateView.setFloat32(offset, player.y, true); offset += 4;
                updateBytes[offset++] = player.state;
                updateBytes[offset++] = player.finished ? 1 : 0;
                const packet = new Uint8Array(updateBuffer, 0, offset);
                socketRef.emit('player_update', packet);
                lastEmitTime = now;
            }
        }

        cameraX = player.x - 100;
        if (cameraX < 0 || isNaN(cameraX)) cameraX = 0;
    } catch (err) {
        console.error("Game update error:", err);
    }
};

// DSA: Update Remote Players (Interpolation)
export const updateRemotePlayers = (dt) => {
    Object.keys(remotePlayers).forEach(id => {
        if (id === myId) return;
        const data = remotePlayers[id];
        const user = users[id];
        if (!user) return;

        const lerpFactor = 12;
        user.x += (data.target.x - user.x) * (1 - Math.exp(-lerpFactor * dt));
        user.y += (data.target.y - user.y) * (1 - Math.exp(-lerpFactor * dt));
        user.state = data.target.state;
        user.finished = data.target.finished;
    });
};

const render = (dt) => {
    try {
        if (!ctx || !canvas) return;

        const me = users[myId];
        const progress = me ? me.x / MAP_LENGTH : 0;
        const sprinting = inputs.right; // isFinalSprint Removed
        const { currentZoom } = updateVisualEffects(me?.vx || 0, sprinting);
        const shake = getShakeOffset();

        updateRemotePlayers(dt);

        // 1. Clear & Setup
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (canvas.width === 0 || canvas.height === 0) return;

        ctx.save();
        const BASE_HEIGHT = 600; const BASE_WIDTH = 1000;
        // Calculate scale to best fit the screen width, with a minimum to prevent too tiny rendering
        const baseScale = Math.max(0.4, canvas.width / BASE_WIDTH);

        // Position Ground (500) at 65% of screen height
        const desiredGroundY = canvas.height * 0.65;
        const verticalOffset = (desiredGroundY / baseScale) - 500;

        const zoom = isNaN(currentZoom) ? 1.0 : currentZoom;
        const finalScale = baseScale * zoom;
        ctx.scale(finalScale, finalScale);

        const camX = isNaN(cameraX) ? 0 : cameraX;
        ctx.translate(-camX + shake.x, verticalOffset + shake.y);

        drawWorldEffects(ctx);

        // 2. Ground
        const groundY = 500;
        if (!isMobile) { /* Shadows Removed */ }
        ctx.strokeStyle = '#222'; ctx.lineWidth = 4;

        // Segmented Ground Rendering to show "Breaks"
        ctx.beginPath();
        let currentX = 0;
        const stride = MAP_STRIDE;
        const count = mapData ? mapData.length / stride : 0;

        for (let i = 0; i < count; i++) {
            const offset = i * stride;
            const type = mapData[offset];
            const gapX = mapData[offset + 1];
            const gapW = mapData[offset + 3];

            // If it's a gap, draw line up to the gap start, then move to gap end
            // Exception: Bridge gaps should be visually connected (drawn below)
            if (type === TYPE_GAP_JUMP || type === TYPE_GAP_ROPE || type === TYPE_GAP_BRIDGE) {
                ctx.moveTo(currentX, groundY);
                ctx.lineTo(gapX, groundY);
                currentX = gapX + gapW;
            }
        }

        // Final segment to infinite or track end
        ctx.moveTo(currentX, groundY);
        ctx.lineTo(MAP_LENGTH + 2000, groundY);
        ctx.stroke();

        if (!isMobile) { /* Shadows Removed */ }

        // Ground Details
        ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 2;
        const startX = Math.floor(camX / 50) * 50;
        const viewWidth = canvas.width / (finalScale || 1);
        const endX = startX + viewWidth + 100;

        ctx.beginPath();
        for (let x = startX; x < endX; x += 100) {
            if (x > MAP_LENGTH + 2000) break;
            ctx.moveTo(x, groundY); ctx.lineTo(x - 15, groundY + 15);
        }
        ctx.stroke();

        // 3. FINISH LINE
        const finishImg = getAsset('finish', 0);
        if (finishImg) {
            const targetHeight = 300;
            const scale = targetHeight / (finishImg.height || 300);
            const targetWidth = (finishImg.width || 300) * scale;
            ctx.drawImage(finishImg, MAP_LENGTH - targetWidth / 2, groundY - targetHeight, targetWidth, targetHeight);
        } else {
            ctx.fillStyle = '#222';
            for (let i = 0; i < 4; i++) { ctx.fillRect(MAP_LENGTH, groundY - 300 + (i * 75), 10, 37.5); }
            ctx.lineWidth = 2; ctx.strokeStyle = '#222'; ctx.strokeRect(MAP_LENGTH, groundY - 300, 10, 300);
            ctx.fillStyle = '#ef5350'; ctx.beginPath(); ctx.moveTo(MAP_LENGTH, groundY - 300); ctx.lineTo(MAP_LENGTH - 100, groundY - 275); ctx.lineTo(MAP_LENGTH, groundY - 250); ctx.fill();
            ctx.fillStyle = '#222'; ctx.font = '900 32px "Inter", sans-serif'; ctx.fillText("FINISH", MAP_LENGTH + 20, groundY - 150);
        }

        // DSA: RENDER ITERATION (Data Oriented)
        if (mapData) {
            let low = 0, high = (mapData.length / MAP_STRIDE) - 1;
            let startIndex = 0;
            while (low <= high) {
                let mid = (low + high) >>> 1;
                let mx = mapData[mid * MAP_STRIDE + 1];
                // Increase padding to 1000 to prevent wide gaps from culling too early
                if (mx + 1000 < camX) { startIndex = mid + 1; low = mid + 1; }
                else high = mid - 1;
            }

            const count = mapData.length / MAP_STRIDE;
            for (let i = startIndex; i < count; i++) {
                const offset = i * MAP_STRIDE;
                const x = mapData[offset + 1];
                if (x > camX + viewWidth) break; // Culling

                const type = mapData[offset + 0];
                const y = mapData[offset + 2];
                const w = mapData[offset + 3];
                const h = mapData[offset + 4];

                if (type === TYPE_TREE) {
                    const img = getAsset('tree', i);
                    if (img) {
                        // Shadow removed
                        ctx.drawImage(img, x, y, w, h);
                    }
                } else if (type === TYPE_OBS_GROUND || type === TYPE_OBS_AIR) {
                    const imgType = type === TYPE_OBS_AIR ? 'air' : 'ground';
                    const img = getAsset(imgType, i);
                    if (img) ctx.drawImage(img, x, y, w, h);
                    else {
                        ctx.fillStyle = type === TYPE_OBS_AIR ? '#ef5350' : '#ffa726';
                        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill(); ctx.stroke(); }
                        else ctx.fillRect(x, y, w, h);
                    }
                    // Shadow removed
                } else if (type === TYPE_GAP_ROPE) {
                    const anchorX = x + w / 2;
                    const anchorY = -300; // Match createRopeInstance anchorY
                    let endX, endY;

                    const rope = ropeStates.get(i);
                    if (rope) {
                        endX = rope.currentX; endY = rope.currentY;
                    } else {
                        // ROPE VISUAL SYNC: If no local simulation, check if any remote player is on this rope
                        let attachedUser = null;
                        Object.values(users).forEach(u => {
                            if ((u.state & STATE_ROPE) && Math.abs(u.x - anchorX) < 300) {
                                attachedUser = u;
                            }
                        });

                        if (attachedUser) {
                            endX = attachedUser.x + (attachedUser.w / 2);
                            endY = attachedUser.y;
                        } else {
                            endX = anchorX;
                            endY = anchorY + 720;
                        }
                    }
                    if (!isNaN(endX) && !isNaN(endY)) {
                        ctx.save();
                        ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 5; // Darker and thicker for visibility
                        ctx.beginPath(); ctx.moveTo(anchorX, anchorY);
                        ctx.quadraticCurveTo(anchorX + (endX - anchorX) * 0.5, anchorY + (endY - anchorY) * 0.8, endX, endY);
                        ctx.stroke();
                        ctx.fillStyle = '#1b110b';
                        ctx.beginPath(); ctx.arc(endX, endY, 8, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(endX, endY, 8, 0, Math.PI * 2); ctx.fill();
                        ctx.restore();
                    }
                } else if (type === TYPE_GAP_BRIDGE) {
                    // Draw Bridge (Wooden Plank style)
                    ctx.fillStyle = '#5d4037'; // Wood Brown
                    if (ctx.roundRect) {
                        ctx.beginPath(); ctx.roundRect(x - 10, y, w + 20, 15, 4); ctx.fill();
                    } else {
                        ctx.fillRect(x - 10, y, w + 20, 15);
                    }
                    // Plank Details
                    ctx.fillStyle = '#3e2723'; // Darker Brown
                    for (let bx = x; bx < x + w; bx += 20) {
                        ctx.fillRect(bx, y, 2, 15);
                    }
                }
            }
        }

        // 4. Players
        Object.values(users).forEach(player => {
            if (isNaN(player.x) || isNaN(player.y)) return;
            // Player Shadow removed

            const isHanging = (player.state & STATE_ROPE) !== 0;
            if (isHanging) ctx.globalAlpha = 0.5;
            drawStickman(ctx, player.x, player.y, player.state, frameCount, '#000');
            if (isHanging) ctx.globalAlpha = 1.0;

            ctx.font = 'bold 14px "Inter", sans-serif';
            const name = player.name || "Player";
            const widthText = ctx.measureText(name).width + 20;
            const bx = player.x + (player.w / 2) - (widthText / 2);
            const by = player.y - 45;
            ctx.fillStyle = getPlayerColor(player.id);
            if (ctx.roundRect) {
                ctx.beginPath(); ctx.roundRect(bx, by, widthText, 26, 13); ctx.fill();
            } else {
                ctx.fillRect(bx, by, widthText, 26);
            }
            ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1; ctx.stroke();
            ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(name.toUpperCase(), bx + widthText / 2, by + 13);
        });

        ctx.restore();

        drawScreenEffects(ctx, canvas.width, canvas.height);
        renderHUD();
        renderCountdown(ctx, canvas.width, canvas.height, Math.max(0.6, Math.min(1.0, canvas.width / 1200)));
    } catch (err) {
        console.error("Game render error:", err);
    }
};

const renderHUD = () => {
    // ... (Existing HUD code with minor refactor if needed, pasted compressed for brevity)
    if (!ctx) return;
    const hudScale = Math.max(0.6, Math.min(1.0, canvas.width / 1200));
    const boardW = 200 * hudScale;
    const x = canvas.width - boardW - 16 * hudScale;
    const y = 16 * hudScale;
    const sortedPlayers = Object.values(users).sort((a, b) => b.x - a.x);
    const boardH = (44 * hudScale) + (sortedPlayers.length * (32 * hudScale));

    ctx.save();
    /* Shadow Removed */ ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    if (ctx.roundRect) {
        ctx.beginPath(); ctx.roundRect(x, y, boardW, boardH, 4 * hudScale); ctx.fill();
    } else {
        ctx.fillRect(x, y, boardW, boardH);
    }
    /* Shadow Removed */ ctx.fillStyle = '#000';
    if (ctx.roundRect) {
        ctx.beginPath(); ctx.roundRect(x, y, 4 * hudScale, boardH, { tl: 4, bl: 4 }); ctx.fill();
    } else {
        ctx.fillRect(x, y, 4 * hudScale, boardH);
    }
    ctx.fillStyle = '#111'; ctx.font = `900 ${Math.max(10, 14 * hudScale)}px "Inter", sans-serif`;
    ctx.fillText("STANDINGS", x + 16 * hudScale, y + 26 * hudScale);

    sortedPlayers.forEach((p, index) => {
        const rowY = y + (52 * hudScale) + (index * (32 * hudScale));
        if (p.id === myId) { ctx.fillStyle = 'rgba(239, 68, 68, 0.05)'; ctx.fillRect(x + 6, rowY - 22, boardW - 12, 28 * hudScale); }
        ctx.fillStyle = p.id === myId ? '#ef4444' : '#111';
        ctx.font = `${p.id === myId ? '900' : '700'} ${Math.max(9, 12 * hudScale)}px "Inter"`;
        const nameText = p.name.length > 10 ? p.name.substring(0, 8) + '..' : p.name;
        ctx.textAlign = 'left';
        ctx.fillText(`${index + 1}.`, x + 16 * hudScale, rowY);
        ctx.fillText(nameText.toUpperCase(), x + 40 * hudScale, rowY);

        const barW = 60 * hudScale; const barX = x + boardW - barW - 16 * hudScale;
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        if (ctx.roundRect) {
            ctx.beginPath(); ctx.roundRect(barX, rowY - 6, barW, 6, 3); ctx.fill();
        } else {
            ctx.fillRect(barX, rowY - 6, barW, 6);
        }
        const progressLife = Math.min(p.x / MAP_LENGTH, 1);
        ctx.fillStyle = p.id === myId ? '#ef4444' : '#333';
        if (p.finished) ctx.fillStyle = '#ffd700';
        if (ctx.roundRect) {
            ctx.beginPath(); ctx.roundRect(barX, rowY - 6, Math.max(0, barW * progressLife), 6, 3); ctx.fill();
        } else {
            ctx.fillRect(barX, rowY - 6, Math.max(0, barW * progressLife), 6);
        }
    });
    ctx.restore();
};
