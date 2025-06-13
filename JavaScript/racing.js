// JavaScript/racing.js

// --- Глобальные переменные ---
let currentBet = 100;
let selectedCar = null;
let gameStarted = false;
let raceInterval = null; // Для setInterval анимации
const RACE_LENGTH_PERCENT = 90; // Процент пути, который должны пройти машинки для финиша
const BASE_SPEED = 0.5; // Базовая скорость в процентах на кадр (или шаг интервала)
const SPEED_VARIATION = 0.3; // Максимальное отклонение от базовой скорости

// Новые константы для случайных зон скорости
const NUM_SPEED_ZONES_PER_LANE = 3; // Количество зон изменения скорости на каждой полосе
const SPEED_CHANGE_MAGNITUDE = 0.2; // Насколько сильно может измениться скорость в зоне

// --- Звуковые эффекты (пути к вашим файлам) ---
const startSound = new Audio('../Music/Races.mp3'); // Звук старта гонки
const winSound = new Audio('../Music/Win.mp3');      // Звук победы
const loseSound = new Audio('../Music/Lose.mp3');     // Звук поражения

startSound.volume = 0.7;
winSound.volume = 0.8;
loseSound.volume = 0.8;

// Предварительная загрузка звуков
startSound.load();
winSound.load();
loseSound.load();

// --- Элементы DOM ---
// Удаляем эту строку, так как balanceAmountSpan управляется promo.js
// const balanceAmountSpan = document.getElementById('balanceAmount');

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

// --- Переменные состояния гонки ---
let carPositions = {
    1: 0,
    2: 0,
    3: 0
};
let carSpeeds = {}; // Будут сгенерированы случайным образом перед каждой гонкой

// Новая переменная для хранения зон скорости
let speedZones = {
    1: [], // Зоны для Car 1
    2: [], // Зоны для Car 2
    3: []  // Зоны для Car 3
};


// --- Функции обновления DOM ---

function updateGameDisplay() {
    currentBetDisplay.textContent = currentBet.toFixed(2);
    playerSelectionDisplay.textContent = selectedCar ? `Car ${selectedCar}` : 'None';

    // Управление доступностью кнопок
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

    // Визуальное обновление позиций машинок
    for (const carId in cars) {
        cars[carId].style.left = `${carPositions[carId]}%`;
    }
}

function showMessage(message, type = 'info') {
    raceResultDisplay.textContent = message;
    raceResultDisplay.className = 'result-text'; // Сброс классов
    if (type === 'win') {
        raceResultDisplay.classList.add('win-message');
    } else if (type === 'lose') {
        raceResultDisplay.classList.add('lose-message');
    } else if (type === 'error') {
        raceResultDisplay.classList.add('error-message');
    }
}

// --- Логика ставок ---

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
    // Проверка баланса: используем глобальную playerBalance
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
    // Используем глобальную playerBalance
    if (typeof playerBalance === 'undefined' || playerBalance <= 0) {
        showMessage('You have no balance to go All In!', 'error');
        return;
    }
    currentBet = playerBalance;
    betAmountInput.value = currentBet.toFixed(2);
    showMessage(`All In! Bet set to $${currentBet.toFixed(2)}.`, 'info');
    updateGameDisplay();
}

// --- Логика выбора машинки ---

function selectCar(carId) {
    if (gameStarted) return; // Нельзя менять выбор во время гонки
    selectedCar = carId;
    updateGameDisplay();
    showMessage(`You selected Car ${carId}.`, 'info');
}

// --- Логика гонки ---

/**
 * Генерирует случайные зоны изменения скорости для каждой машинки.
 * Каждая зона имеет позицию (процент от 0 до RACE_LENGTH_PERCENT) и тип изменения (ускорение/замедление).
 */
function generateSpeedZones() {
    for (let carId = 1; carId <= 3; carId++) {
        speedZones[carId] = [];
        for (let i = 0; i < NUM_SPEED_ZONES_PER_LANE; i++) {
            const position = Math.random() * (RACE_LENGTH_PERCENT - 10) + 5; // Зона от 5% до (RACE_LENGTH_PERCENT-5)%
            const type = Math.random() > 0.5 ? 1 : -1; // 1 для ускорения, -1 для замедления
            speedZones[carId].push({ position, type, triggered: false });
        }
        // console.log(`Speed Zones for Car ${carId}:`, speedZones[carId]); // Для отладки
    }
}


