// wheel.js - Main JavaScript for the Wheel of Fortune game

// --- DOM Element Initialization ---
const fortuneWheelCanvas = document.getElementById('fortuneWheelCanvas');
const ctx = fortuneWheelCanvas ? fortuneWheelCanvas.getContext('2d') : null;
const spinWheelButton = document.getElementById('spinWheelButton');
const wheelCooldownDisplay = document.getElementById('wheelCooldownDisplay'); // Timer
const wheelResultDisplay = document.getElementById('wheelResultDisplay');
const topUpBalanceLink = document.getElementById('topUpBalanceLink');

// --- Game State Variables ---
// Important: COOLDOWN_DURATION_MS is set to 60 seconds for easy testing.
// For production, you might want to increase it to 60 * 60 * 1000 (60 minutes).
const COOLDOWN_DURATION_MS = 60 * 60 * 1000; // 60 min cooldown (for quick testing)
let lastSpinTime = localStorage.getItem(`lastSpinTime_fortune_${CASINO_ID}`) ? parseInt(localStorage.getItem(`lastSpinTime_fortune_${CASINO_ID}`)) : 0;
let wheelAnimationFrameId = null;
let isSpinning = false;

// Wheel Segments
const wheelSegments = [
    { value: 100, color: '#FF6347', probability: 0.30},
    { value: 200, color: '#FFD700', probability: 0.25 },
    { value: 300, color: '#6A5ACD', probability: 0.20 },
    { value: 500, color: '#32CD32', probability: 0.13 },
    { value: 1000, color: '#1E90FF', probability: 0.07 },
    { value: 2000, color: '#DA70D6', probability: 0.05 },
];

const totalProbability = wheelSegments.reduce((sum, seg) => sum + seg.probability, 0);
if (Math.abs(totalProbability - 1) > 0.001) {
    console.warn("Sum of segment probabilities is not 1. Normalizing...");
    wheelSegments.forEach(seg => seg.probability /= totalProbability);
}
const segmentAngle = (2 * Math.PI) / wheelSegments.length;

// --- Sound Effects ---
const spinSound = new Audio('../Music/Roulette.mp3');
const winSound = new Audio('../Music/Win.mp3');
const loseSound = new Audio('../Music/Lose.mp3');

spinSound.volume = 0.6;
winSound.volume = 0.8;
loseSound.volume = 0.8;

spinSound.load();
winSound.load();
loseSound.load();


// --- Drawing Functions ---

function drawWheel(rotationAngle = 0) {
    // Check if canvas context is available before drawing
    if (!ctx) {
        console.error("Canvas context is not available for drawing.");
        return;
    }

    ctx.clearRect(0, 0, fortuneWheelCanvas.width, fortuneWheelCanvas.height);
    const centerX = fortuneWheelCanvas.width / 2;
    const centerY = fortuneWheelCanvas.height / 2;
    const radius = fortuneWheelCanvas.width / 2 - 5; // Small offset from canvas edge

    ctx.save(); // Save the current context state
    ctx.translate(centerX, centerY); // Move origin to canvas center
    ctx.rotate(rotationAngle); // Apply rotation

    wheelSegments.forEach((segment, index) => {
        const startAngle = index * segmentAngle;
        const endAngle = (index + 1) * segmentAngle;

        ctx.beginPath();
        ctx.moveTo(0, 0); // Start from center
        ctx.arc(0, 0, radius, startAngle, endAngle); // Draw arc
        ctx.closePath(); // Close path to center

        ctx.fillStyle = segment.color;
        ctx.fill(); // Fill segment with color
        ctx.strokeStyle = '#333'; // Stroke color
        ctx.lineWidth = 2; // Stroke width
        ctx.stroke(); // Draw stroke

        // Draw text (value)
        ctx.save(); // Save state for text
        ctx.rotate(startAngle + segmentAngle / 2); // Rotate to position text in segment center
        ctx.textAlign = 'right'; // Text alignment
        ctx.fillStyle = '#fff'; // Text color
        ctx.font = 'bold 32px Arial'; // Text font
        ctx.fillText(`$${segment.value}`, radius - 50, 0); // Draw text
        ctx.restore(); // Restore state after drawing text
    });

    ctx.restore(); // Restore context state after drawing the wheel

    // Draw pointer (arrow) - it should not rotate with the wheel
    ctx.save(); // Save state for pointer
    const pointerWidth = 20;
    const pointerHeight = 35;
    ctx.translate(centerX, centerY - radius - 10); // Position pointer above the wheel
    ctx.beginPath();
    ctx.moveTo(0, pointerHeight); // Bottom point of the pointer
    ctx.lineTo(-pointerWidth / 2, 0); // Left top point
    ctx.lineTo(pointerWidth / 2, 0); // Right top point
    ctx.closePath();
    ctx.fillStyle = '#FFD700'; // Fill color
    ctx.fill();
    ctx.strokeStyle = '#B8860B'; // Stroke color
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore(); // Restore context state after drawing the pointer
}

