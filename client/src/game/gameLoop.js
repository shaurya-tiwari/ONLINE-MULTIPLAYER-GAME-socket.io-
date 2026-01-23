import { updatePlayerPhysics, createPlayerState } from './physics';
import { handleCollisions } from './collisions';
import { drawStickman } from './animations';
import { getAsset } from './AssetLoader';
import { getFinishLinePosition } from '../constants/raceLength';

// Juice Features
import { getShakeOffset, triggerShake } from '../game-features/cameraShake';
import { updateVisualEffects, drawWorldEffects, drawScreenEffects, createDustPuff } from '../game-features/visualEffects';
import { startCountdown, updateCountdown, renderCountdown, isRaceLocked } from '../game-features/countdown';
import { isFinalSprint } from '../game-features/playerspeedup';


let animationFrameId;
let ctx;
let canvas;
let myId;
let users;
let mapData;
let cameraX = 0;
let inputs = {
    right: false,
    jump: false,
    slide: false
};

export const clearInputs = () => {
    inputs.right = false;
    inputs.jump = false;
    inputs.slide = false;
};
let socketRef;
let roomCodeRef;
let frameCount = 0;
let onGameOverCallback;
let MAP_LENGTH = 5000; // Will be set dynamically

// Production Networking & Optimization
let lastEmitTime = 0;
const EMIT_RATE = 50; // 20 TPS (Emit every 50ms)
const remotePlayers = {}; // { id: { current: {x,y...}, target: {x,y...}, lastUpdate: timestamp } }

// --- REUSABLE PAYLOAD (Fixes GC Churn) ---
const emitPayload = {
    code: '',
    playerState: {
        id: '', name: '', x: 0, y: 0, w: 0, h: 0, state: '', finished: false
    }
};

// --- DELTA TIME TRACKING ---
let lastFrameTime = performance.now();
let isTabActive = true;
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// --- NAME TAG COLOR PALETTE ---
const NAME_TAG_COLORS = [
    '#ef4444', // Red
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316'  // Orange
];

const getPlayerColor = (id) => {
    if (!id) return NAME_TAG_COLORS[0];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return NAME_TAG_COLORS[Math.abs(hash) % NAME_TAG_COLORS.length];
};

const handleKeyDown = (e) => {
    switch (e.code) {
        case 'ArrowRight':
        case 'KeyD':
            inputs.right = true;
            break;
        case 'Space':
        case 'ArrowUp':
        case 'KeyW':
            inputs.jump = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            inputs.slide = true;
            break;
    }
};

const handleKeyUp = (e) => {
    switch (e.code) {
        case 'ArrowRight':
        case 'KeyD':
            inputs.right = false;
            break;
        case 'Space':
        case 'ArrowUp':
        case 'KeyW':
            inputs.jump = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            inputs.slide = false;
            break;
    }
};

