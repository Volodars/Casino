// JavaScript/casino_war.js - Main JavaScript for the Casino War game

// --- DOM Elements ---
const balanceDisplay = document.getElementById('balanceAmount');
const currentBetDisplay = document.getElementById('currentBetDisplay');
const betAmountInput = document.getElementById('betAmountInput');
const setBetButton = document.getElementById('setBetButton');
const allInButton = document.getElementById('allInButton');
const dealButton = document.getElementById('dealButton');
const goWarButton = document.getElementById('goWarButton');
const surrenderButton = document.getElementById('surrenderButton');
const resultText = document.getElementById('resultText');

const dealerCardsDiv = document.getElementById('dealerCards');
const playerCardsDiv = document.getElementById('playerCards');
const dealerCardDisplay = document.getElementById('dealerCardDisplay'); // For text display of dealer's card
const playerCardDisplay = document.getElementById('playerCardDisplay'); // For text display of player's card

// --- Game State Variables ---
// playerBalance is managed in promo.js and is globally accessible.
let currentBet = 100;
let gameStarted = false;
let deck = []; // Game deck
let playerCard = null; // Player's card
let dealerCard = null; // Dealer's card
let warBet = 0; // Additional bet in case of "war"

// --- Image Assets ---
const cardImages = {}; // Object to store loaded Image objects

// Defining image paths for cards
// Important: Ensure these paths and filenames match your downloaded cards!
const CARD_SUITS = ['clubs', 'diamonds', 'hearts', 'spades'];
const CARD_RANKS = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'];

const IMAGE_BASE_PATH = '../Images/Anime_cards/'; // Base path to the cards folder

function getCardImagePath(rank, suit) {
    if (['ace', 'jack', 'queen', 'king'].includes(rank)) {
        // For face cards - with capitalized names
        const capitalizedRank = rank.charAt(0).toUpperCase() + rank.slice(1);
        const capitalizedSuit = suit.charAt(0).toUpperCase() + suit.slice(1);
        return `${IMAGE_BASE_PATH}${capitalizedRank}_of_${capitalizedSuit}.png`;
    } else {
        // For numeric cards - all lowercase filenames
        return `${IMAGE_BASE_PATH}${rank}_of_${suit}.png`;
    }
}

const allCardImagePaths = {};
// Add paths for all 52 cards
CARD_SUITS.forEach(suit => {
    CARD_RANKS.forEach(rank => {
        const imageId = `${rank}_of_${suit}`;
        allCardImagePaths[imageId] = getCardImagePath(rank, suit);
    });
});
// Add path for the card back
allCardImagePaths['card_back'] = `${IMAGE_BASE_PATH}card_back.png`; // Ensure .png format

// Function to preload all images
function preloadImages(paths) {
    const promises = [];
    Object.keys(paths).forEach(key => {
        const img = new Image();
        img.src = paths[key];
        promises.push(new Promise((resolve, reject) => {
            img.onload = () => {
                cardImages[key] = img; // Store the loaded Image object
                resolve();
            };
            img.onerror = () => {
                console.error(`Failed to load image: ${paths[key]}. Using fallback.`);
                // Fallback image in case of loading error
                const fallbackImg = new Image();
                fallbackImg.src = `https://placehold.co/110x150/999999/FFFFFF?text=FAIL`; // Placeholder for cards
                fallbackImg.onload = () => {
                    cardImages[key] = fallbackImg;
                    resolve();
                };
                fallbackImg.onerror = () => reject(`Failed to load fallback for ${paths[key]}`);
            };
        }));
    });
    return Promise.all(promises);
}

// --- Sound Effects ---
// Important: Ensure these paths are correct for your files!
const dealSound = new Audio('../Music/CardDeal.mp3'); // Sound for dealing cards
// const chipSound = new Audio('../Music/ChipStack.mp3'); // Sound for betting
const winSound = new Audio('../Music/Win.mp3');       // Sound for winning
const loseSound = new Audio('../Music/Lose.mp3');      // Sound for losing

dealSound.volume = 0.5;
// chipSound.volume = 0.6;
winSound.volume = 0.8;
loseSound.volume = 0.8;

dealSound.load();
// chipSound.load();
winSound.load();
loseSound.load();

// --- Card Definitions and Deck Management ---

