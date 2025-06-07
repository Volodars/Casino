// blackjack.js - Main JavaScript for the Blackjack game

// --- DOM Elements ---
const balanceDisplay = document.getElementById('balanceAmount');
const currentBetDisplay = document.getElementById('currentBetDisplay');
const betAmountInput = document.getElementById('betAmountInput');
const setBetButton = document.getElementById('setBetButton');
const allInButton = document.getElementById('allInButton');
const dealButton = document.getElementById('dealButton');
const hitButton = document.getElementById('hitButton');
const standButton = document.getElementById('standButton');
const resultText = document.getElementById('resultText');

const dealerCardsDiv = document.getElementById('dealerCards');
const playerCardsDiv = document.getElementById('playerCards');
const dealerScoreSpan = document.getElementById('dealerScore');
const playerScoreSpan = document.getElementById('playerScore');

// --- Game State Variables ---
// playerBalance is declared and managed in promo.js and is globally accessible.
let currentBet = 100;
let gameStarted = false;
let deck = []; // Game deck
let playerCards = []; // Player's cards
let dealerCards = []; // Dealer's cards

// --- Image Assets ---
const cardImages = {}; // Object to store loaded Image objects

// Defining image paths for cards
// Important: Ensure these paths and filenames match your downloaded cards!
const CARD_SUITS = ['clubs', 'diamonds', 'hearts', 'spades'];
const CARD_RANKS = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'];

const IMAGE_BASE_PATH = '../Images/Cards/'; // Base path to the cards folder

function getCardImagePath(rank, suit) {
    // Forms the filename based on your principle: English_pattern_RANK_of_SUIT.svg
    // Ensure that ranks and suits in the filename match how you downloaded them.
    // If you have 5_of_clubs.svg, then rank will be '5' and suit 'clubs'.
    // For Ace, Jack, Queen, King use their string names: 'ace', 'jack', 'queen', 'king'.
    return `${IMAGE_BASE_PATH}English_pattern_${rank}_of_${suit}.svg`;
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
allCardImagePaths['card_back'] = `${IMAGE_BASE_PATH}card_back.jpg`; // Ensure .jpg format

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
                fallbackImg.src = `https://placehold.co/110x150/999999/FFFFFF?text=FAIL`; // Placeholder for larger cards
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
const chipSound = new Audio('../Music/ChipStack.mp3'); // Sound for betting
const winSound = new Audio('../Music/Win.mp3');      // Sound for winning
const loseSound = new Audio('../Music/Lose.mp3');    // Sound for losing

dealSound.volume = 0.5;
chipSound.volume = 0.6;
winSound.volume = 0.8;
loseSound.volume = 0.8;

dealSound.load();
chipSound.load();
winSound.load();
loseSound.load();

// --- Card Definitions and Deck Management ---

// Function to create a new deck
function createDeck() {
    deck = [];
    // Use 6 decks for blackjack - standard practice
    const numDecks = 6; 
    for (let i = 0; i < numDecks; i++) {
        CARD_SUITS.forEach(suit => {
            CARD_RANKS.forEach(rank => {
                let value;
                if (rank === 'ace') {
                    value = [1, 11]; // Ace can be 1 or 11
                } else if (rank === 'jack' || rank === 'queen' || rank === 'king') {
                    value = 10;
                } else {
                    value = parseInt(rank);
                }
                deck.push({ rank: rank, suit: suit, value: value, imageId: `${rank}_of_${suit}` });
            });
        });
    }
    console.log(`[Blackjack] Deck created: ${deck.length} cards.`);
}

// Function to shuffle the deck (Fisher-Yates shuffle)
function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]]; // Swap elements
    }
    console.log("[Blackjack] Deck shuffled.");
}

// Function to draw one card from the deck
function drawCard() {
    if (deck.length === 0) {
        console.warn("[Blackjack] Deck is empty, recreating and shuffling.");
        createDeck();
        shuffleDeck();
    }
    return deck.pop(); // Take the top card
}

// --- Score Calculation ---
function calculateScore(hand) {
    let score = 0;
    let numAces = 0;

    hand.forEach(card => {
        if (card.rank === 'ace') {
            numAces++;
            score += 11; // Count Ace as 11 initially
        } else {
            score += card.value;
        }
    });

    // If bust and there are Aces, recount them as 1
    while (score > 21 && numAces > 0) {
        score -= 10; // Subtract 10, turning 11 into 1
        numAces--;
    }
    return score;
}

// --- Card Rendering Functions ---

// Displays cards in the specified container
function renderCards(cards, containerElement, hideFirstCard = false) {
    containerElement.innerHTML = ''; // Clear container

    cards.forEach((card, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card'); // Apply base card styles

        const cardImage = document.createElement('img');
        if (hideFirstCard && index === 0) {
            // If the first card needs to be hidden (for dealer)
            cardImage.src = cardImages['card_back'].src;
            cardImage.alt = 'Card Back';
            cardDiv.classList.add('card-facedown'); // Add class for facedown card styling
        } else {
            // Faced-up card
            cardImage.src = cardImages[card.imageId].src;
            cardImage.alt = `${card.rank} of ${card.suit}`;
            cardDiv.classList.add('card-faceup'); // Add class for faceup card styling
        }
        cardDiv.appendChild(cardImage);
        containerElement.appendChild(cardDiv);
    });
}