// --- Game Logic ---

function getWeightedRandomSegment() {
    let randomNumber = Math.random();
    let cumulativeProbability = 0;

    for (let i = 0; i < wheelSegments.length; i++) {
        cumulativeProbability += wheelSegments[i].probability;
        if (randomNumber <= cumulativeProbability) {
            return i;
        }
    }
    return wheelSegments.length - 1; // Return the last segment as a fallback
}

function spinWheel() {
    if (isSpinning) {
        console.log("Wheel is already spinning.");
        return;
    }
    // Cooldown check (if button is disabled, cooldown is active)
    if (spinWheelButton.disabled) {
        updateWheelCooldownDisplay(); // Update timer just in case
        console.log("Spin button is disabled due to cooldown or other reasons.");
        return;
    }

    // Check balance before spinning
    if (typeof playerBalance === 'undefined' || playerBalance < 0) {
        wheelResultDisplay.textContent = 'Insufficient funds! Top up your balance.'; // Translated
        wheelResultDisplay.style.color = 'red';
        return;
    }

    wheelResultDisplay.textContent = ''; // Clear previous result

    // --- ИСПРАВЛЕНИЕ: Перемещено сохранение lastSpinTime сюда ---
    lastSpinTime = Date.now(); // Record last spin time IMMEDIATELY
    localStorage.setItem(`lastSpinTime_fortune_${CASINO_ID}`, lastSpinTime);
    updateWheelCooldownDisplay(); // Update cooldown display IMMEDIATELY
    // --- Конец ИСПРАВЛЕНИЯ ---

    const playPromise = spinSound.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.warn("Audio playback prevented:", error);
        });
    }

    isSpinning = true;
    spinWheelButton.disabled = true; // Disable button immediately when spin starts

    const targetSegmentIndex = getWeightedRandomSegment();
    const targetSegment = wheelSegments[targetSegmentIndex];
    console.log("Target segment selected:", targetSegment.value, "at index", targetSegmentIndex);

    // --- Important Change: Balance is updated and saved immediately ---
    // This ensures the winnings are not lost even if the user closes the page
    // during the animation or before it completes.
    if (typeof playerBalance !== 'undefined' &&
        typeof saveBalance === 'function' &&
        typeof updateBalanceDisplay === 'function') {

        playerBalance = parseFloat((playerBalance + targetSegment.value).toFixed(2)); // Add winnings to balance
        saveBalance(); // Save new balance to localStorage

        // Visual update on the page will only happen after the animation.
        // But the balance in localStorage is already up-to-date!
        console.log("Balance in localStorage updated by wheel.js immediately after win determination to:", playerBalance.toFixed(2));

    } else {
        console.error("Global balance functions from promo.js are unavailable. Balance update failed!"); // Translated
        // Fallback: If promo.js is somehow not loaded, try to update directly
        if (typeof CASINO_ID !== 'undefined') {
            const balanceKey = `playerBalance_${CASINO_ID}`;
            let currentBalance = parseFloat(localStorage.getItem(balanceKey)) || 0;
            currentBalance = parseFloat((currentBalance + targetSegment.value).toFixed(2));
            localStorage.setItem(balanceKey, currentBalance.toFixed(2));
            console.warn("Fallback: Balance updated directly in localStorage."); // Translated
        }
    }
    // --- End of important changes ---

    const duration = 5000; // Animation duration in milliseconds
    let startTime = null;
    let currentRotation = 0;

    const segmentCenterAngle = (3 * Math.PI / 2) - (targetSegmentIndex * segmentAngle + segmentAngle / 2);
    let angleToStop = (segmentCenterAngle + 2 * Math.PI) % (2 * Math.PI);

    const extraRotations = 5; // Number of full extra rotations for effect
    const finalTargetRotation = angleToStop + (extraRotations * 2 * Math.PI);
    console.log("Final target rotation (radians):", finalTargetRotation.toFixed(2));

    function animateWheel(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutProgress = 1 - Math.pow(1 - progress, 3);

        currentRotation = easeOutProgress * finalTargetRotation;

        drawWheel(currentRotation);

        if (elapsed < duration) {
            wheelAnimationFrameId = requestAnimationFrame(animateWheel);
        } else {
            // Animation finished
            cancelAnimationFrame(wheelAnimationFrameId);
            spinSound.pause();
            spinSound.currentTime = 0;

            drawWheel(finalTargetRotation);

            // --- Визуальное обновление баланса на странице после анимации ---
            if (typeof updateBalanceDisplay === 'function') {
                updateBalanceDisplay();
                console.log("Visual balance update on page after animation.");
            } else {
                console.error("updateBalanceDisplay function from promo.js is unavailable for visual update.");
            }

            wheelResultDisplay.textContent = `Congratulations! You won $${targetSegment.value}!`;
            wheelResultDisplay.style.color = '#00FF00';

            const winPlayPromise = winSound.play();
            if (winPlayPromise !== undefined) {
                winPlayPromise.catch(error => console.warn("Win sound playback prevented:", error));
            }

            // --- УДАЛЕНО: Эти строки перемещены в начало spinWheel() ---
            // lastSpinTime = Date.now();
            // localStorage.setItem(`lastSpinTime_fortune_${CASINO_ID}`, lastSpinTime);
            // updateWheelCooldownDisplay();
            // --- Конец УДАЛЕНО ---

            isSpinning = false;
            spinWheelButton.disabled = false;
            console.log("Spin finished, button enabled.");
        }
    }
    wheelAnimationFrameId = requestAnimationFrame(animateWheel);
    console.log("Animation started.");
}

