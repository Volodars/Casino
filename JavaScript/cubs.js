// JavaScript/dice_game.js - Main JavaScript for the Dice Game

// --- DOM Elements ---
const balanceDisplay = document.getElementById("balanceAmount"); // Global balance from promo.js
const currentBetDisplay = document.getElementById("diceCurrentBet");
const betAmountInput = document.getElementById("diceBetInput");
const setBetButton = document.getElementById("setDiceBet");
const allInButton = document.getElementById("allInDiceBet");
const targetSumInput = document.getElementById("targetSumInput");
const betLessButton = document.getElementById("betLess");
const betEqualButton = document.getElementById("betEqual");
const betGreaterButton = document.getElementById("betGreater");
const resultText = document.getElementById("diceResult");
const rollButton = document.getElementById("rollDice");


const diceArea = document.getElementById("diceArea"); // Container for dice images

// --- Game State Variables ---
// playerBalance is declared and managed in promo.js and is globally accessible.
let currentBet = 100; // Initial bet value
let gameInProgress = false; // Flag to prevent actions during a roll
let selectedMode = null;

// --- Изображения кубиков больше не нужны, удаляем связанные переменные и функции ---
// const diceImages = {};
// const IMAGE_BASE_PATH = '../Images/Dice/';
// const allDiceImagePaths = { ... };
// function preloadDiceImages(paths) { ... }


// --- Sound Effects ---
// Important: Ensure these paths are correct for your files!
const rollSound = new Audio('../Music/DiceRoll.mp3'); // Sound for rolling dice
// const // chipSound = new Audio('../Music/ChipStack.mp3'); // Sound for betting
const winSound = new Audio('../Music/Win.mp3');       // Sound for winning
const loseSound = new Audio('../Music/Lose.mp3');      // Sound for losing

rollSound.volume = 0.7;
// chipSound.volume = 0.6;
winSound.volume = 0.8;
loseSound.volume = 0.8;

rollSound.load();
// chipSound.load();
winSound.load();
loseSound.load();

// --- Payout Multipliers (based on two dice sum probabilities) ---
// Ways to roll a sum:
// 2: (1,1) -> 1 way
// 3: (1,2), (2,1) -> 2 ways
// 4: (1,3), (2,2), (3,1) -> 3 ways
// 5: (1,4), (2,3), (3,2), (4,1) -> 4 ways
// 6: (1,5), (2,4), (3,3), (4,2), (5,1) -> 5 ways
// 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) -> 6 ways
// 8: (2,6), (3,5), (4,4), (5,3), (6,2) -> 5 ways
// 9: (3,6), (4,5), (5,4), (6,3) -> 4 ways
// 10: (4,6), (5,5), (6,4) -> 3 ways
// 11: (5,6), (6,5) -> 2 ways
// 12: (6,6) -> 1 way
// Total possible outcomes: 6 * 6 = 36

const payoutOdds = {
    2: 35, // 36 / 1 = 36x
    3: 17.3, // 36 / 2 = 18x
    4: 11.5, // 36 / 3 = 12x
    5: 8.5,  // 36 / 4 = 9x
    6: 6.8,// 36 / 5 = 7.2x (or rounded down to 7x for simplicity in some casinos)
    7: 5.7,  // 36 / 6 = 6x
    8: 6.8,// 36 / 5 = 7.2x
    9: 8.5,  // 36 / 4 = 9x
    10: 11.5,// 36 / 3 = 12x
    11: 17.3,// 36 / 2 = 18x
    12: 35 // 36 / 1 = 36x
};

// --- UI Update Functions ---
const updateUI = () => {
    // playerBalance is globally available from promo.js
    // Мы по-прежнему пытаемся использовать updateBalanceDisplay из promo.js, если она есть
    if (typeof updateBalanceDisplay === 'function') {
        updateBalanceDisplay(); // Update balance via promo.js
    } else {
        // Fallback if promo.js is not loaded or updateBalanceDisplay not found
        // Мы предполагаем, что playerBalance глобально доступен, как указано в комментарии
        if (balanceDisplay && typeof playerBalance !== 'undefined') {
            balanceDisplay.textContent = playerBalance.toFixed(2);
        }
    }
    currentBetDisplay.textContent = currentBet.toFixed(2);
    betAmountInput.value = currentBet.toFixed(2);
};

function updateResultText(message, color = 'white') {
    resultText.textContent = message;
    resultText.style.color = color;
}

