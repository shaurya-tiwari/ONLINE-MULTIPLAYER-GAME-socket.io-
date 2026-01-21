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
    ctx.fillStyle = '#fdfbf7';
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Clear screen

    if (canvas.width === 0 || canvas.height === 0) return;

    ctx.save();

    // Scaling Logic
    const BASE_HEIGHT = 600;
    const scaleFactor = Math.max(0.1, canvas.height / BASE_HEIGHT);
    ctx.scale(scaleFactor, scaleFactor);
    ctx.translate(-cameraX, 0);

    // 2. Ground
    const groundY = 500;

    // Draw Ground Line
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(MAP_LENGTH + 2000, groundY);
    ctx.stroke();

    // Scribble shading
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    // Visible world X range calculation
    const startX = Math.floor(cameraX / 20) * 20;
    const endX = startX + (canvas.width / scaleFactor) + 100;

    for (let x = startX; x < endX; x += 20) {
        if (x > MAP_LENGTH + 2000) break;
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x - 20, 600); // Draw down to base height to cover view
        ctx.stroke();
    }


    // 2.5 Particles
    particles.forEach(p => {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
        if (p.size > 3) {
            ctx.fillStyle = '#000';
            ctx.fill();
        }
    });

    // Finish Line Banner
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    for (let i = 0; i < 20; i++) {
        const x = MAP_LENGTH + (i * 15);
        ctx.strokeRect(x, groundY, 15, 15);
        if (i % 2 === 0) {
            ctx.beginPath();
            ctx.moveTo(x, groundY);
            ctx.lineTo(x + 15, groundY + 15);
            ctx.moveTo(x + 15, groundY);
            ctx.lineTo(x, groundY + 15);
            ctx.stroke();
        }
    }

    // Visual Finish Post
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeRect(MAP_LENGTH, groundY - 300, 10, 300);

    // Flag
    ctx.beginPath();
    ctx.moveTo(MAP_LENGTH - 100, groundY - 300);
    ctx.lineTo(MAP_LENGTH, groundY - 300);
    ctx.lineTo(MAP_LENGTH, groundY - 250);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(MAP_LENGTH - 90, groundY - 290);
    ctx.lineTo(MAP_LENGTH - 10, groundY - 260);
    ctx.stroke();

    ctx.fillStyle = '#000';
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.fillText("FINISH", MAP_LENGTH - 50, groundY - 220);

    // 3. Map Objects
    if (mapData) {
        // Optimize Loop: Only draw visible objects
        // Simple culling can be done if objects are sorted, but for <100 objects generic loop is fine
        // Just checking bounds helps a bit if map is huge

        mapData.trees.forEach((tree, index) => {
            // Culling check
            if (tree.x + tree.w < cameraX || tree.x > cameraX + (canvas.width / scaleFactor)) return;

            const img = getAsset('tree', index);
            if (img) {
                ctx.strokeStyle = '#aaa';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.ellipse(tree.x + tree.w / 2, groundY, tree.w / 2, 10, 0, 0, Math.PI * 2);
                ctx.stroke();

                ctx.drawImage(img, tree.x, tree.y, tree.w, tree.h);
            } else {
                const tx = tree.x;
                const bottomY = groundY;
                const tw = tree.w * 1.5;
                const th = tree.h * 1.5;

                ctx.strokeStyle = '#000';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(tx + tw / 2 - 10, bottomY);
                ctx.lineTo(tx + tw / 2 - 10, bottomY - th / 2);
                ctx.lineTo(tx + tw / 2 + 10, bottomY - th / 2);
                ctx.lineTo(tx + tw / 2 + 10, bottomY);
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(tx + tw / 2, bottomY - th / 2 - 20, 40, 0, Math.PI * 2);
                ctx.arc(tx + tw / 2 - 30, bottomY - th / 2 + 10, 30, 0, Math.PI * 2);
                ctx.arc(tx + tw / 2 + 30, bottomY - th / 2 + 10, 30, 0, Math.PI * 2);
                ctx.stroke();

                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(tx + tw / 2 - 10, bottomY - th / 2 - 10, 10, 0, Math.PI);
                ctx.stroke();
            }
        });

        mapData.obstacles.forEach((obs, index) => {
            if (obs.x + obs.w < cameraX || obs.x > cameraX + (canvas.width / scaleFactor)) return;

            const img = getAsset(obs.type, index);

            if (img) {
                ctx.drawImage(img, obs.x, obs.y, obs.w, obs.h);
            } else {
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 4;
                ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);

                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i < obs.w + obs.h; i += 10) {
                    ctx.moveTo(obs.x + i, obs.y);
                    ctx.lineTo(obs.x + i - 20, obs.y + obs.h);
                }
                ctx.save();
                ctx.rect(obs.x, obs.y, obs.w, obs.h);
                ctx.clip();
                ctx.stroke();
                ctx.restore();
            }
        });
    }

    // 4. Players
    Object.values(users).forEach(player => {
        const color = '#000';

        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const shadowScale = 1 - (groundY - (player.y + player.h)) / 200;
        ctx.ellipse(player.x + player.w / 2, groundY, (player.w / 2) * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
        ctx.stroke();

        drawStickman(ctx, player.x, player.y, player.state, frameCount, color);

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(player.x + player.w / 2 - 40, player.y - 35, 80, 20);

        ctx.fillStyle = '#000';
        ctx.font = '12px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(player.name, player.x + player.w / 2, player.y - 20);
    });

    ctx.restore();

    // 5. HUD - drawn separate from game scale to keep text readable/fixed size if desired, 
    // OR scaled if we want it to shrink.
    // User asked to fix clutter, usually HUD should probably stay roughly same size relative to SCREEN or relative to Game?
    // "production level" usually implies UI scales with screen, but readability is key.
    // Let's keep existing HUD render separate (it draws on top of everything). 
    // BUT we need to check renderHUD to see if it uses absolute pixels. 
    // renderHUD uses (canvas.width - ...) so it adapts to width.
    // We should probably NOT scale the HUD with the game world zoom, but let it adapt to canvas dimensions naturally.
    renderHUD();

    if (users[myId] && users[myId].finished) {
        renderGameOver();
    }
};

