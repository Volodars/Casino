// === GLOBALS ===
const IMAGE_BASE_PATH = '../Images/Anime_cards/';
let deck = [];
let communityCards = [];
const opponentHands = {};
let gamePhase = 0;
let gameStarted = false;
let currentBet = 100;
let currentPot = 0;

const opponentCountSelect = document.getElementById('opponentCount');
const playerHand = document.getElementById('hand-0');
const communityContainer = document.getElementById('communityCards');
const phaseDisplay = document.getElementById('phaseDisplay');
const resultText = document.getElementById('pokerResult');

// Buttons
const dealButton = document.getElementById('dealButton');
const nextPhaseButton = document.getElementById('nextPhaseButton');
const revealButton = document.getElementById('revealButton');
const resetButton = document.getElementById('resetButton');
const betAmountInput = document.getElementById('pokerBetAmountInput');
const setBetButton = document.getElementById('pokerSetBetButton');
const allInButton = document.getElementById('pokerAllInButton');
const betDisplay = document.getElementById('pokerCurrentBetDisplay');

// --- Sound Effects --- // <-- НОВЫЙ БЛОК ДЛЯ ЗВУКОВ
const dealSound = new Audio('../Music/CardDeal.mp3'); // Звук раздачи карт
const winSound = new Audio('../Music/Win.mp3');       // Звук победы
const loseSound = new Audio('../Music/Lose.mp3');      // Звук поражения

dealSound.volume = 0.5;
winSound.volume = 0.8;
loseSound.volume = 0.8;

dealSound.load();
winSound.load();
loseSound.load();

// --- REMOVE THESE PLACEHOLDERS ---
// You should NOT redefine playerBalance, updateBalanceDisplay, or saveBalance here.
// They are managed by promo.js.
// So, the lines below will be DELETED from poker.js:
/*
let playerBalance = 1000.00; // <--- DELETE THIS LINE
function updateBalanceDisplay() { ... } // <--- DELETE THIS FUNCTION
function saveBalance() { ... } // <--- DELETE THIS FUNCTION
*/
// --- END REMOVED PLACEHOLDERS ---

// === INITIAL SETUP ===
document.addEventListener('DOMContentLoaded', () => {
    updatePhaseDisplay();
    updateDisplay();
    updateOpponentVisibility();
    revealButton.disabled = true;
    nextPhaseButton.disabled = true;
    resetButton.disabled = true;
    // Call updateBalanceDisplay from promo.js to ensure balance is shown on poker page load
    if (typeof updateBalanceDisplay === 'function') {
        updateBalanceDisplay();
    }
});

function updateOpponentVisibility() {
    const opponentCount = parseInt(opponentCountSelect.value);
    for (let i = 1; i <= 3; i++) {
        const opponentDiv = document.getElementById(`player-${i}`);
        opponentDiv.style.display = i <= opponentCount ? 'flex' : 'none';
    }
}
opponentCountSelect.addEventListener('change', updateOpponentVisibility);

// === BUTTON HANDLERS ===

setBetButton.addEventListener('click', () => {
    if (gameStarted) {
        updateResult('Cannot change bet during the game!', 'orange');
        return;
    }
    let bet = parseFloat(betAmountInput.value);
    if (isNaN(bet) || bet <= 0) {
        updateResult('Invalid bet amount!', 'orange');
        return;
    }
    // Access playerBalance from promo.js (it's a global variable)
    if (bet > playerBalance) { 
        updateResult('Bet exceeds balance!', 'red');
        return;
    }
    currentBet = bet;
    updateDisplay();
    updateResult(`Bet set to $${currentBet.toFixed(2)}.`, 'white');
});

allInButton.addEventListener('click', () => {
    if (gameStarted) {
        updateResult('Cannot go all-in during the game!', 'orange');
        return;
    }
    // Access playerBalance from promo.js
    currentBet = parseFloat(playerBalance.toFixed(2));
    betAmountInput.value = currentBet.toFixed(2);
    updateDisplay();
    updateResult(`All In! Bet set to $${currentBet.toFixed(2)}.`, 'white');
});