// Function to create a new deck
function createDeck() {
    deck = [];
    // Use 6 decks
    const numDecks = 6; 
    for (let i = 0; i < numDecks; i++) {
        CARD_SUITS.forEach(suit => {
            CARD_RANKS.forEach(rank => {
                let value;
                if (rank === 'ace') {
                    value = 14; // Ace is the highest card in Casino War
                } else if (rank === 'king') {
                    value = 13;
                } else if (rank === 'queen') {
                    value = 12;
                } else if (rank === 'jack') {
                    value = 11;
                } else {
                    value = parseInt(rank);
                }
                deck.push({ rank: rank, suit: suit, value: value, imageId: `${rank}_of_${suit}` });
            });
        });
    }
    console.log(`[Casino War] Deck created: ${deck.length} cards.`);
}

// Function to shuffle the deck (Fisher-Yates shuffle)
function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]]; // Swap elements
    }
    console.log("[Casino War] Deck shuffled.");
}

// Function to draw one card from the deck
function drawCard() {
    if (deck.length === 0) {
        console.warn("[Casino War] Deck is empty, recreating and shuffling.");
        createDeck();
        shuffleDeck();
    }
    return deck.pop(); // Take the top card
}

// --- Card Rendering Functions ---
// Displays cards in the specified container
function renderCards(cards, containerElement, showCardBack = false) {
    containerElement.innerHTML = ''; // Clear container

    cards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card'); // Apply base card styles

        const cardImage = document.createElement('img');
        if (showCardBack) {
            cardImage.src = cardImages['card_back'].src;
            cardImage.alt = 'Card Back';
            cardDiv.classList.add('card-facedown');
        } else {
            cardImage.src = cardImages[card.imageId].src;
            cardImage.alt = `${card.rank} of ${card.suit}`;
            cardDiv.classList.add('card-faceup');
        }
        cardDiv.appendChild(cardImage);
        containerElement.appendChild(cardDiv);
    });
}

// --- UI Display Functions ---
function updateDisplay() {
    // playerBalance is globally available from promo.js
    if (typeof updateBalanceDisplay === 'function') {
        updateBalanceDisplay(); // Update balance via promo.js
    } else {
        // Fallback if promo.js is not loaded
        if (balanceDisplay && typeof playerBalance !== 'undefined') {
            balanceDisplay.textContent = playerBalance.toFixed(2);
        }
    }
    currentBetDisplay.textContent = (currentBet + warBet).toFixed(2); // Display total bet (initial + war bet)
    betAmountInput.value = currentBet.toFixed(2); // Input field always shows initial bet

    // Update text values of cards
    dealerCardDisplay.textContent = dealerCard ? `${dealerCard.rank.toUpperCase()} of ${dealerCard.suit.toUpperCase()}` : 'N/A';
    playerCardDisplay.textContent = playerCard ? `${playerCard.rank.toUpperCase()} of ${playerCard.suit.toUpperCase()}` : 'N/A';
}

function updateResultText(message, color = 'white') {
    resultText.textContent = message;
    resultText.style.color = color;
}

// --- Game Control Functions ---

function enableGameControls() {
    setBetButton.disabled = false;
    allInButton.disabled = false;
    betAmountInput.disabled = false;
    dealButton.disabled = false;
    goWarButton.disabled = true; // Disabled by default
    surrenderButton.disabled = true; // Disabled by default
}

function disableGameControlsDuringRound() {
    setBetButton.disabled = true;
    allInButton.disabled = true;
    betAmountInput.disabled = true;
    dealButton.disabled = true;
    goWarButton.disabled = true;
    surrenderButton.disabled = true;
}

function disableAllGameControls() {
    setBetButton.disabled = true;
    allInButton.disabled = true;
    betAmountInput.disabled = true;
    dealButton.disabled = true;
    goWarButton.disabled = true;
    surrenderButton.disabled = true;
}

// --- Core Game Logic ---

