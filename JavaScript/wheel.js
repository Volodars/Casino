// wheel.js - Main JavaScript for the Wheel of Fortune game

// --- DOM Elements ---
const balanceDisplay = document.getElementById('balanceAmount'); // Из хедера
const fortuneWheelCanvas = document.getElementById('fortuneWheelCanvas');
const ctx = fortuneWheelCanvas ? fortuneWheelCanvas.getContext('2d') : null; // Добавлена проверка на null
const spinWheelButton = document.getElementById('spinWheelButton');
const wheelCooldownDisplay = document.getElementById('wheelCooldownDisplay');
const wheelResultDisplay = document.getElementById('wheelResultDisplay');
const topUpBalanceLink = document.getElementById('topUpBalanceLink');

// --- Game State Variables ---
// const CASINO_ID = 'casino_alpha'; // ЭТА СТРОКА УДАЛЕНА ИЗ wheel.js, ПРЕДПОЛАГАЕТСЯ, ЧТО ОНА ЕСТЬ В promo.js
const COOLDOWN_DURATION_MS = 60 * 60 * 1000; // 1 минута кулдаун
let lastSpinTime = localStorage.getItem('lastSpinTime_fortune') ? parseInt(localStorage.getItem('lastSpinTime_fortune')) : 0;
let wheelAnimationFrameId = null;
let isSpinning = false;

// Сегменты колеса
const wheelSegments = [
    { value: 100, color: '#FF6347', probability: 0.30}, // Tomato - 30%
    { value: 200, color: '#FFD700', probability: 0.25 }, // Gold - 25%
    { value: 300, color: '#6A5ACD', probability: 0.20 }, // SlateBlue - 20%
    { value: 500, color: '#32CD32', probability: 0.13 }, // LimeGreen - 13%
    { value: 1000, color: '#1E90FF', probability: 0.07 }, // DodgerBlue - 7%
    { value: 2000, color: '#DA70D6', probability: 0.05 }, // Orchid - 5%
];

const totalProbability = wheelSegments.reduce((sum, seg) => sum + seg.probability, 0);
if (Math.abs(totalProbability - 1) > 0.001) {
    console.warn("Сумма вероятностей сегментов не равна 1. Нормализация...");
    wheelSegments.forEach(seg => seg.probability /= totalProbability);
}
const segmentAngle = (2 * Math.PI) / wheelSegments.length;

// --- Sound Effects ---
const spinSound = new Audio('../Music/Roulette.mp3');
const winSound = new Audio('../Music/Win.mp3');
const loseSound = new Audio('../Music/Lose.mp3');

spinSound.volume = 0.6;
winSound.volume = 0.8;
loseSound.volume = 0.8;

spinSound.load();
winSound.load();
loseSound.load();


// --- Drawing Functions ---

function drawWheel(rotationAngle = 0) {
    if (!ctx) {
        console.error("Canvas context is not available for drawing.");
        return;
    }
    // console.log('drawWheel called with rotation:', rotationAngle.toFixed(2), 'radians'); // Закомментировано для уменьшения спама в консоли
    // console.log('Canvas dimensions:', fortuneWheelCanvas.width, fortuneWheelCanvas.height); // Закомментировано

    ctx.clearRect(0, 0, fortuneWheelCanvas.width, fortuneWheelCanvas.height);
    const centerX = fortuneWheelCanvas.width / 2;
    const centerY = fortuneWheelCanvas.height / 2;
    const radius = fortuneWheelCanvas.width / 2 - 5;

    ctx.save(); // Сохраняем состояние контекста до поворота колеса
    ctx.translate(centerX, centerY); // Перемещаем начало координат в центр канваса
    ctx.rotate(rotationAngle); // Применяем общий поворот колеса

    wheelSegments.forEach((segment, index) => {
        const startAngle = index * segmentAngle;
        const endAngle = (index + 1) * segmentAngle;

        ctx.beginPath();
        ctx.moveTo(0, 0); // Начинаем от нового центра (0,0)
        ctx.arc(0, 0, radius, startAngle, endAngle);
        ctx.closePath();

        ctx.fillStyle = segment.color;
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Рисуем текст (значение)
        ctx.save(); // Сохраняем состояние для текста
        ctx.rotate(startAngle + segmentAngle / 2); 
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px Arial';
        ctx.fillText(`$${segment.value}`, radius - 50, 0);
        ctx.restore(); // Восстанавливаем состояние после текста
    });

    ctx.restore(); // Восстанавливаем исходное состояние контекста после отрисовки колеса

    // Рисуем указатель (стрелку) - она не должна вращаться с колесом
    ctx.save();
    const pointerWidth = 20;
    const pointerHeight = 35;
    ctx.translate(centerX, centerY - radius - 10); // Позиция указателя над колесом
    ctx.beginPath();
    ctx.moveTo(0, pointerHeight);
    ctx.lineTo(-pointerWidth / 2, 0);
    ctx.lineTo(pointerWidth / 2, 0);
    ctx.closePath();
    ctx.fillStyle = '#FFD700';
    ctx.fill();
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    // console.log('drawWheel finished.'); // Закомментировано
}

