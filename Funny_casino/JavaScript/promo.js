// promo.js - Centralized JavaScript for common functionalities (Для второго казино)

// --- Уникальный идентификатор для ЭТОГО казино ---
const CASINO_ID = 'casino_beta'; // <--- ЗАДАЙ УНИКАЛЬНЫЙ ID ДЛЯ ЭТОГО КАЗИНО!

// --- DOM Elements (глобальные ссылки, инициализируются внутри DOMContentLoaded) ---
let balanceAmountSpan;
let promoCodeInput;
let redeemPromoButton;
let promoCodeResult;

// --- Game State Variables (playerBalance будет загружен позже) ---
let playerBalance; // Теперь инициализируется функцией loadBalance()

// --- Promo Code Configuration ---
const PROMO_CODES = {
    'WELCOME100': { amount: 100, type: 'one-time' },
    'FREESPIN': { amount: 50, type: 'one-time' },
    'LUCKY20': { amount: 20, type: 'one-time' },
    'ETERNAL1K': { amount: 1000, type: 'eternal' },
    'VOLK770': { amount: 100000, type: 'eternal' },
    'DEMJANHUESOS': { amount: 1000, type: 'eternal' }
};

// --- State Variable for Redeemed Codes ---
let redeemedPromoCodes = []; // Будет хранить использованные коды для ЭТОГО казино

// --- Balance Key Management ---
// Эта функция теперь генерирует уникальный ключ для баланса, используя жестко заданный CASINO_ID
function getCasinoBalanceKey() {
    return `playerBalance_${CASINO_ID}`;
}

// Эта функция генерирует ключ для состояния промокодов
function getCasinoRedeemedCodesKey() {
    return `redeemedPromoCodes_${CASINO_ID}`;
}

// --- Display and Storage Functions ---

// Загружает баланс для ТЕКУЩЕГО казино
function loadBalance() {
    const key = getCasinoBalanceKey();
    const savedBalance = localStorage.getItem(key);
    playerBalance = parseFloat(savedBalance) || 0; // Начальный баланс 0, если нет сохранения
    console.log(`[promo.js - ${CASINO_ID}] Loaded balance: ${playerBalance.toFixed(2)}`);

    // Загружаем состояние использованных промокодов для ТЕКУЩЕГО казино
    const redeemedKey = getCasinoRedeemedCodesKey();
    redeemedPromoCodes = JSON.parse(localStorage.getItem(redeemedKey)) || [];
    console.log(`[promo.js - ${CASINO_ID}] Loaded redeemed codes:`, redeemedPromoCodes);
}

// Сохраняет баланс для ТЕКУЩЕГО казино
function saveBalance() {
    const key = getCasinoBalanceKey();
    localStorage.setItem(key, playerBalance.toFixed(2));
    console.log(`[promo.js - ${CASINO_ID}] Saved balance: ${playerBalance.toFixed(2)}`);

    // Сохраняем состояние использованных промокодов для ТЕКУЩЕГО казино
    const redeemedKey = getCasinoRedeemedCodesKey();
    localStorage.setItem(redeemedKey, JSON.stringify(redeemedPromoCodes));
}

// Updates the player's balance in the header across all pages
function updateBalanceDisplay() {
    if (balanceAmountSpan) { 
        balanceAmountSpan.textContent = playerBalance.toFixed(2);
    }
    const balanceAmountDropdown = document.getElementById('balanceAmountDropdown');
    if (balanceAmountDropdown) {
        balanceAmountDropdown.textContent = playerBalance.toFixed(2);
    }
}

// --- Promo Code Functionality ---
function redeemPromoCode() {
    if (!promoCodeInput || !promoCodeResult) {
        console.error("Promo code elements not found.");
        return;
    }

    const code = promoCodeInput.value.trim().toUpperCase(); 

    if (!code) {
        promoCodeResult.textContent = 'Введите промокод!';
        promoCodeResult.style.color = 'orange';
        return;
    }

    const promoDetails = PROMO_CODES[code];

    if (!promoDetails) {
        promoCodeResult.textContent = 'Неверный промокод!';
        promoCodeResult.style.color = 'red';
        return;
    }

    if (promoDetails.type === 'one-time' && redeemedPromoCodes.includes(code)) {
        promoCodeResult.textContent = 'Этот промокод уже был активирован!';
        promoCodeResult.style.color = 'red';
        return;
    }

    const amount = promoDetails.amount;
    playerBalance = parseFloat((playerBalance + amount).toFixed(2));
    
    if (promoDetails.type === 'one-time') {
        redeemedPromoCodes.push(code);
    }
    
    // Сохраняем ОБА значения: баланс и список использованных промокодов
    saveBalance(); 
    updateBalanceDisplay();
    promoCodeResult.textContent = `Промокод активирован! Вы получили ${amount.toFixed(2)} баланса! 🎉`;
    promoCodeResult.style.color = 'green';
    promoCodeInput.value = ''; // Очищаем поле ввода
}

// --- Initial Setup and Event Listeners on Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем ссылки на DOM-элементы ТОЛЬКО после полной загрузки DOM
    balanceAmountSpan = document.getElementById('balanceAmount');
    promoCodeInput = document.getElementById('promoCodeInput');
    redeemPromoButton = document.getElementById('redeemPromoButton'); // Опечатка в оригинале, исправил
    promoCodeResult = document.getElementById('promoCodeResult');

    // Загружаем баланс и состояние промокодов для ТЕКУЩЕГО казино при загрузке страницы
    loadBalance();
    updateBalanceDisplay();

    // Очищаем сообщение о результате промокода при загрузке страницы
    if (promoCodeResult) {
        promoCodeResult.textContent = '';
    }

    // Прикрепляем слушатель события к кнопке "Redeem"
    if (redeemPromoButton) {
        redeemPromoButton.addEventListener('click', redeemPromoCode);
    }

    // Добавляем слушатель события для клавиши Enter на поле ввода промокода
    if (promoCodeInput) {
        promoCodeInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                if (redeemPromoButton) redeemPromoButton.click();
            }
        });
    }
});
