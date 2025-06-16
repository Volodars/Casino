// JavaScript/racing.js

// --- Global Variables ---
let currentBet = 100;
let selectedCar = null;
let gameStarted = false;
let raceInterval = null; // For setInterval animation
const RACE_LENGTH_PERCENT = 90; // Percentage of the track cars need to cover to finish
const BASE_SPEED = 0.5; // Base speed in percentage per frame (or interval step)
const SPEED_VARIATION = 0.3; // Maximum deviation from base speed

// New constants for random speed zones
const NUM_SPEED_ZONES_PER_LANE = 3; // Number of speed change zones per lane
const SPEED_CHANGE_MAGNITUDE = 0.2; // How much speed can change within a zone

// --- Sound Effects (paths to your files) ---
const startSound = new Audio('../Music/Races.mp3'); // Race start sound
const winSound = new Audio('../Music/Win.mp3');     // Win sound
const loseSound = new Audio('../Music/Lose.mp3');    // Lose sound

startSound.volume = 0.7;
winSound.volume = 0.8;
loseSound.volume = 0.8;

// Preload sounds
startSound.load();
winSound.load();
loseSound.load();

// --- DOM Elements ---
const currentBetDisplay = document.getElementById('currentBetDisplay');
const playerSelectionDisplay = document.getElementById('playerSelectionDisplay');
const betAmountInput = document.getElementById('betAmountInput');
const setBetButton = document.getElementById('setBetButton');
const allInButton = document.getElementById('allInButton');
const betCarButtons = document.querySelectorAll('.bet-option-button');
const startRaceButton = document.getElementById('startRace');
const raceResultDisplay = document.getElementById('raceResult');

const cars = {
    1: document.getElementById('car1'),
    2: document.getElementById('car2'),
    3: document.getElementById('car3')
};

// --- Race State Variables ---
let carPositions = {
    1: 0,
    2: 0,
    3: 0
};
let carSpeeds = {}; // Will be randomly generated before each race

// New variable to store speed zones
let speedZones = {
    1: [], // Zones for Car 1
    2: [], // Zones for Car 2
    3: []  // Zones for Car 3
};


// --- DOM Update Functions ---

function updateGameDisplay() {
    currentBetDisplay.textContent = currentBet.toFixed(2);
    playerSelectionDisplay.textContent = selectedCar ? `Car ${selectedCar}` : 'None';

    // Button availability management
    const canStart = !gameStarted && selectedCar !== null && (typeof playerBalance !== 'undefined' && playerBalance >= currentBet) && currentBet > 0;
    startRaceButton.disabled = !canStart;
    setBetButton.disabled = gameStarted;
    allInButton.disabled = gameStarted || (typeof playerBalance === 'undefined' || playerBalance === 0);
    betAmountInput.disabled = gameStarted;

    betCarButtons.forEach(button => {
        button.disabled = gameStarted;
        if (parseInt(button.dataset.carId) === selectedCar) {
            button.classList.add('selected');
        } else {
            button.classList.remove('selected');
        }
    });

    // Visual update of car positions
    for (const carId in cars) {
        cars[carId].style.left = `${carPositions[carId]}%`;
    }
}

function showMessage(message, type = 'info') {
    raceResultDisplay.textContent = message;
    raceResultDisplay.className = 'result-text';
    if (type === 'win') {
        raceResultDisplay.classList.add('win-message');
    } else if (type === 'lose') {
        raceResultDisplay.classList.add('lose-message');
    } else if (type === 'error') {
        raceResultDisplay.classList.add('error-message');
    }
}

// --- Betting Logic ---

function setBet() {
    if (gameStarted) {
        showMessage('Cannot change bet during an active race!', 'error');
        return;
    }
    let newBet = parseFloat(betAmountInput.value);
    if (isNaN(newBet) || newBet <= 0) {
        showMessage('Please enter a valid bet amount!', 'error');
        return;
    }
    if (typeof playerBalance !== 'undefined' && newBet > playerBalance) {
        showMessage(`Bet of $${newBet.toFixed(2)} exceeds your balance of $${playerBalance.toFixed(2)}!`, 'error');
        return;
    }
    currentBet = newBet;
    showMessage(`Bet set to $${currentBet.toFixed(2)}.`, 'info');
    updateGameDisplay();
}

function allInBet() {
    if (gameStarted) {
        showMessage('Cannot change bet during an active race!', 'error');
        return;
    }
    if (typeof playerBalance === 'undefined' || playerBalance <= 0) {
        showMessage('You have no balance to go All In!', 'error');
        return;
    }
    currentBet = playerBalance;
    betAmountInput.value = currentBet.toFixed(2);
    showMessage(`All In! Bet set to $${currentBet.toFixed(2)}.`, 'info');
    updateGameDisplay();
}

// --- Car Selection Logic ---

function selectCar(carId) {
    if (gameStarted) return;
    selectedCar = carId;
    updateGameDisplay();
    showMessage(`You selected Car ${carId}.`, 'info');
}

// --- Race Logic ---

/**
 * Generates random speed change zones for each car.
 * Each zone has a position (percentage from 0 to RACE_LENGTH_PERCENT) and a change type (accelerate/decelerate).
 */
function generateSpeedZones() {
    for (let carId = 1; carId <= 3; carId++) {
        speedZones[carId] = [];
        for (let i = 0; i < NUM_SPEED_ZONES_PER_LANE; i++) {
            const position = Math.random() * (RACE_LENGTH_PERCENT - 10) + 5;
            const type = Math.random() > 0.5 ? 1 : -1;
            speedZones[carId].push({ position, type, triggered: false });
        }
    }
}


