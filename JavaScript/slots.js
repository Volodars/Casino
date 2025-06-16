// --- Canvas Initialization and Context Setup ---

// Get the <canvas> element from the HTML page
const canvas = document.getElementById('slotCanvas');
// Get 2D drawing context so we can draw symbols and shapes
const ctx = canvas.getContext('2d');

// --- Reel and Symbol Configuration ---

const reelCount = 3;  // Number of vertical reels (columns)
const symbolsPerReel = 3;  // Number of visible symbols on each reel

// Array of possible symbols to be shown on the reels
const reelSymbols = [
    '🍒', '🍒', '🍒', '🍒', '🍒', '🍒', '🍒', '🍒', '🍒', '🍒', // 10 cherries
    '🍋', '🍋', '🍋', '🍋', '🍋', '🍋', '🍋',                     // 7 lemons
    '🔔', '🔔', '🔔', '🔔', '🔔',                                  // 5 bells
    '🍉', '🍉', '🍉', '🍉',                                        // 4 watermelons
    '7️⃣', '7️⃣',                                                 // 2 sevens
    '⭐'                                                          // 1 star
];


// --- Dimensions ---

const reelWidth = canvas.width / reelCount;  // Width of each reel (column)
const reelHeight = canvas.height;   // Total height of canvas
const symbolHeight = reelHeight / symbolsPerReel;  // Height of one symbol

// --- Sound Effects ---

// Create audio objects for spinning, winning, and losing
const spinSound = new Audio('../Music/Slots.mp3');
const winSound = new Audio('../Music/Win.mp3');
const loseSound = new Audio('../Music/Lose.mp3'); // NEW: Sound for losing

// Load sound files to avoid delays on first use
spinSound.load();
winSound.load();
loseSound.load(); // NEW: Preload lose sound

// Adjust volume levels
spinSound.volume = 0.6;   // Spin sound volume
winSound.volume = 0.8;    // Win sound volume
loseSound.volume = 0.8;   // NEW: Lose sound volume

// --- Game State Variables ---

// playerBalance is now global from promo.js.
let currentBet = 100;      // Default bet
let isSpinning = false;    // Flag to prevent multiple simultaneous spins
let currentReels = [];     // Array that holds the current symbols on screen
let winningPositions = [];
let animationFrameId = null; // Stores the requestAnimationFrame ID

// --- DOM Elements (Buttons, Inputs, Labels) ---

const balanceDisplay = document.getElementById('balanceAmount');
const currentBetDisplay = document.getElementById('currentBetDisplay');
const betAmountInput = document.getElementById('betAmountInput');
const setBetButton = document.getElementById('setBetButton');
const spinButton = document.getElementById('spinButton');
const resultText = document.getElementById('resultText');
const allInButton = document.getElementById('allInButton');

// --- Symbol Multipliers for Winning ---

const symbolMultipliers = {
    '🍒': 1.4,    // Chance ~1 in 4.9. Payout 4x. RTP = 4 / 4.9 ≈ 81.6% for this win.
    '🍋': 3,    // Chance ~1 in 14.2. Payout 10x. RTP = 10 / 14.2 ≈ 70.4% for this win.
    '🔔': 5,   // Chance ~1 in 39.2. Payout 25x. RTP = 25 / 39.2 ≈ 63.8% for this win.
    '🍉': 12,   // Chance ~1 in 76.3. Payout 50x. RTP = 50 / 76.3 ≈ 65.5% for this win.
    '7️⃣': 80,  // Chance ~1 in 606. Payout 250x. RTP = 250 / 606 ≈ 41.2% for this win.
    '⭐': 700  // Chance ~1 in 4878. Payout 1000x. RTP = 1000 / 4878 ≈ 20.5% for this win.
};

// --- Text Formatting ---

ctx.textAlign = 'center';     // Horizontally center each symbol
ctx.textBaseline = 'middle';  // Vertically center each symbol
ctx.font = '80px Arial';      // Font size and style for symbols

// --- Display Functions ---

// Updates the balance and bet amounts shown on the screen
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
}

// Get a random symbol from the symbol list
function getRandomSymbol() {
    return reelSymbols[Math.floor(Math.random() * reelSymbols.length)];
}

// Initialize each reel with random symbols
function initReels() {
    currentReels = [];
    for (let i = 0; i < reelCount; i++) {
        let column = [];
        for (let j = 0; j < symbolsPerReel; j++) {
            column.push(getRandomSymbol());
        }
        currentReels.push(column);
    }
}