// --- Display Functions ---
function updateDisplay() {
    // playerBalance is globally available from promo.js
    if (typeof updateBalanceDisplay === 'function') {
        updateBalanceDisplay(); // Update balance via promo.js
    } else {
        // Fallback if promo.js is not loaded (shouldn't happen if connected first)
        if (balanceDisplay && typeof playerBalance !== 'undefined') {
            balanceDisplay.textContent = playerBalance.toFixed(2);
        }
    }
    currentBetDisplay.textContent = currentBet.toFixed(2);
    betAmountInput.value = currentBet.toFixed(2);

    // Update score display, but for dealer only show visible card's value initially
    playerScoreSpan.textContent = calculateScore(playerCards);
    if (gameStarted && dealerCards.length > 0) {
        // If game started, dealer shows only the score of their open card
        dealerScoreSpan.textContent = dealerCards[0].rank === 'card_back' ? '?' : calculateScore(dealerCards.slice(1));
    } else {
        dealerScoreSpan.textContent = '0'; // Before game start or if no dealer cards
    }
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
    hitButton.disabled = true; // Initially disabled
    standButton.disabled = true; // Initially disabled
}

function disableGameControlsDuringRound() {
    setBetButton.disabled = true;
    allInButton.disabled = true;
    betAmountInput.disabled = true;
    dealButton.disabled = true;
    hitButton.disabled = false; // Enabled when player can hit
    standButton.disabled = false; // Enabled when player can stand
}

function disableAllGameControls() {
    setBetButton.disabled = true;
    allInButton.disabled = true;
    betAmountInput.disabled = true;
    dealButton.disabled = true;
    hitButton.disabled = true;
    standButton.disabled = true;
}

// --- Core Game Logic ---

function startGame() {
    // playerBalance is globally available from promo.js
    if (typeof playerBalance === 'undefined' || playerBalance < currentBet) {
        updateResultText('Insufficient balance or balance not loaded!', 'red');
        console.error("playerBalance is undefined or insufficient.", playerBalance);
        return;
    }
    if (currentBet <= 0) {
        updateResultText('Bet amount must be positive!', 'orange');
        return;
    }

    playerBalance -= currentBet; // Deduct bet
    saveBalance(); // Save balance (function from promo.js)
    chipSound.play(); // Play bet sound

    updateResultText('Game started! Your turn.', 'white');
    gameStarted = true;
    disableGameControlsDuringRound();
    
    playerCards = [];
    dealerCards = [];

    createDeck();
    shuffleDeck();

    // Deal initial cards
    // Player gets 2 face-up cards
    playerCards.push(drawCard());
    playerCards.push(drawCard());
    // Dealer gets one face-down and one face-up
    dealerCards.push(drawCard()); // This card will be hidden
    dealerCards.push(drawCard()); // This card will be face-up

    renderCards(playerCards, playerCardsDiv);
    renderCards(dealerCards, dealerCardsDiv, true); // Hide dealer's first card
    updateDisplay();

    // Check for Blackjack immediately after deal
    const playerScore = calculateScore(playerCards);
    const dealerScore = calculateScore(dealerCards);

    dealSound.play(); // Play deal sound

    setTimeout(() => { // Small delay for dealing animation
        if (playerScore === 21) {
            if (dealerScore === 21) {
                // Both Blackjack - Push
                endGame(true, 'push'); // Push (tie)
            } else {
                // Player Blackjack - Win 1.5x
                endGame(true, 'blackjack');
            }
        } else if (dealerScore === 21) {
            // Dealer Blackjack - Player loses
            endGame(false);
        }
    }, 1000); // Delay for sound and display

}

function playerHit() {
    if (!gameStarted) return;

    const newCard = drawCard();
    playerCards.push(newCard);
    renderCards(playerCards, playerCardsDiv);
    dealSound.play(); // Sound for drawing a card

    const playerScore = calculateScore(playerCards);
    playerScoreSpan.textContent = playerScore;

    if (playerScore > 21) {
        updateResultText(`Bust! You lose. -$${currentBet.toFixed(2)} 💥`, 'red');
        endGame(false); // Player busted
    } else if (playerScore === 21) {
        updateResultText('21! Great hand!', 'gold');
        // Automatically Stand if 21 (but not initial blackjack)
        playerStand(); 
    }
}

function playerStand() {
    if (!gameStarted) return;

    updateResultText('You stand. Dealer\'s turn.', 'white');
    disableAllGameControls(); // Disable player buttons

    // Reveal dealer's first card
    renderCards(dealerCards, dealerCardsDiv, false); // All dealer's cards are now visible
    dealerScoreSpan.textContent = calculateScore(dealerCards); // Update dealer's score

    // Dealer's logic: hit until 17 or more
    setTimeout(() => {
        dealerTurn();
    }, 1500); // Delay before dealer's turn
}

