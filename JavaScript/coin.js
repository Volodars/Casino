// coin.js - Main JavaScript for the Coin Flip game

// --- Canvas Initialization and Context Setup ---
const canvas = document.getElementById('coinCanvas');
const ctx = canvas.getContext('2d');

// --- Image Assets ---
// Object to store loaded Image objects, keyed by their identifier
const coinImages = {};

// Define paths to your image files.
// IMPORTANT: Replace these placeholder URLs with the actual paths to YOUR image files!
const imagePaths = {
    'heads_img': '../Images/head.png', // Path to your coin heads image
    'tails_img': '../Images/tail.png'  // Path to your coin tails image
};

// Function to preload all images
function preloadImages(paths) {
    const promises = [];
    Object.keys(paths).forEach(key => {
        const img = new Image();
        img.src = paths[key]; // Use the full path from the imagePaths object
        promises.push(new Promise((resolve, reject) => {
            img.onload = () => {
                coinImages[key] = img; // Store the loaded image object
                resolve();
            };
            img.onerror = () => {
                console.error(`Failed to load image: ${paths[key]}. Using fallback.`);
                // Fallback to a basic placeholder on error
                const fallbackImg = new Image();
                fallbackImg.src = `https://placehold.co/100x100/999999/FFFFFF?text=Error`;
                fallbackImg.onload = () => {
                    coinImages[key] = fallbackImg;
                    resolve();
                };
                fallbackImg.onerror = () => reject(`Failed to load fallback for ${paths[key]}`);
            };
        }));
    });
    return Promise.all(promises); // Returns a promise that resolves when all images are loaded
}

// --- Game State Variables ---
// playerBalance is now managed globally by promo.js. Ensure promo.js is loaded FIRST in HTML.
let currentBet = 100;    // Current bet amount
let isFlipping = false;  // Flag to prevent multiple flips at once
let animationFrameId = null; // Stores the requestAnimationFrame ID for stopping animation

// --- Betting State Variables ---
let playerBetSide = null; // Stores the player's chosen side: 'heads', 'tails', 'edge', or null

// --- DOM Elements ---
const balanceDisplay = document.getElementById('balanceAmount');
const currentBetDisplay = document.getElementById('currentBetDisplay');
const betAmountInput = document.getElementById('betAmountInput');
const setBetButton = document.getElementById('setBetButton');
const flipButton = document.getElementById('flipButton'); // The main button to start the flip
const resultText = document.getElementById('resultText');
const playerSelectionDisplay = document.getElementById('playerSelectionDisplay'); // Displays player's current selection
const allInButton = document.getElementById('allInButton'); 

// Get references to the specific coin side betting buttons
const betHeadsButton = document.getElementById('betHeadsButton');
const betTailsButton = document.getElementById('betTailsButton');
const betEdgeButton = document.getElementById('betEdgeButton');

// --- Sound Effects ---
// IMPORTANT: Ensure these paths are correct for your files!
const flipSound = new Audio('../Music/Flip.mp3'); // Sound for the coin flipping animation
const winSound = new Audio('../Music/Win.mp3');     // Sound for winning
const loseSound = new Audio('../Music/Lose.mp3');   // Sound for losing

flipSound.load(); // Preload flip sound to avoid delays
winSound.load();  // Preload win sound
loseSound.load(); // Preload lose sound

flipSound.volume = 0.6; // Set flip sound volume
winSound.volume = 0.8;  // Set win sound volume
loseSound.volume = 0.8; // Set lose sound volume

// --- Coin Configuration ---
// Updated to use imageIds for heads and tails
const COIN_SIDES = [
    { name: 'Heads', imageId: 'heads_img', multiplier: 2 },
    { name: 'Tails', imageId: 'tails_img', multiplier: 2 },
    { name: 'Edge', text: 'EDGE', color: '#8B4513', multiplier: 48 }
];

// --- Canvas Drawing Settings ---
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

// --- Display Functions ---
function updateDisplay() {
    // Use the global updateBalanceDisplay function from promo.js
    if (typeof updateBalanceDisplay === 'function') {
        updateBalanceDisplay();
    } else {
        // Fallback if promo.js isn't loaded (shouldn't happen with correct HTML order)
        if (balanceDisplay && typeof playerBalance !== 'undefined') {
            balanceDisplay.textContent = playerBalance.toFixed(2);
        }
    }
    currentBetDisplay.textContent = currentBet.toFixed(2);
    betAmountInput.value = currentBet.toFixed(2);

    if (playerBetSide) {
        playerSelectionDisplay.textContent = playerBetSide.charAt(0).toUpperCase() + playerBetSide.slice(1);
    } else {
        playerSelectionDisplay.textContent = 'None';
    }

    document.querySelectorAll('.bet-option-button').forEach(button => {
        button.classList.remove('selected');
    });
    if (playerBetSide === 'Heads') betHeadsButton.classList.add('selected');
    else if (playerBetSide === 'Tails') betTailsButton.classList.add('selected');
    else if (playerBetSide === 'Edge') betEdgeButton.classList.add('selected');
}