function startGame() {
    if (typeof playerBalance === 'undefined' || playerBalance < currentBet) {
        updateResultText('Insufficient balance or balance not loaded!', 'red');
        console.error("playerBalance is undefined or insufficient.", playerBalance);
        return;
    }
    if (currentBet <= 0) {
        updateResultText('Bet amount must be positive!', 'orange');
        return;
    }

    // Reset game state for a new round
    gameStarted = true;
    warBet = 0; // Reset war bet
    playerCard = null;
    dealerCard = null;
    dealerCardsDiv.innerHTML = '';
    playerCardsDiv.innerHTML = '';

    playerBalance -= currentBet; // Deduct initial bet
    saveBalance(); // Save balance (function from promo.js)
    // chipSound.play(); // Play bet sound

    updateResultText('Game started! Dealing cards...', 'white');
    disableGameControlsDuringRound();

    createDeck();
    shuffleDeck();

    // Deal one card to player and one to dealer
    playerCard = drawCard();
    dealerCard = drawCard();

    renderCards([playerCard], playerCardsDiv);
    renderCards([dealerCard], dealerCardsDiv);
    updateDisplay(); // Update card and bet display

    dealSound.play(); // Play deal sound

    setTimeout(() => {
        // Compare cards
        if (playerCard.value > dealerCard.value) {
            updateResultText(`You win! Your ${playerCard.rank.toUpperCase()} is higher than the dealer's ${dealerCard.rank.toUpperCase()}! +$${(currentBet * 2).toFixed(2)} 🎉`, 'green');
            endGame(true, 'win');
        } else if (dealerCard.value > playerCard.value) {
            updateResultText(`You lose. Dealer's ${dealerCard.rank.toUpperCase()} is higher than your ${playerCard.rank.toUpperCase()}. -$${currentBet.toFixed(2)} 😔`, 'red');
            endGame(false);
        } else {
            // Tie - offer "Go to War" or "Surrender"
            updateResultText(`Tie! You and the dealer both have ${playerCard.rank.toUpperCase()}. Choose: "Go to War" or "Surrender"`, 'yellow');
            goWarButton.disabled = false;
            surrenderButton.disabled = false;
        }
    }, 1500); // Delay for dealing animation
}

function goWar() {
    if (typeof playerBalance === 'undefined' || playerBalance < currentBet) { // Check if balance is sufficient for doubled bet
        updateResultText('Insufficient balance for War! Please surrender.', 'red');
        goWarButton.disabled = true; // Disable if not enough money for war
        return;
    }

    playerBalance -= currentBet; // Deduct additional bet for war
    saveBalance();
    // chipSound.play(); // Play bet sound

    warBet = currentBet; // Double the bet
    updateDisplay();
    updateResultText('Going to War! Dealing cards...', 'white');
    disableAllGameControls(); // Disable all buttons

    // "Burn" 3 cards, then deal one new card each
    for (let i = 0; i < 3; i++) {
        drawCard(); // Burn cards
    }

    // Deal new cards for the war
    const newPlayerCard = drawCard();
    const newDealerCard = drawCard();

    // Clear old cards and show new ones
    playerCardsDiv.innerHTML = '';
    dealerCardsDiv.innerHTML = '';

    renderCards([newPlayerCard], playerCardsDiv);
    renderCards([newDealerCard], dealerCardsDiv);
    
    // Update text values of cards
    playerCardDisplay.textContent = `${newPlayerCard.rank.toUpperCase()} of ${newPlayerCard.suit.toUpperCase()}`;
    dealerCardDisplay.textContent = `${newDealerCard.rank.toUpperCase()} of ${newDealerCard.suit.toUpperCase()}`;

    dealSound.play(); // Play deal sound

    setTimeout(() => {
        if (newPlayerCard.value >= newDealerCard.value) {
            let totalWinnings = currentBet * 2 + warBet * 2; // Initial bet + war bet * 2
            if (newPlayerCard.value === newDealerCard.value) {
                 // In case of a second tie in war, bet is returned (in most rules)
                updateResultText(`Another Tie in War! Bet returned: +$${(currentBet + warBet).toFixed(2)} 🤝`, 'yellow');
                endGame(true, 'push'); // Return both bets
            } else {
                updateResultText(`You won the War! Your ${newPlayerCard.rank.toUpperCase()} is higher! +$${totalWinnings.toFixed(2)} 🎉`, 'green');
                endGame(true, 'war_win');
            }
        } else {
            updateResultText(`You lost the War. Dealer's ${newDealerCard.rank.toUpperCase()} is higher. -$${(currentBet + warBet).toFixed(2)} 😔`, 'red');
            endGame(false);
        }
    }, 1500); // Delay for animation
}

