// roulette.js - Main JavaScript for the Roulette game

// --- Canvas Initialization and Context Setup ---
const canvas = document.getElementById('rouletteCanvas');
const ctx = canvas.getContext('2d'); // Get the 2D rendering context for the canvas

// --- Game State Variables ---
// playerBalance is now managed globally by promo.js. Ensure promo.js is loaded FIRST in HTML.
let currentBet = 100;    // Current bet amount
let isSpinning = false;  // Flag to prevent multiple spins
let animationFrameId = null; // Stores the requestAnimationFrame ID for stopping animation

// --- New Betting State Variables ---
let playerBetType = null;  // Can be 'color', 'number', or null (no bet placed)
let playerBetValue = null; // Can be 'red', 'black', 'green', or a number (0-36)

// --- DOM Elements ---
const balanceDisplay = document.getElementById('balanceAmount');
const currentBetDisplay = document.getElementById('currentBetDisplay');
const betAmountInput = document.getElementById('betAmountInput');
const setBetButton = document.getElementById('setBetButton');
const spinButton = document.getElementById('spinButton');
const resultText = document.getElementById('resultText');
const playerSelectionDisplay = document.getElementById('playerSelectionDisplay'); // Display for player's selection
const allInButton = document.getElementById('allInButton');

// Betting option buttons and input
const betRedButton = document.getElementById('betRedButton');
const betBlackButton = document.getElementById('betBlackButton');
const betGreenButton = document.getElementById('betGreenButton');
const betNumberInput = document.getElementById('betNumberInput');
const setNumberBetButton = document.getElementById('setNumberBetButton');

// --- Sound Effects ---
// IMPORTANT: Ensure these paths are correct for your files!
const spinSound = new Audio('../Music/Roulette.mp3'); // Sound for wheel spinning
const winSound = new Audio('../Music/Win.mp3');     // Sound for winning
const loseSound = new Audio('../Music/Lose.mp3');   // NEW: Sound for losing

spinSound.load(); // Preload spin sound
winSound.load();  // Preload win sound
loseSound.load(); // NEW: Preload lose sound

spinSound.volume = 0.6; // Set spin sound volume
winSound.volume = 0.8;  // Set win sound volume
loseSound.volume = 0.8; // NEW: Set lose sound volume

// --- Roulette Wheel Configuration ---
const ROULETTE_NUMBERS = [
    { num: 0, color: 'green' },
    { num: 32, color: 'red' }, { num: 15, color: 'black' }, { num: 19, color: 'red' }, { num: 4, color: 'black' },
    { num: 21, color: 'red' }, { num: 2, color: 'black' }, { num: 25, color: 'red' }, { num: 17, color: 'black' },
    { num: 34, color: 'red' }, { num: 6, color: 'black' }, { num: 27, color: 'red' }, { num: 13, color: 'black' },
    { num: 36, color: 'red' }, { num: 11, color: 'black' }, { num: 30, color: 'red' }, { num: 8, color: 'black' },
    { num: 23, color: 'red' }, { num: 10, color: 'black' }, { num: 5, color: 'red' }, { num: 24, color: 'black' },
    { num: 16, color: 'red' }, { num: 33, color: 'black' }, { num: 1, color: 'red' }, { num: 20, color: 'black' },
    { num: 14, color: 'red' }, { num: 31, color: 'black' }, { num: 9, color: 'red' }, { num: 22, color: 'black' },
    { num: 18, color: 'red' }, { num: 29, color: 'black' }, { num: 7, color: 'red' }, { num: 28, color: 'black' },
    { num: 12, color: 'red' }, { num: 35, color: 'black' }, { num: 3, color: 'red' }, { num: 26, color: 'black' }
];

const NUM_SECTORS = ROULETTE_NUMBERS.length; // Total number of sectors on the wheel
const SECTOR_ANGLE = (2 * Math.PI) / NUM_SECTORS; // Angle of each sector in radians

// Multipliers for different bet types
const BET_MULTIPLIERS = {
    'color': 2,    // 2x for Red/Black
    'green': 35,   // Higher multiplier for Green (e.g., 35x)
    'number': 35   // 35x for a single number
};


// --- Canvas Drawing Settings ---
ctx.textAlign = 'center';     // Align text horizontally to the center
ctx.textBaseline = 'middle';  // Align text vertically to the middle

// --- Display Functions ---