// --- Coin Drawing Function ---
// Now draws images for heads/tails and text for edge
function drawCoin(rotationAngle = 0, scaleY = 1, finalSideObj = null, currentConceptualSideIndex = null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the entire canvas for redrawing

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 10; // Radius of the coin, with a small margin

    ctx.save(); // Save the current canvas state before applying transformations
    ctx.translate(centerX, centerY); // Move the canvas origin to the center of the coin

    // Apply vertical scaling for the flip effect. Ensure scaleY is never 0.
    ctx.scale(1, Math.max(0.01, scaleY));
    ctx.rotate(rotationAngle); // Apply rotation for the coin

    // Draw the main coin circle
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI); // Draw a full circle for the coin
    ctx.fillStyle = '#C0C0C0'; // Default silver color for the coin base
    ctx.fill();
    ctx.strokeStyle = '#8B4513'; // Bronze/brown color for the coin edge
    ctx.lineWidth = 5; // Thickness of the coin edge
    ctx.stroke();

    // --- Draw the side content (image/text) ---
    // Determine which side (Heads/Tails/Edge) should be conceptually visible during the flip
    // `finalSideObj` is used when animation finishes (progress >= 1)
    // `currentConceptualSideIndex` is used during animation for visual effect (flipping between heads/tails)
    let sideToShow = null;
    if (finalSideObj) {
        sideToShow = finalSideObj;
    } else if (currentConceptualSideIndex !== null) {
        sideToShow = COIN_SIDES[currentConceptualSideIndex];
    }

    if (sideToShow) {
        ctx.save(); // Save context for content transformations
        // Reverse scale for content to prevent distortion from coin's scaleY
        ctx.scale(1, 1 / Math.max(0.01, scaleY));

        if (sideToShow.name === 'Edge') {
            // Draw text for 'edge' side
            ctx.fillStyle = sideToShow.color;
            ctx.font = 'bold 80px Arial';
            let textY = -radius * 0.5; // Offset 'EDGE' text slightly up
            ctx.fillText(sideToShow.text, 0, textY);
        } else {
            // Draw image for 'heads' or 'tails' side
            const image = coinImages[sideToShow.imageId];
            if (image) {
                const imgSize = radius * 2 * 1.2; // Image takes 100% of coin diameter not 90%
                const imgOffset = -imgSize / 2; // Center the image

                ctx.drawImage(image, imgOffset, imgOffset, imgSize, imgSize);
            } else {
                // Fallback text if image not loaded (shouldn't happen with preloading)
                ctx.fillStyle = '#333';
                ctx.font = 'bold 120px Arial';
                ctx.fillText(sideToShow.name.toUpperCase(), 0, 0);
            }
        }
        
        ctx.restore(); // Restore context state after drawing content
    }

    ctx.restore(); // Restore the canvas state to before coin transformations
}

// --- Game Logic Functions ---