// --- Functions related to game logic and timer ---

function updateWheelCooldownDisplay() {
    const savedLastSpinTime = localStorage.getItem(`lastSpinTime_fortune_${CASINO_ID}`);
    lastSpinTime = savedLastSpinTime ? parseInt(savedLastSpinTime) : 0;

    const currentTime = Date.now();
    const timeElapsed = currentTime - lastSpinTime;
    const timeLeft = COOLDOWN_DURATION_MS - timeElapsed;

    if (timeLeft <= 0) {
        wheelCooldownDisplay.textContent = 'Ready to spin!'; // Translated
        wheelCooldownDisplay.style.color = '#00FF00';
        spinWheelButton.disabled = false;
    } else {
        spinWheelButton.disabled = true;
        const minutes = Math.floor(timeLeft / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        wheelCooldownDisplay.textContent = `Next spin in: ${minutes}m ${seconds}s`; // Translated
        wheelCooldownDisplay.style.color = '#FFD700';

        // Update the timer every second until it expires
        if (timeLeft > 1000) {
            setTimeout(updateWheelCooldownDisplay, 1000);
        } else {
            // If less than a second remains, update faster to show "0m 0s"
            setTimeout(updateWheelCooldownDisplay, timeLeft);
        }
    }
}


// --- Event Listeners ---
spinWheelButton.addEventListener('click', spinWheel);


// --- Initial Setup on Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM content loaded. Initializing Wheel of Fortune."); // Translated
    // Ensure canvas and its context are available
    if (!fortuneWheelCanvas) {
        console.error("Canvas element with ID 'fortuneWheelCanvas' not found!"); // Translated
        // If canvas is not found, no point in continuing initialization
        spinWheelButton.disabled = true; // Disable button
        return;
    }
    if (!ctx) {
        console.error("2D rendering context for canvas is unavailable!"); // Translated
        spinWheelButton.disabled = true; // Disable button
        return;
    }

    // Check that global variables and functions from promo.js are available
    if (typeof CASINO_ID === 'undefined' || typeof playerBalance === 'undefined' ||
        typeof loadBalance !== 'function' || typeof updateBalanceDisplay !== 'function' || typeof saveBalance !== 'function') {
        console.error("ERROR: Global variables or functions from promo.js not found. Ensure promo.js is loaded BEFORE wheel.js."); // Translated
        spinWheelButton.disabled = true; // Disable button to prevent errors
        return;
    }

    loadBalance(); // Load balance via promo.js
    console.log("loadBalance() from promo.js called by wheel.js."); // Translated

    drawWheel(0); // Initialize wheel drawing (without initial rotation)
    console.log("Wheel drawn with initial angle."); // Translated

    // Update balance display using promo.js function
    updateBalanceDisplay();
    console.log("Initial balance display updated by promo.js function."); // Translated

    updateWheelCooldownDisplay(); // Update cooldown display
    wheelResultDisplay.textContent = ''; // Clear result text on game page load
    console.log("Wheel of Fortune initialization complete."); // Translated
});


// --- Functions for controlling game state on page visibility change ---
function pauseGameLogic() {
    if (wheelAnimationFrameId) {
        cancelAnimationFrame(wheelAnimationFrameId); // Stop animation
        wheelAnimationFrameId = null;
    }
    if (spinSound) {
        spinSound.pause();
        spinSound.currentTime = 0;
    }
    // Balance is already saved in localStorage when spin starts.
    console.log("Wheel game logic paused."); // Translated
}

function resumeGameLogic() {
    if (!document.hidden) { // Only if the page actually became visible
        updateWheelCooldownDisplay();
        // When returning to the page, updateBalanceDisplay() is already called in DOMContentLoaded,
        // so it's not strictly necessary here, but can be called if we want the balance to update immediately
        // upon returning (instead of waiting for DOMContentLoaded).
        if (typeof updateBalanceDisplay === 'function') {
            updateBalanceDisplay();
        }
        if (!isSpinning) { // If no active spin, enable buttons
            spinWheelButton.disabled = false;
        }
    }
    console.log("Wheel game logic resumed."); // Translated
}

// Event listener for page visibility changes (important for stopping animations and sounds)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        pauseGameLogic();
    } else {
        resumeGameLogic();
    }
});