// --- Dice Visualization Functions ---
// НОВАЯ ФУНКЦИЯ drawDice для отображения черепков
function drawDice(die1Value, die2Value) {
    diceArea.innerHTML = ''; // Очищаем предыдущие кубики

    // Функция для получения эмодзи черепков по значению кубика
    const getSkullEmojis = (value) => '💀'.repeat(value);

    // Создаем контейнер для первого "кубика"
    const die1Div = document.createElement('div');
    die1Div.classList.add('skull-die'); // Добавляем новый класс для стилей
    die1Div.textContent = getSkullEmojis(die1Value);
    // Базовые инлайн-стили, чтобы выглядело как кубик с черепками
    die1Div.style.fontSize = '32px'; // Размер эмодзи
    die1Div.style.lineHeight = '1'; // Убрать лишний межстрочный интервал
    die1Div.style.textAlign = 'center';
    die1Div.style.width = '100px';  // Ширина "кубика"
    die1Div.style.height = '100px'; // Высота "кубика"
    die1Div.style.border = '3px solid #666'; // Рамка
    die1Div.style.borderRadius = '12px'; // Закругленные углы
    die1Div.style.backgroundColor = '#1a1a1a'; // Темный фон
    die1Div.style.display = 'flex'; // Используем flexbox для центрирования
    die1Div.style.justifyContent = 'center';
    die1Div.style.alignItems = 'center';
    die1Div.style.margin = '10px'; // Отступ между кубиками
    die1Div.style.boxShadow = '0 0 15px rgba(0,0,0,0.5)'; // Тень для объема
    die1Div.style.color = 'white'; // Цвет текста/эмодзи (если фон очень темный)


    // Создаем контейнер для второго "кубика"
    const die2Div = document.createElement('div');
    die2Div.classList.add('skull-die'); // Добавляем новый класс для стилей
    die2Div.textContent = getSkullEmojis(die2Value);
    // Применяем те же инлайн-стили
    die2Div.style.fontSize = '32px';
    die2Div.style.lineHeight = '1';
    die2Div.style.textAlign = 'center';
    die2Div.style.width = '100px';
    die2Div.style.height = '100px';
    die2Div.style.border = '3px solid #666';
    die2Div.style.borderRadius = '12px';
    die2Div.style.backgroundColor = '#1a1a1a';
    die2Div.style.display = 'flex';
    die2Div.style.justifyContent = 'center';
    die2Div.style.alignItems = 'center';
    die2Div.style.margin = '10px';
    die2Div.style.boxShadow = '0 0 15px rgba(0,0,0,0.5)';
    die2Div.style.color = 'white';

    diceArea.appendChild(die1Div);
    diceArea.appendChild(die2Div);

    [die1Div, die2Div].forEach(die => {
        die.classList.add('animate-roll');
        setTimeout(() => die.classList.remove('animate-roll'), 300);
    });

    // Убедитесь, что ваш CSS для #diceArea использует flexbox или grid,
    // чтобы кубики располагались рядом. Например:
    // #diceArea { display: flex; justify-content: center; align-items: center; }
}

// --- Button State Management ---
function enableGameControls() {
    setBetButton.disabled = false;
    allInButton.disabled = false;
    betAmountInput.disabled = false;
}

function disableGameControlsDuringRoll() {
    setBetButton.disabled = true;
    allInButton.disabled = true;
    betAmountInput.disabled = true;
}

function disableAllGameControls() {
    setBetButton.disabled = true;
    allInButton.disabled = true;
    betAmountInput.disabled = true;
}

function playDiceGame(mode) {
    if (gameInProgress) return;

    const target = parseInt(targetSumInput.value);
    if (isNaN(target) || target < 2 || target > 12) {
        updateResultText("Enter a valid target number (2–12).", 'orange');
        return;
    }

    if (mode === 'less' && target <= 2) {
        updateResultText("You can't bet on less than 2.", 'orange');
        return;
    }

    if (mode === 'greater' && target >= 12) {
        updateResultText("You can't bet on greater than 12.", 'orange');
        return;
    }

    // playerBalance должен быть глобально доступен из promo.js
    if (currentBet <= 0 || (typeof playerBalance === 'undefined' || playerBalance < currentBet)) {
        updateResultText("Check your bet or balance!", 'red');
        return;
    }

    function calculateDynamicOdds(mode, target) {
        let totalOutcomes = 36;
        let favorableOutcomes = 0;

        if (mode === 'less') {
            for (let i = 2; i < target; i++) {
                favorableOutcomes += 36 / payoutOdds[i];
            }
        } else if (mode === 'greater') {
            for (let i = target + 1; i <= 12; i++) {
                favorableOutcomes += 36 / payoutOdds[i];
            }
        }

        if (favorableOutcomes === 0) return 0;

        return parseFloat((totalOutcomes / favorableOutcomes * 0.98).toFixed(2));
    }


    gameInProgress = true;
    disableGameControlsDuringRoll();
    updateResultText('Rolling...', 'white');
    rollSound.play();

    playerBalance -= currentBet;
    saveBalance(); // saveBalance() должна быть в promo.js
    updateUI();

    let rollCount = 0;
    const maxRolls = 15;
    const animationInterval = setInterval(() => {
        drawDice(Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6));
        if (++rollCount >= maxRolls) {
            clearInterval(animationInterval);

            const die1 = Math.ceil(Math.random() * 6);
            const die2 = Math.ceil(Math.random() * 6);
            const total = die1 + die2;
            drawDice(die1, die2);

            let win = false;
            let winnings = 0;
            let msg = '';
            let color = '';

            if (
                (mode === 'equal' && total === target) ||
                (mode === 'less' && total < target) ||
                (mode === 'greater' && total > target)
            ) {
                win = true;
                if (mode === 'equal') {
                    winnings = currentBet * payoutOdds[target];
                } else if (mode === 'less') {
                    // Используем calculateDynamicOdds
                    winnings = currentBet * calculateDynamicOdds('less', target);
                } else if (mode === 'greater') {
                    // Используем calculateDynamicOdds
                    winnings = currentBet * calculateDynamicOdds('greater', target);
                }
                playerBalance += winnings;
                saveBalance(); // saveBalance() должна быть в promo.js
                winSound.play();
                msg = `You rolled ${total}! You win +$${winnings.toFixed(2)} 🎉`;
                color = 'green';
            } else {
                loseSound.play();
                msg = `You rolled ${total}. You lose -$${currentBet.toFixed(2)}.`;
                color = 'red';
            }

            updateResultText(msg, color);
            updateUI();
            gameInProgress = false;
            enableGameControls();
        }
    }, 200);
}



