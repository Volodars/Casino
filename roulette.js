// roulette.js - Main JavaScript for the Roulette game

// --- Canvas Initialization and Context Setup ---
const canvas = document.getElementById('rouletteCanvas');
const ctx = canvas.getContext('2d'); // Get the 2D rendering context for the canvas

// --- Game State Variables ---
// Load player balance from localStorage, or set to 1000 if not found
// let playerBalance = parseFloat(localStorage.getItem('playerBalance')) || 1000; //изза него не грузилось и ошибка была)))) нельзя чтобы было 2 инициализирования
let currentBet = 100;     // Current bet amount
let isSpinning = false;   // Flag to prevent multiple spins

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
const spinSound = new Audio(' Baraban.mp3'); // Sound for wheel spinning
const winSound = new Audio('Win.mp3'); // Sound for winning
spinSound.load(); // Preload spin sound
winSound.load();  // Preload win sound
spinSound.volume = 0.6; // Set spin sound volume
winSound.volume = 0.8;  // Set win sound volume

// --- Roulette Wheel Configuration ---
// Defines the numbers and their corresponding colors on the roulette wheel
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
    balanceDisplay.textContent = playerBalance.toFixed(2); // <--- ИЗМЕНЕНИЕ ЗДЕСЬ
    currentBetDisplay.textContent = currentBet.toFixed(2); // <--- И ЗДЕСЬ
    betAmountInput.value = currentBet.toFixed(2); // <--- И ЗДЕСЬ

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

    const centerX = canvas.width / 2;    // X-coordinate of the canvas center
    const centerY = canvas.height / 2;   // Y-coordinate of the canvas center
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
        ctx.closePath();  // Close the path

        // Set fill color based on sector color
        if (sector.color === 'red') {
            ctx.fillStyle = '#C0392B'; // Red color
        } else if (sector.color === 'black') {
            ctx.fillStyle = '#2C3E50'; // Black color
        } else if (sector.color === 'green') {
            ctx.fillStyle = '#27AE60'; // Green color
        }
        ctx.fill();       // Fill the sector with its color
        ctx.strokeStyle = '#34495E'; // Set stroke color for sector borders
        ctx.lineWidth = 2; // Set line width for sector borders
        ctx.stroke();     // Draw the sector border

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
    // This will be the point directly above the wheel, where the arrow's base sits.
    const pointerBaseAbsoluteX = centerX;
    const pointerBaseAbsoluteY = centerY - outerRadius - 10; // 10px distance from wheel's outer edge

    // Translate the canvas origin to the pointer's base position
    ctx.translate(pointerBaseAbsoluteX, pointerBaseAbsoluteY);

    // Now, rotate the context by 180 degrees (Math.PI radians)
    // Anything drawn after this will be flipped 180 degrees relative to the new origin.
    ctx.rotate(Math.PI);

    // Draw the pointer as a triangle that *naturally* points UP from (0,0)
    // After the 180-degree rotation, it will point DOWN (towards the wheel) on the canvas.
    const pointerWidth = 20;  // Width of the pointer's base
    const pointerHeight = 35; // Height of the pointer (from tip to base)

    ctx.beginPath(); // Start path for the pointer
    // Tip of the pointer (relative to the translated and rotated origin (0,0))
    // This will be the visually highest point on the canvas after rotation.
    ctx.moveTo(0, -pointerHeight);
    // Bottom-left corner of the base (relative to the translated and rotated origin (0,0))
    ctx.lineTo(-pointerWidth / 2, 0);
    // Bottom-right corner of the base (relative to the translated and rotated origin (0,0))
    ctx.lineTo(pointerWidth / 2, 0);
    ctx.closePath(); // Close the triangle path

    ctx.fillStyle = '#FFD700';    // Gold color for the pointer
    ctx.fill();                    // Fill the pointer
    ctx.strokeStyle = '#B8860B';  // Darker gold for pointer border
    ctx.lineWidth = 2;             // Line width for pointer border
    ctx.stroke();                  // Draw the pointer border

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

    playerBalance -= currentBet; // Deduct bet from balance
    localStorage.setItem('playerBalance', playerBalance.toFixed(2));
    updateDisplay(); // Update display to show new balance

    isSpinning = true; // Set spinning flag to true
    spinButton.disabled = true; // Disable spin button during spin
    setBetButton.disabled = true; // Disable set bet button during spin
    // Disable betting option buttons during spin to prevent changing bets
    betRedButton.disabled = true;
    betBlackButton.disabled = true;
    betGreenButton.disabled = true;
    betNumberInput.disabled = true;
    setNumberBetButton.disabled = true;

    // Play spin sound effect
    spinSound.pause(); // Pause and reset any previous spin sound
    spinSound.currentTime = 0;
    winSound.pause(); // Pause and reset any previous win sound
    winSound.currentTime = 0;
    spinSound.loop = true; // Loop the spin sound
    spinSound.play(); // Start playing spin sound

    const duration = 5000; // Spin animation duration in milliseconds
    let startTime = null;   // Timestamp when animation starts
    let currentRotation = 0; // Current rotation angle of the wheel

    // Randomly select a final winning sector index
    // This will be the target pocket where the ball will land.
    const finalWinningSectorIndex = Math.floor(Math.random() * NUM_SECTORS);

    // Calculate the target rotation angle to bring the *center* of the winning sector
    // to the top (where the pointer is).
    // Pointer target angle is -Math.PI / 2 radians (top position).
    // Initial center angle of 'finalWinningSectorIndex' is (finalWinningSectorIndex * SECTOR_ANGLE + SECTOR_ANGLE / 2).

    const extraRotations = 5; // Minimum 5 full rotations for visual effect

    // Calculate the angle required to align the center of the chosen sector with the pointer.
    // This is the difference between the pointer's target angle and the sector's initial center angle.
    const angleToAlignSectorCenter = (-Math.PI / 2) - (finalWinningSectorIndex * SECTOR_ANGLE + SECTOR_ANGLE / 2);

    // The total target angle combines full rotations for animation with the precise alignment angle.
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
            requestAnimationFrame(animate); // Continue animation if not finished
        } else {
            // Animation finished
            spinSound.pause(); // Stop spin sound
            spinSound.currentTime = 0; // Reset spin sound to beginning

            // Ensure the wheel stops exactly on the target sector
            drawRouletteWheel(targetAngle);

            // Determine the actual winning number and color based on the selected index
            const winningNumberObj = ROULETTE_NUMBERS[finalWinningSectorIndex];
            const winningNumber = winningNumberObj.num;
            const winningColor = winningNumberObj.color;

            let winnings = 0;
            let resultMessage = '';

            // Check for win based on player's bet type and value
            if (playerBetType === 'color') {
                if (playerBetValue === winningColor) {
                    // Calculate winnings based on multiplier (higher for green)
                    const multiplier = (playerBetValue === 'green') ? BET_MULTIPLIERS.green : BET_MULTIPLIERS.color;
                    winnings = currentBet * multiplier;
                    winnings = parseFloat(winnings.toFixed(2)); 
                    playerBalance += winnings; // Add winnings to balance
                    localStorage.setItem('playerBalance', playerBalance.toFixed(2));
                    resultMessage = `You won on ${playerBetValue.toUpperCase()}! 🎉 +${winnings} (${multiplier}x)`;
                    winSound.play(); // Play win sound
                } else {
                    resultMessage = `You lost. Landed on ${winningNumber} (${winningColor.toUpperCase()}). Try again!`;
                }
            } else if (playerBetType === 'number') {
                if (playerBetValue === winningNumber) {
                    winnings = currentBet * BET_MULTIPLIERS.number; // Calculate winnings for number bet
                    winnings = parseFloat(winnings.toFixed(2)); 
                    playerBalance += winnings; // Add winnings to balance
                    localStorage.setItem('playerBalance', playerBalance.toFixed(2));
                    resultMessage = `You won on Number ${winningNumber}! 🥳 +${winnings} (${BET_MULTIPLIERS.number}x)`;
                    winSound.play(); // Play win sound
                } else {
                    resultMessage = `You lost. Landed on ${winningNumber} (${winningColor.toUpperCase()}). Try again!`;
                }
            } else {
                resultText.textContent = 'No bet placed.'; // Fallback, should ideally not be reached
            }

            resultText.textContent = resultMessage; // Display final result message

            // Stop win sound after a short delay
            setTimeout(() => {
                winSound.pause();
                winSound.currentTime = 0;
            }, 2200);

            updateDisplay(); // Update balance and other UI elements
            isSpinning = false; // Reset spinning flag
            spinButton.disabled = false; // Re-enable spin button
            setBetButton.disabled = false; // Re-enable set bet button
            // Re-enable betting option buttons
            betRedButton.disabled = false;
            betBlackButton.disabled = false;
            betGreenButton.disabled = false;
            betNumberInput.disabled = false;
            setNumberBetButton.disabled = false;

            // Reset player's bet after the spin (optional, for next round)
            playerBetType = null;
            playerBetValue = null;
        }
    }

    requestAnimationFrame(animate); // Start the animation loop
}