dealButton.addEventListener('click', () => {
    if (gameStarted) return;

    if (playerBalance < currentBet) {
        updateResult('Insufficient balance!', 'red');
        return;
    }

    currentPot = 0; // Сброс пота для новой игры

    // Ставка игрока
    playerBalance -= currentBet;
    currentPot += currentBet; // Добавляем в пот
    if (typeof saveBalance === 'function') {
        saveBalance();
    }
    if (typeof updateBalanceDisplay === 'function') {
        updateBalanceDisplay();
    }

    gameStarted = true;
    opponentCountSelect.disabled = true;
    dealButton.disabled = true;
    revealButton.disabled = false;
    nextPhaseButton.disabled = false;
    resetButton.disabled = true;

    communityCards = [];
    gamePhase = 0;
    playerHand.innerHTML = '';
    communityContainer.innerHTML = '';
    for (let i = 1; i <= 3; i++) document.getElementById(`hand-${i}`).innerHTML = '';

    deck = shuffleDeck(createDeck());

    const playerCards = deck.splice(0, 2);
    playerCards.forEach(card => renderCard(card, playerHand));
    dealSound.play();

    const opponentCount = parseInt(opponentCountSelect.value);
    for (let i = 1; i <= opponentCount; i++) {
        // Ставка каждого оппонента
        currentPot += currentBet; // Добавляем в пот
        const handDiv = document.getElementById(`hand-${i}`);
        handDiv.innerHTML = '';
        const opponentCards = deck.splice(0, 2);
        opponentHands[i] = opponentCards;
        opponentCards.forEach(() => {
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('card');
            const img = document.createElement('img');
            img.src = `${IMAGE_BASE_PATH}card_back.png`;
            img.alt = 'Hidden';
            cardDiv.appendChild(img);
            handDiv.appendChild(cardDiv);
        });
        dealSound.play();
    }

    updatePhaseDisplay();
    updateOpponentVisibility();
    updateResult('Cards dealt. Proceed with phases.', 'white');
});

nextPhaseButton.addEventListener('click', () => {
    if (!gameStarted) return;
    if (gamePhase === 0) { // Pre-Flop -> Flop
        communityCards = deck.splice(0, 3);
    } else if (gamePhase === 1 || gamePhase === 2) { // Flop -> Turn, Turn -> River
        communityCards.push(deck.shift());
    } else { // River -> Showdown (or end of phases)
        return;
    }

    communityContainer.innerHTML = '';
    communityCards.forEach(card => renderCard(card, communityContainer));
    gamePhase++;
    updatePhaseDisplay();
    dealSound.play();

    // After River, next click should be Reveal (if not already revealed)
    if (gamePhase === 3) {
        nextPhaseButton.disabled = true;
        revealButton.disabled = false;
    }
});

