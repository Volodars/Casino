// --- Canvas Initialization and Context Setup ---

const canvas = document.getElementById('slotCanvas');
const ctx = canvas.getContext('2d');

// --- Reel and Symbol Configuration ---

const reelCount = 3;         // Number of vertical reels (columns)
const symbolsPerReel = 3;    // Number of visible symbols on each reel

// NEW: Array of possible symbols (using generic string identifiers for all images)
const reelSymbols = [
    'image1', 'image1', 'image1', 'image1', 'image1', 'image1', 'image1', 'image1', 'image1', 'image1', // 10 x image1
    'image2', 'image2', 'image2', 'image2', 'image2', 'image2', 'image2',                                  // 7 x image2
    'image3', 'image3', 'image3', 'image3', 'image3',                                                     // 5 x image3
    'image4', 'image4', 'image4', 'image4',                                                              // 4 x image4
    'image5', 'image5',                                                                                   // 2 x image5
    'image6'                                                                                              // 1 x image6
];

// NEW: Object to store loaded Image objects, keyed by their string identifier
const symbolImages = {};

// NEW: Define paths to all your image files with new generic names.
// IMPORTANT: Make sure the actual image files in your 'Images' folder match these names!
const imagePaths = {
    'image1': '../Images/image1.jpg',
    'image2': '../Images/image2.jpg',
    'image3': '../Images/image3.jpg',
    'image4': '../Images/image4.jpg',
    'image5': '../Images/image5.jpg',
    'image6': '../Images/image6.jpg'
};

// Function to preload all images
function preloadImages(paths) {
    const promises = [];
    Object.keys(paths).forEach(key => {
        const img = new Image();
        img.src = paths[key]; // Use the full path from the imagePaths object
        promises.push(new Promise((resolve, reject) => {
            img.onload = () => {
                symbolImages[key] = img;
                resolve();
            };
            img.onerror = () => {
                console.error(`Failed to load image: ${paths[key]}. Using placeholder.`);
                // Fallback to a placeholder image in case of error
                const placeholder = new Image();
                placeholder.src = `https://placehold.co/${reelWidth-4}x${symbolHeight-4}/cccccc/000000?text=Error`;
                placeholder.onload = () => {
                    symbolImages[key] = placeholder;
                    resolve();
                };
                placeholder.onerror = () => reject(`Failed to load placeholder for ${paths[key]}`);
            };
        }));
    });
    return Promise.all(promises); // Returns a promise that resolves when all images are loaded
}


// --- Dimensions ---

const reelWidth = canvas.width / reelCount;     // Width of each reel (column)
const reelHeight = canvas.height;      // Total height of canvas
const symbolHeight = reelHeight / symbolsPerReel; // Height of one symbol

// --- Sound Effects ---

const spinSound = new Audio('../Music/Baraban.mp3'); // Sound for wheel spinning
const winSound = new Audio('../Music/Win.mp3');     // Sound for winning
const loseSound = new Audio('../Music/Lose.mp3');   // NEW: Sound for losing

spinSound.load(); // Preload spin sound
winSound.load();  // Preload win sound
loseSound.load(); // NEW: Preload lose sound

spinSound.volume = 0.6; // Set spin sound volume
winSound.volume = 0.8;  // Set win sound volume
loseSound.volume = 0.8; // NEW: Set lose sound volume

// --- Game State Variables ---

let currentBet = 100;
let isSpinning = false;
let currentReels = [];
let animationFrameId = null;

// --- DOM Elements (Buttons, Inputs, Labels) ---

const balanceDisplay = document.getElementById('balanceAmount');
const currentBetDisplay = document.getElementById('currentBetDisplay');
const betAmountInput = document.getElementById('betAmountInput');
const setBetButton = document.getElementById('setBetButton');
const spinButton = document.getElementById('spinButton');
const resultText = document.getElementById('resultText');
const allInButton = document.getElementById('allInButton');

// --- Symbol Multipliers for Winning ---

// NEW: Keys in symbolMultipliers now match the generic string identifiers
const symbolMultipliers = {
    'image1': 4,
    'image2': 9,
    'image3': 20,
    'image4': 50,
    'image5': 300,
    'image6': 2500
};

// --- Canvas Drawing Settings ---
// ctx.font, textAlign, textBaseline are technically not used for images,
// but kept for consistency or potential fallback text.
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.font = '80px Arial';

// --- Display Functions ---

function updateDisplay() {
    if (typeof updateBalanceDisplay === 'function') {
        updateBalanceDisplay();
    } else {
        if (balanceDisplay && typeof playerBalance !== 'undefined') {
            balanceDisplay.textContent = playerBalance.toFixed(2);
        }
    }
    currentBetDisplay.textContent = currentBet.toFixed(2);
    betAmountInput.value = currentBet.toFixed(2);
}

function getRandomSymbol() {
    return reelSymbols[Math.floor(Math.random() * reelSymbols.length)];
}

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