// Draw all reels and their symbols
function drawReels(offset = 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear old drawings

    // Draw horizontal separator lines
    for (let i = 1; i < symbolsPerReel; i++) {
        const y = i * symbolHeight;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Draw each symbol on each reel
    for (let i = 0; i < reelCount; i++) {
        for (let j = 0; j < symbolsPerReel + 1; j++) {
            let index = (j + Math.floor(offset / symbolHeight)) % symbolsPerReel;
            let symbol = currentReels[i][index];
            let yPos = (j - (offset / symbolHeight)) * symbolHeight;
            const xPos = reelWidth * i + reelWidth / 2;

            ctx.fillStyle = '#eee';
            ctx.fillText(symbol, xPos, yPos + symbolHeight / 2);

            // Draw rectangle around symbol
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(
                reelWidth * i + 2,
                yPos + 2,
                reelWidth - 4,
                symbolHeight - 4
            );
        }
    }

    if (!isSpinning && winningPositions.length > 0) {
        for (const [col, row] of winningPositions) {
            const x = col * reelWidth + 4;
            const y = row * symbolHeight + 4;
            const w = reelWidth - 8;
            const h = symbolHeight - 8;

            ctx.strokeStyle = '#ffd900';
            ctx.lineWidth = 5;
            ctx.shadowColor = 'transperent';
            ctx.shadowBlur = 0;
            ctx.strokeRect(x, y, w, h);
        }
    }
}

// Check if there is a win on any horizontal or diagonal line
function checkWin(reels) {
    const size = reels[0].length; // 3
    let highestMultiplier = 0;
    winningPositions = []; // Очищаем перед новой проверкой

    // Горизонтали
    for (let row = 0; row < size; row++) {
        const lineSymbols = reels.map(col => col[row]);
        if (lineSymbols.every(s => s === lineSymbols[0])) {
            const symbol = lineSymbols[0];
            highestMultiplier = Math.max(highestMultiplier, symbolMultipliers[symbol] || 0);
            for (let col = 0; col < size; col++) {
                winningPositions.push([col, row]);
            }
        }
    }

    // Диагональ ↘
    let diag1 = [], match1 = true;
    for (let i = 0; i < size; i++) diag1.push(reels[i][i]);
    match1 = diag1.every(s => s === diag1[0]);
    if (match1) {
        const symbol = diag1[0];
        highestMultiplier = Math.max(highestMultiplier, symbolMultipliers[symbol] || 0);
        for (let i = 0; i < size; i++) winningPositions.push([i, i]);
    }

    // Диагональ ↙
    let diag2 = [], match2 = true;
    for (let i = 0; i < size; i++) diag2.push(reels[i][size - 1 - i]);
    match2 = diag2.every(s => s === diag2[0]);
    if (match2) {
        const symbol = diag2[0];
        highestMultiplier = Math.max(highestMultiplier, symbolMultipliers[symbol] || 0);
        for (let i = 0; i < size; i++) winningPositions.push([i, size - 1 - i]);
    }

    return highestMultiplier;
}

// Spin animation and game logic
function spinReels() {
    if (isSpinning) return; // Prevent multiple simultaneous spins
    if (playerBalance < currentBet) {
        resultText.textContent = 'Insufficient balance!';
        return;
    }

    // --- START OF BALANCE/STATE CHANGES (Critical for immediate update) ---
    playerBalance -= currentBet; // Deduct bet from balance IMMEDIATELY
    playerBalance = parseFloat(playerBalance.toFixed(2)); // Round balance
    saveBalance(); // Save balance using the global saveBalance() from promo.js
    updateDisplay(); // Update display to show new balance (reduced bet)

    isSpinning = true;
    // Disable all relevant buttons using a new function
    disableGameControls();

    spinSound.pause(); spinSound.currentTime = 0;
    winSound.pause(); winSound.currentTime = 0;
    loseSound.pause(); loseSound.currentTime = 0; // NEW: Reset lose sound
    spinSound.loop = true;
    spinSound.play();

    // Generate final reels immediately after bet is placed
    const finalReels = [];
    for (let i = 0; i < reelCount; i++) {
        let column = [];
        for (let j = 0; j < symbolsPerReel; j++) {
            column.push(getRandomSymbol());
        }
        finalReels.push(column);
    }
    // Set currentReels to finalReels so drawReels can access the correct symbols during animation
    currentReels = finalReels;

    // Check for win and calculate winnings IMMEDIATELY
    const winMultiplier = checkWin(finalReels); // Check win on the determined final reels

    let winnings = 0;
    let finalResultMessage = 'Try again!'; // Default message

    if (winMultiplier > 0) {
        winnings = currentBet * winMultiplier;
        winnings = parseFloat(winnings.toFixed(2));
        playerBalance += winnings; // Add winnings to balance
        saveBalance(); // Save updated balance IMMEDIATELY
        finalResultMessage = `You won! 🎉 +${winnings.toFixed(2)} (${winMultiplier}x)`;
        // winSound.play(); // OLD: Removed immediate win sound play
    }
    // --- END OF BALANCE/STATE CHANGES ---

    const duration = 2200;
    const speed = 0.55;
    let startTime = null;

    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        let elapsed = timestamp - startTime;
        let offset = (elapsed * speed) % (symbolHeight * symbolsPerReel);

        drawReels(offset); // Draw reels with animation offset

        if (elapsed < duration) {
            animationFrameId = requestAnimationFrame(animate); // Store animation frame ID
        } else {
            // Animation finished
            spinSound.pause(); spinSound.currentTime = 0;

            drawReels(0); // Draw final reels without offset

            resultText.textContent = finalResultMessage; // Display final result message

            // NEW: Play win/lose sound AFTER animation and result display
            if (winMultiplier > 0) {
                winSound.play();
            } else {
                loseSound.play(); // Play lose sound if no win
            }

            // Stop win/lose sound after a short delay
            setTimeout(() => {
                winSound.pause();
                winSound.currentTime = 0;
                loseSound.pause(); // NEW: Stop lose sound
                loseSound.currentTime = 0; // NEW: Reset lose sound
            }, 2200); // This timeout should ideally be longer than the sound itself

            updateDisplay(); // Update balance display (already correctly updated)
            isSpinning = false;
            drawReels(0);
            enableGameControls(); // Re-enable all relevant buttons
            animationFrameId = null; // Clear animation frame ID
        }
    }

    animationFrameId = requestAnimationFrame(animate); // Start animation loop and store its ID
}