// Main coin flip function
function flipCoin() {
    if (isFlipping) return;
    if (playerBetSide === null) {
        resultText.textContent = 'Please place a bet (Heads, Tails or Edge (rare))!';
        return;
    }
    // playerBalance is global from promo.js
    if (playerBalance < currentBet) {
        resultText.textContent = 'Insufficient balance!';
        return;
    }

    // --- START OF BALANCE/STATE CHANGES (Critical for immediate update) ---
    playerBalance -= currentBet; // Deduct bet from balance IMMEDIATELY
    playerBalance = parseFloat(playerBalance.toFixed(2)); // Round balance
    saveBalance(); // Save balance using the global saveBalance() from promo.js
    updateDisplay(); // Update display to show new balance (reduced bet)
    
    isFlipping = true; // Set flipping flag to true
    disableGameControls(); // Disable all relevant buttons

    // Play flip sound effect (starts before animation)
    flipSound.pause(); flipSound.currentTime = 0;
    winSound.pause(); winSound.currentTime = 0; // Ensure winSound is reset
    loseSound.pause(); loseSound.currentTime = 0; // Ensure loseSound is reset
    flipSound.loop = true;
    flipSound.play();

    // --- Determine final winning side (result is known immediately) ---
    const rand = Math.random();
    let finalWinningSideObj;
    if (rand < 0.49) {
        finalWinningSideObj = COIN_SIDES[0]; // Heads
    } else if (rand < 0.98) { // 0.49 + 0.49 = 0.98
        finalWinningSideObj = COIN_SIDES[1]; // Tails
    } else {
        finalWinningSideObj = COIN_SIDES[2]; // Edge
    }

    const finalWinningSideName = finalWinningSideObj.name;
    const finalWinningMultiplier = finalWinningSideObj.multiplier;

    let winnings = 0; // Initialize here
    let resultMessage = ''; // Initialize here
    let hasWon = false; // Flag to track win/lose

    // Check for win and add winnings IMMEDIATELY
    if (playerBetSide === finalWinningSideName) {
        winnings = currentBet * finalWinningMultiplier;
        winnings = parseFloat(winnings.toFixed(2)); 
        playerBalance = parseFloat((playerBalance + winnings).toFixed(2)); // Add winnings to balance
        saveBalance(); // Save updated balance IMMEDIATELY
        resultMessage = `You won on ${finalWinningSideName.toUpperCase()}! 🎉 +${winnings.toFixed(2)} (${finalWinningMultiplier}x)`;
        hasWon = true; // Player won
    } else {
        resultMessage = `You lost. Landed on ${finalWinningSideName.toUpperCase()}. Try again!`;
        hasWon = false; // Player lost
    }
    // --- END OF BALANCE/STATE CHANGES (Balance is now final for this round) ---

    const duration = 3000; // Flip animation duration in milliseconds
    let startTime = null;   // Timestamp when animation starts
    let currentRotation = 0; // Current rotation angle of the coin
    let currentScaleY = 1;   // Current vertical scale for flip effect

    // These values are key for smooth and complete animation
    const totalRevolutions = 8 + Math.floor(Math.random() * 5); // Randomize total revolutions between 8 and 12
    const targetRotationAngle = (2 * Math.PI * totalRevolutions); // Total angle for smooth stopping
    const numFlipsInAir = 10; // How many times the coin "flips" (squashes/stretches) in the air


    // Animation loop function
    function animate(timestamp) {
        if (!startTime) startTime = timestamp; // Initialize startTime on first frame
        const elapsed = timestamp - startTime; // Time elapsed since animation started

        const progress = Math.min(elapsed / duration, 1); // Animation progress (0 to 1)

        // Ease-out cubic function for smooth deceleration of rotation
        const easeOutProgressRotation = 1 - Math.pow(1 - progress, 3);
        currentRotation = easeOutProgressRotation * targetRotationAngle;

        // Use a separate sine wave for vertical scaling, ensuring it ends flat (or thin for edge)
        const halfFlips = numFlipsInAir * progress * 2;
        if (progress < 1) {
            currentScaleY = Math.abs(Math.sin(halfFlips * Math.PI / 2));
            currentScaleY = Math.max(0.01, currentScaleY); // Minimum thickness during animation
        } else {
            // At the very end, force it to the final desired scaleY
            currentScaleY = (finalWinningSideName === 'Edge') ? 0.05 : 1;
        }

        // Determine which side (Heads/Tails) should be conceptually visible during the flip
        const currentConceptualSideIndex = Math.floor(halfFlips) % 2;
        drawCoin(currentRotation, currentScaleY, progress >= 1 ? finalWinningSideObj : null, currentConceptualSideIndex);


        if (elapsed < duration) {
            animationFrameId = requestAnimationFrame(animate); // Store animation frame ID
        } else {
            // Animation finished
            flipSound.pause(); // Stop flip sound
            flipSound.currentTime = 0; // Reset flip sound to beginning

            resultText.textContent = resultMessage; // Display final result message (already determined)

            // Play win/lose sound AFTER animation and result display
            if (hasWon) {
                winSound.play();
            } else {
                loseSound.play(); // Play lose sound if player lost
            }

            // Stop win/lose sound after a short delay
            setTimeout(() => {
                winSound.pause(); winSound.currentTime = 0;
                loseSound.pause(); loseSound.currentTime = 0;
            }, 2200);

            updateDisplay(); // Update balance and other UI elements (balance already updated)
            isFlipping = false; // Reset flipping flag
            enableGameControls(); // Re-enable all relevant buttons
            playerBetSide = null; // Reset player's bet for the next round
            animationFrameId = null; // Clear animation frame ID
        }
    }

    animationFrameId = requestAnimationFrame(animate); // Start animation loop and store its ID
}