// --- Game Logic ---

function getWeightedRandomSegment() {
    let randomNumber = Math.random();
    let cumulativeProbability = 0;

    for (let i = 0; i < wheelSegments.length; i++) {
        cumulativeProbability += wheelSegments[i].probability;
        if (randomNumber <= cumulativeProbability) {
            return i;
        }
    }
    return wheelSegments.length - 1;
}

function spinWheel() {
    if (isSpinning) {
        console.log("Wheel is already spinning.");
        return;
    }
    if (spinWheelButton.disabled) {
        updateWheelCooldownDisplay(); 
        console.log("Spin button is disabled due to cooldown.");
        return;
    }

    wheelResultDisplay.textContent = '';
    
    const playPromise = spinSound.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.warn("Audio playback prevented:", error);
        });
    }

    isSpinning = true;
    spinWheelButton.disabled = true;

    const targetSegmentIndex = getWeightedRandomSegment();
    const targetSegment = wheelSegments[targetSegmentIndex];
    console.log("Target segment selected:", targetSegment.value, "at index", targetSegmentIndex);

    const duration = 5000;
    let startTime = null;
    let currentRotation = 0;

    const segmentCenterAngle = targetSegmentIndex * segmentAngle + segmentAngle / 2;
    let angleToStop = (3 * Math.PI / 2) - segmentCenterAngle; 
    angleToStop = (angleToStop + 2 * Math.PI) % (2 * Math.PI);

    const extraRotations = 5; 
    const finalTargetRotation = angleToStop + (extraRotations * 2 * Math.PI);
    console.log("Final target rotation (radians):", finalTargetRotation.toFixed(2));

    function animateWheel(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutProgress = 1 - Math.pow(1 - progress, 3);

        currentRotation = easeOutProgress * finalTargetRotation;

        drawWheel(currentRotation);

        if (elapsed < duration) {
            wheelAnimationFrameId = requestAnimationFrame(animateWheel);
        } else {
            cancelAnimationFrame(wheelAnimationFrameId);
            spinSound.pause();
            spinSound.currentTime = 0;
            
            drawWheel(finalTargetRotation); // Убедимся, что колесо точно остановилось в нужном месте

            processSpinResult(targetSegment);
            
            lastSpinTime = Date.now();
            localStorage.setItem('lastSpinTime_fortune', lastSpinTime);
            updateWheelCooldownDisplay();
            
            const winPlayPromise = winSound.play();
            if (winPlayPromise !== undefined) {
                winPlayPromise.catch(error => console.warn("Win sound playback prevented:", error));
            }
        }
    }
    wheelAnimationFrameId = requestAnimationFrame(animateWheel);
    console.log("Animation started.");
}

