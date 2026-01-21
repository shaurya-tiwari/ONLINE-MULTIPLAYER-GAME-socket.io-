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

    // 1. Sky & Background (Production Gradient)
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);

    skyGradient.addColorStop(0.5, '#ffffffff'); // Sunset red

    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-cameraX, 0);

    // 2. Ground Polish
    const groundY = 500;
    ctx.fillStyle = '#2a5301ff'; // Darker grass
    ctx.fillRect(0, groundY, MAP_LENGTH + 2000, canvas.height - groundY);


    // 2.5 Particles
    particles.forEach(p => {
        ctx.fillStyle = `rgba(200, 200, 200, ${p.life})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Finish Line Banner
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 20; i++) {
        if (i % 2 === 0) ctx.fillRect(MAP_LENGTH, groundY, 15, 15);
        else ctx.fillRect(MAP_LENGTH + 15, groundY, 15, 15);
    }

    // Visual Finish Post
    ctx.fillStyle = '#444';
    ctx.fillRect(MAP_LENGTH, groundY - 300, 10, 300);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(MAP_LENGTH - 100, groundY - 300, 100, 50);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.fillText("FINISH", MAP_LENGTH - 50, groundY - 265);

    // 3. Map Objects
    if (mapData) {
        mapData.trees.forEach((tree, index) => {
            const img = getAsset('tree', index);
            if (img) {
                // Ground Shadow
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.beginPath();
                ctx.ellipse(tree.x + tree.w / 2, groundY, tree.w / 2, 10, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.drawImage(img, tree.x, tree.y, tree.w, tree.h);
            } else {
                ctx.fillStyle = '#5d4037'; // Trunk
                ctx.fillRect(tree.x + tree.w / 2 - 10, tree.y + tree.h / 2, 20, tree.h / 2);
                ctx.fillStyle = '#2e7d32'; // Leaves
                ctx.beginPath();
                ctx.moveTo(tree.x, tree.y + tree.h / 2);
                ctx.lineTo(tree.x + tree.w / 2, tree.y);
                ctx.lineTo(tree.x + tree.w, tree.y + tree.h / 2);
                ctx.fill();
            }
        });

        mapData.obstacles.forEach((obs, index) => {
            const img = getAsset(obs.type, index);

            // Obstacle Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.ellipse(obs.x + obs.w / 2, groundY, obs.w / 2, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            if (img) {
                ctx.drawImage(img, obs.x, obs.y, obs.w, obs.h);
            } else {
                ctx.fillStyle = '#e53935';
                ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 4;
                ctx.strokeRect(obs.x + 5, obs.y + 5, obs.w - 10, obs.h - 10);
            }
        });
    }

    // 4. Players
    Object.values(users).forEach(player => {
        const color = player.id === myId ? '#3d5afe' : '#ff9100';

        // Player Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        const shadowScale = 1 - (groundY - (player.y + player.h)) / 200; // Shrink as jump
        ctx.ellipse(player.x + player.w / 2, groundY, (player.w / 2) * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dust for running
        if (player.state === 'run' && frameCount % 5 === 0) {
            createDust(player.x, groundY);
        }

        drawStickman(ctx, player.x, player.y, player.state, frameCount, color);

        // Name tag with glow
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillText(player.name, player.x + player.w / 2, player.y - 15);
        ctx.shadowBlur = 0;
    });

    ctx.restore();

    // 5. HUD
    renderHUD();

    // Finished Message Polish
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
    const padding = 20;
    const boardW = 220;
    const x = canvas.width - boardW - padding;
    const y = padding;

    ctx.fillStyle = 'rgba(13, 17, 23, 0.8)'; // GitHub style dark
    ctx.beginPath();
    ctx.roundRect(x, y, boardW, 110, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.stroke();

    ctx.fillStyle = '#58a6ff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText("LEADERBOARD", x + 15, y + 28);

    const sortedPlayers = Object.values(users).sort((a, b) => b.x - a.x);

    sortedPlayers.forEach((p, index) => {
        const barY = y + 45 + (index * 28);
        const progress = Math.min(p.x / MAP_LENGTH, 1);

        ctx.fillStyle = '#c9d1d9';
        ctx.font = '12px sans-serif';
        ctx.fillText(p.name.substring(0, 10), x + 15, barY + 12);

        // Bar Track
        ctx.fillStyle = '#21262d';
        ctx.fillRect(x + 90, barY, 100, 12);

        // Bar Fill
        const barGrad = ctx.createLinearGradient(x + 90, 0, x + 190, 0);
        if (p.id === myId) {
            barGrad.addColorStop(0, '#388bfd');
            barGrad.addColorStop(1, '#79c0ff');
        } else {
            barGrad.addColorStop(0, '#f78166');
            barGrad.addColorStop(1, '#ffa657');
        }
        ctx.fillStyle = barGrad;
        ctx.fillRect(x + 90, barY, 100 * progress, 12);

        if (p.finished) {
            ctx.fillStyle = '#f2cc60';
            ctx.fillText("🏆", x + 195, barY + 12);
        }
    });
};

