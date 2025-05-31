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
    '🍒', '🍒', '🍒', '🍒', '🍒', '🍒', '🍒', '🍒', '🍒', '🍒', // 10 вишен
    '🍋', '🍋', '🍋', '🍋', '🍋', '🍋', '🍋',                   // 7 лимонов
    '🔔', '🔔', '🔔', '🔔', '🔔',                               // 5 колокольчиков
    '🍉', '🍉', '🍉', '🍉',                                        // 4 арбуза
    '7️⃣', '7️⃣',                                       // 2 семёрки
    '⭐','⭐','⭐','⭐','⭐','⭐','⭐','⭐','⭐','⭐','⭐','⭐','⭐','⭐','⭐','⭐','⭐','⭐','⭐','⭐','⭐','⭐','⭐','⭐','⭐','⭐','⭐','⭐'                                             // 1 звезда
];


// --- Dimensions ---

const reelWidth = canvas.width / reelCount;  // Width of each reel (column)
const reelHeight = canvas.height;  // Total height of canvas
const symbolHeight = reelHeight / symbolsPerReel;  // Height of one symbol

// --- Sound Effects ---

// Create audio objects for spinning and winning
const spinSound = new Audio('Baraban.mp3');
const winSound = new Audio('Win.mp3');

// Load sound files to avoid delays on first use
spinSound.load();
winSound.load();

// Adjust volume levels
spinSound.volume = 0.6;  // Spin sound volume
winSound.volume = 0.8;   // Win sound volume

// --- Game State Variables ---

// --- Game State Variables ---

// Load player balance from localStorage, or set to 1000 if not found
let currentBet = 100;       // Default bet
let isSpinning = false;    // Flag to prevent multiple simultaneous spins
let currentReels = [];     // Array that holds the current symbols on screen

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
    '🍒': 4,    // Шанс ~1 к 4.9. Выплата 4x. RTP = 4 / 4.9 ≈ 81.6% для этого выигрыша.
    '🍋': 9,   // Шанс ~1 к 14.2. Выплата 10x. RTP = 10 / 14.2 ≈ 70.4% для этого выигрыша.
    '🔔': 20,   // Шанс ~1 к 39.2. Выплата 25x. RTP = 25 / 39.2 ≈ 63.8% для этого выигрыша.
    '🍉': 50,   // Шанс ~1 к 76.3. Выплата 50x. RTP = 50 / 76.3 ≈ 65.5% для этого выигрыша.
    '7️⃣': 300,  // Шанс ~1 к 606. Выплата 250x. RTP = 250 / 606 ≈ 41.2% для этого выигрыша.
    '⭐': 2500  // Шанс ~1 к 4878. Выплата 1000x. RTP = 1000 / 4878 ≈ 20.5% для этого выигрыша.
};

// --- Text Formatting ---

ctx.textAlign = 'center';    // Horizontally center each symbol
ctx.textBaseline = 'middle'; // Vertically center each symbol
ctx.font = '80px Arial';     // Font size and style for symbols

// --- Display Functions ---

// Updates the balance and bet amounts shown on the screen
function updateDisplay() {
    balanceDisplay.textContent = playerBalance.toFixed(2); // <--- ИЗМЕНЕНИЕ ЗДЕСЬ
    currentBetDisplay.textContent = currentBet.toFixed(2); // <--- И ЗДЕСЬ
    betAmountInput.value = currentBet.toFixed(2); // <--- И ЗДЕСЬ
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
}

// Check if there is a win on any horizontal or diagonal line
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

// Spin animation and game logic
function spinReels() {
    if (isSpinning) return;  // Prevent multiple simultaneous spins
    if (playerBalance < currentBet) {
        resultText.textContent = 'Insufficient balance!';
        return;
    }

    playerBalance -= currentBet;
    localStorage.setItem('playerBalance', playerBalance.toFixed(2));
    updateDisplay();

    isSpinning = true;
    spinButton.disabled = true;
    setBetButton.disabled = true;

    spinSound.pause(); spinSound.currentTime = 0;
    winSound.pause(); winSound.currentTime = 0;
    spinSound.loop = true;
    spinSound.play();

    const duration = 2200;
    const speed = 0.55;
    let startTime = null;

    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        let elapsed = timestamp - startTime;
        let offset = (elapsed * speed) % (symbolHeight * symbolsPerReel);

        drawReels(offset);

        if (elapsed < duration) {
            requestAnimationFrame(animate);
        } else {
            spinSound.pause(); spinSound.currentTime = 0;

            for (let i = 0; i < reelCount; i++) {
                currentReels[i] = [];
                for (let j = 0; j < symbolsPerReel; j++) {
                    currentReels[i].push(getRandomSymbol());
                }
            }

            drawReels(0);
            const winMultiplier = checkWin(currentReels);

            if (winMultiplier > 0) {
                let winnings = currentBet * winMultiplier;
                winnings = parseFloat(winnings.toFixed(2));
                playerBalance += winnings;
                localStorage.setItem('playerBalance', playerBalance.toFixed(2));
                resultText.textContent = `You won! 🎉 +${winnings} (${winMultiplier}x)`;
                winSound.play();
                setTimeout(() => {
                    winSound.pause();
                    winSound.currentTime = 0;
                }, 2200);
            } else {
                resultText.textContent = 'Try again!';
            }

            updateDisplay();
            isSpinning = false;
            spinButton.disabled = false;
            setBetButton.disabled = false;
        }
    }

    requestAnimationFrame(animate);
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
        localStorage.setItem('playerBalance', playerBalance.toFixed(2));

        // Update the bet input field and display
        betAmountInput.value = currentBet.toFixed(2); // Update value in the input field
        updateDisplay(); // Update current bet and balance display

        resultText.textContent = `All In! Your bet is now ${currentBet.toFixed(2)}.`; // Message to the player
    });
}

// --- Initial Setup ---

initReels();      // Generate random symbols
drawReels();      // Display them on the canvas
updateDisplay();  // Show balance and bet