function clearSelectedModeHighlight() {
    betLessButton.classList.remove("selected-mode-button");
    betEqualButton.classList.remove("selected-mode-button");
    betGreaterButton.classList.remove("selected-mode-button");
}

betLessButton.addEventListener("click", () => {
    selectedMode = "less";
    clearSelectedModeHighlight();
    betLessButton.classList.add("selected-mode-button");
    updateResultText("You selected: Less than", "#fff");
});

betEqualButton.addEventListener("click", () => {
    selectedMode = "equal";
    clearSelectedModeHighlight();
    betEqualButton.classList.add("selected-mode-button");
    updateResultText("You selected: Exactly", "#fff");
});

betGreaterButton.addEventListener("click", () => {
    selectedMode = "greater";
    clearSelectedModeHighlight();
    betGreaterButton.classList.add("selected-mode-button");
    updateResultText("You selected: Greater than", "#fff");
});

rollButton.addEventListener("click", () => {
    if (!selectedMode) {
        updateResultText("Please select a condition: Less, Exactly, or Greater.", "orange");
        return;
    }
    playDiceGame(selectedMode);
});


// --- Core Game Logic ---

// Handles setting the bet amount
setBetButton.addEventListener("click", () => {
    if (gameInProgress) {
        updateResultText("Cannot change bet during a roll!", 'orange');
        return;
    }
    let newBet = parseFloat(betAmountInput.value);
    if (isNaN(newBet) || newBet <= 0) {
        updateResultText('Bet must be a positive number!', 'orange');
        return;
    }
    newBet = parseFloat(newBet.toFixed(2));

    if (typeof playerBalance === 'undefined' || playerBalance < newBet) {
        updateResultText('Insufficient balance!', 'red');
        return;
    }

    currentBet = newBet;
    updateUI();
    updateResultText(`Bet amount set: $${currentBet.toFixed(2)}. Select your target sum and roll!`, 'white');
    // chipSound.play();
});

// Handles "All In" bet
allInButton.addEventListener("click", () => {
    if (gameInProgress) {
        updateResultText("Cannot go All In during a roll!", 'orange');
        return;
    }
    if (typeof playerBalance === 'undefined' || playerBalance <= 0) {
        updateResultText("You have insufficient balance to go All In!", 'red');
        return;
    }
    currentBet = parseFloat(playerBalance.toFixed(2));
    betAmountInput.value = currentBet.toFixed(2);
    updateUI();
    updateResultText(`All In! Your bet is now $${currentBet.toFixed(2)}. Select your target sum and roll!`, 'white');
    // chipSound.play();
});

// Handles the dice roll

// --- Initial Setup on Page Load ---
document.addEventListener("DOMContentLoaded", () => {
    // Load balance from promo.js or fallback
    // playerBalance и saveBalance() должны быть определены в promo.js
    if (typeof loadBalance === 'function') {
        loadBalance();
    } else {
        console.error("promo.js or loadBalance() not found. Balance may not work correctly.");
        // Fallback for playerBalance if promo.js is not loaded
        // Примечание: CASINO_ID здесь должен быть доступен глобально
        window.playerBalance = parseFloat(localStorage.getItem(`playerBalance_${CASINO_ID}`)) || 1000;
    }

    // Больше не нужно предварительно загружать изображения, просто инициализируем UI
    console.log("[Dice Game] Initializing Dice Game.");
    updateUI(); // Обновляем UI после загрузки баланса
    enableGameControls(); // Включаем начальные кнопки
    updateResultText('Place your bet, select a target sum, and roll!', 'white');
    drawDice(1, 1); // Отображаем начальные кубики (два черепка)
});