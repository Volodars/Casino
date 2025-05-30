// coin_game.js - Main JavaScript for the Coin Flip game

// --- Canvas Initialization and Context Setup ---
const canvas = document.getElementById('coinCanvas');
const ctx = canvas.getContext('2d');

// --- Game State Variables ---
// Load player balance from localStorage, or set to 1000 if not found
// let playerBalance = parseFloat(localStorage.getItem('playerBalance')) || 1000; //изза него не грузилось и ошибка была)))) нельзя чтобы было 2 инициализирования
let currentBet = 100;     // Current bet amount
let isFlipping = false;   // Flag to prevent multiple flips at once

// --- Betting State Variables ---
let playerBetSide = null; // Stores the player's chosen side: 'heads', 'tails', 'edge', or null

// --- DOM Elements ---
// Get references to HTML elements for displaying game information and controls
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
// Using existing sound files, but ideally, you'd replace them with coin-specific sounds
const flipSound = new Audio('coin.mp3'); // Sound for the coin flipping animation
const winSound = new Audio('Win.mp3'); // Sound for winning
flipSound.load(); // Preload flip sound to avoid delays
winSound.load();  // Preload win sound
flipSound.volume = 0.6; // Set flip sound volume
winSound.volume = 0.8;  // Set win sound volume

// --- Coin Configuration ---
// Defines the possible outcomes (sides) of the coin and their properties
// 'text' property now holds the emoji/symbol for the side
const COIN_SIDES = [
    { name: 'heads', text: '👤', color: '#FFD700', multiplier: 2 }, // Heads side (Head emoji)
    { name: 'tails', text: '1', color: '#463f3f', multiplier: 2 }, // Tails side (1)
    { name: 'edge', text: 'EDGE', color: '#8B4513', multiplier: 48 }   // Edge side (text 'EDGE')
];

// --- Canvas Drawing Settings ---
ctx.textAlign = 'center';     // Align text horizontally to the center
ctx.textBaseline = 'middle';  // Align text vertically to the middle

// --- Display Functions ---
// Updates the player's balance, current bet, and selected side on the HTML page
function updateDisplay() {
    balanceDisplay.textContent = playerBalance.toFixed(2); // <--- ИЗМЕНЕНИЕ ЗДЕСЬ
    currentBetDisplay.textContent = currentBet.toFixed(2); // <--- И ЗДЕСЬ
    betAmountInput.value = currentBet.toFixed(2); // <--- И ЗДЕСЬ

    // Update player's selection display text
    if (playerBetSide) {
        // Capitalize the first letter of the selected side for display
        playerSelectionDisplay.textContent = playerBetSide.charAt(0).toUpperCase() + playerBetSide.slice(1);
    } else {
        playerSelectionDisplay.textContent = 'None'; // Display 'None' if no side is selected
    }

    // Update visual feedback for selected bet button
    // Remove 'selected' class from all bet option buttons first
    document.querySelectorAll('.bet-option-button').forEach(button => {
        button.classList.remove('selected');
    });
    // Add 'selected' class to the currently chosen bet button
    if (playerBetSide === 'heads') betHeadsButton.classList.add('selected');
    else if (playerBetSide === 'tails') betTailsButton.classList.add('selected');
    else if (playerBetSide === 'edge') betEdgeButton.classList.add('selected');
}

// --- Coin Drawing Function ---
// Draws the coin on the canvas, applying both rotation and vertical scaling for flip effect
// finalSideObj is used when the animation ends to draw the explicit winning side.
// currentConceptualSideIndex indicates which conceptual side (0=Heads, 1=Tails) is facing up during animation.
function drawCoin(rotationAngle = 0, scaleY = 1, finalSideObj = null, currentConceptualSideIndex = null) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the entire canvas for redrawing

    const centerX = canvas.width / 2;    // X-coordinate of the canvas center
    const centerY = canvas.height / 2;   // Y-coordinate of the canvas center
    const radius = canvas.width / 2 - 10; // Radius of the coin, with a small margin

    ctx.save(); // Save the current canvas state before applying transformations
    ctx.translate(centerX, centerY); // Move the canvas origin to the center of the coin

    // Apply vertical scaling for the flip effect
    // Math.max(0.01, scaleY) prevents scaleY from becoming 0, which can cause issues with transformations
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

    // --- Draw the side content (emoji/text) ---
    // Always draw content during animation, or the final side
    if (finalSideObj || currentConceptualSideIndex !== null) { // Condition changed to always draw if flipping or final
        ctx.save(); // Save context for text transformations
        // Reset scale for text to prevent distortion from coin's scaleY
        ctx.scale(1, 1 / Math.max(0.01, scaleY));

        let contentToDraw = '';
        let textColor = '#333'; // Default text color

        if (finalSideObj) { // If animation has finished, draw the determined final side
            contentToDraw = finalSideObj.text;
            textColor = finalSideObj.color;
            if (finalSideObj.name === 'edge') {
                 // For edge, reduce font size slightly for text
                ctx.font = 'bold 80px Arial';
                textColor = '#FFD700'; // Ensure edge text is readable
            } else {
                ctx.font = 'bold 120px Arial'; // Larger font for final H/T emojis
            }
        } else if (currentConceptualSideIndex !== null) { // During animation, show the current conceptual side
            // Use the 'text' property from COIN_SIDES for emojis
            contentToDraw = COIN_SIDES[currentConceptualSideIndex].text;
            textColor = COIN_SIDES[currentConceptualSideIndex].color;
            ctx.font = 'bold 120px Arial'; // Standard font for H/T emojis during flip
        }

        ctx.fillStyle = textColor;
        // Определяем позицию для текста
        let textY = 0; // По умолчанию текст по центру
        if (finalSideObj && finalSideObj.name === 'edge') {
            textY = -radius * 0.5; // Смещаем текст EDGE вверх. Можешь поиграться с множителем 0.5
        }

        ctx.fillText(contentToDraw, 0, textY); // Рисуем текст с новой Y-координатой
        

        ctx.restore(); // Restore context state after drawing text
    }

    ctx.restore(); // Restore the canvas state to before coin transformations

    // --- Removed the fixed pointer (triangle) as it's not needed for coin flip ---
}


