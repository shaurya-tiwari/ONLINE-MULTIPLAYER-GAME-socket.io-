import { updatePlayerPhysics, createPlayerState } from './physics';
import { handleCollisions } from './collisions';
import { drawStickman } from './animations';
import { getAsset } from './AssetLoader';

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
let socketRef;
let roomCodeRef;
let frameCount = 0;
let onGameOverCallback;

const MAP_LENGTH = 5000; // As defined in generator

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

export const startGameLoop = (canvasElem, socket, playerId, players, gameMap, roomCode, onGameOver) => {
    canvas = canvasElem;
    ctx = canvas.getContext('2d');
    myId = playerId;
    mapData = gameMap;
    socketRef = socket;
    roomCodeRef = roomCode;
    frameCount = 0;
    onGameOverCallback = onGameOver;

    users = {};
    Object.values(players).forEach(p => {
        users[p.id] = createPlayerState(p.id, p.name);
    });

    socket.on('player_updated', (remotePlayer) => {
        if (remotePlayer.id !== myId) {
            if (!users[remotePlayer.id]) {
                users[remotePlayer.id] = createPlayerState(remotePlayer.id, remotePlayer.name);
            }
            users[remotePlayer.id].x = remotePlayer.x;
            users[remotePlayer.id].y = remotePlayer.y;
            users[remotePlayer.id].w = remotePlayer.w;
            users[remotePlayer.id].h = remotePlayer.h;
            users[remotePlayer.id].state = remotePlayer.state;
            // Also sync progress/status if we added it
        }
    });

    cameraX = 0;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Click handler for Restart Button
    const handleClick = (e) => {
        if (!users[myId] || !users[myId].finished) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // Button Bounds (defined in renderGameOver)
        // x: cx - 120, y: cy + 20, w: 240, h: 60
        if (x >= cx - 120 && x <= cx + 120 && y >= cy + 20 && y <= cy + 80) {
            // Clicked Restart
            if (socketRef && roomCodeRef) {
                socketRef.emit('restart_game', { code: roomCodeRef });
            }
        }
    };
    canvas.addEventListener('click', handleClick);
    // Also touch for mobile
    canvas.addEventListener('touchstart', (e) => {
        // Simple touch handler mapping to click logic
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            handleClick({ clientX: touch.clientX, clientY: touch.clientY });
        }
    });

    const loop = () => {
        update();
        render();
        frameCount++;
        animationFrameId = requestAnimationFrame(loop);
    };

    loop();
};

export const stopGameLoop = () => {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    if (socketRef) {
        socketRef.off('player_updated');
    }
};

const update = () => {
    if (!users[myId]) return;

    const player = users[myId];

    // Check Finish
    if (player.x >= MAP_LENGTH) {
        player.state = 'idle'; // Stop moving
        if (!player.finished) {
            player.finished = true;
            if (typeof onGameOver === 'function') {
                onGameOver();
            }
        }
    } else {
        updatePlayerPhysics(player, inputs);
    }

    if (mapData && mapData.obstacles) {
        handleCollisions(player, mapData.obstacles);
    }

    if (socketRef && roomCodeRef) {
        socketRef.emit('player_update', {
            code: roomCodeRef,
            playerState: {
                id: player.id,
                name: player.name,
                x: player.x,
                y: player.y,
                w: player.w,
                h: player.h,
                state: player.state,
                finished: player.finished
            }
        });
    }

    cameraX = player.x - 100;
    if (cameraX < 0) cameraX = 0;
};

// Particle System State
let particles = [];

const createDust = (x, y) => {
    for (let i = 0; i < 3; i++) {
        particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 2 - 2, // Puff backwards
            vy: (Math.random() - 0.5) * 1,
            life: 1.0,
            size: Math.random() * 5 + 2
        });
    }
};

const updateParticles = () => {
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
    });
};

