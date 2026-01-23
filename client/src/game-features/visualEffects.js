/**
 * Visual Effects: Dust and Speed Lines
 * Adds polish particles and motion effects with Object Pooling for Performance
 */

// --- 1. Object Pooling System ---
const MAX_PARTICLES = 100;
const MAX_SPEED_LINES = 30;

// Pre-allocate pools to prevent GC churn (Crirical for stability)
const particlePool = Array.from({ length: MAX_PARTICLES }, () => ({
    active: false,
    x: 0, y: 0, vx: 0, vy: 0,
    life: 0, size: 0, decay: 0
}));

const speedLinePool = Array.from({ length: MAX_SPEED_LINES }, () => ({
    active: false,
    x: 0, y: 0, len: 0, opacity: 0
}));

let targetZoom = 1.0;
let currentZoom = 1.0;

/**
 * Get an inactive particle from the pool
 */
const getParticle = () => {
    return particlePool.find(p => !p.active);
};

/**
 * Get an inactive speed line from the pool
 */
const getSpeedLine = () => {
    return speedLinePool.find(l => !l.active);
};

/**
 * Create a dust puff effect (Uses Pooling)
 */
export const createDustPuff = (x, y, count = 5) => {
    let created = 0;
    for (let i = 0; i < particlePool.length && created < count; i++) {
        const p = particlePool[i];
        if (!p.active) {
            p.active = true;
            p.x = x;
            p.y = y;
            p.vx = (Math.random() - 0.5) * 4 - 2;
            p.vy = -Math.random() * 2;
            p.life = 1.0;
            p.size = Math.random() * 6 + 2;
            p.decay = 0.02 + Math.random() * 0.02;
            created++;
        }
    }
};

/**
 * Create a specialized "Run Dust" particle (Uses Pooling)
 */
export const createRunDust = (x, y) => {
    const p = getParticle();
    if (p) {
        p.active = true;
        p.x = x + (Math.random() - 0.5) * 20;
        p.y = y;
        p.vx = -3 - Math.random() * 2;
        p.vy = -Math.random() * 1;
        p.life = 0.6;
        p.size = Math.random() * 4 + 1;
        p.decay = 0.04;
    }
};

/**
 * Update logic for effects (No new allocations)
 */
export const updateVisualEffects = (playerSpeed, isSprinting) => {
    // 1. Update Particles
    for (const p of particlePool) {
        if (!p.active) continue;

        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) p.active = false;
    }

    // 2. Speed Lines Removed (User Request)
    speedLinePool.forEach(l => l.active = false);

    /* 
    if (isSprinting && playerSpeed > 2) {
        ... removed ...
    }
    */

    // 3. Update Zoom
    targetZoom = isSprinting ? 0.85 : 1.0;
    currentZoom += (targetZoom - currentZoom) * 0.1;

    return { currentZoom };
};

/**
 * Draw World Space Effects (Dust)
 */
export const drawWorldEffects = (ctx) => {
    ctx.save();
    particlePool.forEach(p => {
        if (!p.active) return;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = '#bbb';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
};

/**
 * Draw Screen Space Effects (Speed Lines)
 */
export const drawScreenEffects = (ctx, canvasWidth, canvasHeight) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 2;
    speedLinePool.forEach(line => {
        if (!line.active) return;
        const x = (line.x / 1200) * canvasWidth;
        const y = (line.y / 600) * canvasHeight;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + line.len, y);
        ctx.stroke();
    });
    ctx.restore();
};