function processSpinResult(segment) {
    // Используем CASINO_ID, который должен быть объявлен в promo.js
    const balanceKey = `playerBalance_${CASINO_ID}`; 
    let currentBalance = parseFloat(localStorage.getItem(balanceKey)) || 0;
    currentBalance = parseFloat((currentBalance + segment.value).toFixed(2));
    localStorage.setItem(balanceKey, currentBalance.toFixed(2));
    console.log("Balance updated in localStorage:", currentBalance.toFixed(2));

    wheelResultDisplay.textContent = `Congratulations! You won $${segment.value}!`;
    wheelResultDisplay.style.color = '#00FF00';

    // ПРЯМОЕ ОБНОВЛЕНИЕ БАЛАНСА В ШАПКЕ
    if (balanceDisplay) { // Убеждаемся, что элемент существует
        balanceDisplay.textContent = currentBalance.toFixed(2);
        console.log("Balance display in header updated directly by wheel.js to:", currentBalance.toFixed(2));
    } else {
        console.warn("Element with ID 'balanceAmount' not found for direct update in wheel.js.");
    }
    
    isSpinning = false;
    spinWheelButton.disabled = false;
    console.log("Spin result processed and button enabled.");
}

function updateWheelCooldownDisplay() {
    const currentTime = Date.now();
    const timeElapsed = currentTime - lastSpinTime;
    const timeLeft = COOLDOWN_DURATION_MS - timeElapsed;

    if (timeLeft <= 0) {
        wheelCooldownDisplay.textContent = 'Ready to spin!';
        wheelCooldownDisplay.style.color = '#00FF00';
        spinWheelButton.disabled = false;
    } else {
        spinWheelButton.disabled = true;
        const minutes = Math.floor(timeLeft / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        wheelCooldownDisplay.textContent = `Next spin in: ${minutes}m ${seconds}s`;
        wheelCooldownDisplay.style.color = '#FFD700';
        setTimeout(updateWheelCooldownDisplay, 1000);
    }
}

// --- Event Listeners ---
spinWheelButton.addEventListener('click', spinWheel);


// --- Initial Setup on Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded. Initializing Wheel of Fortune.");
    if (!fortuneWheelCanvas) {
        console.error("Canvas element with ID 'fortuneWheelCanvas' not found!");
        return;
    }
    if (!ctx) {
        console.error("2D rendering context for canvas not available!");
        return;
    }

    // Инициализация или установка баланса при загрузке страницы.
    // Вызываем window.loadBalance() из promo.js, если она существует,
    // так как она может выполнять другие начальные настройки, связанные с балансом.
    if (typeof window.loadBalance === 'function') { 
        window.loadBalance(); 
        console.log("window.loadBalance() from promo.js called.");
    } else {
        console.warn("window.loadBalance() from promo.js not found. Wheel of Fortune will ensure balance exists.");
        const balanceKey = `playerBalance_${CASINO_ID}`; // Используем CASINO_ID из promo.js
        if (localStorage.getItem(balanceKey) === null || isNaN(parseFloat(localStorage.getItem(balanceKey)))) {
             localStorage.setItem(balanceKey, "1000.00");
             console.log("Initial balance 1000.00 set in localStorage (fallback).");
        }
    }

    drawWheel(0); // Инициализируем отрисовку колеса (без начального поворота)
    
    // ПРЯМОЕ ОБНОВЛЕНИЕ БАЛАНСА В ШАПКЕ ПРИ ИНИЦИАЛИЗАЦИИ
    const balanceKey = `playerBalance_${CASINO_ID}`; // Используем CASINO_ID из promo.js
    const currentBalance = parseFloat(localStorage.getItem(balanceKey)) || 0;
    if (balanceDisplay) {
        balanceDisplay.textContent = currentBalance.toFixed(2);
        console.log("Initial balance display updated directly by wheel.js to:", currentBalance.toFixed(2));
    } else {
        console.warn("Element with ID 'balanceAmount' not found for initial display in wheel.js.");
    }

    updateWheelCooldownDisplay();
    wheelResultDisplay.textContent = '';
    console.log("Wheel of Fortune initialization complete.");
});