function startRace() {
    if (gameStarted) return;
    if (selectedCar === null) {
        showMessage('Please select a car first!', 'error');
        return;
    }
    // Проверка баланса: используем глобальную playerBalance
    if (typeof playerBalance !== 'undefined' && playerBalance < currentBet) {
        showMessage('Insufficient balance to place this bet!', 'error');
        return;
    }
    if (currentBet <= 0) {
        showMessage('Bet amount must be greater than zero!', 'error');
        return;
    }

    gameStarted = true;
    // Вычитаем ставку, используя функцию из promo.js, если она есть
    if (typeof playerBalance !== 'undefined') {
        playerBalance -= currentBet;
        if (typeof saveBalance === 'function') { // Предполагаем, что saveBalance есть в promo.js
            saveBalance();
        }
        if (typeof updateBalanceDisplay === 'function') { // Предполагаем, что updateBalanceDisplay есть в promo.js
            updateBalanceDisplay();
        }
    }
    
    updateGameDisplay();
    showMessage('Race started! Good luck!', 'info');
    startSound.play();

    // Сброс позиций и генерация скоростей
    for (let i = 1; i <= 3; i++) {
        carPositions[i] = 0;
        // Случайная базовая скорость для каждой машинки
        carSpeeds[i] = BASE_SPEED + (Math.random() * SPEED_VARIATION * 2) - SPEED_VARIATION;
        cars[i].style.transition = 'none'; // Отключаем CSS transition на время гонки
        cars[i].style.left = '0%';
    }

    generateSpeedZones(); // Генерируем новые зоны скорости для этой гонки

    // Начинаем анимацию
    raceInterval = setInterval(animateRace, 20); // Обновляем каждые 20ms (50 FPS)
}

function animateRace() {
    let winner = null;

    for (let i = 1; i <= 3; i++) {
        // Проверяем зоны скорости
        speedZones[i].forEach(zone => {
            // Если машинка входит в зону и зона еще не была активирована
            if (carPositions[i] >= zone.position && !zone.triggered) {
                carSpeeds[i] += zone.type * SPEED_CHANGE_MAGNITUDE;
                // Ограничиваем скорость, чтобы не было слишком быстро или назад
                carSpeeds[i] = Math.max(0.1, Math.min(carSpeeds[i], BASE_SPEED + SPEED_VARIATION * 2));
                zone.triggered = true; // Отмечаем зону как активированную
                // console.log(`Car ${i} hit a speed zone at ${zone.position.toFixed(2)}%! New speed: ${carSpeeds[i].toFixed(2)}`); // Для отладки
            }
        });

        if (carPositions[i] < RACE_LENGTH_PERCENT) {
            carPositions[i] += carSpeeds[i];
            cars[i].style.left = `${carPositions[i]}%`;
        } else {
            // Машинка достигла финиша
            if (!winner) { // Первая машинка, которая финишировала
                winner = i;
            }
        }
    }

    if (winner !== null) {
        clearInterval(raceInterval); // Останавливаем интервал
        endRace(winner);
    }
}

function endRace(winnerCarId) {
    gameStarted = false;

    // Включаем CSS transition обратно для плавного сброса
    for (let i = 1; i <= 3; i++) {
        cars[i].style.transition = 'left 0.2s ease';
    }

    let message;
    let messageType;

    if (winnerCarId === selectedCar) {
        const winnings = currentBet * 2; // Выигрыш: удвоенная ставка
        // Добавляем выигрыш, используя функцию из promo.js
        if (typeof playerBalance !== 'undefined') {
            playerBalance = parseFloat((playerBalance + winnings).toFixed(2));
            if (typeof saveBalance === 'function') { // Предполагаем, что saveBalance есть в promo.js
                saveBalance();
            }
            if (typeof updateBalanceDisplay === 'function') { // Предполагаем, что updateBalanceDisplay есть в promo.js
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
    updateGameDisplay(); // Обновляем доступность кнопок
}

function resetGame() {
    clearInterval(raceInterval);
    gameStarted = false;
    selectedCar = null;
    currentBet = 100; // Сброс ставки по умолчанию
    betAmountInput.value = currentBet.toFixed(2);

    for (let i = 1; i <= 3; i++) {
        carPositions[i] = 0;
        cars[i].style.transition = 'none'; // Отключаем transition перед сбросом позиции
        cars[i].style.left = '0%'; // Сброс позиции
    }
    // Краткая задержка, чтобы transition не сработал при включении обратно
    setTimeout(() => {
        for (let i = 1; i <= 3; i++) {
            cars[i].style.transition = 'left 0.2s ease'; // Включаем transition обратно
        }
    }, 50);

    // Сброс зон скорости
    for (let carId = 1; carId <= 3; carId++) {
        speedZones[carId] = []; // Очищаем старые зоны
    }


    showMessage('Place your bet and select a car to start the race!', 'info');
    updateGameDisplay();
    // Убедимся, что баланс отображается сразу после загрузки страницы.
    // Вызываем updateBalanceDisplay() из promo.js, если она доступна.
    if (typeof updateBalanceDisplay === 'function') {
        updateBalanceDisplay();
    }
}

// --- Инициализация при загрузке страницы ---
document.addEventListener('DOMContentLoaded', () => {
    // Привязка слушателей событий
    setBetButton.addEventListener('click', setBet);
    allInButton.addEventListener('click', allInBet);
    startRaceButton.addEventListener('click', startRace);

    betCarButtons.forEach(button => {
        button.dataset.carId = button.id.replace('betCar', ''); // Устанавливаем data-car-id
        button.addEventListener('click', () => selectCar(parseInt(button.dataset.carId)));
    });

    // Инициализация игры
    resetGame();
});
