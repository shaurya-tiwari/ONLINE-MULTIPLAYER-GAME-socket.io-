export const drawStickman = (ctx, x, y, state, frame, color, facingRight = true) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Base position is top-left of the bounding box (x, y)
    // We want to center the stickman in the box roughly
    const cx = x + 20; // Center X (Width 40 / 2)
    const cy = y + 30; // Center Y (Height 60 / 2) -> actually pivot might be better at hips or feet?
    // Let's draw relative to (cx, y)

    // Head
    ctx.beginPath();
    ctx.arc(cx, y + 10, 8, 0, Math.PI * 2); // Head center at y+10, radius 8
    ctx.stroke();

    // Body
    ctx.beginPath();
    ctx.moveTo(cx, y + 18);
    ctx.lineTo(cx, y + 40); // Torso length 22
    ctx.stroke();

    // Limbs logic
    const t = frame * 0.2; // Time factor for animation speed

    let legL_angle = 0;
    let legR_angle = 0;
    let armL_angle = 0;
    let armR_angle = 0;

    switch (state) {
        case 'run':
            // Running: Sine wave oscillation
            legL_angle = Math.sin(t) * 0.8;
            legR_angle = Math.sin(t + Math.PI) * 0.8;
            armL_angle = Math.sin(t + Math.PI) * 0.8;
            armR_angle = Math.sin(t) * 0.8;
            break;

        case 'jump':
            // Jumping: Legs spread or tucked
            legL_angle = -0.5;
            legR_angle = 0.5;
            armL_angle = -2.5; // Hands up
            armR_angle = 2.5;
            break;

        case 'slide':
            // Sliding: Leaning back, legs forward
            // Head is lower, body is horizontal-ish
            // This is complex with simple lines, but let's try
            // We'll override the rendering slightly below for slide
            break;

        case 'idle':
        default:
            // Breathing
            armL_angle = Math.sin(t * 0.5) * 0.1;
            armR_angle = -Math.sin(t * 0.5) * 0.1;
            break;
    }

    if (state === 'slide') {
        // Special drawing for slide
        // Body leans back
        ctx.beginPath();
        ctx.moveTo(cx, y + 25);
        ctx.lineTo(cx - 15, y + 35); // Leaning body
        ctx.stroke();

        // Head lower
        ctx.beginPath();
        ctx.arc(cx - 20, y + 25, 8, 0, Math.PI * 2);
        ctx.stroke();

        // Legs forward
        ctx.beginPath();
        ctx.moveTo(cx - 15, y + 35);
        ctx.lineTo(cx + 15, y + 50);
        ctx.stroke();

    } else {
        // Normal limb drawing
        const hipY = y + 40;
        const shoulderY = y + 22;

        // Legs
        drawLimb(ctx, cx, hipY, legL_angle, 15);
        drawLimb(ctx, cx, hipY, legR_angle, 15);

        // Arms
        drawLimb(ctx, cx, shoulderY, armL_angle, 12);
        drawLimb(ctx, cx, shoulderY, armR_angle, 12);
    }

    ctx.restore();
};

const drawLimb = (ctx, x, y, angle, length) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.sin(angle) * length, y + Math.cos(angle) * length);
    ctx.stroke();
};
