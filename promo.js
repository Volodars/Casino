// promo.js - Centralized JavaScript for common functionalities

// --- DOM Elements (глобальные ссылки, инициализируются внутри DOMContentLoaded) ---
// Объявляем переменные без инициализации, чтобы они были доступны в глобальной области видимости
let balanceAmountSpan;
let promoCodeInput;
let redeemPromoButton;
let promoCodeResult;

// --- Game State Variables (loaded from localStorage) ---
let playerBalance = parseFloat(localStorage.getItem('playerBalance')) || 1000;

// --- Promo Code Configuration ---
const PROMO_CODES = {
    'WELCOME100': { amount: 100, type: 'one-time' },
    'FREESPIN': { amount: 50, type: 'one-time' },
    'LUCKY20': { amount: 20, type: 'one-time' },
    'ETERNAL1K': { amount: 1000, type: 'eternal' }, // Ваш бесконечный промокод
    'VOLK770': { amount: 100000, type: 'eternal' },
    'DEMJANHUESOS': { amount: 1000, type: 'eternal' }
};

// --- State Variable for Redeemed Codes ---
let redeemedPromoCodes = JSON.parse(localStorage.getItem('redeemedPromoCodes')) || [];

// --- Display Functions ---

// Updates the player's balance in the header across all pages
function updateBalanceDisplay() {
    if (balanceAmountSpan) { // Проверяем, что элемент найден
        balanceAmountSpan.textContent = playerBalance.toFixed(2);
    }
    // Если у вас есть второй span для баланса в выпадающем меню, обновите и его
    const balanceAmountDropdown = document.getElementById('balanceAmountDropdown');
    if (balanceAmountDropdown) {
        balanceAmountDropdown.textContent = playerBalance.toFixed(2);
    }
}

// --- Initial Setup and Event Listeners on Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем ссылки на DOM-элементы ТОЛЬКО после полной загрузки DOM
    balanceAmountSpan = document.getElementById('balanceAmount');
    promoCodeInput = document.getElementById('promoCodeInput');
    redeemPromoButton = document.getElementById('redeemPromoButton');
    promoCodeResult = document.getElementById('promoCodeResult');

    // Обновляем отображение баланса сразу после загрузки
    updateBalanceDisplay();

    // Очищаем сообщение о результате промокода при загрузке страницы
    if (promoCodeResult) {
        promoCodeResult.textContent = '';
    }

    // --- Promo Code Functionality (теперь внутри DOMContentLoaded) ---
    // Прикрепляем слушатель события к кнопке только после того, как убедимся, что все элементы существуют
    if (redeemPromoButton && promoCodeInput && promoCodeResult) {
        redeemPromoButton.addEventListener('click', () => {
            const code = promoCodeInput.value.trim().toUpperCase(); // Get and clean the input code

            if (!code) {
                promoCodeResult.textContent = 'Please enter a promo code!';
                promoCodeResult.style.color = 'orange';
                return;
            }

            const promoDetails = PROMO_CODES[code];

            if (!promoDetails) {
                promoCodeResult.textContent = 'Invalid promo code!';
                promoCodeResult.style.color = 'red';
                return;
            }

            if (promoDetails.type === 'one-time' && redeemedPromoCodes.includes(code)) {
                promoCodeResult.textContent = 'This code has already been redeemed!';
                promoCodeResult.style.color = 'red';
                return;
            }

            const amount = promoDetails.amount;
            playerBalance = parseFloat((playerBalance + amount).toFixed(2));
            localStorage.setItem('playerBalance', playerBalance.toFixed(2));

            if (promoDetails.type === 'one-time') {
                redeemedPromoCodes.push(code);
                localStorage.setItem('redeemedPromoCodes', JSON.stringify(redeemedPromoCodes));
            }

            updateBalanceDisplay();
            promoCodeResult.textContent = `Promo code redeemed! You received ${amount.toFixed(2)} balance! 🎉`;
            promoCodeResult.style.color = 'green';
            promoCodeInput.value = ''; // Clear the input field
        });

        // Добавляем слушатель события для клавиши Enter на поле ввода промокода
        promoCodeInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                redeemPromoButton.click(); // Симулируем клик по кнопке "Redeem"
            }
        });
    }
});