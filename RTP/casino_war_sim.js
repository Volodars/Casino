
// simulate_war.js
function createDeck() {
    const suits = ['clubs', 'diamonds', 'hearts', 'spades'];
    const ranks = [
        { rank: '2', value: 2 },
        { rank: '3', value: 3 },
        { rank: '4', value: 4 },
        { rank: '5', value: 5 },
        { rank: '6', value: 6 },
        { rank: '7', value: 7 },
        { rank: '8', value: 8 },
        { rank: '9', value: 9 },
        { rank: '10', value: 10 },
        { rank: 'jack', value: 11 },
        { rank: 'queen', value: 12 },
        { rank: 'king', value: 13 },
        { rank: 'ace', value: 14 }
    ];

    const deck = [];
    for (let d = 0; d < 6; d++) { // 6 decks
        for (const suit of suits) {
            for (const r of ranks) {
                deck.push({ ...r, suit });
            }
        }
    }
    return deck;
}

function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function draw(deck) {
    if (deck.length === 0) {
        deck.push(...createDeck());
        shuffle(deck);
    }
    return deck.pop();
}

function simulateCasinoWar(rounds = 1000000) {
    let deck = createDeck();
    shuffle(deck);

    let initialBet = 100;
    let totalBet = 0;
    let totalReturn = 0;

    for (let i = 0; i < rounds; i++) {
        let playerCard = draw(deck);
        let dealerCard = draw(deck);

        totalBet += initialBet;

        if (playerCard.value > dealerCard.value) {
            totalReturn += initialBet * 1.95;
        } else if (dealerCard.value > playerCard.value) {
            // Player loses
        } else {
            // Tie: simulate "Go to War"
            if (deck.length < 5) {
                deck = createDeck();
                shuffle(deck);
            }

            totalBet += initialBet; // Player adds another bet
            // Burn 3 cards
            for (let j = 0; j < 3; j++) draw(deck);
            const newPlayerCard = draw(deck);
            const newDealerCard = draw(deck);

            if (newPlayerCard.value > newDealerCard.value) {
                totalReturn += (initialBet + initialBet) * 2;
            } else if (newPlayerCard.value === newDealerCard.value) {
                totalReturn += (initialBet + initialBet); // Push
            }
            // If player loses, gets nothing
        }
    }

    const rtp = (totalReturn / totalBet) * 100;
    console.log("Total rounds:", rounds);
    console.log("Total bet: $", totalBet.toFixed(2));
    console.log("Total return: $", totalReturn.toFixed(2));
    console.log("Estimated RTP:", rtp.toFixed(2), "%");
}

simulateCasinoWar(1000000); // Run with 1 million rounds