// --- Helper functions for controlling game state ---
function disableGameControls() {
    setBetButton.disabled = true;
    flipButton.disabled = true;
    allInButton.disabled = true;
    betHeadsButton.disabled = true;
    betTailsButton.disabled = true;
    betEdgeButton.disabled = true;
}

function enableGameControls() {
    setBetButton.disabled = false;
    flipButton.disabled = false;
    allInButton.disabled = false;
    betHeadsButton.disabled = false;
    betTailsButton.disabled = false;
    betEdgeButton.disabled = false;
}

// Function to pause game logic when page is hidden
function pauseGameLogic() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId); // Stop animation
        animationFrameId = null;
    }
    if (flipSound) {
        flipSound.pause();
        flipSound.currentTime = 0;
    }
    if (winSound) { // Stop win sound if it was playing
        winSound.pause();
        winSound.currentTime = 0;
    }
    if (loseSound) { // Stop lose sound if it was playing
        loseSound.pause();
        loseSound.currentTime = 0;
    }
    // Balance is already updated at the start of flipCoin(), so no further action needed here.
    isFlipping = false; // Reset flag to allow new game start
    disableGameControls(); // Disable controls
    resultText.textContent = ''; // Clear result text
}

// Function to resume game logic when page becomes visible
function resumeGameLogic() {
    if (!isFlipping) { // If no active animation (i.e., it was stopped or not started yet)
        enableGameControls(); // Enable controls
    }
}


// --- Event Listeners ---

// Set Bet button
setBetButton.addEventListener('click', () => {
    let newBet = parseFloat(betAmountInput.value);

    if (!isNaN(newBet)) {
        newBet = parseFloat(newBet.toFixed(2));
    }

    if (isNaN(newBet) || newBet <= 0) {
        resultText.textContent = 'Bet must be a positive number!';
        return;
    }
    if (newBet < 0.01) {
        resultText.textContent = 'Minimum bet is 0.01!';
        return;
    }
    // playerBalance is global from promo.js
    if (newBet > playerBalance) {
        resultText.textContent = 'Bet cannot exceed your balance!';
        return;
    }
    
    currentBet = newBet;
    updateDisplay();
    resultText.textContent = `Bet amount set: ${currentBet.toFixed(2)}`;
});

// Event handlers for coin side bet buttons
betHeadsButton.addEventListener('click', () => {
    if (isFlipping) { resultText.textContent = "Cannot change bet while flipping!"; return; } 
    playerBetSide = 'Heads';
    resultText.textContent = `Bet placed on Heads! Amount: ${currentBet}`;
    updateDisplay();
});

betTailsButton.addEventListener('click', () => {
    if (isFlipping) { resultText.textContent = "Cannot change bet while flipping!"; return; } 
    playerBetSide = 'Tails';
    resultText.textContent = `Bet placed on Tails! Amount: ${currentBet}`;
    updateDisplay();
});

betEdgeButton.addEventListener('click', () => {
    if (isFlipping) { resultText.textContent = "Cannot change bet while flipping!"; return; } 
    playerBetSide = 'Edge';
    resultText.textContent = `Bet placed on Edge! Amount: ${currentBet}`;
    updateDisplay();
});

// Event handler for the "Flip Coin!" button
flipButton.addEventListener('click', flipCoin);

// Event listener for the "All In" button
allInButton.addEventListener('click', () => {
    if (isFlipping) {
        resultText.textContent = "You can't go All In while flipping!";
        return;
    }

    if (playerBalance <= 0) {
        resultText.textContent = "You have insufficient balance to go All In!";
        return;
    }

    playerBalance = parseFloat(playerBalance.toFixed(2));
    currentBet = playerBalance;
    // No need to save balance here, it will be saved in flipCoin() on the next flip.

    betAmountInput.value = currentBet.toFixed(2);
    updateDisplay();
    resultText.textContent = `All In! Your bet now is ${currentBet.toFixed(2)}.`;
});

// Event listener for page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        pauseGameLogic();
    } else {
        resumeGameLogic();
    }
});


// --- Initial Setup on Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    preloadImages(imagePaths).then(() => {
        // Draw Heads image initially. Pass the 'heads' side object directly.
        drawCoin(0, 1, COIN_SIDES[0]); 
        updateDisplay(); // Update the balance and bet display on page load
        enableGameControls(); // Ensure buttons are enabled on initial load
    }).catch(error => {
        console.error("Error preloading coin images:", error);
        resultText.textContent = "Error loading coin images. Please check console for details.";
        // Optionally disable game controls if assets cannot be loaded
        disableGameControls();
    });
});
