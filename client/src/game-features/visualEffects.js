/**
 * Visual Effects: Dust and Speed Lines
 * Adds polish particles and motion effects
 */

let particles = [];
let speedLines = [];
let targetZoom = 1.0;
let currentZoom = 1.0;

/**
 * Create a dust puff effect
 * @param {number} x - World X pos
 * @param {number} y - World Y pos (ground)
 * @param {number} count - Number of particles
 */
export const createDustPuff = (x, y, count = 5) => {
    for (let i = 0; i < count; i++) {
        particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 4 - 2,
            vy: -Math.random() * 2,
            life: 1.0,
            size: Math.random() * 6 + 2,
            decay: 0.02 + Math.random() * 0.02
        });
    }
};

/**
 * Create a specialized "Run Dust" particle (smaller, faster)
 */
export const createRunDust = (x, y) => {
    particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y,
        vx: -3 - Math.random() * 2,
        vy: -Math.random() * 1,
        life: 0.6,
        size: Math.random() * 4 + 1,
        decay: 0.04
    });
};

/**
 * Update logic for speed lines and particles
 */
export const updateVisualEffects = (playerSpeed, isSprinting) => {
    // 1. Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) particles.splice(i, 1);
    }

    // 2. Clear/Update Speed Lines
    speedLines = [];
    if (isSprinting && playerSpeed > 2) {
        for (let i = 0; i < 15; i++) {
            speedLines.push({
                x: Math.random() * 1200, // Screen relative
                y: Math.random() * 600,
                len: Math.random() * 100 + 50,
                opacity: Math.random() * 0.3
            });
        }
    }

    // 3. Update Zoom (Spring interpolation)
    targetZoom = isSprinting ? 0.9 : 1.0; // Zoom out slightly when sprinting to see more
    currentZoom += (targetZoom - currentZoom) * 0.1;

    return { currentZoom };
};

/**
 * Draw effects that exist in World Space (Dust)
 */
export const drawWorldEffects = (ctx) => {
    ctx.save();
    particles.forEach(p => {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = '#bbb';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
};

/**
 * Draw effects that exist in Screen Space (Speed Lines)
 */
export const drawScreenEffects = (ctx, canvasWidth, canvasHeight) => {
    if (speedLines.length === 0) return;

    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 2;
    speedLines.forEach(line => {
        const x = (line.x / 1200) * canvasWidth;
        const y = (line.y / 600) * canvasHeight;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + line.len, y);
        ctx.stroke();
    });
    ctx.restore();
};