const render = () => {
    if (!ctx || !canvas) return;

    updateParticles();

    // 1. Sky & Background
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear

    if (canvas.width === 0 || canvas.height === 0) return;

    ctx.save();

    // Scaling Logic (Corrected: Scale THEN Translate)
    const BASE_HEIGHT = 600;
    const scaleFactor = Math.max(0.1, canvas.height / BASE_HEIGHT);
    ctx.scale(scaleFactor, scaleFactor);
    ctx.translate(-cameraX, 0);

    // 2. Ground
    const groundY = 500;

    // Ground Line with Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#222'; // Darker, cleaner ground
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(MAP_LENGTH + 2000, groundY);
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset

    // Subtle Ground Details (Less scratchy)
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    // Visible world X range calculation
    const startX = Math.floor(cameraX / 50) * 50;
    const endX = startX + (canvas.width / scaleFactor) + 100;

    ctx.beginPath();
    for (let x = startX; x < endX; x += 100) {
        if (x > MAP_LENGTH + 2000) break;
        ctx.moveTo(x, groundY);
        ctx.lineTo(x - 15, groundY + 15); // Simple hash marks
    }
    ctx.stroke();


    // 2.5 Particles
    particles.forEach(p => {
        ctx.globalAlpha = Math.max(0, p.life); // Fade out
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });

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


    // 3. Map Objects
    if (mapData) {
        // Trees
        mapData.trees.forEach((tree, index) => {
            // Culling
            if (tree.x + (tree.w * 2) < cameraX || tree.x > cameraX + (canvas.width / scaleFactor)) return;

            const img = getAsset('tree', index);

            // Fix Tree Alignment: Align bottom of tree to groundY
            // We are scaling trees up (user request), so we calculate visual dimensions first.
            const drawW = tree.w * 2;   // Bigger width
            const drawH = tree.h * 1.5; // Bigger height
            const drawX = tree.x;
            const drawY = groundY - drawH; // Force bottom alignment

            if (img) {
                // Soft shadow for tree
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.beginPath();
                ctx.ellipse(drawX + drawW / 2, groundY, drawW / 3, 8, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.drawImage(img, drawX, drawY, drawW, drawH);
            } else {
                // Fallback Tree
                ctx.fillStyle = '#4caf50';
                ctx.beginPath();
                ctx.moveTo(drawX + drawW / 2, drawY);
                ctx.lineTo(drawX, drawY + drawH);
                ctx.lineTo(drawX + drawW, drawY + drawH);
                ctx.fill();
            }
        });

        // Obstacles
        mapData.obstacles.forEach((obs, index) => {
            if (obs.x + obs.w < cameraX || obs.x > cameraX + (canvas.width / scaleFactor)) return;

            const img = getAsset(obs.type, index);
            // Obstacles are already large from server update (120x120), render as is or slight visual adjustment
            const drawW = obs.w;
            const drawH = obs.h;
            // Align Y? Server sends logical Y.
            // If Air, Y is calculated. If Ground, Y is calculated. 
            // Just trust server Y for obstacles, but maybe add shadow.

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

            // Shadow for obstacles
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.beginPath();
            // Shadow on ground for Air objects too? Yes, accurately projected below
            const shadowY = groundY;
            ctx.ellipse(obs.x + drawW / 2, shadowY, drawW / 2.2, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        });
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

        // Name Tag (Clean Badge Style)
        ctx.font = 'bold 14px "Inter", "Segoe UI", sans-serif';
        const name = player.name || "Player";
        const textMetrics = ctx.measureText(name);
        const textWidth = textMetrics.width;
        const padding = 8;
        const badgeW = textWidth + (padding * 2);
        const badgeH = 24;
        const badgeX = player.x + (player.w / 2) - (badgeW / 2);
        const badgeY = player.y - 40;

        // Badge Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; // Semi-transparent black
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 12); // Round pills
        ctx.fill();

        // Badge Text
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1); // +1 visual center correction
    });

    ctx.restore();

    // 5. HUD - Screen Space
    renderHUD();

    if (users[myId] && users[myId].finished) {
        renderGameOver();
    }
};