const renderGameOver = () => {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const overlayGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, canvas.width / 2);
    overlayGrad.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
    overlayGrad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = overlayGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFF';
    ctx.font = 'black 60px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#3d5afe';
    ctx.shadowBlur = 20;
    ctx.fillText("RACE FINISHED!", cx, cy - 40);

    // Draw Restart Button
    ctx.shadowBlur = 0;
    const btnX = cx - 120;
    const btnY = cy + 20;
    const btnW = 240;
    const btnH = 60;

    const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
    btnGrad.addColorStop(0, '#3d5afe');
    btnGrad.addColorStop(1, '#1a237e');

    ctx.fillStyle = btnGrad;
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 15);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText("RESTART GAME", cx, cy + 58);

    // Subtle pulsing effect for button text
    if (Math.sin(frameCount * 0.1) > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillText("RESTART GAME", cx, cy + 58);
    }
};

const renderHUD = () => {
    // Mini Leaderboard
    const padding = 10;
    const boardW = 150; // Smaller width
    const x = canvas.width - boardW - padding;
    const y = padding;

    // Use a smaller height based on player count, max 80px
    const boardH = Math.min(100, 30 + (Object.keys(users).length * 20));

    ctx.save();
    // Do not scale HUD with game world, keep it screen-space but small

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.roundRect(x, y, boardW, boardH, 8);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px sans-serif'; // Tiny font
    ctx.textAlign = 'left';
    ctx.fillText("LEADERBOARD", x + 10, y + 15);

    const sortedPlayers = Object.values(users).sort((a, b) => b.x - a.x);

    sortedPlayers.forEach((p, index) => {
        const barY = y + 25 + (index * 15);
        if (barY > y + boardH - 10) return; // Clip

        const progress = Math.min(p.x / MAP_LENGTH, 1);

        ctx.fillStyle = '#ddd';
        ctx.font = '9px sans-serif';
        ctx.fillText(p.name.substring(0, 8), x + 10, barY + 6);

        // tiny bar
        ctx.fillStyle = '#444';
        ctx.fillRect(x + 60, barY, 80, 6);

        ctx.fillStyle = p.id === myId ? '#3d5afe' : '#f78166';
        ctx.fillRect(x + 60, barY, 80 * progress, 6);

        if (p.finished) {
            ctx.fillStyle = '#ffd700';
            ctx.fillText("★", x + 142, barY + 6);
        }
    });
    ctx.restore();
};