// --- Helper functions for controlling game state ---
function disableGameControls() {
    setBetButton.disabled = true;
    spinButton.disabled = true;
    allInButton.disabled = true;
}

function enableGameControls() {
    setBetButton.disabled = false;
    spinButton.disabled = false;
    allInButton.disabled = false;
}

// Function to pause game logic when page is hidden
function pauseGameLogic() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId); // Stop animation
        animationFrameId = null;
    }
    if (spinSound) {
        spinSound.pause();
        spinSound.currentTime = 0;
    }
    if (winSound) {
        winSound.pause();
        winSound.currentTime = 0;
    }
    if (loseSound) { // NEW: Stop lose sound on page hide
        loseSound.pause();
        loseSound.currentTime = 0;
    }
    // Balance is already updated at the start of spinReels(), so no further action needed here.
    isSpinning = false; // Reset flag to allow new game start
    disableGameControls(); // Disable controls
    resultText.textContent = ''; // Clear result text
}

// Function to resume game logic when page becomes visible
function resumeGameLogic() {
    if (!isSpinning) { // If no active animation (i.e., it was stopped or not started yet)
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

spinButton.addEventListener('click', spinReels);

// Event handler for the "All In" button
if (allInButton) { // Check if the button exists on this page
    allInButton.addEventListener('click', () => {
        // Use 'isSpinning' flag for roulette to prevent betting during animation
        if (isSpinning) { 
            resultText.textContent = "Cannot go All In while the reels are spinning!";
            return;
        }

        if (playerBalance <= 0) {
            resultText.textContent = "You have no balance to go All In!";
            return;
        }

        // Set the current bet to the player's entire balance
        playerBalance = parseFloat(playerBalance.toFixed(2));
        currentBet = playerBalance;
        // localStorage.setItem here is no longer needed, balance will be saved in spinReels() on the next spin.

        // Update the bet input field and display
        betAmountInput.value = currentBet.toFixed(2); // Update value in the input field
        updateDisplay(); // Update current bet and balance display

        resultText.textContent = `All In! Your bet is now ${currentBet.toFixed(2)}.`; // Message to the player
    });
}

// Event listener for page visibility changes (critical for immediate balance update)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        pauseGameLogic();
    } else {
        resumeGameLogic();
    }
});


// --- Initial Setup ---
// Wrap initial setup in DOMContentLoaded to ensure elements are loaded
document.addEventListener('DOMContentLoaded', () => {
    initReels();      // Generate random symbols
    drawReels();      // Display them on the canvas
    updateDisplay();  // Show balance and bet
    enableGameControls(); // Ensure controls are enabled on initial load
});