// --- Game Logic Functions ---

// Main coin flip function
function flipCoin() {
    if (isFlipping) return; // Prevent multiple flips if already flipping
    if (playerBetSide === null) { // Check if a bet side is selected before flipping
        resultText.textContent = 'Please place a bet (Heads, Tails, or Edge)!';
        return;
    }
    if (playerBalance < currentBet) { // Check if player has enough balance to cover the bet
        resultText.textContent = 'Insufficient balance!';
        return;
    }

    playerBalance -= currentBet; // Deduct bet from balance
    playerBalance = parseFloat(playerBalance.toFixed(2)); // <--- НОВОЕ: Округляем playerBalance сразу после вычитания
    localStorage.setItem('playerBalance', playerBalance.toFixed(2));
    updateDisplay(); // Update display to show new balance
    

    isFlipping = true; // Set flipping flag to true
    flipButton.disabled = true; // Disable flip button during animation
    setBetButton.disabled = true; // Disable set bet button during animation
    // Disable betting option buttons during flip to prevent changing bets
    betHeadsButton.disabled = true;
    betTailsButton.disabled = true;
    betEdgeButton.disabled = true;

    // Play flip sound effect
    flipSound.pause(); // Pause and reset any previous flip sound
    flipSound.currentTime = 0;
    winSound.pause(); // Pause and reset any previous win sound
    winSound.currentTime = 0;
    flipSound.loop = true; // Loop the flip sound
    flipSound.play(); // Start playing flip sound

    const duration = 3000; // Flip animation duration in milliseconds
    let startTime = null;   // Timestamp when animation starts
    let currentRotation = 0; // Current rotation angle of the coin
    let currentScaleY = 1;   // Current vertical scale for flip effect

    // --- Determine final winning side based on probabilities (49% H, 49% T, 2% Edge) ---
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
        // This calculates how many "half-flips" have occurred
        const halfFlips = numFlipsInAir * progress * 2; // Each half-flip is PI, so we multiply by 2 for full cycles
        // Ensure scaleY approaches 1 (or 0.05 for edge) at the very end
        if (progress < 1) {
             currentScaleY = Math.abs(Math.sin(halfFlips * Math.PI / 2)); // Use PI/2 for each half-flip cycle
             currentScaleY = Math.max(0.01, currentScaleY); // Minimum thickness during animation
        } else {
            // At the very end, force it to the final desired scaleY
            currentScaleY = (finalWinningSideName === 'edge') ? 0.05 : 1;
        }


        // Determine which side (Heads/Tails) should be conceptually visible during the flip
        // This is based on the number of "half-flips" completed.
        // We use Math.floor(halfFlips) to get an integer count of half-flips.
        // If the count is even, it's Heads (index 0). If odd, it's Tails (index 1).
        const currentConceptualSideIndex = Math.floor(halfFlips) % 2;
        // Pass the index to drawCoin
        drawCoin(currentRotation, currentScaleY, progress >= 1 ? finalWinningSideObj : null, currentConceptualSideIndex);


        if (elapsed < duration) {
            requestAnimationFrame(animate); // Continue animation if not finished
        } else {
            // Animation finished
            flipSound.pause(); // Stop flip sound
            flipSound.currentTime = 0; // Reset flip sound to beginning

            // The final state is already drawn by the last call to drawCoin in the loop,
            // but we ensure it's explicitly set for clarity.
            // drawCoin(currentRotation, (finalWinningSideName === 'edge') ? 0.05 : 1, finalWinningSideObj, null);

            let winnings = 0;
            let resultMessage = '';

            // Check for win based on player's bet type and value
            if (playerBetSide === finalWinningSideName) {
                winnings = currentBet * finalWinningMultiplier; // Calculate winnings
                winnings = parseFloat(winnings.toFixed(2)); 
                playerBalance = parseFloat((playerBalance + winnings).toFixed(2)); // Add winnings to balance
                localStorage.setItem('playerBalance', playerBalance.toFixed(2));
                resultMessage = `You won on ${finalWinningSideName.toUpperCase()}! 🎉 +${winnings.toFixed(2)} (${finalWinningMultiplier}x)`;
                winSound.play(); // Play win sound
            } else {
                resultMessage = `You lost. Landed on ${finalWinningSideName.toUpperCase()}. Try again!`;
            }

            resultText.textContent = resultMessage; // Display final result message

            // Stop win sound after a short delay
            setTimeout(() => {
                winSound.pause();
                winSound.currentTime = 0;
            }, 2200);

            updateDisplay(); // Update balance and other UI elements
            isFlipping = false; // Reset flipping flag
            flipButton.disabled = false; // Re-enable flip button
            setBetButton.disabled = false; // Re-enable set bet button
            // Re-enable betting option buttons
            betHeadsButton.disabled = false;
            betTailsButton.disabled = false;
            betEdgeButton.disabled = false;

            // Reset player's bet after the flip (for the next round)
            playerBetSide = null;
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
        resultText.textContent = 'Bet must be a positive number!';
        return;
    }
    // Добавим проверку на минимальную ставку, если хочешь (например, 0.01)
    if (newBet < 0.01) { // Минимальная ставка
        resultText.textContent = 'Minimum bet is 0.01!';
        return;
    }
    if (newBet > playerBalance) {
        resultText.textContent = 'Bet cannot exceed your balance!';
        return;
    }
    
    currentBet = newBet;
    updateDisplay();
    // Отображаем ставку с 2 знаками после запятой
    resultText.textContent = `Bet amount set: ${currentBet.toFixed(2)}`;
});