revealButton.addEventListener('click', () => {
    if (!gameStarted) return;

    // Ensure all community cards are dealt before revealing
    while (communityCards.length < 5) {
        communityCards.push(deck.shift());
    }
    communityContainer.innerHTML = '';
    communityCards.forEach(card => renderCard(card, communityContainer));
    gamePhase = 3; // Ensure phase is set to River/Showdown
    updatePhaseDisplay();


    const opponentCount = parseInt(opponentCountSelect.value);
    for (let i = 1; i <= opponentCount; i++) {
        const handDiv = document.getElementById(`hand-${i}`);
        handDiv.innerHTML = '';
        opponentHands[i].forEach(card => renderCard(card, handDiv));
    }

const playerFullHand = getFullHand(playerHand); // Это ваши 2 карты, считанные с DOM
const playerBestHand = getBestFiveCardHand(playerFullHand, communityCards); // ЗДЕСЬ ПЕРЕДАЕТЕ 2 КАРТЫ ИГРОКА + 5 ОБЩИХ
const playerStrength = evaluateHand(playerBestHand);
console.log('Player Hand Strength:', playerStrength);

    let winner = 'player';
    let highestStrength = playerStrength;
    let tie = false;
    let tiedPlayers = ['player']; // Keep track of who tied

for (let i = 1; i <= opponentCount; i++) {
    // ИЗМЕНИТЕ ЭТУ СТРОКУ:
    const opponentBestHand = getBestFiveCardHand(opponentHands[i], communityCards); // ПЕРЕДАЙТЕ ТОЛЬКО 2 КАРТЫ ОППОНЕНТА + 5 ОБЩИХ
    const opponentStrength = evaluateHand(opponentBestHand);
    console.log(`Opponent ${i} Hand Strength:`, opponentStrength);

        const comparison = compareHands(opponentStrength, highestStrength);
        if (comparison > 0) { // Opponent has a better hand
            winner = `opponent-${i}`;
            highestStrength = opponentStrength;
            tie = false;
            tiedPlayers = [`opponent-${i}`]; // Reset tied players to the new winner
        } else if (comparison === 0) { // Tie with current highest
            tie = true;
            tiedPlayers.push(`opponent-${i}`);
        }
    }

if (tie && tiedPlayers.length > 1) {
    // Handle split pot if multiple players tied
    const share = currentPot / tiedPlayers.length; // Делим весь пот на количество ничьих
    let resultMsg = "It's a tie! Pot split. ";
    tiedPlayers.forEach(p => {
        if (p === 'player') {
            playerBalance = parseFloat((playerBalance + share).toFixed(2));
            resultMsg += `You receive $${share.toFixed(2)}. `;
        } else {
            resultMsg += `${p.replace('opponent-', 'Opponent ')} also receives $${share.toFixed(2)}. `;
        }
    });
    if (typeof saveBalance === 'function') {
        saveBalance();
    }
    if (typeof updateBalanceDisplay === 'function') {
        updateBalanceDisplay();
    }
    updateResult(resultMsg.trim() + ' 🤝', 'blue');
} else if (winner === 'player') {
    const winnings = currentPot * 0.98; // Весь пот достается победителю
    playerBalance = parseFloat((playerBalance + winnings).toFixed(2));
    if (typeof saveBalance === 'function') {
        saveBalance();
    }
    if (typeof updateBalanceDisplay === 'function') {
        updateBalanceDisplay();
    }
    updateResult(`You win! +$${winnings.toFixed(2)} 🎉`, 'green');
    winSound.play();
} else {
    updateResult(`You lose. ${winner.replace('opponent-', 'Opponent ')} had a better hand. -$${currentBet.toFixed(2)} 😔`, 'red');
    loseSound.play();
}

gameStarted = false;
resetButton.disabled = false;
revealButton.disabled = true;
nextPhaseButton.disabled = true;
});

resetButton.addEventListener('click', () => {
    gameStarted = false;
    opponentCountSelect.disabled = false;
    communityCards = [];
    gamePhase = 0;
    communityContainer.innerHTML = '';
    playerHand.innerHTML = '';
    resultText.textContent = '';
    for (let i = 1; i <= 3; i++) document.getElementById(`hand-${i}`).innerHTML = '';
    updatePhaseDisplay();
    updateOpponentVisibility();

    resetButton.disabled = true;
    dealButton.disabled = false;
    revealButton.disabled = true;
    nextPhaseButton.disabled = true;
    // Update balance display on reset using the function from promo.js
    if (typeof updateBalanceDisplay === 'function') {
        updateBalanceDisplay();
    }
});

// === HELPERS ===

function updateDisplay() {
    betDisplay.textContent = currentBet.toFixed(2);
}

function updateResult(msg, color = 'white') {
    resultText.textContent = msg;
    resultText.style.color = color;
}

function updatePhaseDisplay() {
    const phases = ['Pre-Flop', 'Flop', 'Turn', 'River'];
    phaseDisplay.textContent = `Phase: ${phases[gamePhase] || 'Showdown'}`;
}

function renderCard(card, container) {
    const div = document.createElement('div');
    div.classList.add('card');
    const img = document.createElement('img');
    img.src = `${IMAGE_BASE_PATH}${card}.png`;
    img.alt = card;
    div.appendChild(img);
    container.appendChild(div);
}

function getFullHand(container) {
    const playerCards = [];
    const imgs = container.querySelectorAll('img');
    imgs.forEach(img => {
        const path = img.src.split('/').pop().replace('.png', '');
        playerCards.push(path);
    });
    return playerCards; // Only return player's pocket cards
}

