/* dice_sim.js
   node dice_sim.js <mode> <target> <bet> <rounds>
   mode   : less | equal | greater
   target : число от 2 до 12
   bet    : ставка в единицах баланса (по умолчанию 100)
   rounds : число испытаний              (по умолчанию 1_000_000)
*/

const [, , mode = 'equal', targetArg = '7', betArg = '100', roundsArg = '1000000'] = process.argv;
const target = +targetArg;
const BET    = +betArg;
const ROUNDS = +roundsArg;

if (!['less', 'equal', 'greater'].includes(mode) || target < 2 || target > 12) {
  console.error('Пример: node dice_sim.js equal 12 50 500000');
  process.exit(1);
}

// --- коэффициенты из игры ----------------------------------------------------
const payoutOdds = {
  2: 35,  3: 17.3,  4: 11.5,  5:  8.5,
  6: 6.8, 7:  5.7,  8: 6.8, 9:  8.5,
  10: 11.5, 11: 17.3, 12: 35
};

const totalOutcomes = 36;
function calculateDynamicOdds(m, t) {
  let fav = 0;
  if (m === 'less') {
    for (let s = 2; s < t; s++) fav += totalOutcomes / payoutOdds[s];
  } else if (m === 'greater') {
    for (let s = t + 1; s <= 12; s++) fav += totalOutcomes / payoutOdds[s];
  }
  if (fav === 0) return 0;
  return +(totalOutcomes / fav * 0.98).toFixed(2);   // 0.9 == house edge
}
// ---------------------------------------------------------------------------

const dynOdd = (mode === 'equal')
  ? payoutOdds[target]
  : calculateDynamicOdds(mode, target);

console.log(`>>> mode=${mode}, target=${target}, bet=${BET}, rounds=${ROUNDS}`);
console.log(`Theoretical multiplier: ${dynOdd}\n`);

let balanceChange = 0;

for (let i = 0; i < ROUNDS; i++) {
  // бросаем два кубика
  const d1 = 1 + Math.floor(Math.random() * 6);
  const d2 = 1 + Math.floor(Math.random() * 6);
  const sum = d1 + d2;

  // списываем ставку
  balanceChange -= BET;

  // проверяем победу
  const win =
    (mode === 'equal'   && sum === target) ||
    (mode === 'less'    && sum  < target) ||
    (mode === 'greater' && sum  > target);

  if (win) {
    balanceChange += BET * dynOdd;
  }
}

const totalWagered = BET * ROUNDS;
const RTP = ( (totalWagered + balanceChange) / totalWagered ) * 100;

console.log(`Player's total profit: ${balanceChange.toFixed(2)}`);
console.log(`RTP: ${RTP.toFixed(4)} %`);