// drawReels function now draws images for all symbols
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
            let symbolName = currentReels[i][index]; // Get symbol name (e.g., 'image1')
            let yPos = (j - (offset / symbolHeight)) * symbolHeight;
            const xPos = reelWidth * i; // Top-left X for drawing image

            const image = symbolImages[symbolName]; // Get the preloaded Image object

            if (image) {
                // Draw the image within the cell, considering a small padding
                const imgWidth = reelWidth - 4; // Account for strokeRect padding
                const imgHeight = symbolHeight - 4; // Account for strokeRect padding
                ctx.drawImage(image, xPos + 2, yPos + 2, imgWidth, imgHeight);
            } else {
                // Fallback if image somehow wasn't loaded (shouldn't happen with preloading)
                ctx.fillStyle = 'red';
                ctx.fillText('?', xPos + reelWidth / 2, yPos + symbolHeight / 2);
            }

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
}

function checkWin(reels) {
    const size = reels[0].length;
    let highestMultiplier = 0;

    // Horizontal lines
    for (let row = 0; row < size; row++) {
        const lineSymbols = reels.map(col => col[row]);
        if (lineSymbols.every(s => s === lineSymbols[0])) {
            const symbol = lineSymbols[0];
            highestMultiplier = Math.max(highestMultiplier, symbolMultipliers[symbol] || 0);
        }
    }

    // Diagonal ↘
    let diag1 = [];
    for (let i = 0; i < size; i++) diag1.push(reels[i][i]);
    if (diag1.every(s => s === diag1[0])) {
        const symbol = diag1[0];
        highestMultiplier = Math.max(highestMultiplier, symbolMultipliers[symbol] || 0);
    }

    // Diagonal ↙
    let diag2 = [];
    for (let i = 0; i < size; i++) diag2.push(reels[i][size - 1 - i]);
    if (diag2.every(s => s === diag2[0])) {
        const symbol = diag2[0];
        highestMultiplier = Math.max(highestMultiplier, symbolMultipliers[symbol] || 0);
    }

    return highestMultiplier;
}

function spinReels() {
    if (isSpinning) return;
    if (playerBalance < currentBet) {
        resultText.textContent = 'Insufficient balance!';
        return;
    }

    // --- START OF BALANCE/STATE CHANGES ---
    playerBalance -= currentBet;
    playerBalance = parseFloat(playerBalance.toFixed(2));
    saveBalance();
    updateDisplay();

    isSpinning = true;
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
    currentReels = finalReels;

    // Check for win and calculate winnings IMMEDIATELY
    const winMultiplier = checkWin(finalReels);

    let winnings = 0;
    let finalResultMessage = 'Try again!';
    let hasWon = false; // NEW: Flag to determine if player won this round

    if (winMultiplier > 0) {
        winnings = currentBet * winMultiplier;
        winnings = parseFloat(winnings.toFixed(2));
        playerBalance += winnings;
        saveBalance();
        finalResultMessage = `You won! 🎉 +${winnings.toFixed(2)} (${winMultiplier}x)`;
        hasWon = true; // Player won
    } else {
        hasWon = false; // Player lost
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
            animationFrameId = requestAnimationFrame(animate);
        } else {
            // Animation finished
            spinSound.pause(); spinSound.currentTime = 0;

            drawReels(0); // Draw final reels without offset

            resultText.textContent = finalResultMessage;

            // NEW: Play win/lose sound AFTER animation and result display
            if (hasWon) { // Check the hasWon flag
                winSound.play();
            } else {
                loseSound.play(); // Play lose sound if player lost
            }

            setTimeout(() => {
                winSound.pause(); winSound.currentTime = 0;
                loseSound.pause(); loseSound.currentTime = 0; // NEW: Reset lose sound
            }, 2200);

            updateDisplay();
            isSpinning = false;
            enableGameControls();
            animationFrameId = null;
        }
    }

    animationFrameId = requestAnimationFrame(animate);
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

function pauseGameLogic() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
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
    isSpinning = false;
    disableGameControls();
    resultText.textContent = '';
}

function resumeGameLogic() {
    if (!isSpinning) {
        enableGameControls();
    }
}


// --- Event Listeners ---

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
    if (newBet > playerBalance) {
        resultText.textContent = 'Bet cannot exceed your balance!';
        return;
    }
    
    currentBet = newBet;
    updateDisplay();
    resultText.textContent = `Bet amount set: ${currentBet.toFixed(2)}`;
});

spinButton.addEventListener('click', spinReels);

if (allInButton) {
    allInButton.addEventListener('click', () => {
        if (isSpinning) { 
            resultText.textContent = "Cannot go All In while the reels are spinning!";
            return;
        }

        if (playerBalance <= 0) {
            resultText.textContent = "You have no balance to go All In!";
            return;
        }

        playerBalance = parseFloat(playerBalance.toFixed(2));
        currentBet = playerBalance;

        betAmountInput.value = currentBet.toFixed(2);
        updateDisplay();
        resultText.textContent = `All In! Your bet is now ${currentBet.toFixed(2)}.`;
    });
}

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        pauseGameLogic();
    } else {
        resumeGameLogic();
    }
});


// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    // NEW: Preload images before setting up the game
    preloadImages(imagePaths).then(() => {
        initReels();
        drawReels();
        updateDisplay();
        enableGameControls();
    }).catch(error => {
        console.error("Error preloading images:", error);
        resultText.textContent = "Error loading game assets. Please check console for details.";
        // Optionally disable game controls if assets cannot be loaded
        disableGameControls();
    });
});