// Event handlers for coin side bet buttons
betHeadsButton.addEventListener('click', () => {
    playerBetSide = 'heads'; // Set bet type to 'heads'
    resultText.textContent = `Bet placed on Heads! Amount: ${currentBet}`; // Confirm bet
    updateDisplay(); // Update display
});

betTailsButton.addEventListener('click', () => {
    playerBetSide = 'tails'; // Set bet type to 'tails'
    resultText.textContent = `Bet placed on Tails! Amount: ${currentBet}`; // Confirm bet
    updateDisplay(); // Update display
});

betEdgeButton.addEventListener('click', () => {
    playerBetSide = 'edge'; // Set bet type to 'edge'
    // Edge has a higher multiplier due to its rarity
    resultText.textContent = `Bet placed on Edge! Amount: ${currentBet}`; // Confirm bet
    updateDisplay(); // Update display
});

// Event handler for the "Flip Coin!" button
flipButton.addEventListener('click', flipCoin);

// --- Event Listeners ---

// ... существующие обработчики для setBetButton, betHeadsButton, betTailsButton, betEdgeButton ...

// ... существующие обработчики для setBetButton, betHeadsButton, betTailsButton, betEdgeButton ...

// ОБРАБОТЧИК ДЛЯ КНОПКИ ALL IN (только один, удали дубликат, если есть)
// ОБРАБОТЧИК ДЛЯ КНОПКИ ALL IN
allInButton.addEventListener('click', () => {
    if (isFlipping) {
        resultText.textContent = "You can't bet to All In while flipping!";
        return;
    }

    if (playerBalance <= 0) {
        resultText.textContent = "You have not enough balance to go All In!"; // Changed "ballance" to "balance"
        return;
    }

    playerBalance = parseFloat(playerBalance.toFixed(2));
    currentBet = playerBalance;
    localStorage.setItem('playerBalance', playerBalance.toFixed(2)); // <--- СОХРАНЯЕМ БАЛАНС

    betAmountInput.value = currentBet.toFixed(2);
    updateDisplay();

    resultText.textContent = `All In! Your bet now is ${currentBet.toFixed(2)}.`;
});


// Event handler for the "Flip Coin!" button
flipButton.addEventListener('click', flipCoin);


// --- Initial Setup on Page Load ---
// Set an initial rotation to show the "H" side clearly on load
// drawCoin(0, 1, COIN_SIDES[0], null); // Old call
drawCoin(0, 1, null, 0); // Draw Heads initially using index 0
updateDisplay(); // Update the balance and bet display on page load
