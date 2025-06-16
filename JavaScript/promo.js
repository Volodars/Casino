// promo.js - Centralized JavaScript for common functionalities (Для первого казино)

// --- Уникальный идентификатор для ЭТОГО казино ---
const CASINO_ID = 'casino_alpha'; // <--- ЗАДАЙ УНИКАЛЬНЫЙ ID ДЛЯ ЭТОГО КАЗИНО!

// --- DOM Elements (глобальные ссылки, инициализируются внутри DOMContentLoaded) ---
let balanceAmountSpan;
let promoCodeInput;
let redeemPromoButton;
let promoCodeResult;

// --- Game State Variables (playerBalance будет загружен позже) ---
let playerBalance; // Теперь инициализируется функцией loadBalance()

// --- Promo Code Configuration ---
const PROMO_CODES = {
    '1305821e52ea6ddaab2287207c5f9481b0a1b569b32ddfccf4a3da7cbefa0cf6': { amount: 100, type: 'one-time' },
    '185f8db32271fe25f561a6fc938b2e264306ec304eda518007d1764826381969': { amount: 1000, type: 'one-time' },
    '2ccb9b89c4b406a8b5b6535efa715bd8e8ab17f776895bf39ac5350995f97cd3': { amount: 777777777, type: 'eternal' },
    '3abe29be638d9972468724407d3eec58c0d73adac7d3331a54469b3def4874b5': { amount: 500, type: 'one-time' },
    '382e766581df7c496ef87244f943dedcd74d6b6aab8af8789df88a6a22d170eb': { amount: 1000, type: 'limited', uses:10 },
    '4a892d8d889b8ac36ad05177e90d4ea4dfa53ccb6a7ca91581a0245e28ee7417': { amount: 1000, type: 'eternal' },
    '33c41a45efcc036f175499ba11421fb67029ea6b71a273a77299fadbe9ebf931': { amount: 100000, type: 'eternal' }
};

const BANNER_HASH = '185f8db32271fe25f561a6fc938b2e264306ec304eda518007d1764826381969';
async function hashPromoCode(code) {
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// --- State Variable for Redeemed Codes ---
let redeemedPromoCodes = []; // Будет хранить использованные коды для ЭТОГО казино
let globalPromoUses = JSON.parse(localStorage.getItem('promoGlobalUses')||'{}');

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
    playerBalance = parseFloat(savedBalance) || 0; // Начальный баланс 1000, если нет сохранения
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
async function redeemPromoCode() {
    if (!promoCodeInput || !promoCodeResult) return;

    const rawCode = promoCodeInput.value.trim();
    if (!rawCode) {
        promoCodeResult.textContent = 'Enter promo code!';
        promoCodeResult.style.color = 'orange';
        return;
    }

    const code = rawCode.trim();
    const codeHash = await hashPromoCode(code);

    const promoDetails = PROMO_CODES[codeHash];
    if (!promoDetails) {
        promoCodeResult.textContent = 'Invalid promo code!';
        promoCodeResult.style.color = 'red';
        return;
    }

    if (promoDetails.type === 'one-time' && redeemedPromoCodes.includes(codeHash)) {
        promoCodeResult.textContent = 'This promo code has already been activated!';
        promoCodeResult.style.color = 'red';
        return;
    }

    const amount = promoDetails.amount;
    playerBalance = parseFloat((playerBalance + amount).toFixed(2));

    if (promoDetails.type === 'one-time') {
        redeemedPromoCodes.push(codeHash);
    }

    saveBalance();
    updateBalanceDisplay();
    promoCodeResult.textContent = `Promo code activated! You received ${amount.toFixed(2)} balance! 🎉`;
    promoCodeResult.style.color = 'green';
    promoCodeInput.value = '';

    if (codeHash === BANNER_HASH) {
        localStorage.setItem('promoBannerHidden', 'true');   // запоминаем
        const banner = document.getElementById('promoBanner');
        banner.classList.remove('hidden-instantly'); // на всякий случай
        banner.classList.add('hide');

        setTimeout(() => {
            banner.style.display = 'none';
        }, 3200);
    }


    if (promoDetails.type === 'limited'){
        const used = globalPromoUses[codeHash] || 0;
        if (used >= promo.uses){
            showMsg('Promo code has been exhausted!');
            return;
        }
        globalPromoUses[codeHash] = used + 1;
        localStorage.setItem('promoGlobalUses',JSON.stringify(globalPromoUses));
    }
}



// --- Initial Setup and Event Listeners on Page Load ---
document.addEventListener('DOMContentLoaded', () => {

    const banner = document.getElementById('promoBanner');
    if (banner && localStorage.getItem('promoBannerHidden') === 'true') {
        banner.classList.add('hidden-instantly');
    }
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
