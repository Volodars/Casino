const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function createDeck() {
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

function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function parseCard(cardString) {
    const parts = cardString.replace('_of_', ' ').split(' ');
    let value = parts[0];
    switch (value) {
        case 'Jack': return 11;
        case 'Queen': return 12;
        case 'King': return 13;
        case 'Ace': return 14;
        default: return parseInt(value);
    }
}

function getBestValue(cards) {
    // Только для упрощенной симуляции: максимальная сумма значений двух карт
    return cards.reduce((sum, c) => sum + parseCard(c), 0);
}

function simulatePoker(rounds = 100000) {
    let wins = 0, ties = 0, losses = 0;
    const bet = 100;
    let totalReturn = 0;

    for (let i = 0; i < rounds; i++) {
        let deck = createDeck();
        shuffle(deck);

        const playerHand = deck.splice(0, 2);
        const opponentHand = deck.splice(0, 2);
        const community = deck.splice(0, 5);

        const playerVal = getBestValue(playerHand.concat(community));
        const opponentVal = getBestValue(opponentHand.concat(community));

        if (playerVal > opponentVal) {
            wins++;
            totalReturn += bet * 1.96;
        } else if (playerVal === opponentVal) {
            ties++;
            totalReturn += bet;
        } else {
            losses++;
            // Потеряешь bet, но не прибавляется к totalReturn
        }
    }

    console.log(`Total rounds: ${rounds}`);
    console.log(`Wins: ${wins}`);
    console.log(`Draws: ${ties}`);
    console.log(`Loses: ${losses}`);
    const rtp = totalReturn / (rounds * bet);
    console.log(`RTP: ${(rtp * 100).toFixed(2)}%`);
}

// Запуск симуляции
simulatePoker(100000);