// Function to update the display of balance, current bet, and player's selection on the page.
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

    // Update player's selection display
    if (playerBetType === 'color') {
        playerSelectionDisplay.textContent = playerBetValue.charAt(0).toUpperCase() + playerBetValue.slice(1); // Capitalize first letter
    } else if (playerBetType === 'number') {
        playerSelectionDisplay.textContent = `Number ${playerBetValue}`;
    } else {
        playerSelectionDisplay.textContent = 'None';
    }

    // Update selected button visual (add/remove 'selected' class)
    document.querySelectorAll('.bet-option-button').forEach(button => {
        button.classList.remove('selected');
    });
    if (playerBetType === 'color') {
        if (playerBetValue === 'red') betRedButton.classList.add('selected');
        else if (playerBetValue === 'black') betBlackButton.classList.add('selected');
        else if (playerBetValue === 'green') betGreenButton.classList.add('selected');
    }
    // No specific visual for number bet yet, could add it later
}

// --- Roulette Drawing Functions ---
// Draws the entire roulette wheel on the canvas
function drawRouletteWheel(rotationAngle = 0) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the entire canvas for redrawing

    const centerX = canvas.width / 2;     // X-coordinate of the canvas center
    const centerY = canvas.height / 2;    // Y-coordinate of the canvas center
    const outerRadius = canvas.width / 2 - 20; // Radius of the main wheel
    const innerRadius = 40;            // Radius of the central hub

    // --- Draw the wheel elements that rotate ---
    ctx.save(); // Save the current canvas state before applying transformations
    ctx.translate(centerX, centerY); // Move the canvas origin to the center of the wheel
    ctx.rotate(rotationAngle); // Apply rotation for the entire wheel based on current animation state

    // Iterate through each sector to draw it
    ROULETTE_NUMBERS.forEach((sector, index) => {
        const startAngle = index * SECTOR_ANGLE; // Start angle for the current sector
        const endAngle = (index + 1) * SECTOR_ANGLE; // End angle for the current sector

        // Draw sector
        ctx.beginPath(); // Start a new path
        ctx.arc(0, 0, outerRadius, startAngle, endAngle); // Draw the arc for the sector's outer edge
        ctx.lineTo(0, 0); // Draw a line from the arc end to the center to close the sector
        ctx.closePath();   // Close the path

        // Set fill color based on sector color
        if (sector.color === 'red') {
            ctx.fillStyle = '#C0392B'; // Red color
        } else if (sector.color === 'black') {
            ctx.fillStyle = '#2C3E50'; // Black color
        } else if (sector.color === 'green') {
            ctx.fillStyle = '#27AE60'; // Green color
        }
        ctx.fill();        // Fill the sector with its color
        ctx.strokeStyle = '#34495E'; // Set stroke color for sector borders
        ctx.lineWidth = 2; // Set line width for sector borders
        ctx.stroke();      // Draw the sector border

        // Draw number
        ctx.save(); // Save context state before rotating text
        const textAngle = startAngle + SECTOR_ANGLE / 2; // Angle for the center of the number
        ctx.rotate(textAngle); // Rotate the context to orient the text correctly
        const textRadius = outerRadius * 0.75; // Distance of the number from the center

        ctx.fillStyle = '#eee';      // Text color
        ctx.font = 'bold 20px Arial'; // Text font and size
        ctx.fillText(sector.num.toString(), textRadius, 0); // Draw the number
        ctx.restore(); // Restore context state after drawing number text
    });

    // Draw the central hub (inner circle) - this also rotates with the wheel
    ctx.beginPath();
    ctx.arc(0, 0, innerRadius, 0, 2 * Math.PI); // Draw the inner circle
    ctx.fillStyle = '#7F8C8D'; // Fill color for the hub
    ctx.fill();
    ctx.strokeStyle = '#34495E'; // Stroke color for the hub
    ctx.lineWidth = 2; // Line width for the hub border
    ctx.stroke();

    // Draw the outer golden ring - this also rotates with the wheel
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius + 5, 0, 2 * Math.PI); // Draw the outer golden ring
    ctx.strokeStyle = '#FFD700'; // Golden color
    ctx.lineWidth = 10;          // Thickness of the golden ring
    ctx.stroke();

    ctx.restore(); // Restore the canvas state to before wheel rotations

    // --- Draw the fixed pointer (arrow) at the top ---
    // The pointer should NOT rotate with the wheel, so it's drawn *after* ctx.restore()
    ctx.save(); // Save context state for the pointer (independent transformations)

    // Define absolute coordinates where we want to place the pointer's base
    const pointerBaseAbsoluteX = centerX;
    const pointerBaseAbsoluteY = centerY - outerRadius - 10;

    // Translate the canvas origin to the pointer's base position
    ctx.translate(pointerBaseAbsoluteX, pointerBaseAbsoluteY);

    // Now, rotate the context by 180 degrees (Math.PI radians)
    ctx.rotate(Math.PI);

    // Draw the pointer as a triangle that *naturally* points UP from (0,0)
    const pointerWidth = 20;
    const pointerHeight = 35;

    ctx.beginPath();
    ctx.moveTo(0, -pointerHeight);
    ctx.lineTo(-pointerWidth / 2, 0);
    ctx.lineTo(pointerWidth / 2, 0);
    ctx.closePath();

    ctx.fillStyle = '#FFD700';     // Gold color for the pointer
    ctx.fill();
    ctx.strokeStyle = '#B8860B';   // Darker gold for pointer border
    ctx.lineWidth = 2;             // Line width for pointer border
    ctx.stroke();

    ctx.restore(); // Restore context state after drawing the pointer
}

