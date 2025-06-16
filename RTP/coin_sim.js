/* sim_coin.js
   Monte-Carlo-проверка RTP для coin.js
   Heads / Tails  – 49 % на выпадение, мультипликатор 2
   Edge          –  2 % на выпадение, мультипликатор 48
*/

const RNG = () => Math.random();          // можешь подставить seedable-RNG
const N_SPINS       = 1e7;                // 10 млн бросков
const STAKE         = 1;                  // ставка 1 условная единица
const P_HEADS       = 0.49;
const P_TAILS       = 0.49;               // берём модель coin.js
const P_EDGE        = 0.02;
const MULT_HEADTAIL = 2;                  // выплатный коэффициент («включая» ставку)
const MULT_EDGE     = 48;

function simulate(side = 'Heads') {
  let balance = 0;

  for (let i = 0; i < N_SPINS; i++) {
    const r = RNG();

    // генерируем исход
    let outcome;
    if (r < P_HEADS) outcome = 'Heads';
    else if (r < P_HEADS + P_TAILS) outcome = 'Tails';
    else outcome = 'Edge';

    // учитываем ставку и возможный выигрыш
    balance -= STAKE;                                // поставили 1
    if (outcome === side) {
      const mult = (side === 'Edge') ? MULT_EDGE : MULT_HEADTAIL;
      balance += STAKE * mult;                       // получили выплату
    }
  }

  const rtp = (balance / (N_SPINS * STAKE) + 1) * 100; // +1, чтобы перевести net→gross
  // пояснение: мы в balance храним чистую прибыль (минус ставка).
  // Чтобы получить «возврат к игроку», нужно вернуть поставленные деньги.

  return rtp;
}

console.time('sim');
console.log(`RTP (bet Heads):  ${simulate('Heads').toFixed(4)} %`);
console.log(`RTP (bet Tails):  ${simulate('Tails').toFixed(4)} %`);
console.log(`RTP (bet Edge):   ${simulate('Edge' ).toFixed(4)} %`);
console.timeEnd('sim');