export const startGameLoop = (canvasElem, socket, playerId, players, gameMap, roomCode, onGameOver, raceLengthLabel) => {
    canvas = canvasElem;
    ctx = canvas.getContext('2d');
    myId = playerId;
    mapData = gameMap;
    socketRef = socket;
    roomCodeRef = roomCode;
    frameCount = 0;
    onGameOverCallback = onGameOver;

    // Set dynamic Map Length based on room selection
    MAP_LENGTH = getFinishLinePosition(raceLengthLabel);

    // Reset and start Countdown
    startCountdown();

    // Reset inputs to prevent auto-running if key was held during reset
    clearInputs();

    users = {};
    Object.values(players).forEach(p => {
        users[p.id] = createPlayerState(p.id, p.name);
        // Initialize interpolation buffer
        remotePlayers[p.id] = {
            current: { ...users[p.id] },
            target: { ...users[p.id] },
            lastUpdate: Date.now()
        };
    });

    socket.on('player_updated', (remotePlayer) => {
        if (remotePlayer.id !== myId) {
            if (!users[remotePlayer.id]) {
                users[remotePlayer.id] = createPlayerState(remotePlayer.id, remotePlayer.name);
                remotePlayers[remotePlayer.id] = {
                    current: { ...users[remotePlayer.id] },
                    target: { ...users[remotePlayer.id] },
                    lastUpdate: Date.now()
                };
            }

            // Move current to target (or current is where we are now)
            // Target is the new data
            remotePlayers[remotePlayer.id].target = { ...remotePlayer };
            remotePlayers[remotePlayer.id].lastUpdate = Date.now();
        }
    });

    cameraX = 0;

    // Restore Global Listeners (Crucial for movement)
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Unified Input Handler (Fixes Mobile Latency & Duplicate Listeners)
    const handlePointerDown = (e) => {
        if (!users[myId] || !users[myId].finished) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        if (x >= cx - 120 && x <= cx + 120 && y >= cy + 20 && y <= cy + 80) {
            if (socketRef && roomCodeRef) {
                socketRef.emit('restart_game', { code: roomCodeRef });
            }
        }
    };

    // Save references for cleanup (Fixes Memory Leaks)
    canvas.handlePointerDown = handlePointerDown;
    canvas.addEventListener('pointerdown', handlePointerDown);

    // Visibility Listener (Fixes Network Flooding on Inactive Tabs)
    const handleVisibilityChange = () => {
        isTabActive = !document.hidden;
        if (isTabActive) {
            lastFrameTime = performance.now();
        }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.handleVisibilityChange = handleVisibilityChange;

    const loop = (currentTime) => {
        if (!isTabActive) {
            animationFrameId = requestAnimationFrame(loop);
            return;
        }

        const dt = (currentTime - lastFrameTime) / 1000;
        lastFrameTime = currentTime;

        update(dt);
        render(dt);
        frameCount++;
        animationFrameId = requestAnimationFrame(loop);
    };

    lastFrameTime = performance.now();
    loop(lastFrameTime);
};

export const stopGameLoop = () => {
    cancelAnimationFrame(animationFrameId);

    // Proper Listener Cleanup (Critical Memory Fix)
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);

    if (canvas) {
        canvas.removeEventListener('pointerdown', canvas.handlePointerDown);
    }
    document.removeEventListener('visibilitychange', document.handleVisibilityChange);

    if (socketRef) {
        socketRef.off('player_updated');
    }
};

const update = (dt) => {
    if (!users[myId]) return;

    const player = users[myId];

    // Update Countdown
    updateCountdown(() => {
        triggerShake(15, 20);
        createDustPuff(player.x + player.w / 2, 500, 15);
    });

    if (isRaceLocked()) return;

    // Check Finish
    if (player.x >= MAP_LENGTH) {
        player.state = 'idle';
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
        updatePlayerPhysics(player, inputs, frameCount, MAP_LENGTH);
    }

    if (mapData && mapData.obstacles) {
        handleCollisions(player, mapData.obstacles);
    }

    // --- REUSE OBJECT FOR EMIT (Prevents GC Stutter) ---
    if (socketRef && roomCodeRef) {
        const now = Date.now();
        if (now - lastEmitTime > EMIT_RATE) {
            emitPayload.code = roomCodeRef;
            emitPayload.playerState.id = player.id;
            emitPayload.playerState.name = player.name;
            emitPayload.playerState.x = player.x;
            emitPayload.playerState.y = player.y;
            emitPayload.playerState.w = player.w;
            emitPayload.playerState.h = player.h;
            emitPayload.playerState.state = player.state;
            emitPayload.playerState.finished = player.finished;

            socketRef.emit('player_update', emitPayload);
            lastEmitTime = now;
        }
    }

    cameraX = player.x - 100;
    if (cameraX < 0) cameraX = 0;
};