function startRace() {
    if (gameStarted) return;
    if (selectedCar === null) {
        showMessage('Please select a car first!', 'error');
        return;
    }
    if (typeof playerBalance !== 'undefined' && playerBalance < currentBet) {
        showMessage('Insufficient balance to place this bet!', 'error');
        return;
    }
    if (currentBet <= 0) {
        showMessage('Bet amount must be greater than zero!', 'error');
        return;
    }

    gameStarted = true;
    // Deduct bet using promo.js function if available
    if (typeof playerBalance !== 'undefined') {
        playerBalance -= currentBet;
        // IMPORTANT: Save balance immediately after deducting bet
        if (typeof saveBalance === 'function') {
            saveBalance();
        }
        if (typeof updateBalanceDisplay === 'function') {
            updateBalanceDisplay();
        }
    }
    
    updateGameDisplay();
    showMessage('Race started! Good luck!', 'info');
    startSound.play();

    for (let i = 1; i <= 3; i++) {
        carPositions[i] = 0;
        carSpeeds[i] = BASE_SPEED + (Math.random() * SPEED_VARIATION * 2) - SPEED_VARIATION;
        cars[i].style.transition = 'none';
        cars[i].style.left = '0%';
    }

    generateSpeedZones();

    raceInterval = setInterval(animateRace, 20);
}

function animateRace() {
    let winner = null;

    for (let i = 1; i <= 3; i++) {
        speedZones[i].forEach(zone => {
            if (carPositions[i] >= zone.position && !zone.triggered) {
                carSpeeds[i] += zone.type * SPEED_CHANGE_MAGNITUDE;
                carSpeeds[i] = Math.max(0.1, Math.min(carSpeeds[i], BASE_SPEED + SPEED_VARIATION * 2));
                zone.triggered = true;
            }
        });

        if (carPositions[i] < RACE_LENGTH_PERCENT) {
            carPositions[i] += carSpeeds[i];
            cars[i].style.left = `${carPositions[i]}%`;
        } else {
            if (!winner) {
                winner = i;
            }
        }
    }

    if (winner !== null) {
        clearInterval(raceInterval);
        endRace(winner);
    }
}

function endRace(winnerCarId) {
    gameStarted = false;

    for (let i = 1; i <= 3; i++) {
        cars[i].style.transition = 'left 0.2s ease';
    }

    let message;
    let messageType;

    if (winnerCarId === selectedCar) {
        const winnings = currentBet * 2.9;
        // IMPORTANT: Save balance immediately after adding winnings
        if (typeof playerBalance !== 'undefined') {
            playerBalance = parseFloat((playerBalance + winnings).toFixed(2));
            if (typeof saveBalance === 'function') {
                saveBalance();
            }
            if (typeof updateBalanceDisplay === 'function') {
                updateBalanceDisplay();
            }
        }
        message = `Car ${winnerCarId} wins! You won $${winnings.toFixed(2)}! 🎉`;
        messageType = 'win';
        winSound.play();
    } else {
        message = `Car ${winnerCarId} wins! You lose $${currentBet.toFixed(2)}. 😔`;
        messageType = 'lose';
        loseSound.play();
    }
    showMessage(message, messageType);
    updateGameDisplay();
}

function resetGame() {
    clearInterval(raceInterval);
    gameStarted = false;
    selectedCar = null;
    currentBet = 100;
    betAmountInput.value = currentBet.toFixed(2);

    for (let i = 1; i <= 3; i++) {
        carPositions[i] = 0;
        cars[i].style.transition = 'none';
        cars[i].style.left = '0%';
    }
    setTimeout(() => {
        for (let i = 1; i <= 3; i++) {
            cars[i].style.transition = 'left 0.2s ease';
        }
    }, 50);

    for (let carId = 1; carId <= 3; carId++) {
        speedZones[carId] = [];
    }

    showMessage('Place your bet and select a car to start the race!', 'info');
    updateGameDisplay();
    if (typeof updateBalanceDisplay === 'function') {
        updateBalanceDisplay();
    }
}

// --- Initialization on Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    // Attach event listeners
    setBetButton.addEventListener('click', setBet);
    allInButton.addEventListener('click', allInBet);
    startRaceButton.addEventListener('click', startRace);

    betCarButtons.forEach(button => {
        button.dataset.carId = button.id.replace('betCar', '');
        button.addEventListener('click', () => selectCar(parseInt(button.dataset.carId)));
    });

    // Initialize the game
    resetGame();

    // IMPORTANT: Verify promo.js functions are available, similar to wheel.js
    if (typeof CASINO_ID === 'undefined' || typeof playerBalance === 'undefined' ||
        typeof loadBalance !== 'function' || typeof updateBalanceDisplay !== 'function' || typeof saveBalance !== 'function') {
        console.error("ERROR: Global variables or functions from promo.js not found. Ensure promo.js is loaded BEFORE racing.js.");
        startRaceButton.disabled = true; // Disable start button if core functions are missing
        setBetButton.disabled = true;
        allInButton.disabled = true;
        betAmountInput.disabled = true;
        betCarButtons.forEach(button => button.disabled = true);
        showMessage("Game initialization failed. Please check console for promo.js errors.", "error");
        return; // Stop further initialization
    }

    // Load balance via promo.js (already happens in promo.js DOMContentLoaded, but good to ensure)
    // loadBalance(); // This is typically handled by promo.js itself when it loads

    updateBalanceDisplay(); // Update balance display for racing page
});

// --- IMPORTANT: Save balance on page unload/close ---
window.addEventListener('beforeunload', saveBalance);
window.addEventListener('unload', saveBalance);
// --- End of IMPORTANT ---