// --- Game Logic Functions ---

// Main spin function
function spinRoulette() {
    if (isSpinning) return; // Prevent multiple spins if already spinning
    if (playerBetType === null) { // Check if a bet type is selected before spinning
        resultText.textContent = 'Please place a bet (select a color or number)!';
        return;
    }
    if (playerBalance < currentBet) { // Check if player has enough balance to cover the bet
        resultText.textContent = 'Insufficient balance!';
        return;
    }

    // --- START OF BALANCE/STATE CHANGES (Critical for immediate update) ---
    playerBalance -= currentBet; // Deduct bet from balance IMMEDIATELY
    playerBalance = parseFloat(playerBalance.toFixed(2)); // Round balance
    saveBalance(); // Save balance using the global saveBalance() from promo.js
    updateDisplay(); // Update display to show new balance (reduced bet)

    isSpinning = true; // Set spinning flag to true
    disableGameControls(); // Disable all relevant buttons

    // Play spin sound effect and reset win/lose sounds
    spinSound.pause(); spinSound.currentTime = 0;
    winSound.pause(); winSound.currentTime = 0;
    loseSound.pause(); loseSound.currentTime = 0; // NEW: Reset lose sound
    spinSound.loop = true;
    spinSound.play();

    // Randomly select a final winning sector index IMMEDIATELY
    const finalWinningSectorIndex = Math.floor(Math.random() * NUM_SECTORS);
    const winningNumberObj = ROULETTE_NUMBERS[finalWinningSectorIndex]; // Get the winning number object
    const winningNumber = winningNumberObj.num;
    const winningColor = winningNumberObj.color;

    let winnings = 0; // Initialize here
    let resultMessage = ''; // Initialize here
    let hasWon = false; // NEW: Flag to determine if player won this round

    // Check for win and calculate winnings IMMEDIATELY
    if (playerBetType === 'color') {
        if (playerBetValue === winningColor) {
            const multiplier = (playerBetValue === 'green') ? BET_MULTIPLIERS.green : BET_MULTIPLIERS.color;
            winnings = currentBet * multiplier;
            winnings = parseFloat(winnings.toFixed(2));
            playerBalance += winnings; // Add winnings to balance
            saveBalance(); // Save updated balance IMMEDIATELY
            resultMessage = `You won on ${playerBetValue.toUpperCase()}! 🎉 +${winnings.toFixed(2)} (${multiplier}x)`;
            hasWon = true; // Player won
        } else {
            resultMessage = `You lost. Landed on ${winningNumber} (${winningColor.toUpperCase()}). Try again!`;
            hasWon = false; // Player lost
        }
    } else if (playerBetType === 'number') {
        if (playerBetValue === winningNumber) {
            winnings = currentBet * BET_MULTIPLIERS.number; // Calculate winnings for number bet
            winnings = parseFloat(winnings.toFixed(2));
            playerBalance += winnings; // Add winnings to balance
            saveBalance(); // Save updated balance IMMEDIATELY
            resultMessage = `You won on Number ${winningNumber}! 🥳 +${winnings.toFixed(2)} (${BET_MULTIPLIERS.number}x)`;
            hasWon = true; // Player won
        } else {
            resultMessage = `You lost. Landed on ${winningNumber} (${winningColor.toUpperCase()}). Try again!`;
            hasWon = false; // Player lost
        }
    } else {
        resultText.textContent = 'No bet placed.'; // Fallback, should ideally not be reached
        hasWon = false; // No bet, no win
    }
    // --- END OF BALANCE/STATE CHANGES (Balance is now final for this round) ---

    const duration = 5000; // Spin animation duration in milliseconds
    let startTime = null;   // Timestamp when animation starts
    let currentRotation = 0; // Current rotation angle of the wheel

    // Calculate the target rotation angle to bring the *center* of the winning sector
    const extraRotations = 5; // Minimum 5 full rotations for visual effect
    const angleToAlignSectorCenter = (-Math.PI / 2) - (finalWinningSectorIndex * SECTOR_ANGLE + SECTOR_ANGLE / 2);
    const targetAngle = (2 * Math.PI * extraRotations) + angleToAlignSectorCenter;


    // Animation loop function
    function animate(timestamp) {
        if (!startTime) startTime = timestamp; // Initialize startTime on first frame
        const elapsed = timestamp - startTime; // Time elapsed since animation started

        const progress = Math.min(elapsed / duration, 1); // Animation progress (0 to 1)
        // Ease-out cubic function for smooth deceleration (wheel slows down towards the end)
        const easeOutProgress = 1 - Math.pow(1 - progress, 3);

        // Calculate the current rotation based on ease-out progress towards the target angle
        currentRotation = easeOutProgress * targetAngle;

        drawRouletteWheel(currentRotation); // Redraw the wheel at the current rotation

        if (elapsed < duration) {
            animationFrameId = requestAnimationFrame(animate); // Store animation frame ID
        } else {
            // Animation finished
            spinSound.pause(); // Stop spin sound
            spinSound.currentTime = 0; // Reset spin sound to beginning

            // Ensure the wheel stops exactly on the target sector
            drawRouletteWheel(targetAngle);

            resultText.textContent = resultMessage; // Display final result message

            // NEW: Play win/lose sound AFTER animation and result display
            if (hasWon) { // Check the hasWon flag
                winSound.play();
            } else {
                loseSound.play(); // Play lose sound if player lost
            }

            // Stop win/lose sound after a short delay (e.g., 2.2 seconds)
            setTimeout(() => {
                winSound.pause(); winSound.currentTime = 0;
                loseSound.pause(); loseSound.currentTime = 0; // NEW: Reset lose sound
            }, 2200);

            updateDisplay(); // Update balance and other UI elements (balance already updated)
            isSpinning = false; // Reset spinning flag
            enableGameControls(); // Re-enable all relevant buttons

            // Reset player's bet after the spin (optional, for next round)
            playerBetType = null;
            playerBetValue = null;
            animationFrameId = null; // Clear animation frame ID
        }
    }

    animationFrameId = requestAnimationFrame(animate); // Start the animation loop and store its ID
}

