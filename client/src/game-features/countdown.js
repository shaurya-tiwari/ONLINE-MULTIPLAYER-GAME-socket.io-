/**
 * Race Countdown Feature
 * Logic and Rendering for 3...2...1...GO!
 */

let countdownValue = 3;
let timer = 0;
let isActive = false;
let isFinished = false;
let displayLabel = "";
let showGo = false;
let goTimer = 0;

/**
 * Reset and start the countdown
 */
export const startCountdown = () => {
    countdownValue = 3;
    timer = 60; // 60 frames = approx 1 second
    isActive = true;
    isFinished = false;
    displayLabel = "3";
    showGo = false;
    goTimer = 0;
};

/**
 * Logic update for countdown
 * @returns {boolean} - Returns true if the race is allowed to start (countdown is "GO!")
 */
export const updateCountdown = (onGoTrigger) => {
    if (!isActive) return true;

    timer--;
    if (timer <= 0) {
        countdownValue--;
        if (countdownValue > 0) {
            displayLabel = countdownValue.toString();
            timer = 60;
        } else if (countdownValue === 0) {
            displayLabel = "GO!";
            isActive = false;
            isFinished = true;
            showGo = true;
            goTimer = 90; // Show GO! for 1.5 seconds
            if (onGoTrigger) onGoTrigger();
        }
    }

    return isFinished;
};

/**
 * Render the countdown overlay
 */
export const renderCountdown = (ctx, canvasWidth, canvasHeight, hudScale) => {
    if (!isActive && !showGo) return;

    if (showGo) {
        goTimer--;
        if (goTimer <= 0) showGo = false;
    }

    const cx = canvasWidth / 2;
    const cy = canvasHeight / 2;

    ctx.save();

    // Animate scale based on timer falloff for "pop" effect
    // timer goes from 60 to 0
    const progress = isActive ? (timer / 60) : (goTimer / 90);
    const pulse = 1 + Math.sin(progress * Math.PI) * 0.5;
    const scale = hudScale * pulse;

    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // Modern Sketch Style Font
    ctx.font = '900 120px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillText(displayLabel, 8, 8);

    // Fill
    ctx.fillStyle = displayLabel === "GO!" ? "#ef4444" : "#000";
    ctx.fillText(displayLabel, 0, 0);

    ctx.restore();
};

export const isRaceLocked = () => {
    return isActive;
};
