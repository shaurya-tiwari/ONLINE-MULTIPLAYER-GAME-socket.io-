import { updatePlayerPhysics, createPlayerState } from './physics';
import { handleCollisions } from './collisions';
import { drawStickman } from './animations';
import { getAsset } from './AssetLoader';
import { getFinishLinePosition } from '../constants/raceLength';

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
let MAP_LENGTH = 5000; // Will be set dynamically

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

    // Reset inputs to prevent auto-running if key was held during reset
    inputs = { right: false, jump: false, slide: false };

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
            if (socketRef && roomCodeRef) {
                socketRef.emit('player_won', {
                    code: roomCodeRef,
                    name: player.name
                });
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
    // Dynamic responsive scaling based on canvas width
    const scale = canvas.width <= 400 ? 0.4 : canvas.width < 640 ? 0.65 : canvas.width < 1024 ? 0.85 : 1.0;

    const boardW = 200 * scale;
    // Shifted to the right side with consistent padding
    const x = canvas.width - boardW - (16 * scale);
    const y = 16 * scale;

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

    // Header Text
    ctx.fillStyle = '#111';
    ctx.font = `black ${14 * scale}px "Inter", sans-serif`;
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

        // Rank and Name
        ctx.textAlign = 'left';
        ctx.fillStyle = p.id === myId ? '#ef4444' : '#111';
        ctx.font = `${p.id === myId ? 'bold' : '500'} ${12 * scale}px "Inter", sans-serif`;

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

