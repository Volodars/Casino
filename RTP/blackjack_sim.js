function createDeck(numDecks = 6) {
    const ranks = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'];
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const deck = [];
    for (let d = 0; d < numDecks; d++) {
        for (const suit of suits) {
            for (const rank of ranks) {
                let value = 0;
                if (rank === 'ace') value = [1, 11];
                else if (['jack', 'queen', 'king'].includes(rank)) value = 10;
                else value = parseInt(rank);
                deck.push({ rank, suit, value });
            }
        }
    }
    return deck;
}

function calculateScore(hand) {
    let score = 0;
    let aces = 0;
    for (const card of hand) {
        if (card.rank === 'ace') {
            score += 11;
            aces++;
        } else {
            score += card.value;
        }
    }
    while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
    }
    return score;
}

function drawCard(deck) {
    if (deck.length === 0) {
        deck.push(...createDeck());
        shuffle(deck);
    }
    return deck.pop();
}

function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function simulateRound(deck, bet = 100) {
    const player = [drawCard(deck), drawCard(deck)];
    const dealer = [drawCard(deck), drawCard(deck)];

    let playerScore = calculateScore(player);
    let dealerScore = calculateScore(dealer);

    if (playerScore === 21 && dealerScore !== 21) return bet * 1.5;
    if (playerScore === 21 && dealerScore === 21) return 0;
    if (dealerScore === 21) return -bet;

    while (playerScore < 17) {
        player.push(drawCard(deck));
        playerScore = calculateScore(player);
        if (playerScore > 21) return -bet;
    }

    while (dealerScore < 17) {
        dealer.push(drawCard(deck));
        dealerScore = calculateScore(dealer);
    }

    if (dealerScore > 21) return bet;
    if (dealerScore > playerScore) return -bet;
    if (dealerScore < playerScore) return bet;
    return 0;
}

function simulateMany(rounds = 100000, bet = 100) {
    const deck = createDeck();
    shuffle(deck);
    let total = 0;
    for (let i = 0; i < rounds; i++) {
        total += simulateRound(deck, bet);
    }
    const rtp = ((total + rounds * bet) / (rounds * bet)) * 100;
    console.log(`RTP over ${rounds} rounds: ${rtp.toFixed(2)}%`);
}

simulateMany(); // запусти в node.js