function createDeck() {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck = [];
    for (const suit of suits) {
        for (const value of values) {
            let name = value;
            if (value === 'J') name = 'Jack';
            else if (value === 'Q') name = 'Queen';
            else if (value === 'K') name = 'King';
            else if (value === 'A') name = 'Ace';
            const suitCap = suit.charAt(0).toUpperCase() + suit.slice(1);
            deck.push(`${name}_of_${suitCap}`);
        }
    }
    return deck;
}

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// === POKER HAND EVALUATOR ===

// Helper function to parse card string into { value, suit }
function parseCard(cardString) {
    const parts = cardString.replace('_of_', ' ').split(' ');
    let value = parts[0];
    const suit = parts[1].toLowerCase();

    switch (value) {
        case 'Jack': value = 11; break;
        case 'Queen': value = 12; break;
        case 'King': value = 13; break;
        case 'Ace': value = 14; break; // Ace high for most cases
        default: value = parseInt(value);
    }
    return { value, suit };
}

// Function to get the best 5-card hand from 7 cards
function getBestFiveCardHand(pocketCards, communityCards) {
    const allCards = pocketCards.concat(communityCards);
    if (allCards.length < 5) return [];

    let bestHand = [];
    let bestStrength = { rank: -1, highCard: 0, kickers: [] };

    const combinations = getCombinations(allCards, 5);

    // console.log("All 7 cards for evaluation:", allCards); // Добавьте это, чтобы увидеть все 7 карт
    // console.log("Number of 5-card combinations:", combinations.length); // Убедитесь, что комбинаций достаточно (C(7,5) = 21)

    for (const combo of combinations) {
        const currentStrength = evaluateHand(combo);
        const comparison = compareHands(currentStrength, bestStrength);
        if (comparison > 0) {
            bestStrength = currentStrength;
            bestHand = combo;
        }
    }
    // console.log("Best 5-card hand selected:", bestHand); // Добавьте это, чтобы увидеть выбранную лучшую 5-карточную руку
    // console.log("Strength of best hand:", bestStrength); // И ее силу
    return bestHand;
}

// Helper for combinations (from a previous common utility or can be implemented here)
function getCombinations(arr, k) {
    const result = [];
    function backtrack(start, currentCombo) {
        if (currentCombo.length === k) {
            result.push([...currentCombo]);
            return;
        }
        for (let i = start; i < arr.length; i++) {
            currentCombo.push(arr[i]);
            backtrack(i + 1, currentCombo);
            currentCombo.pop();
        }
    }
    backtrack(0, []);
    return result;
}