export const updateRemotePlayers = (dt) => {
    const now = Date.now();

    Object.keys(remotePlayers).forEach(id => {
        if (id === myId) return;
        const data = remotePlayers[id];
        const user = users[id];
        if (!user) return;

        // --- DELTA-TIME INTERPOLATION (Framerate Independent Sync) ---
        // Using exponential smoothing for more reliable catch-up than frame-lerp
        const lerpFactor = 12; // Smoothing speed
        user.x += (data.target.x - user.x) * (1 - Math.exp(-lerpFactor * dt));
        user.y += (data.target.y - user.y) * (1 - Math.exp(-lerpFactor * dt));

        user.state = data.target.state;
        user.finished = data.target.finished;
    });
};


// Redundant local particle system removed - moved to visualEffects.js

const render = (dt) => {
    if (!ctx || !canvas) return;

    // Juice Features Update
    const me = users[myId];
    const progress = me ? me.x / MAP_LENGTH : 0;
    const sprinting = inputs.right || isFinalSprint(progress);
    const { currentZoom } = updateVisualEffects(me?.vx || 0, sprinting);
    const shake = getShakeOffset();

    updateRemotePlayers(dt); // Pass DT for smoothing

    // 1. Sky & Background
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear

    if (canvas.width === 0 || canvas.height === 0) return;

    ctx.save();

    // Scaling Logic (Dual-axis scale + Dynamic Zoom)
    const BASE_HEIGHT = 600;
    const BASE_WIDTH = 1000;
    const scaleFactorHeight = canvas.height / BASE_HEIGHT;
    const scaleFactorWidth = canvas.width / BASE_WIDTH;
    const baseScale = Math.max(0.2, Math.min(scaleFactorHeight, scaleFactorWidth * 1.5));

    // Apply Juice Zoom and Shake
    ctx.scale(baseScale * currentZoom, baseScale * currentZoom);
    ctx.translate(-cameraX + shake.x, shake.y);

    // Render Dust Effects behind objects
    drawWorldEffects(ctx);


    // 2. Ground
    const groundY = 500;

    // --- CONDITIONAL SHADOWS (Fixes Mobile Latency) ---
    if (!isMobile) {
        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        ctx.shadowBlur = 10;
    }

    ctx.strokeStyle = '#222';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(MAP_LENGTH + 2000, groundY);
    ctx.stroke();

    if (!isMobile) ctx.shadowBlur = 0;

    // Subtle Ground Details (Less scratchy)
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    // Visible world X range calculation
    const startX = Math.floor(cameraX / 50) * 50;
    const endX = startX + (canvas.width / (baseScale * currentZoom)) + 100;

    ctx.beginPath();
    for (let x = startX; x < endX; x += 100) {
        if (x > MAP_LENGTH + 2000) break;
        ctx.moveTo(x, groundY);
        ctx.lineTo(x - 15, groundY + 15); // Simple hash marks
    }
    ctx.stroke();


    ctx.stroke();

    // 2.5 Particles Rendered via drawWorldEffects now

    // Finish Line
    ctx.fillStyle = '#222';
    for (let i = 0; i < 4; i++) { // Checkered post
        ctx.fillRect(MAP_LENGTH, groundY - 300 + (i * 75), 10, 37.5);
    }
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#222';
    ctx.strokeRect(MAP_LENGTH, groundY - 300, 10, 300);

    // Flag
    ctx.fillStyle = '#ef5350';
    ctx.beginPath();
    ctx.moveTo(MAP_LENGTH, groundY - 300);
    ctx.lineTo(MAP_LENGTH - 100, groundY - 275);
    ctx.lineTo(MAP_LENGTH, groundY - 250);
    ctx.fill();

    ctx.fillStyle = '#222';
    ctx.font = '900 32px "Inter", "Segoe UI", sans-serif'; // Modern Bold Font
    ctx.fillText("FINISH", MAP_LENGTH + 20, groundY - 150);


    // --- OPTIMIZED CULLING (Binary Search for O(log N) skip) ---
    // Since map data is generated in sorted X order, we can skip hidden objects!
    const findStartIndex = (arr, scrollX) => {
        let low = 0, high = arr.length - 1;
        let result = 0;
        while (low <= high) {
            let mid = Math.floor((low + high) / 2);
            if (arr[mid].x + (arr[mid].w || 150) * 2 < scrollX) {
                result = mid + 1;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return result;
    };

    // 3. Map Objects
    if (mapData) {
        const viewWidth = canvas.width / (baseScale * currentZoom);

        // Trees
        const treeStart = findStartIndex(mapData.trees, cameraX);
        for (let i = treeStart; i < mapData.trees.length; i++) {
            const tree = mapData.trees[i];
            if (tree.x > cameraX + viewWidth) break; // End search early!

            const img = getAsset('tree', i);
            const drawW = tree.w * 2;
            const drawH = tree.h * 1.5;
            const drawX = tree.x;
            const drawY = groundY - drawH;

            if (img) {
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.beginPath();
                ctx.ellipse(drawX + drawW / 2, groundY, drawW / 3, 8, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.drawImage(img, drawX, drawY, drawW, drawH);
            }
        }

        // Obstacles
        const obsStart = findStartIndex(mapData.obstacles, cameraX);
        for (let i = obsStart; i < mapData.obstacles.length; i++) {
            const obs = mapData.obstacles[i];
            if (obs.x > cameraX + viewWidth) break; // End search early!

            const img = getAsset(obs.type, i);
            const drawW = obs.w;
            const drawH = obs.h;

            if (img) {
                ctx.drawImage(img, obs.x, obs.y, drawW, drawH);
            } else {
                ctx.fillStyle = obs.type === 'air' ? '#ef5350' : '#ffa726';
                ctx.beginPath();
                ctx.roundRect(obs.x, obs.y, drawW, drawH, 10);
                ctx.fill();
                ctx.strokeStyle = '#222';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.beginPath();
            ctx.ellipse(obs.x + drawW / 2, groundY, drawW / 2.2, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 4. Players
    Object.values(users).forEach(player => {
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        // Scale shadow based on height (jump)
        const distFromGround = Math.max(0, (groundY - (player.y + player.h)));
        const shadowScale = Math.max(0.5, 1 - distFromGround / 200);

        ctx.ellipse(player.x + player.w / 2, groundY, (player.w / 1.5) * shadowScale, 6 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stickman
        const color = '#000';
        drawStickman(ctx, player.x, player.y, player.state, frameCount, color);

        // Name Tag (Clean Badge Style with Unique Colors)
        ctx.font = 'bold 14px "Inter", "Segoe UI", sans-serif';
        const name = player.name || "Player";
        const textMetrics = ctx.measureText(name);
        const textWidth = textMetrics.width;
        const padding = 10; // Slightly more padding
        const badgeW = textWidth + (padding * 2);
        const badgeH = 26;
        const badgeX = player.x + (player.w / 2) - (badgeW / 2);
        const badgeY = player.y - 45; // Lifted slightly higher

        // Badge Background (Dynamic Color)
        const badgeColor = getPlayerColor(player.id);
        ctx.fillStyle = badgeColor;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 13); // Round pills
        ctx.fill();

        // Subtle Drop Shadow for Badge
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Badge Text
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name.toUpperCase(), badgeX + badgeW / 2, badgeY + badgeH / 2 + 1);
    });

    ctx.restore();

    // 4.5 Screen Space Effects (Speed Lines)
    drawScreenEffects(ctx, canvas.width, canvas.height);

    // 5. HUD - Screen Space
    renderHUD();

    // 5.5 Race Countdown
    renderCountdown(ctx, canvas.width, canvas.height, Math.max(0.6, Math.min(1.0, canvas.width / 1200)));

    // Removed renderGameOver() as we are using React Overlay now
};

const renderGameOver = () => {
    // Elegant Ink Overlay
    ctx.fillStyle = 'rgba(10, 10, 10, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Premium Certificate Style for Game Over
    const cardW = Math.min(canvas.width * 0.8, 500);
    const cardH = 300;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 40;

    ctx.fillStyle = '#fcfcfc';
    ctx.beginPath();
    ctx.roundRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 8);
    ctx.fill();

    // Border
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.stroke();

    ctx.restore();

    // Title
    ctx.fillStyle = '#0a0a0a';
    ctx.font = 'black 48px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("RACE FINISHED", cx, cy - 60);

    // Dynamic marker line
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(cx - 100, cy - 45, 200, 4);

    // Button
    const btnW = 200;
    const btnH = 50;
    const btnX = cx - btnW / 2;
    const btnY = cy + 40;

    // Hover-like scale effect based on frameCount
    const s = 1 + Math.sin(frameCount * 0.1) * 0.02;

    ctx.save();
    ctx.translate(cx, btnY + btnH / 2);
    ctx.scale(s, s);
    ctx.translate(-cx, -(btnY + btnH / 2));

    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 4);
    ctx.fill();

    // Button Text
    ctx.fillStyle = '#fcfcfc';
    ctx.font = 'black 16px "Inter", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText("READY UP", cx, btnY + btnH / 2);

    ctx.restore();
};

const renderHUD = () => {
    // Continuous fluid scaling formula (clamp between 0.6 and 1.0)
    const hudScale = Math.max(0.6, Math.min(1.0, canvas.width / 1200));
    const scale = hudScale;

    const boardW = 200 * scale;
    // Account for safe areas in HUD positioning (Shifted from right)
    const padding = 16 * scale;
    const x = canvas.width - boardW - padding;
    const y = padding;

    const sortedPlayers = Object.values(users).sort((a, b) => b.x - a.x);
    const boardH = (44 * scale) + (sortedPlayers.length * (32 * scale));

    ctx.save();

    // Premium Paper Card Style
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 10 * scale;
    ctx.shadowOffsetY = 4 * scale;

    // Smooth rounded rect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.roundRect(x, y, boardW, boardH, 4 * scale);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Header Accent bar
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.roundRect(x, y, 4 * scale, boardH, { tl: 4 * scale, bl: 4 * scale });
    ctx.fill();

    // Header Text - Min Font Size Clamp
    ctx.fillStyle = '#111';
    const headerFontSize = Math.max(10, 14 * scale);
    ctx.font = `900 ${headerFontSize}px "Inter", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText("STANDINGS", x + (16 * scale), y + (26 * scale));

    // Rows
    sortedPlayers.forEach((p, index) => {
        const rowY = y + (52 * scale) + (index * (32 * scale));

        // Background highlight for self
        if (p.id === myId) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
            ctx.fillRect(x + (6 * scale), rowY - (22 * scale), boardW - (12 * scale), 28 * scale);
        }

        // Rank and Name - Min Font Size Clamp
        ctx.textAlign = 'left';
        ctx.fillStyle = p.id === myId ? '#ef4444' : '#111';
        const nameFontSize = Math.max(9, 12 * scale);
        ctx.font = `${p.id === myId ? '900' : '700'} ${nameFontSize}px "Inter", sans-serif`;

        const rankStr = `${index + 1}.`;
        const nameStr = p.name.length > 10 ? p.name.substring(0, 8) + '..' : p.name;

        ctx.fillText(rankStr, x + (16 * scale), rowY);
        ctx.fillText(nameStr.toUpperCase(), x + (40 * scale), rowY);

        // Progress Pill
        const barW = 60 * scale;
        const barH = 6 * scale;
        const barX = x + boardW - barW - (16 * scale);

        // Track
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.beginPath();
        ctx.roundRect(barX, rowY - (6 * scale), barW, barH, barH / 2);
        ctx.fill();

        // Progress
        const progress = Math.min(p.x / MAP_LENGTH, 1);
        const fillW = Math.max(0, barW * progress);

        const gradient = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
        gradient.addColorStop(0, p.id === myId ? '#ef4444' : '#111');
        gradient.addColorStop(1, p.id === myId ? '#f87171' : '#333');

        ctx.fillStyle = p.finished ? '#ffd700' : gradient;
        ctx.beginPath();
        ctx.roundRect(barX, rowY - (6 * scale), fillW, barH, barH / 2);
        ctx.fill();
    });

    ctx.restore();
};