// --- Helper functions for controlling game state ---
function disableGameControls() {
    setBetButton.disabled = true;
    spinButton.disabled = true;
    allInButton.disabled = true;
    betRedButton.disabled = true;
    betBlackButton.disabled = true;
    betGreenButton.disabled = true;
    betNumberInput.disabled = true;
    setNumberBetButton.disabled = true;
}

function enableGameControls() {
    setBetButton.disabled = false;
    spinButton.disabled = false;
    allInButton.disabled = false;
    betRedButton.disabled = false;
    betBlackButton.disabled = false;
    betGreenButton.disabled = false;
    betNumberInput.disabled = false;
    setNumberBetButton.disabled = false;
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
    if (winSound) { // Stop win sound if it was playing
        winSound.pause();
        winSound.currentTime = 0;
    }
    if (loseSound) { // NEW: Stop lose sound if it was playing
        loseSound.pause();
        loseSound.currentTime = 0;
    }
    // Balance is already updated at the start of spinRoulette(), so no further action needed here.
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
// --- END OF NEW HELPER FUNCTIONS ---

// --- Event Listeners ---

// Set Bet button
setBetButton.addEventListener('click', () => {
    // Prevent changing bet during spin
    if (isSpinning) { resultText.textContent = "Cannot change bet while wheel is spinning!"; return; }
    let newBet = parseFloat(betAmountInput.value);

    // Round the entered bet value to 2 decimal places
    if (!isNaN(newBet)) {
        newBet = parseFloat(newBet.toFixed(2));
    }

    if (isNaN(newBet) || newBet <= 0) {
        resultText.textContent = 'The bet must be a positive number!';
        return;
    }
    if (newBet < 0.01) { // Minimum bet
        resultText.textContent = 'Minimum bet 0.01!';
        return;
    }
    // playerBalance is global from promo.js
    if (newBet > playerBalance) {
        resultText.textContent = 'The bet cannot exceed the balance!';
        return;
    }

    currentBet = newBet;
    updateDisplay();
    resultText.textContent = `The bet amount is set: ${currentBet.toFixed(2)}`;
});

spinButton.addEventListener('click', spinRoulette);

// Event handlers for color bet buttons
betRedButton.addEventListener('click', () => {
    if (isSpinning) { resultText.textContent = "Cannot change bet while wheel is spinning!"; return; } // Prevent changing bet during spin
    playerBetType = 'color';    // Set bet type to color
    playerBetValue = 'red';     // Set bet value to red
    resultText.textContent = `Bet placed on Red! Amount: ${currentBet}`; // Confirm bet
    updateDisplay(); // Update display
});

betBlackButton.addEventListener('click', () => {
    if (isSpinning) { resultText.textContent = "Cannot change bet while wheel is spinning!"; return; } // Prevent changing bet during spin
    playerBetType = 'color';    // Set bet type to color
    playerBetValue = 'black'; // Set bet value to black
    resultText.textContent = `Bet placed on Black! Amount: ${currentBet}`; // Confirm bet
    updateDisplay(); // Update display
});

betGreenButton.addEventListener('click', () => {
    if (isSpinning) { resultText.textContent = "Cannot change bet while wheel is spinning!"; return; } // Prevent changing bet during spin
    playerBetType = 'color';    // Set bet type to color
    playerBetValue = 'green'; // Set bet value to green
    resultText.textContent = `Bet placed on Green (0)! Amount: ${currentBet}`; // Confirm bet
    updateDisplay(); // Update display
});

// Event handler for setting a number bet
setNumberBetButton.addEventListener('click', () => {
    if (isSpinning) { resultText.textContent = "Cannot change bet while wheel is spinning!"; return; } // Prevent changing bet during spin
    let numBet = parseInt(betNumberInput.value); // Get number from input

    // Validate number bet (must be between 0 and 36)
    if (isNaN(numBet) || numBet < 0 || numBet > 36) {
        resultText.textContent = 'Invalid number bet. Must be between 0 and 36.';
        return;
    }

    playerBetType = 'number';    // Set bet type to number
    playerBetValue = numBet;     // Set bet value to the chosen number
    resultText.textContent = `Bet placed on Number ${numBet}! Amount: ${currentBet}`; // Confirm bet
    updateDisplay(); // Update display
});

// Event handler for the "All In" button
if (allInButton) { // Check if the button exists on this page
    allInButton.addEventListener('click', () => {
        // Use 'isSpinning' flag for roulette to prevent betting during animation
        if (isSpinning) {
            resultText.textContent = "Cannot go All In while the wheel is spinning!";
            return;
        }

        if (playerBalance <= 0) {
            resultText.textContent = "You have no balance to go All In!";
            return;
        }

        // Set the current bet to the player's entire balance
        playerBalance = parseFloat(playerBalance.toFixed(2));
        currentBet = playerBalance;
        // localStorage.setItem here is no longer needed, balance will be saved in spinRoulette() on the next spin.

        // Update the bet input field and display
        betAmountInput.value = currentBet.toFixed(2); // Update value in the input field
        updateDisplay(); // Update current bet and balance display

        resultText.textContent = `All In! Your bet is now ${currentBet.toFixed(2)}.`; // Message to the player
    });
}

// Event listener for page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        pauseGameLogic();
    } else {
        resumeGameLogic();
    }
});


// --- Initial Setup on Page Load ---
// Wrap initial setup in DOMContentLoaded to ensure elements are loaded
document.addEventListener('DOMContentLoaded', () => {
    drawRouletteWheel(); // Draw the static roulette wheel initially when the page loads
    updateDisplay();     // Update the balance and bet display on page load
    enableGameControls(); // Ensure controls are enabled on initial load
});