function dealerTurn() {
    let dealerScore = calculateScore(dealerCards);
    const playerScore = calculateScore(playerCards);

    // Dealer hits until score is 17 or more
    // Add a check so dealer doesn't hit if player already busted
    if (playerScore > 21) { 
        // Player already lost, dealer can just reveal cards and game ends
        return;
    }

    while (dealerScore < 17) {
        const newCard = drawCard();
        dealerCards.push(newCard);
        renderCards(dealerCards, dealerCardsDiv, false);
        dealSound.play(); // Sound for dealer drawing a card
        dealerScore = calculateScore(dealerCards);
        dealerScoreSpan.textContent = dealerScore;
        // Could add a small delay here if step-by-step drawing animation is desired
    }

    // Determine winner
    if (dealerScore > 21) {
        updateResultText(`Dealer busts! You win! 🎉 +$${(currentBet * 2).toFixed(2)} (2X)`, 'green');
        endGame(true, 'win');
    } else if (dealerScore >= playerScore) { // Dealer wins or it's a push
        if (dealerScore === playerScore) {
            updateResultText(`Push!🤝 Bet returned: +$${currentBet.toFixed(2)}`, 'yellow');
            endGame(true, 'push');
        } else {
            updateResultText(`You lose.😔 Dealer wins. -$${currentBet.toFixed(2)}`, 'red');
            endGame(false);
        }
    } else { // Player wins
        updateResultText(`You win! +$${(currentBet * 2).toFixed(2)} 🎉`, 'green');
        endGame(true, 'win');
    }
}

function endGame(playerWon, type = 'lose') {
    gameStarted = false;
    dealButton.disabled = false; // Enable "Deal" button for a new game
    hitButton.disabled = true;
    standButton.disabled = true;
    setBetButton.disabled = false;
    allInButton.disabled = false;
    betAmountInput.disabled = false;

    let winnings = 0;
    let finalMessage = '';

    if (playerWon) {
        if (type === 'blackjack') {
            winnings = currentBet * 2.5; // Blackjack 3:2 payout
            finalMessage = `BLACKJACK! You win +$${winnings.toFixed(2)} (3:2 payout)! 🎉`;
        } else if (type === 'win') {
            winnings = currentBet * 2; // Regular win 1:1 payout
            finalMessage = `You win! +$${winnings.toFixed(2)} 🎉`;
        } else if (type === 'push') {
            winnings = currentBet; // Push, bet returned
            finalMessage = `Push! Bet returned: +$${winnings.toFixed(2)} 🤝`;
        }
        playerBalance = parseFloat((playerBalance + winnings).toFixed(2));
        saveBalance(); // Save balance (function from promo.js)
        if (type !== 'push') { // Play win sound only on win, not on push
            winSound.play();
        }
    } else {
        // Balance was already deducted at the start of the game for a loss.
        finalMessage = `You lose! -$${currentBet.toFixed(2)} 😔`;
        loseSound.play();
    }
    updateResultText(finalMessage, playerWon ? 'green' : 'red'); // Set color based on win/loss
    if (type === 'push') { updateResultText(finalMessage, 'yellow'); } // Yellow for push
    updateDisplay(); // Update UI with new balance
}


// --- Event Listeners ---
setBetButton.addEventListener('click', () => {
    if (gameStarted) { updateResultText("Cannot change bet during the game!", 'orange'); return; }
    let newBet = parseFloat(betAmountInput.value);
    if (isNaN(newBet) || newBet <= 0) {
        updateResultText('Bet must be a positive number!', 'orange');
        return;
    }
    newBet = parseFloat(newBet.toFixed(2));
    // playerBalance is globally available from promo.js
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
    // playerBalance is globally available from promo.js
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
hitButton.addEventListener('click', playerHit);
standButton.addEventListener('click', playerStand);

// --- Initial Setup on Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    // Before starting the game:
    // 1. Set playerBalance if promo.js is loaded
    // (promo.js must be connected BEFORE blackjack.js for playerBalance to exist)
    if (typeof loadBalance === 'function') { // Check if loadBalance function is available
        loadBalance(); // Load balance from promo.js
    } else {
        // Fallback if promo.js is somehow not loaded
        console.error("promo.js or loadBalance() not found. Balance may not work correctly.");
        playerBalance = parseFloat(localStorage.getItem('playerBalance_default_casino')) || 1000; // Try to load default
    }
    
    // 2. Preload all card images
    preloadImages(allCardImagePaths).then(() => {
        console.log("[Blackjack] All card images loaded.");
        updateDisplay(); // Update display after loading balance and cards
        enableGameControls(); // Enable initial buttons
        updateResultText('Place your bet and click "Deal"!', 'white');
    }).catch(error => {
        console.error("Error preloading card images:", error);
        updateResultText("Error loading game resources. Check console for details.", 'red');
        disableAllGameControls(); // Disable everything on error
    });
});