// --- Event Listeners ---

// Set Bet button
setBetButton.addEventListener('click', () => {
    let newBet = parseFloat(betAmountInput.value); // Используем parseFloat вместо parseInt

    // Округляем введенное значение ставки до 2 знаков после запятой,
    // чтобы избежать проблем с плавающей точкой в будущем и привести к формату "копеек".
    if (!isNaN(newBet)) {
        newBet = parseFloat(newBet.toFixed(2));
    }

    if (isNaN(newBet) || newBet <= 0) {
        resultText.textContent = 'Ставка должна быть положительным числом!';
        return;
    }
    // Добавим проверку на минимальную ставку, если хочешь (например, 0.01)
    if (newBet < 0.01) { // Минимальная ставка
        resultText.textContent = 'Минимальная ставка 0.01!';
        return;
    }
    if (newBet > playerBalance) {
        resultText.textContent = 'Ставка не может превышать баланс!';
        return;
    }
    
    currentBet = newBet;
    updateDisplay();
    // Отображаем ставку с 2 знаками после запятой
    resultText.textContent = `Сумма ставки установлена: ${currentBet.toFixed(2)}`;
});

// Event handlers for color bet buttons
betRedButton.addEventListener('click', () => {
    playerBetType = 'color';  // Set bet type to color
    playerBetValue = 'red';   // Set bet value to red
    resultText.textContent = `Bet placed on Red! Amount: ${currentBet}`; // Confirm bet
    updateDisplay(); // Update display
});