// Main hand evaluation function
function evaluateHand(cards) {
    const parsedCards = cards.map(parseCard).sort((a, b) => a.value - b.value);

    const counts = {};
    const suits = {};
    for (const card of parsedCards) {
        counts[card.value] = (counts[card.value] || 0) + 1;
        suits[card.suit] = (suits[card.suit] || 0) + 1;
    }

    const values = Object.keys(counts).map(Number).sort((a, b) => a - b);
    const hasPair = values.some(val => counts[val] === 2);
    const hasTwoPair = values.filter(val => counts[val] === 2).length === 2;
    const hasThreeOfAKind = values.some(val => counts[val] === 3);
    const hasFourOfAKind = values.some(val => counts[val] === 4);
    const hasFlush = Object.values(suits).some(count => count >= 5);

    let isStraight = false;
    let straightHighCard = 0;
    // Check for A-5 straight (Ace as 1)
    const lowAceValues = parsedCards.map(c => c.value === 14 ? 1 : c.value).sort((a, b) => a - b);
    let consecutiveCountLowAce = 0;
    for (let i = 0; i < lowAceValues.length; i++) {
        // Skip duplicates when checking for straight
        if (i > 0 && lowAceValues[i] === lowAceValues[i-1]) continue;

        if (i === 0 || lowAceValues[i] === lowAceValues[i - 1] + 1) {
            consecutiveCountLowAce++;
        } else {
            consecutiveCountLowAce = 1;
        }
        if (consecutiveCountLowAce >= 5) {
            isStraight = true;
            straightHighCard = lowAceValues[i];
            break;
        }
    }

    // Check for normal straight (Ace as 14)
    let consecutiveCount = 0;
    for (let i = 0; i < values.length; i++) {
        // Skip duplicates when checking for straight
        if (i > 0 && values[i] === values[i-1]) continue;

        if (i === 0 || values[i] === values[i - 1] + 1) {
            consecutiveCount++;
        } else {
            consecutiveCount = 1;
        }
        if (consecutiveCount >= 5) {
            isStraight = true;
            straightHighCard = values[i];
            break;
        }
    }


    // Determine kickers (highest cards not part of a combination)
    function getKickers(excludeValues) {
        return parsedCards
            .filter(card => !excludeValues.includes(card.value))
            .map(card => card.value)
            .sort((a, b) => b - a);
    }

    // Rank 9: Royal Flush (T-J-Q-K-A of same suit)
    if (hasFlush && isStraight) {
        const flushSuit = Object.keys(suits).find(suit => suits[suit] >= 5);
        const flushCards = parsedCards.filter(card => card.suit === flushSuit).sort((a, b) => a.value - b.value);
        if (flushCards.length >= 5) {
            const hasTen = flushCards.some(card => card.value === 10);
            const hasJack = flushCards.some(card => card.value === 11);
            const hasQueen = flushCards.some(card => card.value === 12);
            const hasKing = flushCards.some(card => card.value === 13);
            const hasAce = flushCards.some(card => card.value === 14);
            if (hasTen && hasJack && hasQueen && hasKing && hasAce) {
                return { rank: 9, name: "Royal Flush", highCard: 14, kickers: [] };
            }
        }
    }

    // Rank 8: Straight Flush
    if (hasFlush) { // Check for straight flush within the flush cards
        const flushSuit = Object.keys(suits).find(suit => suits[suit] >= 5);
        const flushCardsOnly = parsedCards.filter(card => card.suit === flushSuit).map(c => c.value).sort((a, b) => a - b);
        
        let sfConsecutive = 0;
        let sfHighCard = 0;
        // Check for normal straight flush
        for (let i = 0; i < flushCardsOnly.length; i++) {
            if (i > 0 && flushCardsOnly[i] === flushCardsOnly[i-1]) continue; // Skip duplicates
            if (i === 0 || flushCardsOnly[i] === flushCardsOnly[i - 1] + 1) {
                sfConsecutive++;
            } else {
                sfConsecutive = 1;
            }
            if (sfConsecutive >= 5) {
                sfHighCard = flushCardsOnly[i];
            }
        }
        
        // Check for A-5 straight flush
        const lowAceFlushCards = flushCardsOnly.map(c => c === 14 ? 1 : c).sort((a, b) => a - b);
        let sfConsecutiveLowAce = 0;
        for (let i = 0; i < lowAceFlushCards.length; i++) {
            if (i > 0 && lowAceFlushCards[i] === lowAceFlushCards[i-1]) continue; // Skip duplicates
            if (i === 0 || lowAceFlushCards[i] === lowAceFlushCards[i - 1] + 1) {
                sfConsecutiveLowAce++;
            } else {
                sfConsecutiveLowAce = 1;
            }
            if (sfConsecutiveLowAce >= 5) {
                sfHighCard = Math.max(sfHighCard, 5); // A-5 straight flush uses 5 as high card value
            }
        }

        if (sfHighCard > 0) {
            return { rank: 8, name: "Straight Flush", highCard: sfHighCard, kickers: [] };
        }
    }

    // Rank 7: Four of a Kind
    if (hasFourOfAKind) {
        const fourValue = values.find(val => counts[val] === 4);
        const kickers = getKickers([fourValue]);
        return { rank: 7, name: "Four of a Kind", highCard: fourValue, kickers: kickers.slice(0, 1) }; // One kicker
    }

    // Rank 6: Full House (Three of a Kind and a Pair)
    if (hasThreeOfAKind) {
        const threeValue = values.find(val => counts[val] === 3);
        const pairValues = values.filter(val => counts[val] === 2 && val !== threeValue).sort((a, b) => b - a);
        if (pairValues.length > 0) {
            return { rank: 6, name: "Full House", highCard: threeValue, kickers: [pairValues[0]] }; // Highest pair
        }
    }

    // Rank 5: Flush
    if (hasFlush) {
        const flushSuit = Object.keys(suits).find(suit => suits[suit] >= 5);
        const flushCards = parsedCards.filter(card => card.suit === flushSuit).map(card => card.value).sort((a, b) => b - a);
        return { rank: 5, name: "Flush", highCard: flushCards[0], kickers: flushCards.slice(1, 5) }; // Top 5 cards
    }

    // Rank 4: Straight
    if (isStraight) {
        // Recalculate straightHighCard more accurately from the parsed cards for tie-breaking
        let actualStraightHighCard = 0;
        let consecutiveForActualStraight = 0;
        // For standard straight
        for (let i = 0; i < parsedCards.length; i++) {
             if (i > 0 && parsedCards[i].value === parsedCards[i-1].value) continue; // Skip duplicates
            if (i === 0 || parsedCards[i].value === parsedCards[i - 1].value + 1) {
                consecutiveForActualStraight++;
            } else {
                consecutiveForActualStraight = 1;
            }
            if (consecutiveForActualStraight >= 5) {
                actualStraightHighCard = parsedCards[i].value;
            }
        }
        // For A-5 straight
        const hasA5Straight = (
            parsedCards.some(c => c.value === 14) && // Ace
            parsedCards.some(c => c.value === 2) &&
            parsedCards.some(c => c.value === 3) &&
            parsedCards.some(c => c.value === 4) &&
            parsedCards.some(c => c.value === 5)
        );
        if (hasA5Straight) {
            actualStraightHighCard = Math.max(actualStraightHighCard, 5); // A-5 straight, 5 is the high card
        }

        return { rank: 4, name: "Straight", highCard: actualStraightHighCard, kickers: [] };
    }


    // Rank 3: Three of a Kind
    if (hasThreeOfAKind) {
        const threeValue = values.find(val => counts[val] === 3);
        const kickers = getKickers([threeValue]);
        return { rank: 3, name: "Three of a Kind", highCard: threeValue, kickers: kickers.slice(0, 2) }; // Two kickers
    }

    // Rank 2: Two Pair
    if (hasTwoPair) {
        const pairs = values.filter(val => counts[val] === 2).sort((a, b) => b - a); // Highest pair first
        const kickers = getKickers(pairs);
        return { rank: 2, name: "Two Pair", highCard: pairs[0], kickers: [pairs[1], kickers[0]] }; // Highest pair, second pair, one kicker
    }

    // Rank 1: One Pair
    if (hasPair) {
        const pairValue = values.find(val => counts[val] === 2);
        const kickers = getKickers([pairValue]);
        return { rank: 1, name: "Pair", highCard: pairValue, kickers: kickers.slice(0, 3) }; // Three kickers
    }

    // Rank 0: High Card
    const highCard = values[values.length - 1]; // Highest card value
    const kickers = getKickers([highCard]).slice(0, 4); // Remaining four highest cards
    return { rank: 0, name: "High Card", highCard: highCard, kickers: kickers };
}

// Compare two hand strengths
// Returns: 1 if strengthA is better, -1 if strengthB is better, 0 if tie
function compareHands(strengthA, strengthB) {
    if (strengthA.rank !== strengthB.rank) {
        return strengthA.rank - strengthB.rank;
    }

    // Tie-breaking by highCard (for straight, flush, etc., or the main pair/trips/quads value)
    if (strengthA.highCard !== strengthB.highCard) {
        return strengthA.highCard - strengthB.highCard;
    }

    // Tie-breaking by kickers
    for (let i = 0; i < Math.min(strengthA.kickers.length, strengthB.kickers.length); i++) {
        if (strengthA.kickers[i] !== strengthB.kickers[i]) {
            return strengthA.kickers[i] - strengthB.kickers[i];
        }
    }

    return 0; // Absolute tie
}