function surrender() {
    playerBalance += currentBet / 2; // Return half of the initial bet
    saveBalance();
    updateDisplay();
    updateResultText(`You surrendered. You get back $${(currentBet / 2).toFixed(2)}. You lost $${(currentBet / 2).toFixed(2)} 😔`, 'red');
    loseSound.play(); // Play lose sound
    endGame(false, 'surrender'); // Indicate it's a surrender, but result is a loss
}

function endGame(playerWon, type = 'lose') {
    gameStarted = false;
    enableGameControls(); // Enable buttons for a new game (Set Bet, All In, Deal)

    let winnings = 0;
    let finalMessage = '';

    if (playerWon) {
        if (type === 'win') {
            winnings = currentBet * 2; // 1:1 payout from initial bet
            finalMessage = `You win! +$${winnings.toFixed(2)} 🎉`;
        } else if (type === 'war_win') {
            winnings = (currentBet + warBet) * 2; // 1:1 payout from TOTAL bet (initial + war)
            finalMessage = `You won the War! +$${winnings.toFixed(2)} 🎉`;
        } else if (type === 'push') {
            winnings = currentBet + warBet; // Return both bets (initial and war bet)
            finalMessage = `Push! Bet returned: +$${winnings.toFixed(2)} 🤝`;
        }
        playerBalance = parseFloat((playerBalance + winnings).toFixed(2));
        saveBalance();
        if (type !== 'push') { // Play win sound only on win, not on push
            winSound.play();
        }
    } else {
        // Balance was already deducted at the start of the game or during war
        if (type === 'surrender') {
            // Balance already adjusted in surrender() function
            // currentBet / 2 is already lost
            finalMessage = `You surrendered. You get back $${(currentBet / 2).toFixed(2)}. You lost $${(currentBet / 2).toFixed(2)} 😔`;
        } else {
            finalMessage = `You lose! -$${(currentBet + warBet).toFixed(2)} 😔`;
        }
        loseSound.play();
    }
    updateResultText(finalMessage, playerWon ? 'green' : 'red'); // Set message color
    if (type === 'push') { updateResultText(finalMessage, 'yellow'); }
    updateDisplay(); // Update UI with new balance
}


// --- Event Listeners ---
setBetButton.addEventListener('click', () => {
    if (gameStarted) { updateResultText("Cannot change bet during the game!", 'orange'); return; }
    let newBet = parseFloat(betAmountInput.value);
    if (isNaN(newBet) || newBet <= 0) {
        updateResultText('Bet amount must be positive!', 'orange');
        return;
    }
    newBet = parseFloat(newBet.toFixed(2));
    if (typeof playerBalance === 'undefined') {
        updateResultText('Balance not loaded. Please reload the page.', 'red');
        return;
    }
    if (newBet > playerBalance) {
        updateResultText('Bet cannot exceed your balance!', 'red');
        return;
    }
    currentBet = newBet;
    updateDisplay();
    updateResultText(`Bet amount set: $${currentBet.toFixed(2)}`, 'white');
});

allInButton.addEventListener('click', () => {
    if (gameStarted) { updateResultText("Cannot go All In during the game!", 'orange'); return; }
    if (typeof playerBalance === 'undefined' || playerBalance <= 0) {
        updateResultText("You have insufficient balance to go All In or balance not loaded!", 'red');
        return;
    }
    currentBet = parseFloat(playerBalance.toFixed(2));
    betAmountInput.value = currentBet.toFixed(2);
    updateDisplay();
    updateResultText(`All In! Your bet is now $${currentBet.toFixed(2)}.`, 'white');
});

dealButton.addEventListener('click', startGame);
goWarButton.addEventListener('click', goWar);
surrenderButton.addEventListener('click', surrender);

// --- Initial Setup on Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    if (typeof loadBalance === 'function') { // Check if loadBalance function is available
        loadBalance(); // Load balance from promo.js
    } else {
        console.error("promo.js or loadBalance() not found. Balance may not work correctly.");
        playerBalance = parseFloat(localStorage.getItem('playerBalance_default_casino')) || 1000; // Try to load default
    }
    
    preloadImages(allCardImagePaths).then(() => {
        console.log("[Casino War] All card images loaded.");
        updateDisplay(); // Update display after loading balance and cards
        enableGameControls(); // Enable initial buttons
        updateResultText('Place your bet and click "Deal"!', 'white');
    }).catch(error => {
        console.error("Error preloading card images:", error);
        updateResultText("Error loading game resources. Check console for details.", 'red');
        disableAllGameControls(); // Disable everything on error
    });
});