betBlackButton.addEventListener('click', () => {
    playerBetType = 'color';  // Set bet type to color
    playerBetValue = 'black'; // Set bet value to black
    resultText.textContent = `Bet placed on Black! Amount: ${currentBet}`; // Confirm bet
    updateDisplay(); // Update display
});

betGreenButton.addEventListener('click', () => {
    playerBetType = 'color';  // Set bet type to color
    playerBetValue = 'green'; // Set bet value to green
    // Green has a higher multiplier, so it's a riskier bet
    resultText.textContent = `Bet placed on Green (0)! Amount: ${currentBet}`; // Confirm bet
    updateDisplay(); // Update display
});

// Event handler for setting a number bet
setNumberBetButton.addEventListener('click', () => {
    let numBet = parseInt(betNumberInput.value); // Get number from input

    // Validate number bet (must be between 0 and 36)
    if (isNaN(numBet) || numBet < 0 || numBet > 36) {
        resultText.textContent = 'Invalid number bet. Must be between 0 and 36.';
        return;
    }

    playerBetType = 'number';  // Set bet type to number
    playerBetValue = numBet;   // Set bet value to the chosen number
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
        localStorage.setItem('playerBalance', playerBalance.toFixed(2));

        // Update the bet input field and display
        betAmountInput.value = currentBet.toFixed(2); // Update value in the input field
        updateDisplay(); // Update current bet and balance display

        resultText.textContent = `All In! Your bet is now ${currentBet}.`; // Message to the player
    });
}


// Event handler for the "Spin!" button
spinButton.addEventListener('click', spinRoulette);

// --- Initial Setup on Page Load ---
drawRouletteWheel(); // Draw the static roulette wheel initially when the page loads
updateDisplay();     // Update the balance and bet display on page load