const renderGameOver = () => {
    // Backdrop
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(20, 20, 30, 0.9)');
    gradient.addColorStop(1, 'rgba(40, 40, 60, 0.95)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    // Title
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#fff';
    ctx.font = '900 64px "Inter", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("RACE FINISHED", cx, cy - 60);

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Button
    const btnW = 260;
    const btnH = 64;
    const btnX = cx - btnW / 2;
    const btnY = cy + 40;

    // Pulse
    const pulse = Math.sin(frameCount * 0.1) * 3;

    ctx.fillStyle = '#3d5afe'; // Primary Blue
    ctx.beginPath();
    ctx.roundRect(btnX - pulse, btnY - pulse, btnW + pulse * 2, btnH + pulse * 2, 16);
    ctx.fill();

    // Text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px "Inter", sans-serif';
    ctx.fillText("PLAY AGAIN", cx, cy + 82);
};

const renderHUD = () => {
    // Dynamic responsive scaling based on canvas width
    // Extra small for <= 400px screens
    const scale = canvas.width <= 400 ? 0.4 : canvas.width < 640 ? 0.65 : canvas.width < 1024 ? 0.85 : 1.0;

    const padding = 20 * scale;
    const boardW = 220 * scale;
    // Move to Left side, below the "ROOM" badge (approx y=80)
    const x = 20 * scale;
    const y = 80 * scale;

    const sortedPlayers = Object.values(users).sort((a, b) => b.x - a.x);
    const boardH = (50 * scale) + (sortedPlayers.length * (36 * scale));

    ctx.save();

    // Apply "Paper" Style: Rotation and Border
    // We translate to center of board to rotate, then draw
    const cx = x + boardW / 2;
    const cy = y + boardH / 2;

    ctx.translate(cx, cy);
    ctx.rotate(-0.02); // Slight negative rotation like Room Badge (-1 deg approx)
    ctx.translate(-cx, -cy);

    // Background (White glass)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.backdropFilter = 'blur(4px)'; // Note: Canvas doesn't support backdropFilter directly, utilizing fill transparency
    ctx.beginPath();
    // ctx.roundRect(x, y, boardW, boardH, 2); // Less rounded, more paper-like
    ctx.rect(x, y, boardW, boardH);
    ctx.fill();

    // Border (Dashed Black)
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.setLineDash([8, 6]); // Dashed
    ctx.stroke();
    ctx.setLineDash([]); // Reset

    // Header
    ctx.fillStyle = '#000'; // Black text
    ctx.font = `bold ${16 * scale}px "Mono", monospace`; // Mono font to match
    ctx.textAlign = 'left';
    ctx.fillText("LEADERBOARD", x + (16 * scale), y + (26 * scale));

    // Rows
    ctx.font = `600 ${13 * scale}px "Inter", sans-serif`;
    sortedPlayers.forEach((p, index) => {
        const rowY = y + (50 * scale) + (index * (36 * scale));

        // Rank/Name
        ctx.fillStyle = '#000'; // Black text
        const nameStr = p.name.length > 10 ? p.name.substring(0, 9) + '..' : p.name;
        // Highlight self?
        if (p.id === myId) {
            ctx.font = `bold ${13 * scale}px "Inter", sans-serif`;
            ctx.fillText(`> ${index + 1}. ${nameStr}`, x + (12 * scale), rowY);
        } else {
            ctx.font = `600 ${13 * scale}px "Inter", sans-serif`;
            ctx.fillText(`${index + 1}. ${nameStr}`, x + (16 * scale), rowY);
        }

        // Progress Bar Background
        const barW = 80 * scale;
        const barX = x + boardW - barW - (16 * scale);
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        // ctx.roundRect(barX, rowY - 8, barW, 8, 4);
        ctx.rect(barX, rowY - (8 * scale), barW, 8 * scale); // Sharp rects
        ctx.fill();
        // Border for bar
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1 * scale;
        ctx.strokeRect(barX, rowY - (8 * scale), barW, 8 * scale);

        // Progress Fill
        const progress = Math.min(p.x / MAP_LENGTH, 1);
        ctx.fillStyle = p.finished ? '#ffd700' : (p.id === myId ? '#222' : '#ff7043'); // Self is dark, others orange/gold
        ctx.beginPath();
        // Clamped width
        const fillW = Math.max(0, barW * progress);
        ctx.fillRect(barX, rowY - (8 * scale), fillW, 8 * scale);
    });

    ctx.restore();
};

